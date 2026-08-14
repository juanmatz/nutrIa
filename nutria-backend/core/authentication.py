from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings

from .models import Usuario


class UsuarioJWTAuthentication(JWTAuthentication):
    """Autentica con JWT contra el modelo Usuario (PK = id_usuario)."""

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('El token no contiene un identificador de usuario')

        try:
            return Usuario.objects.get(id_usuario=user_id)
        except Usuario.DoesNotExist:
            raise InvalidToken('Usuario no encontrado')
