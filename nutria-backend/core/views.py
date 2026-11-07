import datetime
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .chatbot_service import calculate_biometrics, query_nutriabot
from .models import Alergia, Alimento, Comida, RegistroAgua, Usuario
from .permissions import IsAdminRole, IsOwnerOrAdmin
from .serializers import (
    AlergiaSerializer,
    AlimentoSerializer,
    ComidaSerializer,
    NutriaChatRequestSerializer,
    RegistroAguaSerializer,
    UsuarioRegistroSerializer,
    UsuarioSerializer,
    UsuarioTokenRefreshSerializer,
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
@authentication_classes([])
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


class UsuarioTokenRefreshView(TokenRefreshView):
    """Endpoint de refresco de tokens JWT adaptado al modelo Usuario."""
    serializer_class = UsuarioTokenRefreshSerializer


# ============================================================
# 2. USUARIOS (RBAC)
# ============================================================
def _handle_registro_usuario(request):
    """Lógica unificada de validación y persistencia para registro de usuarios."""
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


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register -> Registro de cuenta nuevo (Público).
    Rechaza automáticamente GET, PUT, DELETE con HTTP 405 Method Not Allowed.
    """
    return _handle_registro_usuario(request)


@api_view(['GET', 'POST'])
def usuarios(request):
    """
    GET  /api/usuarios -> Listar todos (Exclusivo Administrador)
    POST /api/usuarios -> Registro de cuenta nuevo (Público / Alias compatible)
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

    return _handle_registro_usuario(request)


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
    history = data.get('history') or []
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
    consumed_today = None
    if user and getattr(user, 'is_authenticated', False):
        nombre = getattr(user, 'nombre', 'Usuario')
        peso = getattr(user, 'peso', None)
        altura = getattr(user, 'altura', None)
        edad = getattr(user, 'edad', None)
        objetivo = getattr(user, 'objetivo', None)
        calorias_diarias = getattr(user, 'calorias_diarias', None)
        gender = 'Femenino'

        # Inyección de Alergias registradas en base de datos
        db_alergias = list(Alergia.objects.filter(usuario=user).values_list('nombre', flat=True))
        formatted_db = [
            f"Sin {a}" if not a.lower().startswith('sin ') else a
            for a in db_alergias
        ]
        exclusions = list(dict.fromkeys(list(exclusions) + formatted_db))

        # Inyección de Calorías consumidas hoy
        today = timezone.localdate()
        todays_meals = Comida.objects.filter(usuario=user, fecha=today)
        consumed_today = sum(float(m.calorias or 0.0) for m in todays_meals)
    else:
        nombre = 'Camila Torres'
        peso = 63.8
        altura = 168.0
        edad = 26
        gender = 'Femenino'
        objetivo = 'Hipertrofia Limpia & Tonificación Magra'
        calorias_diarias = 2150
        if not exclusions:
            exclusions = ["Sin Frutos Cáscara", "Sin Mariscos", "Sin Lactosa"]

    # Aplicar sobrescritura de métricas
    if metrics_override:
        peso = metrics_override.get('peso') or metrics_override.get('weight') or peso
        altura = metrics_override.get('altura') or metrics_override.get('height') or altura
        edad = metrics_override.get('edad') or metrics_override.get('age') or edad
        gender = metrics_override.get('sexo') or metrics_override.get('gender') or gender
        objetivo = metrics_override.get('objetivo') or metrics_override.get('goal') or objetivo
        calorias_diarias = metrics_override.get('calorias_diarias') or metrics_override.get('tdee') or calorias_diarias

    user_bio = calculate_biometrics(
        weight=peso,
        height=altura,
        age=edad,
        gender=gender,
        goal=objetivo,
        daily_calories=calorias_diarias,
        name=nombre,
        consumed_today=consumed_today,
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
        history=history,
    )

    return Response(resultado, status=status.HTTP_200_OK)


# ============================================================
# 5. COMIDAS DIARIAS (CRUD)
# ============================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def comidas(request):
    """
    GET  /api/comidas -> Listar comidas del usuario (opcional ?fecha=YYYY-MM-DD, default hoy)
    POST /api/comidas -> Registrar nueva comida para el usuario autenticado
    """
    if request.method == 'GET':
        fecha_param = request.query_params.get('fecha')
        queryset = Comida.objects.filter(usuario=request.user)
        if fecha_param:
            if fecha_param.lower() not in ('all', 'todas'):
                try:
                    target_date = datetime.date.fromisoformat(fecha_param)
                    queryset = queryset.filter(fecha=target_date)
                except ValueError:
                    return Response(
                        {'error': 'Formato de fecha inválido. Utilice YYYY-MM-DD.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        else:
            queryset = queryset.filter(fecha=timezone.localdate())

        queryset = queryset.order_by('hora', 'id_comida')
        return Response(ComidaSerializer(queryset, many=True).data)

    serializer = ComidaSerializer(data=request.data)
    if serializer.is_valid():
        comida = serializer.save(usuario=request.user)
        return Response(
            {
                'mensaje': 'Comida registrada',
                'comida': ComidaSerializer(comida).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comida_detalle(request, pk):
    """
    GET    /api/comidas/<pk> -> Obtener comida
    PATCH  /api/comidas/<pk> -> Alternar completado o editar datos
    DELETE /api/comidas/<pk> -> Eliminar comida
    """
    try:
        comida = Comida.objects.get(pk=pk, usuario=request.user)
    except Comida.DoesNotExist:
        return Response(
            {'error': 'Comida no encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(ComidaSerializer(comida).data)

    if request.method == 'DELETE':
        comida.delete()
        return Response({'mensaje': 'Comida eliminada'}, status=status.HTTP_200_OK)

    serializer = ComidaSerializer(comida, data=request.data, partial=True)
    if serializer.is_valid():
        comida_act = serializer.save()
        return Response(
            {
                'mensaje': 'Comida actualizada',
                'comida': ComidaSerializer(comida_act).data,
            },
            status=status.HTTP_200_OK,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ============================================================
# 6. REGISTRO DE AGUA (HIDRATACIÓN)
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agua_hoy(request):
    """
    GET /api/agua/hoy -> Retorna el estado de hidratación de hoy para el usuario.
    """
    today = timezone.localdate()
    registro, _ = RegistroAgua.objects.get_or_create(
        usuario=request.user,
        fecha=today,
        defaults={'cantidad_ml': 0, 'meta_ml': 2000}
    )
    return Response(
        {
            'cantidad_ml': registro.cantidad_ml,
            'meta_ml': registro.meta_ml,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agua(request):
    """
    POST /api/agua -> Acumula consumo de agua o reinicia para hoy.
    Body: { cantidad_ml: int, reset?: bool }
    """
    data = request.data
    is_reset = bool(data.get('reset', False))

    if 'cantidad_ml' not in data and not is_reset:
        return Response(
            {'error': 'El campo cantidad_ml es requerido.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_cantidad = data.get('cantidad_ml', 0)
    try:
        cantidad = int(raw_cantidad)
    except (TypeError, ValueError):
        return Response(
            {'error': 'La cantidad de agua debe ser un número entero.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if cantidad < 0:
        return Response(
            {'error': 'La cantidad de agua no puede ser negativa.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if cantidad > 10000:
        return Response(
            {'error': 'La cantidad de agua en una sola toma no puede superar los 10,000 ml.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    today = timezone.localdate()
    registro, _ = RegistroAgua.objects.get_or_create(
        usuario=request.user,
        fecha=today,
        defaults={'cantidad_ml': 0, 'meta_ml': 2000}
    )

    if is_reset:
        registro.cantidad_ml = 0
    else:
        registro.cantidad_ml += cantidad
    registro.save()

    return Response(
        {
            'cantidad_ml': registro.cantidad_ml,
            'meta_ml': registro.meta_ml,
        },
        status=status.HTTP_200_OK,
    )


# ============================================================
# 7. ALERGIAS E INTOLERANCIAS (CRUD)
# ============================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def alergias(request):
    """
    GET  /api/alergias -> Listar alergias registradas del usuario autenticado
    POST /api/alergias -> Crear nueva alergia
    """
    if request.method == 'GET':
        queryset = Alergia.objects.filter(usuario=request.user).order_by('-fecha_registro', 'id_alergia')
        return Response(AlergiaSerializer(queryset, many=True).data)

    serializer = AlergiaSerializer(data=request.data)
    if serializer.is_valid():
        alergia = serializer.save(usuario=request.user)
        return Response(
            {
                'id_alergia': alergia.id_alergia,
                'id': alergia.id_alergia,
                'nombre': alergia.nombre,
                'reemplazos': alergia.reemplazos,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {'error': _primer_error(serializer)},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def alergia_detalle(request, pk):
    """
    DELETE /api/alergias/<pk> -> Eliminar alergia del usuario autenticado
    """
    try:
        alergia = Alergia.objects.get(pk=pk, usuario=request.user)
    except Alergia.DoesNotExist:
        return Response(
            {'error': 'Alergia no encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    alergia.delete()
    return Response({'mensaje': 'Alergia eliminada'}, status=status.HTTP_200_OK)


# ============================================================
# 8. PROGRESO SEMANAL
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progreso_semanal(request):
    """
    GET /api/progreso/semanal
    Calcula la adherencia nutricional para los últimos 7 días terminando en HOY.
    Suma las calorías de las comidas completadas (completado=True) y evalúa
    si se alcanzó al menos el 85% de la meta diaria del usuario.
    """
    today = timezone.localdate()
    start_date = today - datetime.timedelta(days=6)

    completed_meals = Comida.objects.filter(
        usuario=request.user,
        fecha__range=[start_date, today],
        completado=True,
    )

    daily_kcal = {}
    for m in completed_meals:
        daily_kcal[m.fecha] = daily_kcal.get(m.fecha, 0.0) + (m.calorias or 0.0)

    target_kcal = getattr(request.user, 'calorias_diarias', None) or 2000
    min_adherence_threshold = round(target_kcal * 0.85)

    day_names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    month_abbr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    result = []
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        name = day_names[d.weekday()]
        day_num = d.day
        date_label = f"{day_num} {month_abbr[d.month - 1]}"
        kcal = int(round(daily_kcal.get(d, 0.0)))
        is_completed = (kcal >= min_adherence_threshold) if min_adherence_threshold > 0 else (kcal > 0)

        result.append({
            'day': name,
            'dayNum': day_num,
            'dateLabel': date_label,
            'kcal': kcal,
            'isCompleted': is_completed,
            'isToday': (d == today),
            'isPast': (d < today),
            'isFuture': False,
        })

    return Response(result, status=status.HTTP_200_OK)

