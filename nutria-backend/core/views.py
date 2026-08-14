from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Alimento, Usuario
from .serializers import AlimentoSerializer, UsuarioRegistroSerializer, UsuarioSerializer


def _primer_error(serializer):
    for errors in serializer.errors.values():
        if isinstance(errors, list) and errors:
            return str(errors[0])
        if isinstance(errors, dict):
            for sub in errors.values():
                if isinstance(sub, list) and sub:
                    return str(sub[0])
    return 'Error de validación'


def _requiere_autenticacion(request):
    return IsAuthenticated().has_permission(request, None)


# ============================================================
# 1. LOGIN de usuario
#    POST /api/auth/login   Body: { email, password }
# ============================================================
@api_view(['POST'])
def login(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not email or not password:
        return Response(
            {'error': 'Email y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        usuario = Usuario.objects.select_related('rol').get(email=email)
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Correo no registrado'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not check_password(password, usuario.contrasena_hash):
        return Response(
            {'error': 'Contraseña incorrecta'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(usuario)
    return Response({
        'mensaje': 'Login exitoso',
        'usuario': UsuarioSerializer(usuario).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


# ============================================================
# 2. USUARIOS
#    GET  /api/usuarios  -> listar (requiere JWT)
#    POST /api/usuarios  -> registrar  Body: { nombre, email, contrasena_hash, ... }
# ============================================================
@api_view(['GET', 'POST'])
def usuarios(request):
    if request.method == 'GET':
        if not _requiere_autenticacion(request):
            return Response(
                {'error': 'Credenciales no proporcionadas'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        queryset = Usuario.objects.select_related('rol').order_by('id_usuario')
        return Response(UsuarioSerializer(queryset, many=True).data)

    # POST -> registro
    serializer = UsuarioRegistroSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'mensaje': 'Usuario creado correctamente'},
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ============================================================
# 3. ALIMENTOS
#    GET    /api/alimentos      -> listar (público)
#    POST   /api/alimentos      -> crear (requiere JWT)
#    PUT    /api/alimentos/:id  -> actualizar (requiere JWT)
#    DELETE /api/alimentos/:id  -> eliminar (requiere JWT)
# ============================================================
@api_view(['GET', 'POST'])
def alimentos(request):
    if request.method == 'GET':
        queryset = Alimento.objects.select_related('categoria').order_by('id_alimento')
        return Response(AlimentoSerializer(queryset, many=True).data)

    # POST -> crear
    if not _requiere_autenticacion(request):
        return Response(
            {'error': 'Credenciales no proporcionadas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    serializer = AlimentoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'mensaje': 'Alimento creado correctamente', 'alimento': serializer.data},
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['PUT', 'PATCH', 'DELETE'])
def alimento_detalle(request, pk):
    if not _requiere_autenticacion(request):
        return Response(
            {'error': 'Credenciales no proporcionadas'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        alimento = Alimento.objects.get(pk=pk)
    except Alimento.DoesNotExist:
        return Response(
            {'error': 'Alimento no encontrado'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        alimento.delete()
        return Response({'mensaje': 'Alimento eliminado correctamente'})

    serializer = AlimentoSerializer(alimento, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'mensaje': 'Alimento actualizado correctamente', 'alimento': serializer.data},
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )
