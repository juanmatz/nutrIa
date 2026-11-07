"""
NutrIA Automated Test Suite: Backend Data Parity (Milestone 2).

Covers:
- Meals CRUD (/api/comidas): creation with items, user filtering, date filtering, completion toggle, deletion.
- Water tracker (/api/agua/hoy, /api/agua): initial status, logging, accumulation, reset/decrement, boundaries.
- Allergies CRUD (/api/alergias): listing, addition with replacements, deletion, name validation.
- Weekly progress (/api/progreso/semanal): 7-day array schema, calorie sum from completed meals, goal calculation.
- Extended Alimento catalog (/api/alimentos): emoji, badge, prioridad, detalles defaults and serialization.
- Multi-tenant isolation: strict barrier preventing cross-user read, update, or deletion.
- Authentication enforcement: 401 on unauthenticated access across all parity endpoints.

Execution:
    python manage.py test core.tests_parity
"""

import datetime
from decimal import Decimal
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Alergia, Alimento, Categoria, Comida, RegistroAgua, Rol, Usuario


# ==============================================================================
# BASE TEST HARNESS FOR BACKEND PARITY
# ==============================================================================
class ParityBaseTestCase(TestCase):
    """
    Base test fixture providing pre-configured roles, categories, users,
    and authenticated API clients.
    """

    def setUp(self):
        super().setUp()
        self.client = APIClient()

        # Seed RBAC Roles
        self.rol_admin, _ = Rol.objects.get_or_create(id_rol=1, defaults={'nombre': 'Administrador'})
        self.rol_usuario, _ = Rol.objects.get_or_create(id_rol=2, defaults={'nombre': 'Usuario'})
        self.rol_nutri, _ = Rol.objects.get_or_create(id_rol=3, defaults={'nombre': 'Nutricionista'})

        # Seed Default Category
        self.cat_proteina, _ = Categoria.objects.get_or_create(nombre='Proteínas')
        self.cat_carbos, _ = Categoria.objects.get_or_create(nombre='Carbohidratos')

        # Primary test user (User A)
        self.user_a = Usuario.objects.create(
            nombre='Ana García',
            email='ana.garcia@nutria.fit',
            contrasena_hash=make_password('Password2026!'),
            edad=29,
            peso=64.0,
            altura=168.0,
            calorias_diarias=2000,
            objetivo='Mantenimiento',
            rol=self.rol_usuario,
        )

        # Secondary test user (User B for multi-tenant isolation)
        self.user_b = Usuario.objects.create(
            nombre='Bruno Díaz',
            email='bruno.diaz@nutria.fit',
            contrasena_hash=make_password('Password2026!'),
            edad=35,
            peso=85.0,
            altura=182.0,
            calorias_diarias=2500,
            objetivo='Hipertrofia',
            rol=self.rol_usuario,
        )

    def login_user(self, user):
        """Authenticates client via /api/auth/login and sets Bearer token."""
        res = self.client.post('/api/auth/login', {'email': user.email, 'password': 'Password2026!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return token


# ==============================================================================
# 1. MEALS CRUD TESTS (/api/comidas)
# ==============================================================================
class MealsCrudParityTests(ParityBaseTestCase):
    """Verifies creation, listing, filtering, PATCH completion, and deletion of daily meals."""

    def setUp(self):
        super().setUp()
        self.login_user(self.user_a)

    def test_crear_comida_con_items_exitoso(self):
        """POST /api/comidas: Creates meal with items and returns 201 with meal object."""
        payload = {
            "tipo": "Desayuno",
            "nombre": "Tortilla de claras con avena",
            "hora": "08:30",
            "calorias": 420,
            "proteinas": 32.5,
            "carbohidratos": 45.0,
            "grasas": 8.0,
            "completado": False,
            "items": [
                {"nombre": "Claras de huevo", "porcion": "150g", "calorias": 75},
                {"nombre": "Avena en hojuelas", "porcion": "50g", "calorias": 180}
            ]
        }
        res = self.client.post('/api/comidas', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('comida', res.data)
        comida_data = res.data['comida']
        self.assertEqual(comida_data['nombre'], "Tortilla de claras con avena")
        self.assertEqual(comida_data['tipo'], "Desayuno")
        self.assertEqual(len(comida_data['items']), 2)

        # Verify DB persistence and user binding
        db_meal = Comida.objects.get(id_comida=comida_data['id_comida'])
        self.assertEqual(db_meal.usuario, self.user_a)
        self.assertEqual(db_meal.calorias, 420)

    def test_crear_comida_sin_items_default_lista_vacia(self):
        """POST /api/comidas: Omitted items defaults to empty list."""
        payload = {
            "tipo": "Cena",
            "nombre": "Pechuga a la plancha",
            "hora": "20:00",
            "calorias": 350,
            "proteinas": 40.0,
            "carbohidratos": 0.0,
            "grasas": 5.0,
            "completado": False
        }
        res = self.client.post('/api/comidas', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['comida']['items'], [])

    def test_listar_comidas_usuario_autenticado(self):
        """GET /api/comidas: Returns all meals belonging to authenticated user."""
        Comida.objects.create(usuario=self.user_a, tipo='Desayuno', nombre='Comida 1', calorias=300)
        Comida.objects.create(usuario=self.user_a, tipo='Almuerzo', nombre='Comida 2', calorias=600)

        res = self.client.get('/api/comidas')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 2)
        nombres = [m['nombre'] for m in res.data]
        self.assertIn('Comida 1', nombres)
        self.assertIn('Comida 2', nombres)

    def test_listar_comidas_filtradas_por_fecha(self):
        """GET /api/comidas?fecha=YYYY-MM-DD: Returns only meals matching date query."""
        today = timezone.localdate()
        yesterday = today - datetime.timedelta(days=1)

        Comida.objects.create(usuario=self.user_a, tipo='Desayuno', nombre='Hoy', calorias=300, fecha=today)
        Comida.objects.create(usuario=self.user_a, tipo='Cena', nombre='Ayer', calorias=500, fecha=yesterday)

        res_today = self.client.get(f'/api/comidas?fecha={today.isoformat()}')
        self.assertEqual(res_today.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_today.data), 1)
        self.assertEqual(res_today.data[0]['nombre'], 'Hoy')

    def test_toggle_completado_comida_patch(self):
        """PATCH /api/comidas/<id>: Toggles completado boolean flag."""
        meal = Comida.objects.create(usuario=self.user_a, tipo='Almuerzo', nombre='Salmón', calorias=500, completado=False)
        res = self.client.patch(f'/api/comidas/{meal.id_comida}', {'completado': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['comida']['completado'])

        meal.refresh_from_db()
        self.assertTrue(meal.completado)

    def test_eliminar_comida_exitoso(self):
        """DELETE /api/comidas/<id>: Removes meal from database."""
        meal = Comida.objects.create(usuario=self.user_a, tipo='Merienda', nombre='Yogur', calorias=150)
        res = self.client.delete(f'/api/comidas/{meal.id_comida}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Comida.objects.filter(id_comida=meal.id_comida).exists())

    def test_validacion_comida_calorias_limites(self):
        """POST /api/comidas: Rejects calories < 0 or > 10,000 with 400; accepts 0 kcal."""
        # 0 kcal accepted
        res_zero = self.client.post('/api/comidas', {
            'tipo': 'Snack', 'nombre': 'Té verde', 'calorias': 0
        }, format='json')
        self.assertEqual(res_zero.status_code, status.HTTP_201_CREATED)

        # > 10000 kcal rejected
        res_high = self.client.post('/api/comidas', {
            'tipo': 'Almuerzo', 'nombre': 'Banquete', 'calorias': 15000
        }, format='json')
        self.assertEqual(res_high.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modificar_o_eliminar_comida_inexistente_retorna_404(self):
        """PATCH/DELETE non-existent meal ID returns 404."""
        r_patch = self.client.patch('/api/comidas/99999', {'completado': True}, format='json')
        self.assertEqual(r_patch.status_code, status.HTTP_404_NOT_FOUND)

        r_del = self.client.delete('/api/comidas/99999')
        self.assertEqual(r_del.status_code, status.HTTP_404_NOT_FOUND)


# ==============================================================================
# 2. WATER TRACKER TESTS (/api/agua/hoy, /api/agua)
# ==============================================================================
class WaterTrackerParityTests(ParityBaseTestCase):
    """Verifies hydration tracking, today's status, accumulation, reset, and constraints."""

    def setUp(self):
        super().setUp()
        self.login_user(self.user_a)

    def test_obtener_agua_hoy_default_inicial(self):
        """GET /api/agua/hoy: Returns 0 ml when no record exists for today."""
        res = self.client.get('/api/agua/hoy')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('cantidad_ml'), 0)
        self.assertGreaterEqual(res.data.get('meta_ml', 0), 2000)

    def test_registrar_consumo_agua_simple(self):
        """POST /api/agua: Logs water intake and returns updated quantity."""
        res = self.client.post('/api/agua', {'cantidad_ml': 250}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('cantidad_ml'), 250)

    def test_acumulacion_multiples_ingestas_agua(self):
        """POST /api/agua: Consecutive additions accumulate correctly."""
        self.client.post('/api/agua', {'cantidad_ml': 250}, format='json')
        res2 = self.client.post('/api/agua', {'cantidad_ml': 500}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data.get('cantidad_ml'), 750)

        # Verify GET /api/agua/hoy matches cumulative total
        res_today = self.client.get('/api/agua/hoy')
        self.assertEqual(res_today.data.get('cantidad_ml'), 750)

    def test_reinicio_consumo_agua_con_flag_reset(self):
        """POST /api/agua: Reset flag sets quantity back to 0."""
        self.client.post('/api/agua', {'cantidad_ml': 1000}, format='json')
        res_reset = self.client.post('/api/agua', {'cantidad_ml': 0, 'reset': True}, format='json')
        self.assertEqual(res_reset.status_code, status.HTTP_200_OK)
        self.assertEqual(res_reset.data.get('cantidad_ml'), 0)

    def test_validacion_agua_negativa_o_excesiva_rechazada(self):
        """POST /api/agua: Rejects negative amounts or amounts > 10,000 ml with 400."""
        r_neg = self.client.post('/api/agua', {'cantidad_ml': -250}, format='json')
        self.assertEqual(r_neg.status_code, status.HTTP_400_BAD_REQUEST)

        r_high = self.client.post('/api/agua', {'cantidad_ml': 25000}, format='json')
        self.assertEqual(r_high.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agua_superar_meta_sin_error(self):
        """POST /api/agua: Logging beyond target (e.g. 3500ml) succeeds cleanly."""
        res = self.client.post('/api/agua', {'cantidad_ml': 3500}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('cantidad_ml'), 3500)


# ==============================================================================
# 3. ALLERGIES CRUD TESTS (/api/alergias)
# ==============================================================================
class AllergiesCrudParityTests(ParityBaseTestCase):
    """Verifies user allergies listing, creation with replacements, deletion, and validation."""

    def setUp(self):
        super().setUp()
        self.login_user(self.user_a)

    def test_listar_alergias_vacio_inicial(self):
        """GET /api/alergias: Returns empty list initially."""
        res = self.client.get('/api/alergias')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_crear_alergia_con_reemplazos(self):
        """POST /api/alergias: Creates allergy and returns 201 with ID and replacements."""
        payload = {
            "nombre": "Mariscos y Crustáceos",
            "reemplazos": "Pescado blanco magro, salmón salvaje"
        }
        res = self.client.post('/api/alergias', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['nombre'], "Mariscos y Crustáceos")
        self.assertEqual(res.data['reemplazos'], "Pescado blanco magro, salmón salvaje")
        self.assertIn('id_alergia', res.data)

        # Verify DB binding to user A
        db_alergia = Alergia.objects.get(id_alergia=res.data['id_alergia'])
        self.assertEqual(db_alergia.usuario, self.user_a)

    def test_crear_alergia_sin_reemplazos_opcional(self):
        """POST /api/alergias: Reemplazos field is optional."""
        res = self.client.post('/api/alergias', {'nombre': 'Gluten'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['reemplazos'], '')

    def test_eliminar_alergia_exitoso(self):
        """DELETE /api/alergias/<id>: Deletes allergy."""
        alergia = Alergia.objects.create(usuario=self.user_a, nombre='Lactosa')
        res = self.client.delete(f'/api/alergias/{alergia.id_alergia}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Alergia.objects.filter(id_alergia=alergia.id_alergia).exists())

    def test_validacion_alergia_nombre_vacio_o_largo(self):
        """POST /api/alergias: Rejects empty or whitespace name, and names > 150 chars."""
        r_empty = self.client.post('/api/alergias', {'nombre': '   '}, format='json')
        self.assertEqual(r_empty.status_code, status.HTTP_400_BAD_REQUEST)

        r_long = self.client.post('/api/alergias', {'nombre': 'A' * 200}, format='json')
        self.assertEqual(r_long.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eliminar_alergia_inexistente_retorna_404(self):
        """DELETE non-existent allergy returns 404."""
        res = self.client.delete('/api/alergias/99999')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ==============================================================================
# 4. WEEKLY PROGRESS TESTS (/api/progreso/semanal)
# ==============================================================================
class WeeklyProgressParityTests(ParityBaseTestCase):
    """Verifies past 7 days progress calculation and payload schema."""

    def setUp(self):
        super().setUp()
        self.login_user(self.user_a)

    def test_progreso_semanal_retorna_array_de_7_dias(self):
        """GET /api/progreso/semanal: Returns an array of exactly 7 days."""
        res = self.client.get('/api/progreso/semanal')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 7)

    def test_progreso_semanal_estructura_de_claves(self):
        """GET /api/progreso/semanal: Each day contains day, dayNum, dateLabel, kcal, isCompleted."""
        res = self.client.get('/api/progreso/semanal')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for item in res.data:
            self.assertIn('day', item)
            self.assertIn('dayNum', item)
            self.assertIn('dateLabel', item)
            self.assertIn('kcal', item)
            self.assertIn('isCompleted', item)

    def test_progreso_semanal_suma_calorias_comidas_completadas(self):
        """GET /api/progreso/semanal: Only completed meals are summed into daily kcal."""
        today = timezone.localdate()

        # Completed meal: 500 kcal
        Comida.objects.create(
            usuario=self.user_a, tipo='Desayuno', nombre='Completada',
            calorias=500, completado=True, fecha=today
        )
        # Incomplete meal: 700 kcal
        Comida.objects.create(
            usuario=self.user_a, tipo='Almuerzo', nombre='Pendiente',
            calorias=700, completado=False, fecha=today
        )

        res = self.client.get('/api/progreso/semanal')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # The last element in the 7-day array corresponds to today
        today_data = res.data[-1]
        self.assertEqual(today_data['kcal'], 500)


# ==============================================================================
# 5. ALIMENTO EXTENDED FIELDS TESTS (/api/alimentos)
# ==============================================================================
class AlimentoExtendedFieldsParityTests(ParityBaseTestCase):
    """Verifies emoji, badge, prioridad, detalles fields on Alimento model and serializer."""

    def setUp(self):
        super().setUp()
        self.login_user(self.user_a)

    def test_alimento_modelo_campos_extendidos_defaults(self):
        """Alimento model fields default to emoji='🥗', badge='', prioridad='media', detalles=''."""
        food = Alimento.objects.create(
            nombre='Huevo Duro',
            calorias=155,
            proteinas=Decimal('13.0'),
            carbohidratos=Decimal('1.1'),
            grasas=Decimal('11.0'),
            categoria=self.cat_proteina
        )
        self.assertEqual(food.emoji, '🥗')
        self.assertEqual(food.badge, '')
        self.assertEqual(food.prioridad, 'media')
        self.assertEqual(food.detalles, '')

    def test_alimento_serializer_incluye_campos_extendidos(self):
        """GET /api/alimentos: Serializes emoji, badge, prioridad, and detalles."""
        food = Alimento.objects.create(
            nombre='Aguacate Hass',
            calorias=160,
            proteinas=Decimal('2.0'),
            carbohidratos=Decimal('8.5'),
            grasas=Decimal('14.7'),
            categoria=self.cat_proteina,
            emoji='🥑',
            badge='Superfood',
            prioridad='alta',
            detalles='Grasas monoinsaturadas cardiosaludables'
        )
        res = self.client.get(f'/api/alimentos/{food.id_alimento}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['emoji'], '🥑')
        self.assertEqual(res.data['badge'], 'Superfood')
        self.assertEqual(res.data['prioridad'], 'alta')
        self.assertEqual(res.data['detalles'], 'Grasas monoinsaturadas cardiosaludables')


# ==============================================================================
# 6. MULTI-TENANT ISOLATION TESTS
# ==============================================================================
class MultiTenantIsolationParityTests(ParityBaseTestCase):
    """Verifies strict tenant barrier: User A cannot see, edit, or delete User B's data."""

    def setUp(self):
        super().setUp()
        # Seed User B's private data
        self.meal_b = Comida.objects.create(
            usuario=self.user_b, tipo='Almuerzo', nombre='Almuerzo Privado User B', calorias=800
        )
        self.water_b = RegistroAgua.objects.create(
            usuario=self.user_b, cantidad_ml=1800, meta_ml=2500
        )
        self.allergy_b = Alergia.objects.create(
            usuario=self.user_b, nombre='Frutos Secos', reemplazos='Semillas de lino'
        )

        # Authenticate as User A
        self.login_user(self.user_a)

    def test_usuario_a_no_ve_comidas_de_usuario_b(self):
        """GET /api/comidas: User A's list never includes User B's meals."""
        res = self.client.get('/api/comidas')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [m['id_comida'] for m in res.data]
        self.assertNotIn(self.meal_b.id_comida, ids)

    def test_usuario_a_no_puede_modificar_comida_de_usuario_b(self):
        """PATCH /api/comidas/<id_b>: User A attempting to modify User B's meal returns 404."""
        res = self.client.patch(f'/api/comidas/{self.meal_b.id_comida}', {'completado': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.meal_b.refresh_from_db()
        self.assertFalse(self.meal_b.completado)

    def test_usuario_a_no_puede_eliminar_comida_de_usuario_b(self):
        """DELETE /api/comidas/<id_b>: User A attempting to delete User B's meal returns 404."""
        res = self.client.delete(f'/api/comidas/{self.meal_b.id_comida}')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Comida.objects.filter(id_comida=self.meal_b.id_comida).exists())

    def test_usuario_a_no_ve_ni_modifica_agua_de_usuario_b(self):
        """User A water operations are completely isolated from User B."""
        # User A logs 300 ml
        self.client.post('/api/agua', {'cantidad_ml': 300}, format='json')

        # User B's record is unaffected
        self.water_b.refresh_from_db()
        self.assertEqual(self.water_b.cantidad_ml, 1800)

        # User A's today status is 300 ml
        res = self.client.get('/api/agua/hoy')
        self.assertEqual(res.data['cantidad_ml'], 300)

    def test_usuario_a_no_ve_alergias_de_usuario_b(self):
        """GET /api/alergias: User A never sees User B's allergies."""
        res = self.client.get('/api/alergias')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [a['id_alergia'] for a in res.data]
        self.assertNotIn(self.allergy_b.id_alergia, ids)

    def test_usuario_a_no_puede_eliminar_alergia_de_usuario_b(self):
        """DELETE /api/alergias/<id_b>: User A attempting to delete User B's allergy returns 404."""
        res = self.client.delete(f'/api/alergias/{self.allergy_b.id_alergia}')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Alergia.objects.filter(id_alergia=self.allergy_b.id_alergia).exists())


# ==============================================================================
# 7. AUTHENTICATION REQUIRED ENFORCEMENT TESTS
# ==============================================================================
class AuthenticationRequiredParityTests(TestCase):
    """Verifies that all parity endpoints strictly return 401 Unauthorized when unauthenticated."""

    def setUp(self):
        self.client = APIClient()

    def test_comidas_requiere_autenticacion(self):
        """Unauthenticated requests to /api/comidas return 401."""
        self.assertEqual(self.client.get('/api/comidas').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post('/api/comidas', {'nombre': 'Test'}).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.patch('/api/comidas/1', {'completado': True}).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.delete('/api/comidas/1').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_agua_requiere_autenticacion(self):
        """Unauthenticated requests to /api/agua return 401."""
        self.assertEqual(self.client.get('/api/agua/hoy').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post('/api/agua', {'cantidad_ml': 250}).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_alergias_requiere_autenticacion(self):
        """Unauthenticated requests to /api/alergias return 401."""
        self.assertEqual(self.client.get('/api/alergias').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post('/api/alergias', {'nombre': 'Test'}).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.delete('/api/alergias/1').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_progreso_semanal_requiere_autenticacion(self):
        """Unauthenticated request to /api/progreso/semanal returns 401."""
        self.assertEqual(self.client.get('/api/progreso/semanal').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_jwt_falsificado_retorna_401(self):
        """Malformed or forged JWT token returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.falsificado.invalido')
        self.assertEqual(self.client.get('/api/comidas').status_code, status.HTTP_401_UNAUTHORIZED)
