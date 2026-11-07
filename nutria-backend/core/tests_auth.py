"""
Suite automatizada de pruebas para Autenticación, Registro y Seguridad RBAC (Milestone 1).
"""

from django.contrib.auth.hashers import check_password
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Rol, Usuario


class AuthAndRegistrationTestSuite(TestCase):
    """
    Verifica endpoints /api/auth/register, /api/usuarios, /api/auth/login, /api/auth/me,
    códigos HTTP (201, 400, 401), validación de datos y blindaje contra escalamiento de privilegios.
    """

    def setUp(self):
        self.client = APIClient()
        self.rol_admin, _ = Rol.objects.get_or_create(id_rol=1, defaults={'nombre': 'Administrador'})
        self.rol_usuario, _ = Rol.objects.get_or_create(id_rol=2, defaults={'nombre': 'Usuario'})
        self.rol_nutri, _ = Rol.objects.get_or_create(id_rol=3, defaults={'nombre': 'Nutricionista'})

        self.valid_payload = {
            'nombre': 'Valeria Ramos',
            'email': 'valeria.ramos@nutria.fit',
            'contrasena': 'NutrIA2026!Pass',
            'edad': 28,
            'peso': 62.5,
            'altura': 166.0,
            'objetivo': 'Mantenimiento & Salud',
            'calorias_diarias': 2000,
        }

    # 1. Registro exitoso y emisión de tokens JWT
    def test_registro_exitoso_auth_register_sin_barra(self):
        res = self.client.post('/api/auth/register', self.valid_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['usuario']['email'], 'valeria.ramos@nutria.fit')
        self.assertEqual(res.data['usuario']['rol'], 'Usuario')

        user_db = Usuario.objects.get(email='valeria.ramos@nutria.fit')
        self.assertTrue(check_password('NutrIA2026!Pass', user_db.contrasena_hash))
        self.assertEqual(user_db.rol.id_rol, 2)

    def test_registro_exitoso_auth_register_con_barra(self):
        payload = dict(self.valid_payload, email='valeria.slash@nutria.fit')
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)

    def test_registro_exitoso_alias_usuarios(self):
        for endpoint in ('/api/usuarios', '/api/usuarios/'):
            email = f'alias_{endpoint.replace("/", "_")}@nutria.fit'
            payload = dict(self.valid_payload, email=email)
            res = self.client.post(endpoint, payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertIn('access', res.data)

    def test_registro_soporta_clave_contrasena_hash(self):
        payload = dict(self.valid_payload)
        payload.pop('contrasena')
        payload['contrasena_hash'] = 'HashPass123!'
        payload['email'] = 'hashuser@nutria.fit'
        res = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user_db = Usuario.objects.get(email='hashuser@nutria.fit')
        self.assertTrue(check_password('HashPass123!', user_db.contrasena_hash))

    def test_registro_soporta_clave_password(self):
        payload = dict(self.valid_payload)
        payload.pop('contrasena')
        payload['password'] = 'AltPass123!'
        payload['email'] = 'altuser@nutria.fit'
        res = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user_db = Usuario.objects.get(email='altuser@nutria.fit')
        self.assertTrue(check_password('AltPass123!', user_db.contrasena_hash))

    # 2. Email duplicado
    def test_registro_email_duplicado_rechazado_400(self):
        self.client.post('/api/auth/register', self.valid_payload, format='json')
        res_dup = self.client.post('/api/auth/register', self.valid_payload, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('El correo ya está registrado', res_dup.data.get('error', ''))

        payload_upper = dict(self.valid_payload, email='VALERIA.RAMOS@NUTRIA.FIT')
        res_upper = self.client.post('/api/auth/register', payload_upper, format='json')
        self.assertEqual(res_upper.status_code, status.HTTP_400_BAD_REQUEST)

    # 3. Contraseñas débiles
    def test_registro_contrasenas_debiles_rechazadas_400(self):
        bad_passwords = [
            'Aa1!',              # Menos de 8 caracteres
            'lowercase123!',     # Sin mayúscula
            'NOLOWERCASE123!',   # Sin minúscula
            'NoNumbersHere!',    # Sin números
            'NoSpecial1234',     # Sin carácter especial
        ]
        for pwd in bad_passwords:
            payload = dict(self.valid_payload, email=f'bad_{hash(pwd)}@nutria.fit', contrasena=pwd)
            res = self.client.post('/api/auth/register', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', res.data)

    # 4. Datos biométricos fuera de rango
    def test_registro_biometricos_fuera_de_rango_rechazados_400(self):
        invalid_cases = [
            ({'edad': 11}, 'rango fisiológico válido (12-120 años)'),
            ({'edad': 121}, 'rango fisiológico válido (12-120 años)'),
            ({'peso': 29.9}, 'entre 30 kg y 300 kg'),
            ({'peso': 301.0}, 'entre 30 kg y 300 kg'),
            ({'altura': 99.0}, 'entre 100 cm y 250 cm'),
            ({'altura': 251.0}, 'entre 100 cm y 250 cm'),
            ({'calorias_diarias': 499}, 'entre 500 y 10,000 kcal'),
            ({'calorias_diarias': 10001}, 'entre 500 y 10,000 kcal'),
        ]
        for override, err_substr in invalid_cases:
            payload = dict(self.valid_payload, email=f'bio_{hash(str(override))}@nutria.fit', **override)
            res = self.client.post('/api/auth/register', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn(err_substr, res.data.get('error', ''))

    # 5. Bloqueo de escalamiento de privilegios
    def test_registro_intento_escalamiento_rol_rechazado_400(self):
        for evil_role in (1, 3, 99):
            payload = dict(self.valid_payload, email=f'evil_{evil_role}@evil.com', id_rol=evil_role)
            res_reg = self.client.post('/api/auth/register', payload, format='json')
            self.assertEqual(res_reg.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('privilegiado', res_reg.data.get('error', '').lower())

            res_alias = self.client.post('/api/usuarios', payload, format='json')
            self.assertEqual(res_alias.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertFalse(Usuario.objects.filter(email__contains='evil.com').exists())

    # 6. Login con credenciales nuevas
    def test_login_con_credenciales_nuevas_y_emision_tokens(self):
        self.client.post('/api/auth/register', self.valid_payload, format='json')

        # Login exitoso con password
        res_login = self.client.post('/api/auth/login', {
            'email': 'valeria.ramos@nutria.fit',
            'password': 'NutrIA2026!Pass',
        }, format='json')
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data)
        self.assertIn('refresh', res_login.data)

        # Login exitoso con contrasena y trailing slash
        res_login_slash = self.client.post('/api/auth/login/', {
            'email': 'valeria.ramos@nutria.fit',
            'contrasena': 'NutrIA2026!Pass',
        }, format='json')
        self.assertEqual(res_login_slash.status_code, status.HTTP_200_OK)

        # 401 Contraseña incorrecta
        res_bad_pwd = self.client.post('/api/auth/login', {
            'email': 'valeria.ramos@nutria.fit',
            'password': 'WrongPassword123!',
        }, format='json')
        self.assertEqual(res_bad_pwd.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('contraseña incorrecta', res_bad_pwd.data.get('error', ''))

        # 401 Correo inexistente
        res_bad_email = self.client.post('/api/auth/login', {
            'email': 'noexiste@nutria.fit',
            'password': 'NutrIA2026!Pass',
        }, format='json')
        self.assertEqual(res_bad_email.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('no registrado', res_bad_email.data.get('error', ''))

        # 400 Campos vacíos
        res_empty = self.client.post('/api/auth/login', {'email': ''}, format='json')
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

    # 7. /api/auth/me con access token
    def test_auth_me_con_access_token_emitido(self):
        res_reg = self.client.post('/api/auth/register', self.valid_payload, format='json')
        access_token = res_reg.data['access']

        # Con token Bearer válido
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        res_me = self.client.get('/api/auth/me')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['email'], 'valeria.ramos@nutria.fit')
        self.assertEqual(res_me.data['nombre'], 'Valeria Ramos')
        self.assertEqual(res_me.data['rol'], 'Usuario')

        # Con trailing slash
        res_me_slash = self.client.get('/api/auth/me/')
        self.assertEqual(res_me_slash.status_code, status.HTTP_200_OK)

        # Sin token
        self.client.credentials()
        res_unauth = self.client.get('/api/auth/me')
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Con token inválido
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token_invalido_12345')
        res_invalid = self.client.get('/api/auth/me')
        self.assertEqual(res_invalid.status_code, status.HTTP_401_UNAUTHORIZED)

    # 8. Token Refresh JWT
    def test_auth_refresh_exitoso(self):
        """Verifica emisión de nuevo token access mediante refresh token válido."""
        res_reg = self.client.post('/api/auth/register', self.valid_payload, format='json')
        refresh_token = res_reg.data['refresh']

        for endpoint in ('/api/auth/refresh', '/api/auth/refresh/'):
            res_ref = self.client.post(endpoint, {'refresh': refresh_token}, format='json')
            self.assertEqual(res_ref.status_code, status.HTTP_200_OK)
            self.assertIn('access', res_ref.data)

            # Validar que el nuevo token funcione en /api/auth/me
            new_access = res_ref.data['access']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
            res_me = self.client.get('/api/auth/me')
            self.assertEqual(res_me.status_code, status.HTTP_200_OK)
            self.assertEqual(res_me.data['email'], self.valid_payload['email'])

    def test_auth_refresh_token_invalido(self):
        """Rechaza tokens de refresco corruptos o inexistentes con HTTP 401."""
        res = self.client.post('/api/auth/refresh', {'refresh': 'token.invalido.xyz'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # 9. Disciplina de métodos HTTP en /api/auth/register (405 en GET)
    def test_registro_metodo_get_rechazado_405(self):
        """Rechaza peticiones GET en /api/auth/register con 405 Method Not Allowed."""
        for endpoint in ('/api/auth/register', '/api/auth/register/'):
            res = self.client.get(endpoint)
            self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # 10. Robustez y validaciones límite de payload
    def test_registro_payload_no_diccionario_rechazado_400(self):
        """Rechaza payloads JSON primitivos con HTTP 400 en lugar de crashear con HTTP 500."""
        for primitive_payload in (12345, "string_invalido", True):
            res = self.client.post('/api/auth/register', primitive_payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', res.data)

    def test_registro_email_formato_invalido_400(self):
        """Rechaza correos sin arroba, sin dominio o malformados con HTTP 400."""
        bad_emails = ['notanemail', 'sin_dominio@', '@sin_usuario.com', 'espacios @nutria.fit']
        for bad_mail in bad_emails:
            payload = dict(self.valid_payload, email=bad_mail)
            res = self.client.post('/api/auth/register', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            err = res.data.get('error', '').lower()
            self.assertTrue(
                'correo' in err or 'email' in err or 'válid' in err or 'valid' in err,
                f"Mensaje de error inesperado para '{bad_mail}': {err}"
            )

    def test_registro_nombre_invalido_400(self):
        """Rechaza nombres menores a 3 caracteres o que incluyan inyección de scripts/HTML."""
        for bad_name in ('Al', '   ', '<script>alert(1)</script>', '<b>Tag</b>'):
            payload = dict(self.valid_payload, email=f'name_{abs(hash(bad_name))}@nutria.fit', nombre=bad_name)
            res = self.client.post('/api/auth/register', payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', res.data)

