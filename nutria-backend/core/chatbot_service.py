"""
NutriaBot Metabolic Chatbot Service
Integración con OpenRouter API y Motor Mock Bioadaptativo con Blindaje Alérgico.
"""

import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"

# Mapeo de términos alérgenos comunes para detección de restricciones alimentarias
ALLERGEN_KEYWORD_MAP: Dict[str, List[str]] = {
    'marisco': [
        'marisco', 'mariscos', 'camaron', 'camarón', 'camarones', 'langostino',
        'langostinos', 'ostra', 'ostras', 'pulpo', 'calamar', 'cangrejo',
        'mejillon', 'mejillón', 'mejillones', 'crustaceo', 'crustáceo', 'crustaceos', 'crustáceos'
    ],
    'lactosa': [
        'lactosa', 'leche', 'queso', 'yogurt', 'yogur', 'mantequilla', 'crema',
        'dairy', 'nata', 'suero de leche', 'whey'
    ],
    'fruto': [
        'fruto seco', 'frutos secos', 'fruto cascara', 'frutos cáscara', 'frutos cascara',
        'nuez', 'nueces', 'almendra', 'almendras', 'mani', 'maní', 'cacahuate',
        'cacahuates', 'avellana', 'avellanas', 'pistacho', 'pistachos', 'anacardo',
        'anacardos', 'castaña', 'castañas'
    ],
    'nuez': [
        'nuez', 'nueces', 'almendra', 'almendras', 'avellana', 'avellanas',
        'pistacho', 'pistachos', 'anacardo', 'anacardos', 'frutos secos'
    ],
    'gluten': [
        'gluten', 'trigo', 'cebada', 'centeno', 'pan blanco', 'pasta tradicional', 'harina de trigo'
    ],
    'huevo': [
        'huevo', 'huevos', 'yema', 'yemas', 'tortilla de huevo'
    ],
    'soja': [
        'soja', 'soya', 'tofu', 'edamame', 'lecitina de soja'
    ],
    'pescado': [
        'pescado', 'atun', 'atún', 'salmon', 'salmón', 'merluza', 'bacalao', 'trucha'
    ]
}


def normalize_text(text: str) -> str:
    """Normaliza texto eliminando acentos básicos y caracteres especiales para matching."""
    t = text.lower()
    replacements = (
        ("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"),
        ("ü", "u"), ("ñ", "n")
    )
    for src, dst in replacements:
        t = t.replace(src, dst)
    return t


def calculate_biometrics(
    weight: Optional[float] = None,
    height: Optional[float] = None,
    age: Optional[int] = None,
    gender: str = "Femenino",
    goal: str = "Hipertrofia Limpia & Tonificación Magra",
    daily_calories: Optional[int] = None,
    name: str = "Camila Torres",
    consumed_today: Optional[float] = None
) -> Dict[str, Any]:
    """
    Calcula IMC y TDEE (Ecuación Mifflin-St Jeor) con normalización de unidades.
    """
    w = float(weight if weight is not None and float(weight) > 0 else 63.8)
    h_raw = float(height if height is not None and float(height) > 0 else 168.0)

    # Normalización de estatura (metros y centímetros)
    if h_raw > 3.0:
        h_cm = h_raw
        h_m = h_raw / 100.0
    else:
        h_m = h_raw
        h_cm = h_raw * 100.0

    a = int(age if age is not None and int(age) > 0 else 26)

    # Índice de Masa Corporal (IMC)
    imc = round(w / (h_m ** 2), 1)
    if imc < 18.5:
        imc_status = "Bajo peso"
    elif imc < 25.0:
        imc_status = "Saludable"
    elif imc < 30.0:
        imc_status = "Sobrepeso"
    else:
        imc_status = "Obesidad"

    # Tasa Metabólica Basal (BMR - Mifflin-St Jeor)
    is_female = str(gender).strip().lower().startswith("f")
    if is_female:
        bmr = round(10.0 * w + 6.25 * h_cm - 5.0 * a - 161.0)
    else:
        bmr = round(10.0 * w + 6.25 * h_cm - 5.0 * a + 5.0)

    # Gasto Energético Total Diario (TDEE)
    if daily_calories and int(daily_calories) > 0:
        tdee = int(daily_calories)
    else:
        tdee = round(bmr * 1.55)  # Factor de actividad física moderada

    consumed_kcal = round(float(consumed_today), 1) if consumed_today is not None else None
    remaining_kcal = max(0, tdee - round(consumed_kcal)) if consumed_kcal is not None else None

    return {
        "name": name,
        "weight_kg": w,
        "height_m": round(h_m, 2),
        "height_cm": round(h_cm, 1),
        "age": a,
        "gender": gender,
        "imc": imc,
        "imc_status": imc_status,
        "bmr": bmr,
        "tdee": tdee,
        "goal": goal or "Hipertrofia Limpia & Tonificación Magra",
        "consumed_today_kcal": consumed_kcal,
        "remaining_kcal": remaining_kcal
    }


def detect_blocked_allergen(message: str, exclusions: List[str]) -> Optional[Tuple[str, str]]:
    """
    Evalúa si el mensaje del usuario menciona algún alérgeno o término crítico bloqueado.
    Retorna una tupla (termino_detectado, exclusion_regla) o None.
    """
    norm_msg = normalize_text(message)

    for ex in exclusions:
        norm_ex = normalize_text(ex)
        clean_ex = (
            norm_ex.replace("sin ", "")
            .replace("alergia a ", "")
            .replace("alérgeno ", "")
            .strip()
        )

        # 1. Búsqueda directa del término limpio de la exclusión
        if clean_ex and len(clean_ex) >= 3 and clean_ex in norm_msg:
            return clean_ex, ex

        # 2. Búsqueda por mapa semántico de palabras clave
        for key, keywords in ALLERGEN_KEYWORD_MAP.items():
            if key in norm_ex or key in clean_ex:
                for kw in keywords:
                    norm_kw = normalize_text(kw)
                    # Búsqueda con límites de palabra para evitar falsos positivos
                    pattern = r'\b' + re.escape(norm_kw) + r'\b'
                    if re.search(pattern, norm_msg):
                        return kw, ex

    return None


def generate_mock_response(
    message: str,
    bio: Dict[str, Any],
    exclusions: List[str],
    reason: str = "Servicio de IA en modo contingencia local"
) -> str:
    """
    Motor de Contingencia Transparente y Seguro:
    Aplica el filtro de alérgenos y devuelve el estado real del servicio
    y parámetros nutricionales del usuario sin simular recetas pregrabadas falsas.
    """
    name = bio.get("name", "Usuario")
    tdee = bio.get("tdee", 2150)
    goal = bio.get("goal", "Hipertrofia Limpia & Tonificación Magra")
    imc = bio.get("imc", 22.6)
    imc_status = bio.get("imc_status", "Saludable")
    exclusions_str = ", ".join(exclusions) if exclusions else "Ninguno registrado"

    # 1. Blindaje Alérgico: detección inmediata prioritaria
    allergen_match = detect_blocked_allergen(message, exclusions)
    if allergen_match:
        detected_term, exclusion_rule = allergen_match
        return (
            f"⚠️ **Alerta de Seguridad Alimentaria NutriaBot**\n\n"
            f"He detectado una consulta sobre **'{detected_term}'** en tu mensaje. "
            f"Tu perfil cuenta con un **blindaje de seguridad activo** para evitar: **{exclusion_rule}**.\n\n"
            f"Para cuidar tu bienestar, este alimento está excluido de tus sugerencias. "
            f"Para mantener tu objetivo de **{goal}** y tu meta de **{tdee} kcal**, te sugiero reemplazarlo "
            f"por alternativas ricas y seguras libres de **{detected_term}**."
        )

    consumed_info = ""
    if bio.get("consumed_today_kcal") is not None:
        consumed_info = f"- **Calorías consumidas hoy**: {bio['consumed_today_kcal']} kcal (Restantes: {bio['remaining_kcal']} kcal)\n"

    return (
        f"ℹ️ **NutriaBot — Asistencia en Modo Contingencia**\n\n"
        f"¡Hola {name}! En este momento la conexión en vivo con el modelo `{DEFAULT_MODEL}` "
        f"no se encuentra disponible ({reason}).\n\n"
        f"📊 **Tus parámetros nutricionales registrados**:\n"
        f"- **Objetivo nutricional**: {goal}\n"
        f"- **Requerimiento diario (TDEE)**: {tdee} kcal\n"
        f"- **Estado IMC**: {imc} kg/m² ({imc_status})\n"
        f"{consumed_info}"
        f"- **Alimentos a evitar**: {exclusions_str}\n\n"
        f"💡 Tu consulta (*\"{message}\"*) ha sido revisada con tus preferencias alimentarias. "
        f"Restablece la conexión con OpenRouter para generar recomendaciones dinámicas en tiempo real."
    )


def build_system_prompt(bio: Dict[str, Any], exclusions: List[str], scheme: str = "Alta en Proteína") -> str:
    """
    Construye el System Prompt amigable y natural con inyección de metas, comidas hoy y restricciones.
    """
    exclusions_text = "\n".join([f"- ⚠️ {ex}" for ex in exclusions]) if exclusions else "- Ninguno registrado"
    inline_exclusions = ", ".join(exclusions) if exclusions else "ninguno"

    consumed_line = ""
    if bio.get("consumed_today_kcal") is not None:
        consumed_line = (
            f"\n- Calorías registradas hoy: {bio['consumed_today_kcal']} kcal "
            f"(Restantes para hoy: {bio['remaining_kcal']} kcal)"
        )

    return f"""Eres Nutri, el asistente de alimentación saludable y bienestar de la plataforma NutrIA.
Operas sobre el modelo {DEFAULT_MODEL}.
Tu estilo es cálido, motivador, cercano, claro y muy práctico, pensado para personas comunes que quieren mejorar su alimentación y bienestar diario. Explicas las cosas de forma sencilla y natural, sin usar términos médicos, clínicos ni sonar como un doctor.

PERFIL DEL USUARIO:
- Nombre: {bio.get('name', 'Usuario')}
- Peso: {bio['weight_kg']} kg | Estatura: {bio['height_m']:.2f} m | Edad: {bio['age']} años
- Índice de Masa Corporal (IMC): {bio['imc']} kg/m² ({bio['imc_status']})
- Meta calórica diaria: {bio['tdee']} kcal/día{consumed_line}
- Objetivo: {bio['goal']}
- Enfoque alimentario: {scheme}

ALERGIAS O ALIMENTOS A EVITAR:
{exclusions_text}

PAUTAS DE RESPUESTA:
1. SEGURIDAD: Jamás sugieras ingredientes o platos que contengan o puedan contener los alérgenos bloqueados ({inline_exclusions}). Si el usuario pregunta por ellos, explícale amablemente por qué no es seguro y dale un sustituto rico y saludable.
2. ENFOQUE PRÁCTICO: Da ideas de platos sabrosos, fáciles de preparar y reales. Menciona de forma clara y sencilla las calorías y macronutrientes aproximados (Proteínas, Carbohidratos, Grasas) cuando sugieras comidas.
3. TONO: Cercano, optimista, breve y ordenado con viñetas claras. Responde siempre en español.
"""


def query_nutriabot(
    message: str,
    user_bio: Dict[str, Any],
    exclusions: Optional[List[str]] = None,
    scheme: str = "Alta en Proteína",
    history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Procesa la consulta a NutriaBot llamando a OpenRouter API o conmutando a contingencia segura.
    """
    if exclusions is None:
        exclusions = ["Sin Frutos Cáscara", "Sin Mariscos", "Sin Lactosa"]

    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    metabolic_context = {
        "imc": user_bio["imc"],
        "tdee": user_bio["tdee"],
        "objetivo": user_bio["goal"],
        "alérgenos_bloqueados": exclusions,
        "calorias_consumidas_hoy": user_bio.get("consumed_today_kcal"),
        "calorias_restantes": user_bio.get("remaining_kcal"),
    }

    # Filtro prioritario ante alérgenos bloqueados
    allergen_match = detect_blocked_allergen(message, exclusions)
    if allergen_match:
        reply = generate_mock_response(message, user_bio, exclusions)
        return {
            "reply": reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }

    # Si OPENROUTER_API_KEY no está configurada, operar en Modo Contingencia
    if not api_key:
        logger.info("OPENROUTER_API_KEY no configurada. Ejecutando NutriaBot en Modo Contingencia.")
        reply = generate_mock_response(
            message, user_bio, exclusions, reason="Clave de API no configurada"
        )
        return {
            "reply": reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }

    # Llamada a OpenRouter API con System Prompt bioadaptativo e historial de conversación
    system_prompt = build_system_prompt(user_bio, exclusions, scheme)
    conversation_messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt}
    ]

    if history and isinstance(history, list):
        for turn in history[-12:]:
            if isinstance(turn, dict):
                role = str(turn.get("role", "")).strip().lower()
                content = str(turn.get("content", "")).strip()
                if role in ("user", "assistant") and content:
                    conversation_messages.append({"role": role, "content": content})

    conversation_messages.append({"role": "user", "content": message})

    payload = {
        "model": model,
        "messages": conversation_messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        req = urllib.request.Request(
            url=OPENROUTER_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nutria.fit",
                "X-Title": "NutrIA Bioadaptive Nutrition Platform"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw_body = resp.read().decode("utf-8")
            data = json.loads(raw_body)
            choices = data.get("choices") or []
            if not choices:
                raise ValueError("Respuesta de OpenRouter sin 'choices'.")
            choice = choices[0]
            reply = choice.get("message", {}).get("content") or choice.get("text", "")
            if not reply:
                raise ValueError("OpenRouter retornó respuesta vacía.")
            return {
                "reply": reply,
                "status": "success",
                "mock": False,
                "model": model,
                "metabolic_context": metabolic_context
            }
    except urllib.error.HTTPError as http_err:
        err_body = ""
        try:
            err_body = http_err.read().decode('utf-8', errors='ignore')
        except Exception:
            pass
        logger.warning(
            "HTTPError en OpenRouter API (%s): %s. Conmutando a modo contingencia.",
            http_err, err_body
        )
        fallback_reply = generate_mock_response(
            message, user_bio, exclusions, reason=f"Error HTTP {http_err.code} en OpenRouter"
        )
        return {
            "reply": fallback_reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }
    except Exception as exc:
        logger.warning(
            "Excepción al consultar OpenRouter API (%s). Conmutando a Modo de contingencia.",
            exc
        )
        fallback_reply = generate_mock_response(
            message, user_bio, exclusions, reason="Error de red o tiempo de espera agotado"
        )
        return {
            "reply": fallback_reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }
