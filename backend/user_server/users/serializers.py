from rest_framework import serializers
from .models import User


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["uid", "email", "created_at"]


class UserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=5)


class PasswordChangeSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
