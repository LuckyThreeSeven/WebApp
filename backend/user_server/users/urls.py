from django.urls import path
from . import views
from ..jwt_token import jwks_view

urlpatterns = [
    path("", views.health, name="health_check"),
    path("signup/verify-email/", views.verify_email, name="verify_email"),
    path("signup/confirm-email/", views.confirm_email, name="confirm_email"),
    path("signup/", views.signup, name="signup"),
    path("signin/password/", views.login_password, name="login_password"),
    path("signin/", views.login_verify, name="login_verify"),
    path('.well-known/jwks.json', jwks_view, name='jwks'),
]
