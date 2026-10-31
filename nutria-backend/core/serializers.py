import re
from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import Alimento, Categoria, Rol, Usuario


EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    id_rol = serializers.IntegerField(source='rol.id_rol', read_only=True)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'edad', 'peso', 'altura',
            'objetivo', 'calorias_diarias', 'id_rol', 'rol_nombre', 'fecha_registro',
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
    contrasena = serializers.CharField(source='contrasena_hash', write_only=True)
    id_rol = serializers.IntegerField(write_only=True, required=False, default=2)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'contrasena',
            'edad', 'peso', 'altura', 'objetivo', 'calorias_diarias', 'id_rol',
        ]
        read_only_fields = ['id_usuario']

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
        if Usuario.objects.filter(email=val).exists():
            raise serializers.ValidationError('El correo ya está registrado.')
        return val

    def validate_contrasena(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('La contraseña debe tener mínimo 8 caracteres.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos una letra mayúscula.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un número.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
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

    def create(self, validated_data):
        id_rol = validated_data.pop('id_rol', 2)
        try:
            rol = Rol.objects.get(id_rol=id_rol)
        except Rol.DoesNotExist:
            raise serializers.ValidationError({'id_rol': 'Rol no válido.'})
        validated_data['rol'] = rol
        validated_data['contrasena_hash'] = make_password(validated_data['contrasena_hash'])
        return Usuario.objects.create(**validated_data)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nombre']


class AlimentoSerializer(serializers.ModelSerializer):
    categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    id_categoria = serializers.IntegerField(write_only=True)

    class Meta:
        model = Alimento
        fields = [
            'id_alimento', 'nombre', 'categoria', 'id_categoria',
            'calorias', 'proteinas', 'carbohidratos', 'grasas',
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
