from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("", views.health, name="health_check"),
    path("verify-email/", views.verify_email, name="verify_email"),
    path("confirm-email/", views.confirm_email, name="confirm_email"),
    path("signup/", views.signup, name="signup"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
