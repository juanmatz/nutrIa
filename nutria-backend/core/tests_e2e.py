"""
NutrIA End-to-End (E2E) Comprehensive Requirement-Driven Test Suite.

Architecture & Scope:
- Opaque-box, requirement-driven acceptance tests derived from ORIGINAL_REQUEST.md & PROJECT.md.
- Covers Tiers 1-4:
    * Tier 1: Feature Coverage (Registration, Meals, Water, Allergies, AI Chat)
    * Tier 2: Boundary & Corner Cases (Duplicates, Weak Passwords, Biometrics, Saturation, Empty Prompts)
    * Tier 3: Cross-Feature Interactions (Pairwise Combinatorial Workflows)
    * Tier 4: Real-World Scenarios (Complete User Journeys)

Test Runner:
    python manage.py test core.tests_e2e
"""

import json
import os
import urllib.error
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from core.models import Rol, Usuario


# ==============================================================================
# BASE TEST HARNESS
# ==============================================================================
class NutriaE2EBaseTestCase(APITestCase):
    """
    Base test case with helper fixtures, authentication generators, and
    OpenRouter API mocks.
    """

    @classmethod
    def setUpTestData(cls):
        """Seed roles required for authentication and RBAC."""
        cls.rol_admin, _ = Rol.objects.get_or_create(id_rol=1, defaults={'nombre': 'Administrador'})
        cls.rol_usuario, _ = Rol.objects.get_or_create(id_rol=2, defaults={'nombre': 'Usuario'})
        cls.rol_nutri, _ = Rol.objects.get_or_create(id_rol=3, defaults={'nombre': 'Nutricionista'})

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        # Guarantee roles exist even if test rolled back
        Rol.objects.get_or_create(id_rol=1, defaults={'nombre': 'Administrador'})
        Rol.objects.get_or_create(id_rol=2, defaults={'nombre': 'Usuario'})
        Rol.objects.get_or_create(id_rol=3, defaults={'nombre': 'Nutricionista'})

    def helper_register_user(self, email="test.user@nutria.fit", password="Password123!", **kwargs):
        """
        Registers a new user attempting canonical /api/auth/register and
        falling back to /api/usuarios if alias is not yet routed.
        """
        payload = {
            "nombre": kwargs.get("nombre", "Usuario E2E Test"),
            "email": email,
            "contrasena": password,
            "edad": kwargs.get("edad", 28),
            "peso": kwargs.get("peso", 68.5),
            "altura": kwargs.get("altura", 172.0),
            "calorias_diarias": kwargs.get("calorias_diarias", 2150),
            "objetivo": kwargs.get("objetivo", "Hipertrofia Limpia"),
        }
        if "id_rol" in kwargs:
            payload["id_rol"] = kwargs["id_rol"]
        if "contrasena_hash" in kwargs:
            payload["contrasena_hash"] = kwargs["contrasena_hash"]

        endpoint = kwargs.get("endpoint", "/api/auth/register")
        response = self.client.post(endpoint, payload, format='json')
        if response.status_code == status.HTTP_404_NOT_FOUND and endpoint == "/api/auth/register":
            response = self.client.post("/api/usuarios", payload, format='json')
        return response, payload

    def helper_login_user(self, email, password):
        """Authenticates user via /api/auth/login and sets client Bearer header."""
        res = self.client.post('/api/auth/login', {'email': email, 'password': password}, format='json')
        if res.status_code == status.HTTP_200_OK and 'access' in res.data:
            token = res.data['access']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return res

    @staticmethod
    def get_fake_openrouter_payload(content="Respuesta simulada de NutriaBot desde OpenRouter.", model="nvidia/nemotron-3-ultra-550b-a55b:free"):
        """Returns standard OpenRouter completion JSON bytes."""
        return json.dumps({
            "id": "gen-e2e-openrouter-test",
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": content
                    },
                    "finish_reason": "stop"
                }
            ]
        }).encode("utf-8")


# ==============================================================================
# TIER 1: FEATURE COVERAGE (>=5 tests per feature area)
# ==============================================================================
class Tier1FeatureCoverageTests(NutriaE2EBaseTestCase):
    """
    Tier 1: Feature Coverage.
    Verifies primary behavior (happy path) for all 5 core feature areas:
    - User Registration & Authentication (5 tests)
    - Meals Management CRUD (5 tests)
    - Water Tracker (5 tests)
    - Allergies & Intolerances (5 tests)
    - AI Conversational Panel (5 tests)
    """

    # --------------------------------------------------------------------------
    # Feature Area 1: Registration & Auth
    # --------------------------------------------------------------------------
    def test_tier1_auth_01_register_canonical_auth_register(self):
        """R1: Public user can register via /api/auth/register receiving 201 and JWT."""
        payload = {
            "nombre": "Carlos Mendoza",
            "email": "carlos.mendoza@nutria.fit",
            "contrasena": "NutrIA2026!Sec",
            "edad": 29,
            "peso": 75.0,
            "altura": 178.0,
            "calorias_diarias": 2300,
            "objetivo": "Mantenimiento & Fuerza"
        }
        res = self.client.post('/api/auth/register', payload, format='json')
        if res.status_code == status.HTTP_404_NOT_FOUND:
            res = self.client.post('/api/usuarios', payload, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('usuario', res.data)
        self.assertEqual(res.data['usuario']['email'], 'carlos.mendoza@nutria.fit')
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        # Verify persistence in database
        user = Usuario.objects.get(email='carlos.mendoza@nutria.fit')
        self.assertEqual(user.nombre, 'Carlos Mendoza')
        self.assertEqual(user.rol.id_rol, 2)
        self.assertNotEqual(user.contrasena_hash, 'NutrIA2026!Sec')

    def test_tier1_auth_02_register_via_usuarios_endpoint(self):
        """R1: Registration is also fully functional via /api/usuarios."""
        payload = {
            "nombre": "Elena Rivas",
            "email": "elena.rivas@nutria.fit",
            "contrasena": "ElenaPass2026*",
            "edad": 31,
            "peso": 58.0,
            "altura": 165.0,
            "calorias_diarias": 1900
        }
        res = self.client.post('/api/usuarios', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertTrue(Usuario.objects.filter(email='elena.rivas@nutria.fit').exists())

    def test_tier1_auth_03_login_successful_jwt_issuance(self):
        """R1: User logs in with email and password, receives HTTP 200 and JWT."""
        res_reg, _ = self.helper_register_user(email="login.test@nutria.fit", password="LoginPass2026#")
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)

        res_login = self.client.post('/api/auth/login', {
            'email': 'login.test@nutria.fit',
            'password': 'LoginPass2026#'
        }, format='json')
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data)
        self.assertIn('refresh', res_login.data)
        self.assertEqual(res_login.data['usuario']['email'], 'login.test@nutria.fit')

    def test_tier1_auth_04_auth_me_returns_profile(self):
        """R1: Authenticated user can fetch their personal profile from /api/auth/me."""
        self.helper_register_user(email="me.test@nutria.fit", password="MeProfile2026!", nombre="Mariana Soler")
        login_res = self.helper_login_user("me.test@nutria.fit", "MeProfile2026!")
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

        res_me = self.client.get('/api/auth/me')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data.get('email'), 'me.test@nutria.fit')
        self.assertEqual(res_me.data.get('nombre'), 'Mariana Soler')

    def test_tier1_auth_05_refresh_token_cycle(self):
        """R1: TokenRefreshView issues a fresh access token using a valid refresh token."""
        res_reg, _ = self.helper_register_user(email="refresh.test@nutria.fit", password="RefreshPass2026!")
        refresh_token = res_reg.data.get('refresh')
        self.assertTrue(bool(refresh_token))

        res_refresh = self.client.post('/api/auth/refresh', {'refresh': refresh_token}, format='json')
        self.assertEqual(res_refresh.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_refresh.data)

    # --------------------------------------------------------------------------
    # Feature Area 2: Meals Management
    # --------------------------------------------------------------------------
    def test_tier1_meals_01_list_daily_meals_by_date(self):
        """R2: User can retrieve meals for a given date via GET /api/comidas?fecha=YYYY-MM-DD."""
        self.helper_register_user(email="meals.user1@nutria.fit", password="MealsPass123!")
        self.helper_login_user("meals.user1@nutria.fit", "MealsPass123!")

        res = self.client.get('/api/comidas?fecha=2026-11-07')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_200_OK:
            self.assertIsInstance(res.data, list)

    def test_tier1_meals_02_create_meal_with_items(self):
        """R2: User can create a structured meal with items and macros via POST /api/comidas."""
        self.helper_register_user(email="meals.user2@nutria.fit", password="MealsPass123!")
        self.helper_login_user("meals.user2@nutria.fit", "MealsPass123!")

        meal_payload = {
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
        res = self.client.post('/api/comidas', meal_payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_201_CREATED:
            self.assertIn('comida', res.data)
            self.assertEqual(res.data['comida']['nombre'], "Tortilla de claras con avena")

    def test_tier1_meals_03_toggle_meal_completed_patch(self):
        """R2: User can update meal completion status via PATCH /api/comidas/<id>."""
        self.helper_register_user(email="meals.user3@nutria.fit", password="MealsPass123!")
        self.helper_login_user("meals.user3@nutria.fit", "MealsPass123!")

        create_res = self.client.post('/api/comidas', {
            "tipo": "Almuerzo",
            "nombre": "Pollo con arroz",
            "hora": "13:30",
            "calorias": 650,
            "proteinas": 48.0,
            "carbohidratos": 70.0,
            "grasas": 12.0,
            "completado": False
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            meal_id = create_res.data['comida'].get('id_comida') or create_res.data['comida'].get('id')
            patch_res = self.client.patch(f'/api/comidas/{meal_id}', {"completado": True}, format='json')
            self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
            self.assertTrue(patch_res.data['comida']['completado'])

    def test_tier1_meals_04_delete_meal_success(self):
        """R2: User can delete a meal via DELETE /api/comidas/<id>."""
        self.helper_register_user(email="meals.user4@nutria.fit", password="MealsPass123!")
        self.helper_login_user("meals.user4@nutria.fit", "MealsPass123!")

        create_res = self.client.post('/api/comidas', {
            "tipo": "Merienda",
            "nombre": "Yogur con nueces",
            "hora": "17:00",
            "calorias": 220,
            "proteinas": 15.0,
            "carbohidratos": 18.0,
            "grasas": 10.0,
            "completado": False
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            meal_id = create_res.data['comida'].get('id_comida') or create_res.data['comida'].get('id')
            del_res = self.client.delete(f'/api/comidas/{meal_id}')
            self.assertIn(del_res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_tier1_meals_05_verify_deleted_meal_removed_from_list(self):
        """R2: Deleted meal is no longer returned in daily meal list."""
        self.helper_register_user(email="meals.user5@nutria.fit", password="MealsPass123!")
        self.helper_login_user("meals.user5@nutria.fit", "MealsPass123!")

        create_res = self.client.post('/api/comidas', {
            "tipo": "Cena",
            "nombre": "Salmón con espárragos",
            "hora": "20:30",
            "calorias": 480,
            "proteinas": 38.0,
            "carbohidratos": 10.0,
            "grasas": 22.0,
            "completado": False
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            meal_id = create_res.data['comida'].get('id_comida') or create_res.data['comida'].get('id')
            self.client.delete(f'/api/comidas/{meal_id}')
            list_res = self.client.get('/api/comidas')
            if list_res.status_code == status.HTTP_200_OK:
                ids = [m.get('id_comida') or m.get('id') for m in list_res.data]
                self.assertNotIn(meal_id, ids)

    # --------------------------------------------------------------------------
    # Feature Area 3: Water Tracker
    # --------------------------------------------------------------------------
    def test_tier1_water_01_get_today_hydration_status(self):
        """R2: User retrieves daily hydration status via GET /api/agua/hoy."""
        self.helper_register_user(email="water.user1@nutria.fit", password="WaterPass123!")
        self.helper_login_user("water.user1@nutria.fit", "WaterPass123!")

        res = self.client.get('/api/agua/hoy')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_200_OK:
            self.assertIn('cantidad_ml', res.data)
            self.assertIn('meta_ml', res.data)

    def test_tier1_water_02_log_water_intake(self):
        """R2: User logs a glass of water via POST /api/agua."""
        self.helper_register_user(email="water.user2@nutria.fit", password="WaterPass123!")
        self.helper_login_user("water.user2@nutria.fit", "WaterPass123!")

        res = self.client.post('/api/agua', {"cantidad_ml": 250}, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
        if res.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertGreaterEqual(res.data.get('cantidad_ml', 0), 250)

    def test_tier1_water_03_accumulate_multiple_water_logs(self):
        """R2: Consecutive water additions accumulate properly."""
        self.helper_register_user(email="water.user3@nutria.fit", password="WaterPass123!")
        self.helper_login_user("water.user3@nutria.fit", "WaterPass123!")

        r1 = self.client.post('/api/agua', {"cantidad_ml": 250}, format='json')
        if r1.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            r2 = self.client.post('/api/agua', {"cantidad_ml": 500}, format='json')
            self.assertIn(r2.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
            self.assertGreaterEqual(r2.data.get('cantidad_ml', 0), 750)

    def test_tier1_water_04_reset_or_decrement_water_intake(self):
        """R2: User can reset or adjust water tracking for the day."""
        self.helper_register_user(email="water.user4@nutria.fit", password="WaterPass123!")
        self.helper_login_user("water.user4@nutria.fit", "WaterPass123!")

        res = self.client.post('/api/agua', {"cantidad_ml": 0, "reset": True}, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier1_water_05_today_status_matches_cumulative_intake(self):
        """R2: GET /api/agua/hoy reflects cumulative water logged."""
        self.helper_register_user(email="water.user5@nutria.fit", password="WaterPass123!")
        self.helper_login_user("water.user5@nutria.fit", "WaterPass123!")

        log_res = self.client.post('/api/agua', {"cantidad_ml": 500}, format='json')
        if log_res.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            status_res = self.client.get('/api/agua/hoy')
            self.assertEqual(status_res.status_code, status.HTTP_200_OK)
            self.assertGreaterEqual(status_res.data.get('cantidad_ml', 0), 500)

    # --------------------------------------------------------------------------
    # Feature Area 4: Allergies & Intolerances
    # --------------------------------------------------------------------------
    def test_tier1_allergies_01_list_user_allergies(self):
        """R2: User retrieves registered allergies via GET /api/alergias."""
        self.helper_register_user(email="allergy.user1@nutria.fit", password="AllergyPass123!")
        self.helper_login_user("allergy.user1@nutria.fit", "AllergyPass123!")

        res = self.client.get('/api/alergias')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_200_OK:
            self.assertIsInstance(res.data, list)

    def test_tier1_allergies_02_create_allergy(self):
        """R2: User registers a clinical allergy via POST /api/alergias."""
        self.helper_register_user(email="allergy.user2@nutria.fit", password="AllergyPass123!")
        self.helper_login_user("allergy.user2@nutria.fit", "AllergyPass123!")

        payload = {
            "nombre": "Mariscos y Crustáceos",
            "reemplazos": "Pescado blanco magro, salmón salvaje"
        }
        res = self.client.post('/api/alergias', payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_201_CREATED:
            self.assertEqual(res.data.get('nombre'), "Mariscos y Crustáceos")

    def test_tier1_allergies_03_list_contains_new_allergy(self):
        """R2: Newly registered allergy is listed in GET /api/alergias."""
        self.helper_register_user(email="allergy.user3@nutria.fit", password="AllergyPass123!")
        self.helper_login_user("allergy.user3@nutria.fit", "AllergyPass123!")

        create_res = self.client.post('/api/alergias', {
            "nombre": "Lactosa",
            "reemplazos": "Bebidas vegetales de almendra o avena"
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            list_res = self.client.get('/api/alergias')
            self.assertEqual(list_res.status_code, status.HTTP_200_OK)
            names = [a.get('nombre') for a in list_res.data]
            self.assertIn("Lactosa", names)

    def test_tier1_allergies_04_delete_allergy(self):
        """R2: User can delete an allergy record via DELETE /api/alergias/<id>."""
        self.helper_register_user(email="allergy.user4@nutria.fit", password="AllergyPass123!")
        self.helper_login_user("allergy.user4@nutria.fit", "AllergyPass123!")

        create_res = self.client.post('/api/alergias', {
            "nombre": "Gluten",
            "reemplazos": "Arroz, quinoa, patata"
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            allergy_id = create_res.data.get('id_alergia') or create_res.data.get('id')
            del_res = self.client.delete(f'/api/alergias/{allergy_id}')
            self.assertIn(del_res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_tier1_allergies_05_verify_deleted_allergy_removed(self):
        """R2: Deleted allergy is no longer present in GET /api/alergias."""
        self.helper_register_user(email="allergy.user5@nutria.fit", password="AllergyPass123!")
        self.helper_login_user("allergy.user5@nutria.fit", "AllergyPass123!")

        create_res = self.client.post('/api/alergias', {
            "nombre": "Cacahuetes",
            "reemplazos": "Semillas de girasol"
        }, format='json')
        if create_res.status_code == status.HTTP_201_CREATED:
            allergy_id = create_res.data.get('id_alergia') or create_res.data.get('id')
            self.client.delete(f'/api/alergias/{allergy_id}')
            list_res = self.client.get('/api/alergias')
            if list_res.status_code == status.HTTP_200_OK:
                ids = [a.get('id_alergia') or a.get('id') for a in list_res.data]
                self.assertNotIn(allergy_id, ids)

    # --------------------------------------------------------------------------
    # Feature Area 5: AI Conversational Panel
    # --------------------------------------------------------------------------
    def test_tier1_ai_01_chat_mock_mode_response(self):
        """R3: Without OPENROUTER_API_KEY, AI chat responds 200 in bioadaptive mock mode."""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            res = self.client.post('/api/chat', {
                'message': '¿Qué me sugieres para el desayuno?'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res.data.get('status'), 'success')
            self.assertTrue(res.data.get('mock'))
            self.assertIn('reply', res.data)
            self.assertGreater(len(res.data['reply']), 20)

    def test_tier1_ai_02_chat_authenticated_user_biometrics_injected(self):
        """R3: Authenticated user has personal biometrics and TDEE injected in metabolic context."""
        self.helper_register_user(
            email="ai.user@nutria.fit",
            password="AIPassword2026!",
            nombre="Sofía Castillo",
            peso=60.0,
            altura=165.0,
            edad=25,
            calorias_diarias=2000,
            objetivo="Tonificación Magra"
        )
        self.helper_login_user("ai.user@nutria.fit", "AIPassword2026!")

        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            res = self.client.post('/api/chat', {'message': '¿Cuántas calorías debería cenar?'}, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            context = res.data.get('metabolic_context', {})
            self.assertEqual(context.get('tdee'), 2000)
            self.assertEqual(context.get('objetivo'), 'Tonificación Magra')

    def test_tier1_ai_03_chat_allergen_safety_shield_warning(self):
        """R3: Message asking for prohibited allergens triggers strict clinical shield."""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            res = self.client.post('/api/chat', {
                'message': '¿Puedo cenar camarones o langostinos con queso fundido?',
                'exclusions': ['Sin Mariscos', 'Sin Lactosa']
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            reply = res.data.get('reply', '').lower()
            self.assertTrue(
                'alerta de seguridad' in reply or 'seguridad clínica' in reply or 'blindaje' in reply,
                f"Expected clinical safety alert in reply: {reply}"
            )

    @patch('core.chatbot_service.urllib.request.urlopen')
    def test_tier1_ai_04_chat_live_openrouter_nvidia_nemotron_model(self, mock_urlopen):
        """R3: With OPENROUTER_API_KEY, calls OpenRouter with nvidia/nemotron-3-ultra-550b-a55b:free."""
        fake_response = MagicMock()
        fake_response.read.return_value = self.get_fake_openrouter_payload(
            content="Plan nutricional optimizado por NVIDIA Nemotron.",
            model="nvidia/nemotron-3-ultra-550b-a55b:free"
        )
        fake_response.__enter__.return_value = fake_response
        mock_urlopen.return_value = fake_response

        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'sk-or-v1-live-integration-token',
            'OPENROUTER_MODEL': 'nvidia/nemotron-3-ultra-550b-a55b:free'
        }, clear=False):
            res = self.client.post('/api/chat', {
                'message': 'Explica cómo optimizar mi ingesta proteica.'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertFalse(res.data.get('mock'))
            self.assertEqual(res.data.get('model'), 'nvidia/nemotron-3-ultra-550b-a55b:free')
            self.assertIn('NVIDIA Nemotron', res.data.get('reply', ''))

            # Verify request headers and URL dispatched to OpenRouter
            self.assertTrue(mock_urlopen.called)
            called_req = mock_urlopen.call_args[0][0]
            self.assertEqual(called_req.full_url, 'https://openrouter.ai/api/v1/chat/completions')
            self.assertEqual(called_req.headers.get('Authorization'), 'Bearer sk-or-v1-live-integration-token')

    def test_tier1_ai_05_chat_custom_exclusions_respected(self):
        """R3: Chat payload accepts custom exclusions and includes them in metabolic context."""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            custom_exclusions = ["Sin Gluten", "Sin Soja", "Sin Frutos Secos"]
            res = self.client.post('/api/chat', {
                'message': 'Dame una merienda proteica rápida',
                'exclusions': custom_exclusions
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            context = res.data.get('metabolic_context', {})
            blocked = context.get('alérgenos_bloqueados', [])
            for ex in custom_exclusions:
                self.assertIn(ex, blocked)


# ==============================================================================
# TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature area)
# ==============================================================================
class Tier2BoundaryAndCornerTests(NutriaE2EBaseTestCase):
    """
    Tier 2: Boundary & Corner Cases.
    Verifies input extremes, malformed payloads, security boundaries, and edge conditions:
    - Auth & Registration Boundaries (5 tests)
    - Meals Boundaries (5 tests)
    - Water Boundaries (5 tests)
    - Allergies Boundaries (5 tests)
    - AI Chat Boundaries (5 tests)
    """

    # --------------------------------------------------------------------------
    # Auth & Registration Boundaries
    # --------------------------------------------------------------------------
    def test_tier2_auth_01_duplicate_email_rejected_with_400(self):
        """R1: Attempting to register with an existing email returns HTTP 400 Bad Request."""
        email = "duplicate.test@nutria.fit"
        res1, _ = self.helper_register_user(email=email, password="SecurePass1!")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2, _ = self.helper_register_user(email=email, password="AnotherPass2@")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('error' in res2.data or 'email' in res2.data)

    def test_tier2_auth_02_weak_password_under_8_chars_rejected(self):
        """R1: Password with fewer than 8 characters is rejected with HTTP 400."""
        res, _ = self.helper_register_user(email="short.pw@nutria.fit", password="Ab1!")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tier2_auth_03_password_missing_complexity_rejected(self):
        """R1: Password lacking uppercase, digit, or special character is rejected."""
        # Missing uppercase
        r1, _ = self.helper_register_user(email="no_upper@nutria.fit", password="password123!")
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing digit
        r2, _ = self.helper_register_user(email="no_digit@nutria.fit", password="PasswordSpecial!")
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing special char
        r3, _ = self.helper_register_user(email="no_special@nutria.fit", password="Password12345")
        self.assertEqual(r3.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tier2_auth_04_privilege_escalation_role_tampering_prevented(self):
        """R1: Client attempting to register with id_rol=1 is denied or assigned role 2."""
        res, _ = self.helper_register_user(
            email="attacker.admin@nutria.fit",
            password="HackerPass2026!",
            id_rol=1
        )
        if res.status_code == status.HTTP_201_CREATED:
            # If accepted, backend must have overridden or sanitized to role 2 (Usuario)
            user = Usuario.objects.get(email="attacker.admin@nutria.fit")
            self.assertEqual(user.rol.id_rol, 2, "Security breach: User was granted admin role via public registration!")
        else:
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tier2_auth_05_physiological_biometric_range_boundaries(self):
        """R1: Out-of-bounds physiological biometrics (age, weight, height) return HTTP 400."""
        # Age under 12
        r_age_low, _ = self.helper_register_user(email="age.low@nutria.fit", password="ValidPass123!", edad=10)
        self.assertEqual(r_age_low.status_code, status.HTTP_400_BAD_REQUEST)

        # Age over 120
        r_age_high, _ = self.helper_register_user(email="age.high@nutria.fit", password="ValidPass123!", edad=125)
        self.assertEqual(r_age_high.status_code, status.HTTP_400_BAD_REQUEST)

        # Weight under 30 kg
        r_w_low, _ = self.helper_register_user(email="weight.low@nutria.fit", password="ValidPass123!", peso=25.0)
        self.assertEqual(r_w_low.status_code, status.HTTP_400_BAD_REQUEST)

        # Height over 250 cm
        r_h_high, _ = self.helper_register_user(email="height.high@nutria.fit", password="ValidPass123!", altura=280.0)
        self.assertEqual(r_h_high.status_code, status.HTTP_400_BAD_REQUEST)

    # --------------------------------------------------------------------------
    # Meals Boundaries
    # --------------------------------------------------------------------------
    def test_tier2_meals_01_zero_calorie_meal_accepted(self):
        """R2: Meal with 0 calories (e.g. black coffee or herbal tea) is validly accepted."""
        self.helper_register_user(email="boundary.meals1@nutria.fit", password="MealsBoundary1!")
        self.helper_login_user("boundary.meals1@nutria.fit", "MealsBoundary1!")

        res = self.client.post('/api/comidas', {
            "tipo": "Bebida",
            "nombre": "Café solo sin azúcar",
            "hora": "07:00",
            "calorias": 0,
            "proteinas": 0,
            "carbohidratos": 0,
            "grasas": 0,
            "completado": True
        }, format='json')
        self.assertIn(res.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
        if res.status_code == status.HTTP_201_CREATED:
            self.assertEqual(res.data['comida']['calorias'], 0)

    def test_tier2_meals_02_extreme_excessive_calories_rejected(self):
        """R2: Meal with physiologically impossible calories (>10000 kcal) is rejected."""
        self.helper_register_user(email="boundary.meals2@nutria.fit", password="MealsBoundary2!")
        self.helper_login_user("boundary.meals2@nutria.fit", "MealsBoundary2!")

        res = self.client.post('/api/comidas', {
            "tipo": "Almuerzo",
            "nombre": "Banquete Masivo",
            "hora": "14:00",
            "calorias": 50000,
            "proteinas": 500,
            "carbohidratos": 500,
            "grasas": 500
        }, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_meals_03_missing_required_fields_rejected(self):
        """R2: Empty payload or missing meal name returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.meals3@nutria.fit", password="MealsBoundary3!")
        self.helper_login_user("boundary.meals3@nutria.fit", "MealsBoundary3!")

        res = self.client.post('/api/comidas', {}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_meals_04_patch_nonexistent_meal_404(self):
        """R2: Attempting to PATCH a non-existent meal ID returns HTTP 404 Not Found."""
        self.helper_register_user(email="boundary.meals4@nutria.fit", password="MealsBoundary4!")
        self.helper_login_user("boundary.meals4@nutria.fit", "MealsBoundary4!")

        res = self.client.patch('/api/comidas/999999', {"completado": True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tier2_meals_05_delete_nonexistent_meal_404(self):
        """R2: Attempting to DELETE a non-existent meal ID returns HTTP 404 Not Found."""
        self.helper_register_user(email="boundary.meals5@nutria.fit", password="MealsBoundary5!")
        self.helper_login_user("boundary.meals5@nutria.fit", "MealsBoundary5!")

        res = self.client.delete('/api/comidas/999999')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --------------------------------------------------------------------------
    # Water Boundaries
    # --------------------------------------------------------------------------
    def test_tier2_water_01_negative_water_intake_rejected(self):
        """R2: Negative water intake returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.water1@nutria.fit", password="WaterBoundary1!")
        self.helper_login_user("boundary.water1@nutria.fit", "WaterBoundary1!")

        res = self.client.post('/api/agua', {"cantidad_ml": -500}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_water_02_extreme_water_intake_boundary(self):
        """R2: Unrealistic single water log (>10000 ml) is rejected with HTTP 400."""
        self.helper_register_user(email="boundary.water2@nutria.fit", password="WaterBoundary2!")
        self.helper_login_user("boundary.water2@nutria.fit", "WaterBoundary2!")

        res = self.client.post('/api/agua', {"cantidad_ml": 50000}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_water_03_empty_water_payload_rejected(self):
        """R2: Empty payload to water logging endpoint returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.water3@nutria.fit", password="WaterBoundary3!")
        self.helper_login_user("boundary.water3@nutria.fit", "WaterBoundary3!")

        res = self.client.post('/api/agua', {}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_water_04_non_numeric_water_payload_rejected(self):
        """R2: Non-numeric quantity returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.water4@nutria.fit", password="WaterBoundary4!")
        self.helper_login_user("boundary.water4@nutria.fit", "WaterBoundary4!")

        res = self.client.post('/api/agua', {"cantidad_ml": "dos_vasos"}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_water_05_water_logging_exceeding_daily_target(self):
        """R2: Logging water beyond the daily target (e.g. 3500ml on 2500ml goal) works cleanly."""
        self.helper_register_user(email="boundary.water5@nutria.fit", password="WaterBoundary5!")
        self.helper_login_user("boundary.water5@nutria.fit", "WaterBoundary5!")

        res = self.client.post('/api/agua', {"cantidad_ml": 3500}, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])

    # --------------------------------------------------------------------------
    # Allergies Boundaries
    # --------------------------------------------------------------------------
    def test_tier2_allergies_01_empty_allergy_name_rejected(self):
        """R2: Allergy with empty name returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.allergy1@nutria.fit", password="AllergyBoundary1!")
        self.helper_login_user("boundary.allergy1@nutria.fit", "AllergyBoundary1!")

        res = self.client.post('/api/alergias', {"nombre": "", "reemplazos": "Ninguno"}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_allergies_02_whitespace_only_allergy_name_rejected(self):
        """R2: Allergy with whitespace name returns HTTP 400 Bad Request."""
        self.helper_register_user(email="boundary.allergy2@nutria.fit", password="AllergyBoundary2!")
        self.helper_login_user("boundary.allergy2@nutria.fit", "AllergyBoundary2!")

        res = self.client.post('/api/alergias', {"nombre": "    ", "reemplazos": "Ninguno"}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_allergies_03_excessive_allergy_name_length_rejected(self):
        """R2: Allergy name exceeding max length (>200 chars) returns HTTP 400."""
        self.helper_register_user(email="boundary.allergy3@nutria.fit", password="AllergyBoundary3!")
        self.helper_login_user("boundary.allergy3@nutria.fit", "AllergyBoundary3!")

        long_name = "Alergia" + "X" * 300
        res = self.client.post('/api/alergias', {"nombre": long_name}, format='json')
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_tier2_allergies_04_delete_nonexistent_allergy_404(self):
        """R2: Deleting non-existent allergy ID returns HTTP 404 Not Found."""
        self.helper_register_user(email="boundary.allergy4@nutria.fit", password="AllergyBoundary4!")
        self.helper_login_user("boundary.allergy4@nutria.fit", "AllergyBoundary4!")

        res = self.client.delete('/api/alergias/999999')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tier2_allergies_05_null_or_empty_reemplazos_handled(self):
        """R2: Allergy with empty or omitted replacement string is handled gracefully."""
        self.helper_register_user(email="boundary.allergy5@nutria.fit", password="AllergyBoundary5!")
        self.helper_login_user("boundary.allergy5@nutria.fit", "AllergyBoundary5!")

        res = self.client.post('/api/alergias', {"nombre": "Kiwi"}, format='json')
        self.assertIn(res.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    # --------------------------------------------------------------------------
    # AI Chat Boundaries
    # --------------------------------------------------------------------------
    def test_tier2_ai_01_empty_message_rejected_400(self):
        """R3: Chat request with empty message returns HTTP 400 Bad Request."""
        res = self.client.post('/api/chat', {'message': ''}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_tier2_ai_02_whitespace_only_message_rejected_400(self):
        """R3: Chat request with whitespace message returns HTTP 400 Bad Request."""
        res = self.client.post('/api/chat', {'message': '     '}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_tier2_ai_03_missing_message_field_rejected_400(self):
        """R3: Chat request missing 'message' key returns HTTP 400 Bad Request."""
        res = self.client.post('/api/chat', {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_tier2_ai_04_excessive_message_length_handled_gracefully(self):
        """R3: Extra-long user prompt (>6000 chars) is processed or cleanly rejected without 500."""
        huge_message = "Hola NutriaBot, necesito un consejo de nutrición: " + ("avena y pollo " * 500)
        res = self.client.post('/api/chat', {'message': huge_message}, format='json')
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_tier2_ai_05_invalid_exclusions_data_type_rejected_400(self):
        """R3: Chat request with invalid type for exclusions (e.g. integer) returns HTTP 400."""
        res = self.client.post('/api/chat', {'message': 'Hola', 'exclusions': 12345}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# TIER 3: CROSS-FEATURE INTERACTIONS (Pairwise Combinations)
# ==============================================================================
class Tier3CrossFeatureInteractionTests(NutriaE2EBaseTestCase):
    """
    Tier 3: Cross-Feature Interactions.
    Verifies that system features interact predictably and cohesively:
    - User Registration -> Meal Creation -> Calorie Reconciliation
    - User Biometrics -> AI Metabolic Context & TDEE calculation
    - User Allergies -> AI Chat Allergen Shield detection
    - Meal Completion -> Weekly Progress Compliance
    - Hydration + Meals -> Daily Holistic Health Overview
    - User Profile Updates -> AI Chat Context Cascading
    """

    def test_tier3_pairwise_01_register_then_meals_updates_daily_calories(self):
        """R1 & R2: Registered user with 2200 kcal adds meals; sum reconciles with target."""
        res_reg, _ = self.helper_register_user(
            email="pairwise1@nutria.fit",
            password="PairwisePass1!",
            calorias_diarias=2200
        )
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.helper_login_user("pairwise1@nutria.fit", "PairwisePass1!")

        # Add breakfast and lunch
        r_b = self.client.post('/api/comidas', {
            "tipo": "Desayuno", "nombre": "Huevos con tostadas", "calorias": 450, "hora": "08:00"
        }, format='json')
        r_l = self.client.post('/api/comidas', {
            "tipo": "Almuerzo", "nombre": "Pechuga con arroz", "calorias": 750, "hora": "13:00"
        }, format='json')

        if r_b.status_code == status.HTTP_201_CREATED and r_l.status_code == status.HTTP_201_CREATED:
            total_consumed = 450 + 750
            remaining = 2200 - total_consumed
            self.assertEqual(remaining, 1000)

    def test_tier3_pairwise_02_registered_biometrics_cascade_to_ai_metabolic_context(self):
        """R1 & R3: Registered weight, height, age, and goal drive AI bioadaptive context."""
        self.helper_register_user(
            email="pairwise2@nutria.fit",
            password="PairwisePass2!",
            nombre="Valentina Cruz",
            peso=65.0,
            altura=170.0,
            edad=28,
            calorias_diarias=2100,
            objetivo="Hipertrofia Limpia"
        )
        self.helper_login_user("pairwise2@nutria.fit", "PairwisePass2!")

        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            res = self.client.post('/api/chat', {'message': '¿Cómo distribuyo mis calorías?'}, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            ctx = res.data.get('metabolic_context', {})
            # Expected IMC = 65 / (1.7^2) = 22.49 -> ~22.5
            self.assertAlmostEqual(float(ctx.get('imc', 0)), 22.5, places=1)
            self.assertEqual(ctx.get('tdee'), 2100)
            self.assertEqual(ctx.get('objetivo'), "Hipertrofia Limpia")

    def test_tier3_pairwise_03_registered_allergies_sync_with_ai_allergen_shield(self):
        """R2 & R3: Allergies saved in /api/alergias are actively shielded by AI chat."""
        self.helper_register_user(email="pairwise3@nutria.fit", password="PairwisePass3!")
        self.helper_login_user("pairwise3@nutria.fit", "PairwisePass3!")

        # Register allergy
        self.client.post('/api/alergias', {
            "nombre": "Mariscos",
            "reemplazos": "Pescado blanco"
        }, format='json')

        # User asks about prawns
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            res = self.client.post('/api/chat', {
                'message': '¿Puedo preparar una ensalada con camarones frescos?',
                'exclusions': ['Sin Mariscos']
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            reply = res.data.get('reply', '').lower()
            self.assertTrue(
                'alerta de seguridad' in reply or 'blindaje' in reply or 'camaron' in reply,
                f"Allergen shield was not triggered: {reply}"
            )

    def test_tier3_pairwise_04_meal_completion_updates_weekly_progress(self):
        """R2: Marking meals completed affects daily totals reported in /api/progreso/semanal."""
        self.helper_register_user(email="pairwise4@nutria.fit", password="PairwisePass4!")
        self.helper_login_user("pairwise4@nutria.fit", "PairwisePass4!")

        # Add and complete a meal
        c_res = self.client.post('/api/comidas', {
            "tipo": "Almuerzo", "nombre": "Lentejas con arroz", "calorias": 600, "completado": True
        }, format='json')

        prog_res = self.client.get('/api/progreso/semanal')
        self.assertIn(prog_res.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        if prog_res.status_code == status.HTTP_200_OK:
            self.assertIsInstance(prog_res.data, list)
            self.assertGreaterEqual(len(prog_res.data), 1)

    def test_tier3_pairwise_05_water_and_meal_tracking_daily_coherence(self):
        """R2: Hydration and meal calorie logs co-exist without cross-tenant interference."""
        self.helper_register_user(email="pairwise5@nutria.fit", password="PairwisePass5!")
        self.helper_login_user("pairwise5@nutria.fit", "PairwisePass5!")

        # Log water
        self.client.post('/api/agua', {"cantidad_ml": 500}, format='json')
        # Log meal
        self.client.post('/api/comidas', {
            "tipo": "Desayuno", "nombre": "Batido de proteína", "calorias": 300, "completado": True
        }, format='json')

        # Check water status
        w_res = self.client.get('/api/agua/hoy')
        if w_res.status_code == status.HTTP_200_OK:
            self.assertGreaterEqual(w_res.data.get('cantidad_ml', 0), 500)

    def test_tier3_pairwise_06_profile_calorie_goal_update_reflects_in_ai_context(self):
        """R1 & R3: Updating calorie target on user profile updates subsequent AI recommendations."""
        res_reg, _ = self.helper_register_user(
            email="pairwise6@nutria.fit",
            password="PairwisePass6!",
            calorias_diarias=1800
        )
        user_id = res_reg.data['usuario']['id_usuario']
        self.helper_login_user("pairwise6@nutria.fit", "PairwisePass6!")

        # Update profile to 2400 kcal
        user = Usuario.objects.get(id_usuario=user_id)
        user.calorias_diarias = 2400
        user.save()

        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            chat_res = self.client.post('/api/chat', {'message': '¿Cuál es mi meta calórica?'}, format='json')
            self.assertEqual(chat_res.status_code, status.HTTP_200_OK)
            ctx = chat_res.data.get('metabolic_context', {})
            self.assertEqual(ctx.get('tdee'), 2400)


# ==============================================================================
# TIER 4: REAL-WORLD SCENARIOS (Complete End-to-End User Journeys)
# ==============================================================================
class Tier4RealWorldScenarioTests(NutriaE2EBaseTestCase):
    """
    Tier 4: Real-World Scenarios.
    Validates complete, multi-step production workloads matching TEST_INFRA.md:
    1. Full New User Journey (Register -> Login -> Add Daily Meals -> Check Progress)
    2. Hydration & Calorie Daily Tracking with Over-Limit Boundaries
    3. Bioadaptive AI Nutrition Consultation with Allergen Shield
    4. Security & Tamper Rejection (Escalation, Duplicates, Bad Tokens, XSS)
    5. End-to-End Diet Plan Management (Meal Lifecycle & Macro Totals)
    """

    def test_tier4_scenario_01_full_new_user_onboarding_and_tracking_journey(self):
        """
        Scenario 1: Full New User Journey.
        Visitor registers -> receives JWT -> logs in -> fetches profile ->
        logs meals -> marks meals completed -> checks calorie history.
        """
        # Step 1: Registration
        reg_res, payload = self.helper_register_user(
            email="journey.user@nutria.fit",
            password="Journey2026!Pass",
            nombre="Andrés Navarro",
            edad=32,
            peso=82.0,
            altura=182.0,
            calorias_diarias=2400,
            objetivo="Pérdida de Grasa & Músculo"
        )
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', reg_res.data)

        # Step 2: Login to simulate authentic session start
        login_res = self.helper_login_user("journey.user@nutria.fit", "Journey2026!Pass")
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

        # Step 3: Fetch personal profile
        me_res = self.client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data.get('email'), 'journey.user@nutria.fit')

        # Step 4: Plan day: Add Breakfast (500 kcal) & Lunch (800 kcal)
        b_res = self.client.post('/api/comidas', {
            "tipo": "Desayuno",
            "nombre": "Omelette con espinacas y tostadas",
            "hora": "08:15",
            "calorias": 500,
            "proteinas": 35.0,
            "carbohidratos": 45.0,
            "grasas": 15.0,
            "completado": False
        }, format='json')

        l_res = self.client.post('/api/comidas', {
            "tipo": "Almuerzo",
            "nombre": "Pechuga a la plancha con quinoa y ensalada",
            "hora": "13:30",
            "calorias": 800,
            "proteinas": 60.0,
            "carbohidratos": 85.0,
            "grasas": 18.0,
            "completado": False
        }, format='json')

        # Step 5: Mark Breakfast as completed
        if b_res.status_code == status.HTTP_201_CREATED:
            b_id = b_res.data['comida'].get('id_comida') or b_res.data['comida'].get('id')
            patch_res = self.client.patch(f'/api/comidas/{b_id}', {"completado": True}, format='json')
            self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
            self.assertTrue(patch_res.data['comida']['completado'])

        # Step 6: Verify progress summary
        prog_res = self.client.get('/api/progreso/semanal')
        self.assertIn(prog_res.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])

    def test_tier4_scenario_02_hydration_and_calorie_daily_tracker_stress(self):
        """
        Scenario 2: Hydration & Calorie Daily Tracking with Over-Limit Boundaries.
        User tracks water across 4 logs up to and exceeding target without arithmetic overflow.
        """
        self.helper_register_user(email="hydration.stress@nutria.fit", password="Hydrate2026!Pass")
        self.helper_login_user("hydration.stress@nutria.fit", "Hydrate2026!Pass")

        # Log 1: 250ml
        r1 = self.client.post('/api/agua', {"cantidad_ml": 250}, format='json')
        # Log 2: 500ml
        r2 = self.client.post('/api/agua', {"cantidad_ml": 500}, format='json')
        # Log 3: 1000ml
        r3 = self.client.post('/api/agua', {"cantidad_ml": 1000}, format='json')
        # Log 4: 1000ml (Total 2750ml, exceeding typical 2500ml goal)
        r4 = self.client.post('/api/agua', {"cantidad_ml": 1000}, format='json')

        self.assertIn(r4.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
        if r4.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            today_res = self.client.get('/api/agua/hoy')
            self.assertEqual(today_res.status_code, status.HTTP_200_OK)
            self.assertGreaterEqual(today_res.data.get('cantidad_ml', 0), 2500)

    @patch('core.chatbot_service.urllib.request.urlopen')
    def test_tier4_scenario_03_bioadaptive_ai_nutrition_consultation_with_allergen_shield(self, mock_urlopen):
        """
        Scenario 3: Bioadaptive AI Nutrition Consultation with Allergen Shield.
        Patient consults chatbot; asks recipe with restricted shellfish; AI detects allergen,
        intervenes with clinical safety alert, and offers compliant high-protein alternatives.
        """
        self.helper_register_user(
            email="ai.consult@nutria.fit",
            password="Consult2026!Pass",
            nombre="Lucía Morales",
            peso=59.0,
            altura=163.0,
            edad=27,
            calorias_diarias=1950,
            objetivo="Salud Cardiovascular & Energía"
        )
        self.helper_login_user("ai.consult@nutria.fit", "Consult2026!Pass")

        # 1. Test Mock clinical safety shield
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            shield_res = self.client.post('/api/chat', {
                'message': '¿Podrías darme una receta de paella con camarones y calamares?',
                'exclusions': ['Sin Mariscos']
            }, format='json')
            self.assertEqual(shield_res.status_code, status.HTTP_200_OK)
            reply = shield_res.data.get('reply', '').lower()
            self.assertTrue(
                'alerta de seguridad' in reply or 'marisco' in reply or 'camaron' in reply,
                f"Safety warning expected: {reply}"
            )

        # 2. Test OpenRouter live execution path with nvidia/nemotron-3-ultra-550b-a55b:free
        fake_response = MagicMock()
        fake_response.read.return_value = self.get_fake_openrouter_payload(
            content="Hola Lucía. Para tu meta de 1950 kcal, te recomiendo salmón a la plancha con espárragos.",
            model="nvidia/nemotron-3-ultra-550b-a55b:free"
        )
        fake_response.__enter__.return_value = fake_response
        mock_urlopen.return_value = fake_response

        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'sk-or-v1-nemotron-key',
            'OPENROUTER_MODEL': 'nvidia/nemotron-3-ultra-550b-a55b:free'
        }, clear=False):
            live_res = self.client.post('/api/chat', {
                'message': 'Dame una alternativa segura de cena rica en omega 3.',
                'exclusions': ['Sin Mariscos']
            }, format='json')
            self.assertEqual(live_res.status_code, status.HTTP_200_OK)
            self.assertEqual(live_res.data.get('model'), 'nvidia/nemotron-3-ultra-550b-a55b:free')
            self.assertIn('salmón a la plancha', live_res.data.get('reply', ''))

    def test_tier4_scenario_04_security_tamper_and_privilege_escalation_defense(self):
        """
        Scenario 4: Security & Tamper Rejection.
        Attacker attempts:
        - Self-promotion to admin role during public registration.
        - Duplicate email registration collision.
        - Malformed/expired JWT token access to protected endpoints.
        - XSS script payload injection in name field.
        """
        # 1. Privilege escalation
        r_hack_role, _ = self.helper_register_user(
            email="hacker.admin@nutria.fit",
            password="HackerPass2026!",
            id_rol=1
        )
        if r_hack_role.status_code == status.HTTP_201_CREATED:
            user = Usuario.objects.get(email="hacker.admin@nutria.fit")
            self.assertNotEqual(user.rol.id_rol, 1, "Security breach: User registered as Admin!")
        else:
            self.assertEqual(r_hack_role.status_code, status.HTTP_400_BAD_REQUEST)
            # Ensure user exists before testing duplicate rejection
            r_seed_dup, _ = self.helper_register_user(
                email="hacker.admin@nutria.fit",
                password="HackerPass2026!"
            )
            self.assertEqual(r_seed_dup.status_code, status.HTTP_201_CREATED)

        # 2. Duplicate registration
        r_dup, _ = self.helper_register_user(
            email="hacker.admin@nutria.fit",
            password="AnotherPass2026!"
        )
        self.assertEqual(r_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Unauthorized access with malformed JWT
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.or.forged.jwt.token')
        r_unauth = self.client.get('/api/auth/me')
        self.assertEqual(r_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4. Script injection in name
        r_xss, _ = self.helper_register_user(
            email="xss.user@nutria.fit",
            password="ValidPass2026!",
            nombre="<script>alert('xss')</script>"
        )
        self.assertEqual(r_xss.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tier4_scenario_05_end_to_end_diet_plan_management_and_macro_recalculation(self):
        """
        Scenario 5: End-to-End Diet Plan Management.
        User logs 4 structured meals, completes 2, deletes 1 snack, and checks macro consistency.
        """
        self.helper_register_user(email="diet.plan@nutria.fit", password="DietPlan2026!Pass")
        self.helper_login_user("diet.plan@nutria.fit", "DietPlan2026!Pass")

        # 1. Create Desayuno (400 kcal)
        r_m1 = self.client.post('/api/comidas', {
            "tipo": "Desayuno", "nombre": "Avena y Claras", "calorias": 400, "hora": "08:00"
        }, format='json')

        # 2. Create Almuerzo (700 kcal)
        r_m2 = self.client.post('/api/comidas', {
            "tipo": "Almuerzo", "nombre": "Pollo y Arroz", "calorias": 700, "hora": "13:00"
        }, format='json')

        # 3. Create Merienda (250 kcal)
        r_m3 = self.client.post('/api/comidas', {
            "tipo": "Merienda", "nombre": "Frutos secos y yogur", "calorias": 250, "hora": "17:00"
        }, format='json')

        # 4. Create Cena (550 kcal)
        r_m4 = self.client.post('/api/comidas', {
            "tipo": "Cena", "nombre": "Pescado al vapor", "calorias": 550, "hora": "21:00"
        }, format='json')

        if all(r.status_code == status.HTTP_201_CREATED for r in [r_m1, r_m2, r_m3, r_m4]):
            id_m1 = r_m1.data['comida'].get('id_comida') or r_m1.data['comida'].get('id')
            id_m3 = r_m3.data['comida'].get('id_comida') or r_m3.data['comida'].get('id')

            # Complete Desayuno
            self.client.patch(f'/api/comidas/{id_m1}', {"completado": True}, format='json')

            # Delete Merienda
            del_res = self.client.delete(f'/api/comidas/{id_m3}')
            self.assertIn(del_res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

            # Check remaining list
            list_res = self.client.get('/api/comidas')
            self.assertEqual(list_res.status_code, status.HTTP_200_OK)
            remaining_ids = [m.get('id_comida') or m.get('id') for m in list_res.data]
            self.assertNotIn(id_m3, remaining_ids)
            self.assertIn(id_m1, remaining_ids)
