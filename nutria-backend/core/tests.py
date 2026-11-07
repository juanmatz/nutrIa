"""
Automated Smoke & Integration Tests for NutriaBot (Milestone 1)
"""

import io
import os
import urllib.error
from unittest.mock import MagicMock, patch
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Alergia, Comida, Rol, Usuario


class NutriaBotChatSmokeTests(TestCase):
    """
    Suite de verificación esencial (R4) para el endpoint /api/chat y /api/chat/.
    """

    def setUp(self):
        self.client = APIClient()
        self.rol = Rol.objects.create(id_rol=2, nombre='Usuario')
        self.usuario = Usuario.objects.create(
            id_usuario=10,
            nombre='Camila Torres',
            email='camila.torres@nutria.fit',
            contrasena_hash='pbkdf2_sha256$test_hash',
            edad=26,
            peso=63.8,
            altura=168.0,
            objetivo='Hipertrofia Limpia & Tonificación Magra',
            calorias_diarias=2150,
            rol=self.rol
        )

    def test_chatbot_endpoint_mock_mode_smoke(self):
        """
        R1 & R4: Sin OPENROUTER_API_KEY, el endpoint /api/chat responde HTTP 200
        en modo mock con respuesta coherente y metabolic_context bioadaptativo.
        """
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            payload = {
                'message': 'Hola NutriaBot, ¿qué opciones de desayuno me recomiendas para hoy?',
                'exclusions': ['Sin Frutos Cáscara', 'Sin Mariscos', 'Sin Lactosa']
            }
            # Probamos tanto /api/chat como /api/chat/ (APPEND_SLASH = False)
            for url in ('/api/chat', '/api/chat/'):
                response = self.client.post(url, payload, format='json')
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data.get('status'), 'success')
                self.assertTrue(response.data.get('mock'))
                self.assertIn('reply', response.data)
                self.assertTrue(len(response.data['reply']) > 20)

                # Verificamos inyección de contexto metabólico
                context = response.data.get('metabolic_context', {})
                self.assertAlmostEqual(float(context.get('imc', 0)), 22.6, places=1)
                self.assertEqual(int(context.get('tdee', 0)), 2150)
                self.assertIn('Sin Mariscos', context.get('alérgenos_bloqueados', []))

    def test_chatbot_allergen_shield_in_mock_mode(self):
        """
        R2 & R4: Si el mensaje del usuario menciona alérgenos bloqueados
        (ej. camarones, mariscos, queso), NutriaBot emite una alerta clínica de seguridad.
        """
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            payload = {
                'message': '¿Puedo cenar un plato con camarones y queso derretido?',
                'exclusions': ['Sin Mariscos', 'Sin Lactosa']
            }
            response = self.client.post('/api/chat', payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('mock'))

            reply = response.data.get('reply', '').lower()
            # Debe contener advertencia clínica explícita de seguridad
            self.assertTrue(
                'alerta de seguridad' in reply or 'seguridad clínica' in reply or 'blindaje' in reply,
                f"La respuesta no contiene alerta de seguridad esperada: {reply}"
            )
            # Debe hacer referencia al alérgeno detectado o exclusión
            self.assertTrue(
                'camaron' in reply or 'camarón' in reply or 'marisco' in reply or 'lactosa' in reply,
                f"La respuesta no menciona el alérgeno detectado: {reply}"
            )

    @patch('core.chatbot_service.urllib.request.urlopen')
    def test_chatbot_openrouter_live_branch_mocked_https(self, mock_urlopen):
        """
        R1 & R4: Con OPENROUTER_API_KEY configurada, se ejecuta la rama live
        consultando la API de OpenRouter con el modelo definido en OPENROUTER_MODEL.
        """
        fake_payload = b'''{
            "id": "gen-test-openrouter-01",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Respuesta en vivo simulada desde OpenRouter deepseek-chat."
                    },
                    "finish_reason": "stop"
                }
            ]
        }'''
        fake_response = MagicMock()
        fake_response.read.return_value = fake_payload
        fake_response.__enter__.return_value = fake_response
        mock_urlopen.return_value = fake_response

        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'sk-or-v1-fake-integration-key',
            'OPENROUTER_MODEL': 'nvidia/nemotron-3-ultra-550b-a55b:free'
        }, clear=False):
            payload = {
                'message': 'Explica la distribución de mis macronutrientes para hipertrofia.'
            }
            response = self.client.post('/api/chat', payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertFalse(response.data.get('mock'))
            self.assertEqual(response.data.get('model'), 'nvidia/nemotron-3-ultra-550b-a55b:free')
            self.assertIn('Respuesta en vivo simulada desde OpenRouter', response.data.get('reply', ''))

            # Verificamos que urllib.request.urlopen fue invocado con la URL y headers correctos
            self.assertTrue(mock_urlopen.called)
            called_request = mock_urlopen.call_args[0][0]
            self.assertEqual(called_request.full_url, 'https://openrouter.ai/api/v1/chat/completions')
            self.assertEqual(
                called_request.headers.get('Authorization'),
                'Bearer sk-or-v1-fake-integration-key'
            )

    @patch('core.chatbot_service.urllib.request.urlopen')
    def test_chatbot_openrouter_network_error_graceful_fallback(self, mock_urlopen):
        """
        R1: Si ocurre un error de red o timeout al llamar a OpenRouter, el servicio
        conmuta suavemente al motor Mock sin romper la respuesta del usuario (HTTP 200).
        """
        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")

        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'sk-or-v1-fake-key-with-network-drop'
        }, clear=False):
            payload = {
                'message': '¿Qué puedo almorzar hoy?'
            }
            response = self.client.post('/api/chat', payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('mock'))
            self.assertIn('reply', response.data)
            self.assertTrue(len(response.data['reply']) > 20)

    def test_chatbot_empty_or_invalid_message_validation(self):
        """
        R4: Solicitudes con mensaje vacío o ausente devuelven HTTP 400 Bad Request.
        """
        # Mensaje con solo espacios
        res1 = self.client.post('/api/chat', {'message': '   '}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res1.data)

        # Mensaje ausente
        res2 = self.client.post('/api/chat', {}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res2.data)

    def test_chatbot_authenticated_user_profile_extraction(self):
        """
        R2: Si la petición está autenticada con JWT, extrae los biomarcadores
        reales del usuario en la base de datos (peso, altura, TDEE, objetivo),
        así como sus alergias registradas y calorías consumidas hoy.
        """
        Alergia.objects.create(usuario=self.usuario, nombre='Gluten', reemplazos='Arroz y quinoa')
        Comida.objects.create(
            usuario=self.usuario,
            tipo='Desayuno',
            nombre='Avena con claras',
            calorias=450.0,
            completado=True
        )
        self.client.force_authenticate(user=self.usuario)
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': '', 'OPENROUTER_MODEL': ''}, clear=False):
            payload = {
                'message': 'Dame una recomendación para mi desayuno.'
            }
            response = self.client.post('/api/chat', payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data.get('model'), 'nvidia/nemotron-3-ultra-550b-a55b:free')
            self.assertNotIn('Tortilla Bio-Clean', response.data.get('reply', ''))
            context = response.data.get('metabolic_context', {})
            self.assertEqual(context.get('objetivo'), 'Hipertrofia Limpia & Tonificación Magra')
            self.assertEqual(context.get('tdee'), 2150)
            self.assertIn('Sin Gluten', context.get('alérgenos_bloqueados', []))
            self.assertEqual(context.get('calorias_consumidas_hoy'), 450.0)
            self.assertEqual(context.get('calorias_restantes'), 1700)
