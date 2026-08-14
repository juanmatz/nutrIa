from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# Los patrones se registran con y sin barra final porque el frontend
# llama sin barra (p.ej. POST /api/auth/login) y APPEND_SLASH está desactivado.

urlpatterns = [
    path('auth/login', views.login),
    path('auth/login/', views.login),
    path('auth/refresh', TokenRefreshView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),

    path('usuarios', views.usuarios),
    path('usuarios/', views.usuarios),

    path('alimentos', views.alimentos),
    path('alimentos/', views.alimentos),
    path('alimentos/<int:pk>', views.alimento_detalle),
    path('alimentos/<int:pk>/', views.alimento_detalle),
]
