from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserCreateSerializer
from drf_spectacular.utils import extend_schema


@extend_schema(
    request=UserCreateSerializer,
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Bad Request (e.g., invalid data, email exists)"},
    },
)
@api_view(["POST"])
def signup(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "이미 존재하는 이메일입니다"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User.objects.create_user(email=email, password=password)
        return Response(
            {"message": "User created successfully"}, status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
