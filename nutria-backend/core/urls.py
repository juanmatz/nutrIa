from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # Autenticación JWT
    path('auth/login', views.login),
    path('auth/login/', views.login),
    path('auth/refresh', TokenRefreshView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me', views.me),
    path('auth/me/', views.me),

    # Usuarios (RBAC)
    path('usuarios', views.usuarios),
    path('usuarios/', views.usuarios),
    path('usuarios/<int:pk>', views.usuario_detalle),
    path('usuarios/<int:pk>/', views.usuario_detalle),

    # Alimentos (RBAC)
    path('alimentos', views.alimentos),
    path('alimentos/', views.alimentos),
    path('alimentos/<int:pk>', views.alimento_detalle),
    path('alimentos/<int:pk>/', views.alimento_detalle),

    # NutriaBot AI Conversacional
    path('chat', views.chat_view),
    path('chat/', views.chat_view),
]
