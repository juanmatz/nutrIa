from django.urls import path

from . import views

urlpatterns = [
    # Autenticación JWT
    path('auth/login', views.login),
    path('auth/login/', views.login),
    path('auth/register', views.register),
    path('auth/register/', views.register),
    path('auth/refresh', views.UsuarioTokenRefreshView.as_view()),
    path('auth/refresh/', views.UsuarioTokenRefreshView.as_view()),
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

    # Comidas (Paridad Milestone 2)
    path('comidas', views.comidas),
    path('comidas/', views.comidas),
    path('comidas/<int:pk>', views.comida_detalle),
    path('comidas/<int:pk>/', views.comida_detalle),

    # Agua (Paridad Milestone 2)
    path('agua/hoy', views.agua_hoy),
    path('agua/hoy/', views.agua_hoy),
    path('agua', views.agua),
    path('agua/', views.agua),

    # Alergias (Paridad Milestone 2)
    path('alergias', views.alergias),
    path('alergias/', views.alergias),
    path('alergias/<int:pk>', views.alergia_detalle),
    path('alergias/<int:pk>/', views.alergia_detalle),

    # Progreso Semanal (Paridad Milestone 2)
    path('progreso/semanal', views.progreso_semanal),
    path('progreso/semanal/', views.progreso_semanal),
]
