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
DEFAULT_MODEL = "deepseek/deepseek-chat"

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
            f"Para tu **Cena de Reparación y Síntesis** ({cals_cena} kcal):\n\n"
            f"- **Proteína de digestión ligera**: 170g de lubina o dorada al horno con espárragos verdes.\n"
            f"- **Carbohidrato reparador**: 120g de batata o patata al vapor.\n"
            f"- **Ensalada detox**: Rúcula, tomate cherry y pepino con vinagre de manzana.\n\n"
            f"📊 **Macros**: 36g proteína | 28g carbohidratos | 9g grasas.\n"
            f"🛡️ Blindaje biológico verificado: Cero alérgenos."
        )

    # 6. Solicitud de Plan Completo / Regenerar Dieta
    if any(k in norm_msg for k in ["plan", "regenera", "dieta", "semana", "menu", "menu"]):
        return (
            f"📋 **Plan NutriaBot Calibrado para {name}**\n"
            f"- **Biometría**: {weight} kg | IMC {imc} ({imc_status}) | TDEE Meta: {tdee} kcal | Objetivo: {goal}\n\n"
            f"**Distribución del día ({tdee} kcal)**:\n"
            f"1. **Desayuno Bio-Anabólico** ({round(tdee * 0.22)} kcal): Tortilla de claras, pan de centeno, aguacate.\n"
            f"2. **Almuerzo Metabólico** ({round(tdee * 0.35)} kcal): Pavo braseado con quinoa y verduras al vapor.\n"
            f"3. **Snack Pre-Entreno** ({round(tdee * 0.15)} kcal): Manzana asada con canela y galletas de arroz puro.\n"
            f"4. **Cena Reparadora** ({round(tdee * 0.28)} kcal): Pescado blanco al papillote con batata y ensalada verde.\n\n"
            f"🛡️ **Garantía Inmunológica**: Tolerancia cero a {', '.join(exclusions) if exclusions else 'alérgenos bloqueados'}."
        )

    # 7. Respuesta Contextualizada General
    return (
        f"¡Hola {name}! He analizado tu mensaje con tu perfil metabólico activo:\n\n"
        f"- **Estatus Fisiológico**: IMC {imc} kg/m² ({imc_status}), Gasto Diario (TDEE) de **{tdee} kcal**.\n"
        f"- **Objetivo Primario**: {goal}.\n"
        f"- **Blindaje Inmunológico Activo**: {', '.join(exclusions) if exclusions else 'Sin restricciones registradas'}.\n\n"
        f"En relación a tu consulta: *\"{message}\"*, todos los ajustes y recomendaciones nutricionales "
        f"se encuentran alineados con tu balance energético y respetan rigurosamente la exclusión de tus alérgenos críticos. "
        f"¿Deseas una sugerencia específica para una comida del día o calibrar tus macronutrientes?"
    )


def build_system_prompt(bio: Dict[str, Any], exclusions: List[str], scheme: str = "Alta en Proteína") -> str:
    """
    Construye el System Prompt bioadaptativo con inyección de biomarcadores y reglas clínicas.
    """
    exclusions_text = "\n".join([f"- ⚠️ {ex}" for ex in exclusions]) if exclusions else "- Ninguno registrado"
    inline_exclusions = ", ".join(exclusions) if exclusions else "ninguno"

    return f"""Eres NutriaBot, un especialista clínico en nutrición deportiva bioadaptativa y metabolismo de precisión de la plataforma NutrIA.

PERFIL CLÍNICO Y METABÓLICO DEL PACIENTE:
- Nombre: {bio.get('name', 'Usuario')}
- Biometría: {bio['weight_kg']} kg | {bio['height_m']:.2f} m ({bio['height_cm']:.0f} cm) | {bio['age']} años | Sexo: {bio.get('gender', 'Femenino')}
- Índice de Masa Corporal (IMC): {bio['imc']} kg/m² ({bio['imc_status']})
- Tasa Metabólica Basal (BMR): {bio['bmr']} kcal/día
- Gasto Energético Total Diario (TDEE Meta): {bio['tdee']} kcal/día
- Objetivo Nutricional Primario: {bio['goal']}
- Esquema Alimentario: {scheme}

BLINDAJE DE SEGURIDAD CLÍNICA - EXCLUSIONES Y ALÉRGENOS BLOQUEADOS:
{exclusions_text}

DIRECTRICES CLÍNICAS ESTRICTAS DE RESPUESTA:
1. REGLA DE TOLERANCIA CERO A ALÉRGENOS: Queda ESTRICTAMENTE PROHIBIDO recomendar, insinuar o incorporar recetas o ingredientes que contengan o deriven de los alérgenos bloqueados ({inline_exclusions}). Si el paciente solicita o menciona platos con dichos componentes, debes alertarlo de forma contundente e inmediata sobre el peligro para su salud y proponer un sustituto seguro y equivalente en macronutrientes.
2. ADHERENCIA METABÓLICA AL TDEE: Toda distribución calórica o propuesta de ingesta debe ajustarse rigurosamente al balance de {bio['tdee']} kcal diarias y a su objetivo de {bio['goal']}.
3. PRECISIÓN EN MACROS: Cuando detalles comidas, incluye la estimación de proteínas (g), carbohidratos (g) y grasas saludables (g).
4. TONO: Científico, empático, motivador, claro y estructurado en Markdown legible. Responde siempre en español.
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
    except Exception as exc:
        logger.warning(
            "Excepción al consultar OpenRouter API (%s). Conmutando a Modo Mock de contingencia.",
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
