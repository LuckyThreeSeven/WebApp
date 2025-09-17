from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from .models import User
import json


@csrf_exempt
def signup(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse(
                    {"error": "Email and password are required"}, status=400
                )

            if User.objects.filter(email=email).exists():
                return JsonResponse({"error": "이미 존재하는 이메일입니다"}, status=400)

            user = User.objects.create_user(email=email, password=password)
            return JsonResponse({"message": "User created successfully"}, status=201)
        except IntegrityError as e:
            return JsonResponse({"error": "이미 존재하는 이메일입니다"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)
