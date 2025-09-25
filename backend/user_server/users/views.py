from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserCreateSerializer, VerifyEmailSerializer
from drf_spectacular.utils import extend_schema
import random
import string
import requests
from django.utils import timezone
from datetime import timedelta


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@extend_schema(
    request=UserCreateSerializer,
    responses={
        200: {"description": "Verification code sent successfully"},
        400: {
            "description": "Bad Request (e.g., invalid data, email exists and is active)"
        },
        500: {"description": "Mail server error"},
    },
)
@api_view(["POST"])
def signup(request):
    serializer = UserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    user = User.objects.filter(email=email).first()

    if user and user.is_active:
        return Response(
            {"error": "이미 가입되어 활성화된 이메일입니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    verification_code = "".join(random.choices(string.digits, k=5))
    code_expiry = timezone.now() + timedelta(minutes=5)

    if user:  # Inactive user exists, update their code and password
        user.verification_code = verification_code
        user.code_expiry = code_expiry
        user.set_password(password)
        user.save(
            update_fields=["verification_code", "code_expiry", "password", "is_active"]
        )
    else:  # Create a new user
        user = User.objects.create_user(
            email=email,
            password=password,
            is_active=False,
            verification_code=verification_code,
            code_expiry=code_expiry,
        )

    # Call mail-server to send the email
    try:
        # This is an assumed endpoint for the mail-server.
        mail_server_url = "http://mail-server:8000/api/email"
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
        200: {"description": "Email verified successfully"},
        400: {"description": "Bad Request (e.g., invalid code, expired code)"},
        404: {"description": "User not found or already active"},
    },
)
@api_view(["POST"])
def verify_email(request):
    serializer = VerifyEmailSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    code = serializer.validated_data["code"]

    try:
        user = User.objects.get(email=email, is_active=False)
    except User.DoesNotExist:
        return Response(
            {"error": "사용자를 찾을 수 없거나 이미 활성화된 계정입니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if user.code_expiry < timezone.now():
        return Response(
            {"error": "인증 코드가 만료되었습니다."}, status=status.HTTP_400_BAD_REQUEST
        )

    if user.verification_code != code:
        return Response(
            {"error": "인증 코드가 올바르지 않습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_active = True
    user.verification_code = None
    user.code_expiry = None
    user.save(update_fields=["is_active", "verification_code", "code_expiry"])

    return Response(
        {"message": "이메일 인증이 성공적으로 완료되었습니다."},
        status=status.HTTP_200_OK,
    )
