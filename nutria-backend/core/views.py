from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .chatbot_service import calculate_biometrics, query_nutriabot
from .models import Alimento, Usuario
from .permissions import IsAdminRole, IsOwnerOrAdmin
from .serializers import (
    AlimentoSerializer,
    NutriaChatRequestSerializer,
    UsuarioRegistroSerializer,
    UsuarioSerializer,
)


def _primer_error(serializer):
    for errors in serializer.errors.values():
        if isinstance(errors, list) and errors:
            return str(errors[0])
        if isinstance(errors, dict):
            for sub in errors.values():
                if isinstance(sub, list) and sub:
                    return str(sub[0])
    return 'Error de validación en los datos proporcionados.'


# ============================================================
# 1. AUTENTICACIÓN
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    POST /api/auth/login
    Body: { email, contrasena } o { email, password }
    """
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or request.data.get('contrasena') or ''

    if not email or not password:
        return Response(
            {'error': 'Email y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        usuario = Usuario.objects.select_related('rol').get(email=email)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Credenciales inválidas: correo no registrado.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not check_password(password, usuario.contrasena_hash):
        return Response(
            {'error': 'Credenciales inválidas: contraseña incorrecta.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(usuario)
    return Response({
        'mensaje': 'Autenticación exitosa',
        'usuario': UsuarioSerializer(usuario).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET /api/auth/me
    Retorna el perfil del usuario autenticado actual.
    """
    usuario = Usuario.objects.select_related('rol').get(id_usuario=request.user.id_usuario)
    return Response(UsuarioSerializer(usuario).data)


# ============================================================
# 2. USUARIOS (RBAC)
# ============================================================
@api_view(['GET', 'POST'])
def usuarios(request):
    """
    GET  /api/usuarios -> Listar todos (Exclusivo Administrador)
    POST /api/usuarios -> Registro de cuenta nuevo (Público)
    """
    if request.method == 'GET':
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Credenciales de autenticación no proporcionadas.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Validación estricta de IsAdminRole
        if not IsAdminRole().has_permission(request, None):
            return Response(
                {'error': 'Acceso denegado: solo Administradores pueden consultar la lista global de usuarios.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = Usuario.objects.select_related('rol').order_by('id_usuario')
        return Response(UsuarioSerializer(queryset, many=True).data)

    # POST -> Registro público
    serializer = UsuarioRegistroSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                'mensaje': 'Cuenta de usuario creada exitosamente.',
                'usuario': UsuarioSerializer(usuario).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def usuario_detalle(request, pk):
    """
    GET, PUT, PATCH, DELETE /api/usuarios/<pk>
    Protegido: Solo el propietario del recurso o un Administrador (IsOwnerOrAdmin).
    """
    if not request.user or not request.user.is_authenticated:
        return Response(
            {'error': 'Credenciales de autenticación no proporcionadas.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        target_user = Usuario.objects.select_related('rol').get(pk=pk)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verifica si es propietario o Administrador
    perm = IsOwnerOrAdmin()
    if not perm.has_object_permission(request, None, target_user):
        return Response(
            {'error': 'Acceso denegado: no tienes permisos para acceder o modificar este perfil.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'GET':
        return Response(UsuarioSerializer(target_user).data)

    if request.method == 'DELETE':
        # Solo Admin puede eliminar cuentas de usuario
        if not IsAdminRole().has_permission(request, None):
            return Response(
                {'error': 'Acceso denegado: solo Administradores pueden dar de baja usuarios.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        target_user.delete()
        return Response({'mensaje': f'Usuario {pk} eliminado correctamente.'})

    # PUT / PATCH
    serializer = UsuarioSerializer(
        target_user,
        data=request.data,
        partial=(request.method == 'PATCH'),
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({
            'mensaje': 'Perfil actualizado correctamente.',
            'usuario': serializer.data
        })
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ============================================================
# 3. ALIMENTOS (RBAC)
# ============================================================
@api_view(['GET', 'POST'])
def alimentos(request):
    """
    GET  /api/alimentos -> Listar catálogo (Público o Autenticado)
    POST /api/alimentos -> Crear alimento (Exclusivo Administrador: IsAdminRole)
    """
    if request.method == 'GET':
        queryset = Alimento.objects.select_related('categoria').order_by('id_alimento')
        return Response(AlimentoSerializer(queryset, many=True).data)

    # POST -> Requiere Administrador
    if not request.user or not request.user.is_authenticated:
        return Response(
            {'error': 'Credenciales no proporcionadas.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not IsAdminRole().has_permission(request, None):
        return Response(
            {'error': 'Acceso denegado: solo los Administradores pueden crear alimentos en el catálogo oficial.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = AlimentoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'mensaje': 'Alimento creado correctamente.', 'alimento': serializer.data},
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def alimento_detalle(request, pk):
    """
    GET               /api/alimentos/<pk> -> Consultar detalle (Público)
    PUT, PATCH, DELETE /api/alimentos/<pk> -> Modificar / Eliminar (Exclusivo Administrador: IsAdminRole)
    """
    try:
        alimento = Alimento.objects.select_related('categoria').get(pk=pk)
    except Alimento.DoesNotExist:
        return Response(
            {'error': 'Alimento no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(AlimentoSerializer(alimento).data)

    # Modificación / Eliminación requiere Administrador
    if not request.user or not request.user.is_authenticated:
        return Response(
            {'error': 'Credenciales no proporcionadas.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not IsAdminRole().has_permission(request, None):
        return Response(
            {'error': 'Acceso denegado: se requieren permisos de Administrador para modificar o eliminar alimentos.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'DELETE':
        alimento.delete()
        return Response({'mensaje': f'Alimento {pk} eliminado correctamente.'})

    serializer = AlimentoSerializer(alimento, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response({
            'mensaje': 'Alimento actualizado correctamente.',
            'alimento': serializer.data
        })
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ============================================================
# 4. NUTRIA BOT AI (CONVERSACIONAL BIOADAPTATIVO)
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def chat_view(request):
    """
    POST /api/chat y /api/chat/
    Endpoint de conversación con NutriaBot AI inyectando perfil metabólico.
    """
    serializer = NutriaChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': _primer_error(serializer)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    message = data['message']
    exclusions = data.get('exclusions') or []
    metrics_override = data.get('metrics_override') or {}

    # Soporte para campos de métricas a nivel superior si se envían directamente
    if data.get('goal'):
        metrics_override.setdefault('goal', data['goal'])
    if data.get('dietScheme'):
        metrics_override.setdefault('scheme', data['dietScheme'])
    if data.get('weight') is not None:
        metrics_override.setdefault('peso', data['weight'])
    if data.get('height') is not None:
        metrics_override.setdefault('altura', data['height'])

    # Extracción de perfil: usuario autenticado o demo Camila Torres
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        nombre = getattr(user, 'nombre', 'Usuario')
        peso = getattr(user, 'peso', None)
        altura = getattr(user, 'altura', None)
        edad = getattr(user, 'edad', None)
        objetivo = getattr(user, 'objetivo', None)
        calorias_diarias = getattr(user, 'calorias_diarias', None)
        gender = 'Femenino'
    else:
        nombre = 'Camila Torres'
        peso = 63.8
        altura = 168.0
        edad = 26
        gender = 'Femenino'
        objetivo = 'Hipertrofia Limpia & Tonificación Magra'
        calorias_diarias = 2150

    # Aplicar sobrescritura de métricas
    if metrics_override:
        peso = metrics_override.get('peso') or metrics_override.get('weight') or peso
        altura = metrics_override.get('altura') or metrics_override.get('height') or altura
        edad = metrics_override.get('edad') or metrics_override.get('age') or edad
        gender = metrics_override.get('sexo') or metrics_override.get('gender') or gender
        objetivo = metrics_override.get('objetivo') or metrics_override.get('goal') or objetivo
        calorias_diarias = metrics_override.get('calorias_diarias') or metrics_override.get('tdee') or calorias_diarias

    if not exclusions:
        exclusions = ["Sin Frutos Cáscara", "Sin Mariscos", "Sin Lactosa"]

    user_bio = calculate_biometrics(
        weight=peso,
        height=altura,
        age=edad,
        gender=gender,
        goal=objetivo,
        daily_calories=calorias_diarias,
        name=nombre,
    )

    scheme = (
        metrics_override.get('scheme')
        or metrics_override.get('esquema')
        or data.get('dietScheme')
        or 'Alta en Proteína'
    )

    resultado = query_nutriabot(
        message=message,
        user_bio=user_bio,
        exclusions=exclusions,
        scheme=scheme,
    )

    return Response(resultado, status=status.HTTP_200_OK)

