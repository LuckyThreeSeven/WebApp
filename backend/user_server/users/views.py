from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import (
    EmailSerializer,
    UserSerializer,
    UserCreateSerializer,
    VerifyEmailSerializer,
    PasswordChangeSerializer,
)
from drf_spectacular.utils import extend_schema
import random
import string
import os
import requests
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@extend_schema(
    request=EmailSerializer,
    responses={
        200: {"description": "Verification code sent successfully"},
        400: {"description": "Bad Request (e.g., invalid data, email exists)"},
        500: {"description": "Mail server error"},
    },
)
@api_view(["POST"])
def verify_email(request):
    """
    Request email verification. Sends a verification code to the user's email.
    """
    serializer = EmailSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    verification_code = "".join(random.choices(string.digits, k=5))
    code_expiry = timezone.now() + timedelta(minutes=5)

    request.session["verification_email"] = email
    request.session["verification_code"] = verification_code
    request.session["code_expiry"] = code_expiry.isoformat()
    request.session["is_authenticated"] = False

    try:
        mail_server_url = os.getenv("MAIL_API_URL", "http://mail-server:8000/api/email")
        response = requests.post(
            mail_server_url,
            json={
                "to": email,
                "format": "SIGNUP_AUTH",
                "parameters": [verification_code],
            },
            timeout=15,
        )
        if response.status_code != 200:
            return Response(
                {
                    "error": "메일 서버에서 이메일 발송에 실패했습니다.",
                    "detail": response.text,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except requests.exceptions.RequestException as e:
        return Response(
            {"error": "메일 서버에 연결할 수 없습니다.", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"message": "인증 코드가 이메일로 발송되었습니다. 5분 안에 입력해주세요."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=VerifyEmailSerializer,
    responses={
        200: {"description": "Email confirmed successfully. You can now sign up."},
        400: {"description": "Bad Request (e.g., invalid code, expired code)"},
    },
)
@api_view(["POST"])
def confirm_email(request):
    """
    Confirms the email verification code.
    """
    serializer = VerifyEmailSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    code = serializer.validated_data["code"]

    session_email = request.session.get("verification_email")
    session_code = request.session.get("verification_code")
    session_expiry_str = request.session.get("code_expiry")

    if (
        not all([session_email, session_code, session_expiry_str])
        or email != session_email
    ):
        return Response(
            {"error": "인증 정보가 유효하지 않습니다. 다시 시도해주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    code_expiry = timezone.datetime.fromisoformat(session_expiry_str)
    if code_expiry < timezone.now():
        try:
            del request.session["verification_email"]
            del request.session["verification_code"]
            del request.session["code_expiry"]
            del request.session["is_authenticated"]
        except KeyError:
            pass
        return Response(
            {"error": "인증 코드가 만료되었습니다."}, status=status.HTTP_400_BAD_REQUEST
        )

    if session_code != code:
        return Response(
            {"error": "인증 코드가 올바르지 않습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.session["is_authenticated"] = True
    request.session["signup_expiry"] = request.session["code_expiry"]

    try:
        del request.session["verification_code"]
    except KeyError:
        pass

    return Response(
        {"message": "이메일 인증이 완료되었습니다."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=UserCreateSerializer,
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Bad Request (e.g., email not verified, expired)"},
    },
)
@api_view(["POST"])
def signup(request):
    """
    Creates a new user after email verification.
    """
    serializer = UserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    session_email = request.session.get("verification_email")
    is_authenticated = request.session.get("is_authenticated")
    signup_expiry_str = request.session.get("signup_expiry")

    if (
        not all([session_email, is_authenticated, signup_expiry_str])
        or email != session_email
    ):
        return Response(
            {"error": "이메일 인증이 필요합니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    signup_expiry = timezone.datetime.fromisoformat(signup_expiry_str)
    if signup_expiry < timezone.now():
        return Response(
            {
                "error": "회원가입 기간이 만료되었습니다. 다시 이메일 인증을 시도해주세요."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(email=email, password=password)

    try:
        del request.session["verification_email"]
        del request.session["is_authenticated"]
        del request.session["signup_expiry"]
        del request.session["code_expiry"]
    except KeyError:
        pass

    return Response(
        {"message": "회원가입이 성공적으로 완료되었습니다.", "uid": user.uid},
        status=status.HTTP_201_CREATED,
    )


@extend_schema(
    request=UserCreateSerializer,
    responses={
        200: {"description": "2FA code sent to your email."},
        400: {"description": "Invalid data."},
        401: {"description": "Invalid credentials."},
        500: {"description": "Mail server error."},
    },
    summary="Login Step 1: Password Authentication",
)
@api_view(["POST"])
def login_password(request):
    """
    Authenticates a user with email and password.
    If successful, generates and sends a 5-digit 2FA code to the user's email.
    """
    serializer = UserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    user = authenticate(request, email=email, password=password)
    if user is None:
        return Response(
            {"error": "잘못된 이메일 또는 비밀번호입니다."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Generate 5-digit 2FA code and store in session
    verification_code = "".join(random.choices(string.digits, k=5))
    code_expiry = timezone.now() + timedelta(minutes=5)

    request.session["login_email"] = email
    request.session["login_code"] = verification_code
    request.session["login_expiry"] = code_expiry.isoformat()

    # Send email with the 2FA code
    try:
        mail_server_url = os.getenv("MAIL_API_URL", "http://mail-server:8000/api/email")
        response = requests.post(
            mail_server_url,
            json={
                "to": email,
                "format": "2FA_AUTH",
                "parameters": [verification_code],
            },
            timeout=15,
        )
        if response.status_code != 200:
            return Response(
                {
                    "error": "메일 서버에서 이메일 발송에 실패했습니다.",
                    "detail": response.text,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except requests.exceptions.RequestException as e:
        return Response(
            {"error": "메일 서버에 연결할 수 없습니다.", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"message": "2단계 인증 코드가 이메일로 발송되었습니다."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=VerifyEmailSerializer,
    responses={
        200: {"description": "JWT tokens."},
        400: {"description": "Invalid or expired code."},
        404: {"description": "User not found."},
    },
    summary="Login Step 2: 2FA Verification & JWT Issuance",
)
@api_view(["POST"])
def login_verify(request):
    """
    Verifies the 2FA code from session and issues JWT access and refresh tokens.
    """
    serializer = VerifyEmailSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    code = serializer.validated_data["code"]

    session_email = request.session.get("login_email")
    session_code = request.session.get("login_code")
    session_expiry_str = request.session.get("login_expiry")

    if (
        not all([session_email, session_code, session_expiry_str])
        or email != session_email
    ):
        return Response(
            {"error": "인증 정보가 유효하지 않습니다. 다시 시도해주세요."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if session_code != code:
        return Response(
            {"error": "2단계 인증 코드가 잘못되었습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    code_expiry = timezone.datetime.fromisoformat(session_expiry_str)
    if code_expiry < timezone.now():
        try:
            del request.session["login_email"]
            del request.session["login_code"]
            del request.session["login_expiry"]
        except KeyError:
            pass
        return Response(
            {"error": "2단계 인증 코드가 만료되었습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verification successful, get user and generate JWT
    try:
        user = User.objects.get(email=session_email)
    except User.DoesNotExist:
        return Response(
            {"error": "사용자를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND
        )

    # Clear the session data
    try:
        del request.session["login_email"]
        del request.session["login_code"]
        del request.session["login_expiry"]
    except KeyError:
        pass

    # Generate JWT
    refresh = RefreshToken.for_user(user)
    refresh["uid"] = str(user.uid)

    return Response(
        {
            "message": "로그인이 완료되었습니다.",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    responses={
        200: {"description": "Logout successful"},
    },
)
@api_view(["POST"])
def logout(request):
    pass


@extend_schema(
    responses={
        200: UserSerializer,
        401: {"description": "Unauthorized"},
    },
)
@api_view(["GET"])
def get_user_info(request):
    pass
