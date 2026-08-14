from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import Alimento, Categoria, Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    id_rol = serializers.IntegerField(source='rol.id_rol', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'edad', 'peso', 'altura',
            'objetivo', 'calorias_diarias', 'id_rol', 'fecha_registro',
        ]
        read_only_fields = ['id_usuario', 'fecha_registro']


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    contrasena_hash = serializers.CharField(write_only=True)
    id_rol = serializers.IntegerField(write_only=True, required=False, default=2)

    class Meta:
        model = Usuario
        fields = [
            'id_usuario', 'nombre', 'email', 'contrasena_hash',
            'edad', 'peso', 'altura', 'id_rol',
        ]
        read_only_fields = ['id_usuario']

    def validate_email(self, value):
        value = value.strip().lower()
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('El correo ya está registrado')
        return value

    def create(self, validated_data):
        id_rol = validated_data.pop('id_rol', 2)
        try:
            rol = Rol.objects.get(id_rol=id_rol)
        except Rol.DoesNotExist:
            raise serializers.ValidationError({'id_rol': 'Rol no válido'})
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

    def create(self, validated_data):
        id_categoria = validated_data.pop('id_categoria')
        try:
            categoria = Categoria.objects.get(id_categoria=id_categoria)
        except Categoria.DoesNotExist:
            raise serializers.ValidationError({'id_categoria': 'Categoría no válida'})
        return Alimento.objects.create(categoria=categoria, **validated_data)

    def update(self, instance, validated_data):
        id_categoria = validated_data.pop('id_categoria', None)
        if id_categoria is not None:
            try:
                instance.categoria = Categoria.objects.get(id_categoria=id_categoria)
            except Categoria.DoesNotExist:
                raise serializers.ValidationError({'id_categoria': 'Categoría no válida'})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
