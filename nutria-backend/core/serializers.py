from collections.abc import Mapping
import re
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings

from .models import Alergia, Alimento, Categoria, Comida, RegistroAgua, Rol, Usuario


EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    id_rol = serializers.IntegerField(source='rol.id_rol', read_only=True)
    rol = serializers.CharField(source='rol.nombre', read_only=True)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'edad', 'peso', 'altura',
            'objetivo', 'calorias_diarias', 'id_rol', 'rol', 'rol_nombre', 'fecha_registro',
        ]
        read_only_fields = ['id_usuario', 'fecha_registro']

    def update(self, instance, validated_data):
        # Si se envía id_rol directamente en request.data, solo admin puede modificarlo
        request = self.context.get('request')
        if request and 'id_rol' in request.data:
            user = request.user
            is_admin = getattr(user, 'rol_id', None) == 1 or getattr(getattr(user, 'rol', None), 'id_rol', None) == 1
            if is_admin:
                new_rol_id = int(request.data['id_rol'])
                try:
                    instance.rol = Rol.objects.get(id_rol=new_rol_id)
                except Rol.DoesNotExist:
                    raise serializers.ValidationError({'id_rol': 'El rol especificado no existe.'})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(
        source='contrasena_hash',
        write_only=True,
        required=True,
        error_messages={'required': 'La contraseña es requerida.'}
    )
    id_rol = serializers.IntegerField(write_only=True, required=False, default=2)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'contrasena',
            'edad', 'peso', 'altura', 'objetivo', 'calorias_diarias', 'id_rol',
        ]
        read_only_fields = ['id_usuario']
        extra_kwargs = {
            'email': {
                'validators': [],  # Custom validation in validate_email returns domain error
            }
        }

    def to_internal_value(self, data):
        # Rechazar tipos primitivos que no son mapeos delegando a DRF (retorna 400 en vez de 500)
        if not isinstance(data, Mapping):
            return super().to_internal_value(data)

        # Permite indistintamente 'contrasena', 'contrasena_hash' o 'password'
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if not data_copy.get('contrasena'):
            if data_copy.get('contrasena_hash'):
                data_copy['contrasena'] = data_copy['contrasena_hash']
            elif data_copy.get('password'):
                data_copy['contrasena'] = data_copy['password']
        return super().to_internal_value(data_copy)

    def validate_nombre(self, value):
        val = str(value).strip()
        if len(val) < 3:
            raise serializers.ValidationError('El nombre debe tener al menos 3 caracteres.')
        if '<' in val or '>' in val:
            raise serializers.ValidationError('El nombre no puede contener etiquetas HTML ni scripts.')
        return val

    def validate_email(self, value):
        val = str(value).strip().lower()
        if not EMAIL_REGEX.match(val):
            raise serializers.ValidationError('El formato de correo no es válido (RFC 5322).')
        if Usuario.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError('El correo ya está registrado.')
        return val

    def validate_contrasena(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener mínimo 8 caracteres.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos una letra mayúscula.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos una letra minúscula.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un número.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un carácter especial.')
        return value

    def validate_edad(self, value):
        if value is not None and (value < 12 or value > 120):
            raise serializers.ValidationError('La edad debe encontrarse en un rango fisiológico válido (12-120 años).')
        return value

    def validate_peso(self, value):
        if value is not None and (value < 30 or value > 300):
            raise serializers.ValidationError('El peso corporal debe encontrarse entre 30 kg y 300 kg.')
        return value

    def validate_altura(self, value):
        if value is not None and (value < 100 or value > 250):
            raise serializers.ValidationError('La altura debe encontrarse entre 100 cm y 250 cm.')
        return value

    def validate_calorias_diarias(self, value):
        if value is not None and (value < 500 or value > 10000):
            raise serializers.ValidationError('Las calorías diarias deben encontrarse entre 500 y 10,000 kcal.')
        return value

    def validate_id_rol(self, value):
        if value is not None and value != 2:
            raise serializers.ValidationError('No está permitido registrarse con un rol privilegiado.')
        return 2

    def create(self, validated_data):
        # Blindaje anti-escalamiento: descartar id_rol del cliente y forzar rol 2 (Usuario)
        validated_data.pop('id_rol', None)
        rol = (
            Rol.objects.filter(id_rol=2).first()
            or Rol.objects.filter(nombre='Usuario').first()
            or Rol.objects.create(id_rol=2, nombre='Usuario')
        )
        validated_data['rol'] = rol
        validated_data['contrasena_hash'] = make_password(validated_data['contrasena_hash'])
        try:
            return Usuario.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'email': 'El correo ya está registrado.'})


class UsuarioTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Serializador de refresco JWT para el modelo Usuario (PK = id_usuario).
    Reemplaza la consulta de auth.User por core.models.Usuario y maneja inexistencia.
    """
    def validate(self, attrs):
        refresh = self.token_class(attrs['refresh'])

        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM, None)
        if user_id:
            try:
                user = Usuario.objects.get(id_usuario=user_id)
            except Usuario.DoesNotExist:
                raise AuthenticationFailed(
                    self.error_messages['no_active_account'],
                    'no_active_account',
                )

            if not getattr(user, 'is_active', True):
                raise AuthenticationFailed(
                    self.error_messages['no_active_account'],
                    'no_active_account',
                )

        data = {'access': str(refresh.access_token)}

        if api_settings.ROTATE_REFRESH_TOKENS:
            if api_settings.BLACKLIST_AFTER_ROTATION:
                try:
                    refresh.blacklist()
                except AttributeError:
                    pass

            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()

            if api_settings.USER_ID_CLAIM in refresh.payload:
                refresh.payload[api_settings.USER_ID_CLAIM] = user_id

            data['refresh'] = str(refresh)

        return data


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre']


class AlimentoSerializer(serializers.ModelSerializer):
    categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    id_categoria = serializers.IntegerField(write_only=True)
    emoji = serializers.CharField(max_length=16, required=False, default='🥗')
    badge = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    prioridad = serializers.CharField(max_length=20, required=False, default='media')
    detalles = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Alimento
        fields = [
            'id_alimento', 'nombre', 'categoria', 'categoria_nombre', 'id_categoria',
            'calorias', 'proteinas', 'carbohidratos', 'grasas',
            'emoji', 'badge', 'prioridad', 'detalles',
        ]
        read_only_fields = ['id_alimento']

    def validate_nombre(self, value):
        val = str(value).strip()
        if len(val) < 2:
            raise serializers.ValidationError('El nombre del alimento debe tener al menos 2 caracteres.')
        return val

    def validate_calorias(self, value):
        if value < 0 or value > 10000:
            raise serializers.ValidationError('El valor calórico debe estar entre 0 y 10,000 kcal.')
        return value

    def validate_proteinas(self, value):
        if value < 0 or value > 500:
            raise serializers.ValidationError('Las proteínas deben estar entre 0g y 500g.')
        return value

    def validate_carbohidratos(self, value):
        if value < 0 or value > 500:
            raise serializers.ValidationError('Los carbohidratos deben estar entre 0g y 500g.')
        return value

    def validate_grasas(self, value):
        if value < 0 or value > 500:
            raise serializers.ValidationError('Las grasas deben estar entre 0g y 500g.')
        return value

    def create(self, validated_data):
        id_categoria = validated_data.pop('id_categoria')
        try:
            categoria = Categoria.objects.get(id_categoria=id_categoria)
        except Categoria.DoesNotExist:
            raise serializers.ValidationError({'id_categoria': 'Categoría no válida.'})
        return Alimento.objects.create(categoria=categoria, **validated_data)

    def update(self, instance, validated_data):
        id_categoria = validated_data.pop('id_categoria', None)
        if id_categoria is not None:
            try:
                instance.categoria = Categoria.objects.get(id_categoria=id_categoria)
            except Categoria.DoesNotExist:
                raise serializers.ValidationError({'id_categoria': 'Categoría no válida.'})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ------------------------------------------------------------
# SERIALIZADORES MILESTONE 2: PARIDAD DE DATOS
# ------------------------------------------------------------
class ComidaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='id_comida', read_only=True)
    id_comida = serializers.IntegerField(read_only=True)
    tipo = serializers.CharField(required=False, default='Almuerzo')
    nombre = serializers.CharField(required=True)
    hora = serializers.CharField(max_length=10, required=False, allow_blank=True, default='12:00')
    calorias = serializers.FloatField(required=True)
    proteinas = serializers.FloatField(required=False, default=0.0)
    carbohidratos = serializers.FloatField(required=False, default=0.0)
    grasas = serializers.FloatField(required=False, default=0.0)
    completado = serializers.BooleanField(required=False, default=False)
    fecha = serializers.DateField(required=False, default=timezone.localdate)
    items = serializers.JSONField(required=False, default=list)

    class Meta:
        model = Comida
        fields = [
            'id', 'id_comida', 'tipo', 'nombre', 'hora',
            'calorias', 'proteinas', 'carbohidratos', 'grasas',
            'completado', 'fecha', 'items',
        ]
        read_only_fields = ['id', 'id_comida']

    def validate_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre de la comida es requerido.')
        if len(val) < 2:
            raise serializers.ValidationError('El nombre de la comida debe tener al menos 2 caracteres.')
        return val

    def validate_calorias(self, value):
        if value < 0:
            raise serializers.ValidationError('Las calorías no pueden ser negativas.')
        if value > 10000:
            raise serializers.ValidationError('Las calorías exceden el límite fisiológico permitido (10,000 kcal).')
        return value

    def validate_proteinas(self, value):
        if value < 0 or value > 1000:
            raise serializers.ValidationError('El valor de proteínas debe encontrarse entre 0g y 1000g.')
        return value

    def validate_carbohidratos(self, value):
        if value < 0 or value > 1000:
            raise serializers.ValidationError('El valor de carbohidratos debe encontrarse entre 0g y 1000g.')
        return value

    def validate_grasas(self, value):
        if value < 0 or value > 1000:
            raise serializers.ValidationError('El valor de grasas debe encontrarse entre 0g y 1000g.')
        return value

    def validate_items(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Los items deben proporcionarse como una lista.')
        return value


class RegistroAguaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='id_registro', read_only=True)
    id_registro = serializers.IntegerField(read_only=True)

    class Meta:
        model = RegistroAgua
        fields = ['id', 'id_registro', 'fecha', 'cantidad_ml', 'meta_ml']
        read_only_fields = ['id', 'id_registro', 'fecha']

    def validate_cantidad_ml(self, value):
        if value < 0:
            raise serializers.ValidationError('La cantidad de agua no puede ser negativa.')
        if value > 10000:
            raise serializers.ValidationError('La cantidad de agua en una sola toma no puede superar los 10,000 ml.')
        return value


class AlergiaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='id_alergia', read_only=True)
    id_alergia = serializers.IntegerField(read_only=True)
    reemplazos = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Alergia
        fields = ['id', 'id_alergia', 'nombre', 'reemplazos', 'fecha_registro']
        read_only_fields = ['id', 'id_alergia', 'fecha_registro']

    def validate_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre de la alergia no puede estar vacío.')
        if len(val) > 150:
            raise serializers.ValidationError('El nombre de la alergia no puede exceder 150 caracteres.')
        return val


class NutriaChatRequestSerializer(serializers.Serializer):
    """
    Serializador para solicitudes de chat a NutriaBot.
    Valida el mensaje requerido, lista de exclusiones y métricas metabólicas opcionales.
    """
    message = serializers.CharField(required=True, allow_blank=False)
    exclusions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
    metrics_override = serializers.DictField(
        required=False,
        default=dict
    )
    goal = serializers.CharField(required=False, allow_blank=True, default='')
    dietScheme = serializers.CharField(required=False, allow_blank=True, default='')
    weight = serializers.FloatField(required=False, allow_null=True, default=None)
    height = serializers.FloatField(required=False, allow_null=True, default=None)

    def validate_message(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El mensaje no puede estar vacío.')
        return val
