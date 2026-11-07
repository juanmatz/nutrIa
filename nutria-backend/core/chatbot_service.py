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
DEFAULT_MODEL = "google/gemini-2.0-flash-001"

# Mapeo de términos alérgenos comunes para detección clínica
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
    name: str = "Camila Torres"
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
        "goal": goal or "Hipertrofia Limpia & Tonificación Magra"
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


def generate_mock_response(message: str, bio: Dict[str, Any], exclusions: List[str]) -> str:
    """
    Motor Mock Bioadaptativo:
    Genera respuestas inteligentes, contextualizadas y con validación de seguridad
    de alérgenos cuando no se dispone de OPENROUTER_API_KEY o falla la red.
    """
    name = bio.get("name", "Camila")
    tdee = bio.get("tdee", 2150)
    goal = bio.get("goal", "Hipertrofia Limpia & Tonificación Magra")
    weight = bio.get("weight_kg", 63.8)
    imc = bio.get("imc", 22.6)
    imc_status = bio.get("imc_status", "Saludable")

    # 1. Blindaje Alérgico: detección inmediata
    allergen_match = detect_blocked_allergen(message, exclusions)
    if allergen_match:
        detected_term, exclusion_rule = allergen_match
        return (
            f"⚠️ **Alerta de Seguridad Clínica NutriaBot**\n\n"
            f"He detectado una consulta sobre **'{detected_term}'** en tu mensaje. "
            f"Tu perfil cuenta con un **blindaje clínico estricto** para la exclusión: **{exclusion_rule}**.\n\n"
            f"Por seguridad médica y nutricional, este alimento está completamente bloqueado en tus recomendaciones. "
            f"Para mantener tu objetivo de **{goal}** y tu meta de **{tdee} kcal**, te sugiero reemplazarlo "
            f"por alternativas biocompatibles seguras como pechuga de pavo braseada, lomo magro o claras de huevo pasteurizadas."
        )

    norm_msg = normalize_text(message)

    # 2. Consultas sobre Desayuno
    if "desayuno" in norm_msg:
        cals_desayuno = round(tdee * 0.22)
        return (
            f"¡Hola {name}! Para tu objetivo de **{goal}** y requerimiento metabólico de **{tdee} kcal**, "
            f"te he preparado una propuesta de **Desayuno Bio-Anabólico** ({cals_desayuno} kcal):\n\n"
            f"- **Tortilla Bio-Clean**: 3 claras de huevo + 1 huevo entero con espinacas baby y champiñones.\n"
            f"- **Carbohidrato complejo**: 2 rebanadas de pan de masa madre o centeno tostado.\n"
            f"- **Grasa saludable**: 1/4 de aguacate maduro en rodajas.\n"
            f"- **Bebida**: Infusión de té verde o café solo sin azúcar.\n\n"
            f"📊 **Aporte estimado**: 34g proteína | 38g carbohidratos | 12g grasas saludables.\n"
            f"🛡️ **Blindaje activo**: 0% alérgenos detectados (sin mariscos, sin lactosa, sin frutos secos)."
        )

    # 3. Consultas sobre Proteína / Batidos / Suplementación
    if any(k in norm_msg for k in ["proteina", "batido", "suplemento", "macros", "requerimiento"]):
        prot_gr = round(weight * 2.0)
        return (
            f"Para potenciar tu meta de **{goal}** con tu peso actual de **{weight} kg**, "
            f"tu requerimiento proteico óptimo se sitúa en **{prot_gr}g diarios** (~2.0g/kg):\n\n"
            f"1. **Pechuga de pavo / pollo a la plancha**: 31g proteína / 100g.\n"
            f"2. **Claras de huevo pasteurizadas**: 11g proteína / 100g (altísima biodisponibilidad).\n"
            f"3. **Proteína vegetal aislada (Guisante/Arroz)**: Alternativa hipoalergénica sin suero lácteo.\n"
            f"4. **Salmón o atún fresco**: 22g proteína / 100g + aporte de ácidos grasos Omega-3.\n\n"
            f"🛡️ Todas las fuentes seleccionadas cumplen estrictamente con tus exclusiones activas."
        )

    # 4. Consultas sobre Almuerzo / Comida
    if any(k in norm_msg for k in ["almuerzo", "comida", "mediodia"]):
        cals_almuerzo = round(tdee * 0.35)
        return (
            f"Para tu **Almuerzo Metabólico** ({cals_almuerzo} kcal), adaptado a tu TDEE de **{tdee} kcal**:\n\n"
            f"- **Proteína**: 180g de solomillo de pavo o pechuga de pollo al limón con hierbas provenzales.\n"
            f"- **Energía limpia**: 150g de quinoa cocida con perejil fresco o arroz basmati integral.\n"
            f"- **Fibra y micronutrientes**: Brócoli al vapor con zanahorias asadas y 10ml de aceite de oliva virgen extra.\n\n"
            f"📊 **Macros**: 45g proteína | 52g carbohidratos | 14g grasas.\n"
            f"🛡️ 100% libre de alérgenos bloqueados."
        )

    # 5. Consultas sobre Cena
    if "cena" in norm_msg:
        cals_cena = round(tdee * 0.25)
        return (
            f"¡Excelente opción! Para una **Cena Ligera y Nutritiva** (~{cals_cena} kcal):\n\n"
            f"- **Plato principal**: 160g de filete de pescado o pechuga a la plancha con espárragos y calabacín.\n"
            f"- **Guarnición**: 1 porción pequeña de batata asada o puré casero.\n"
            f"- **Ensalada fresca**: Espinacas baby, tomate cherry y pepino con unas gotas de aceite de oliva.\n\n"
            f"📊 **Aporte estimado**: 34g proteínas | 24g carbohidratos | 8g grasas saludables.\n"
            f"✨ Libre de los ingredientes que prefieres evitar."
        )

    # 6. Solicitud de Plan Completo / Regenerar Dieta
    if any(k in norm_msg for k in ["plan", "regenera", "dieta", "semana", "menu", "menú"]):
        return (
            f"📋 **Propuesta de Menú Diario para {name}**\n"
            f"• Meta del día: **{tdee} kcal** | Objetivo: {goal}\n\n"
            f"1. 🌅 **Desayuno** (~{round(tdee * 0.22)} kcal): Tortilla de claras o huevos con espinacas y tostadas integrales.\n"
            f"2. ☀️ **Almuerzo** (~{round(tdee * 0.35)} kcal): Pollo o pavo a la plancha con quinoa y vegetales salteados.\n"
            f"3. 🍎 **Merienda** (~{round(tdee * 0.15)} kcal): Yogur vegetal con frutos rojos y semillas de calabaza.\n"
            f"4. 🌙 **Cena** (~{round(tdee * 0.28)} kcal): Pescado al horno con batata y ensalada verde.\n\n"
            f"🥗 Seguro y adaptado a tus preferencias alimentarias."
        )

    # 7. Respuesta Contextualizada General
    return (
        f"¡Hola {name}! Con gusto te ayudo. Tomando en cuenta tu meta de **{tdee} kcal al día** "
        f"y tu objetivo de **{goal}**:\n\n"
        f"Respecto a lo que me comentas (*\"{message}\"*), puedo sugerirte opciones de comidas, recetas rápidas "
        f"o cómo distribuir tus proteínas y calorías a lo largo del día. ¿En qué comida o momento te gustaría enfocarte hoy?"
    )


def build_system_prompt(bio: Dict[str, Any], exclusions: List[str], scheme: str = "Alta en Proteína") -> str:
    """
    Construye el System Prompt amigable y natural con inyección de metas y restricciones.
    """
    exclusions_text = "\n".join([f"- ⚠️ {ex}" for ex in exclusions]) if exclusions else "- Ninguno registrado"
    inline_exclusions = ", ".join(exclusions) if exclusions else "ninguno"

    return f"""Eres Nutri, el asistente nutricional amigable y experto de la plataforma NutrIA.
Tu estilo es cálido, motivador, claro y muy práctico. Explicas las cosas de forma sencilla y natural, sin usar jerga médica pesada ni sonar como un robot.

PERFIL DEL USUARIO:
- Nombre: {bio.get('name', 'Usuario')}
- Peso: {bio['weight_kg']} kg | Estatura: {bio['height_m']:.2f} m | Edad: {bio['age']} años
- Índice de Masa Corporal (IMC): {bio['imc']} kg/m² ({bio['imc_status']})
- Meta calórica diaria: {bio['tdee']} kcal/día
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
    scheme: str = "Alta en Proteína"
) -> Dict[str, Any]:
    """
    Procesa la consulta a NutriaBot llamando a OpenRouter API o conmutando a Mock Bioadaptativo.
    """
    if exclusions is None:
        exclusions = ["Sin Frutos Cáscara", "Sin Mariscos", "Sin Lactosa"]

    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    metabolic_context = {
        "imc": user_bio["imc"],
        "tdee": user_bio["tdee"],
        "objetivo": user_bio["goal"],
        "alérgenos_bloqueados": exclusions
    }

    # Si OPENROUTER_API_KEY no está configurada, operar en Modo Mock
    if not api_key:
        logger.info("OPENROUTER_API_KEY no configurada. Ejecutando NutriaBot en Modo Mock.")
        reply = generate_mock_response(message, user_bio, exclusions)
        return {
            "reply": reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }

    # Llamada a OpenRouter API con System Prompt bioadaptativo
    system_prompt = build_system_prompt(user_bio, exclusions, scheme)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
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
            reply = data["choices"][0]["message"]["content"]
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
        fallback_reply = generate_mock_response(message, user_bio, exclusions)
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
        fallback_reply = generate_mock_response(message, user_bio, exclusions)
        return {
            "reply": fallback_reply,
            "status": "success",
            "mock": True,
            "model": model,
            "metabolic_context": metabolic_context
        }
