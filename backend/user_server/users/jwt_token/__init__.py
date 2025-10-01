from django.http import JsonResponse
from rest_framework.decorators import api_view
from .manager import jwtManager


@api_view(["GET"])
def jwks_view(request):
    return JsonResponse(jwtManager.get_validation_key())
