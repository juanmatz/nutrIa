/**
 * NutrIA - API Service Layer
 * Conexión directa mediante apiClient con RBAC, tokens JWT y fallback a Mock Data reactivo.
 *
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/refresh
 * - GET  /api/auth/me
 * - GET  /api/usuarios
 * - POST /api/usuarios
 * - PUT  /api/usuarios/:id
 * - GET  /api/alimentos
 * - POST /api/alimentos
 * - PUT  /api/alimentos/:id
 * - DELETE /api/alimentos/:id
 */

import { apiRequest, tokenStorage } from './apiClient';

// Base inicial de alimentos
const INITIAL_ALIMENTOS = [
  {
    id_alimento: 1,
    nombre: "Salmón Salvaje del Atlántico",
    calorias: 208,
    proteinas: 22.0,
    carbohidratos: 0.0,
    grasas: 13.0,
    id_categoria: 1,
    categoria_nombre: "Proteínas",
    badge: "Recomendado IMC 22.4",
    prioridad: "priorizar",
    emoji: "🐟",
    detalles: "Rico en Omega-3 (EPA/DHA) y astaxantina para recuperación muscular."
  },
  {
    id_alimento: 2,
    nombre: "Pechuga de Pavo Braseada",
    calorias: 135,
    proteinas: 30.0,
    carbohidratos: 0.0,
    grasas: 1.5,
    id_categoria: 1,
    categoria_nombre: "Proteínas",
    badge: "Superalimento Magro",
    prioridad: "priorizar",
    emoji: "🍗",
    detalles: "98% libre de grasa, alta densidad de leucina para tonificación."
  },
  {
    id_alimento: 3,
    nombre: "Quinoa Real Andina",
    calorias: 120,
    proteinas: 4.4,
    carbohidratos: 21.3,
    grasas: 2.8,
    id_categoria: 2,
    categoria_nombre: "Carbohidratos Complejos",
    badge: "Libre de Gluten",
    prioridad: "priorizar",
    emoji: "🌾",
    detalles: "Aminoácidos completos y bajo índice glucémico (IG 35)."
  },
  {
    id_alimento: 4,
    nombre: "Aguacate Hass Bio",
    calorias: 160,
    proteinas: 2.0,
    carbohidratos: 9.0,
    grasas: 15.0,
    id_categoria: 3,
    categoria_nombre: "Grasas Saludables",
    badge: "Grasas Cardio-Protectoras",
    prioridad: "priorizar",
    emoji: "🥑",
    detalles: "Ácido oleico monoinsaturado y alto contenido de potasio bioactivo."
  },
  {
    id_alimento: 5,
    nombre: "Arándanos Silvestres",
    calorias: 57,
    proteinas: 0.7,
    carbohidratos: 14.0,
    grasas: 0.3,
    id_categoria: 2,
    categoria_nombre: "Carbohidratos Complejos",
    badge: "Superalimento Antioxidante",
    prioridad: "priorizar",
    emoji: "🫐",
    detalles: "Antocianinas neuroprotectoras y reducción del estrés oxidativo."
  },
  {
    id_alimento: 6,
    nombre: "Espinaca Baby Orgánica",
    calorias: 23,
    proteinas: 2.9,
    carbohidratos: 3.6,
    grasas: 0.4,
    id_categoria: 2,
    categoria_nombre: "Carbohidratos Complejos",
    badge: "Denso en Micronutrientes",
    prioridad: "neutral",
    emoji: "🥬",
    detalles: "Nitrato natural para vasodilatación y oxigenación celular."
  },
  {
    id_alimento: 7,
    nombre: "Huevos de Pastoreo (Claras + Yema)",
    calorias: 155,
    proteinas: 13.0,
    carbohidratos: 1.1,
    grasas: 11.0,
    id_categoria: 1,
    categoria_nombre: "Proteínas",
    badge: "Proteína de Referencia",
    prioridad: "priorizar",
    emoji: "🥚",
    detalles: "Valor biológico 100, biodisponibilidad máxima de colina."
  },
  {
    id_alimento: 8,
    nombre: "Lomo de Ternera Magro",
    calorias: 140,
    proteinas: 26.0,
    carbohidratos: 0.0,
    grasas: 4.0,
    id_categoria: 1,
    categoria_nombre: "Proteínas",
    badge: "Hierro Hémico + Zinc",
    prioridad: "neutral",
    emoji: "🥩",
    detalles: "Aporte natural de creatina y hierro para síntesis de hemoglobina."
  },
  {
    id_alimento: 9,
    nombre: "Avena Integral Germinada",
    calorias: 389,
    proteinas: 16.9,
    carbohidratos: 66.3,
    grasas: 6.9,
    id_categoria: 2,
    categoria_nombre: "Carbohidratos Complejos",
    badge: "Fibra Beta-Glucano",
    prioridad: "neutral",
    emoji: "🥣",
    detalles: "Energía sostenida sin picos de insulina, promueve saciedad."
  },
  {
    id_alimento: 10,
    nombre: "Aceite de Oliva Virgen Extra (AOVE)",
    calorias: 884,
    proteinas: 0.0,
    carbohidratos: 0.0,
    grasas: 100.0,
    id_categoria: 3,
    categoria_nombre: "Grasas Saludables",
    badge: "Polifenoles Vivos",
    prioridad: "priorizar",
    emoji: "🫒",
    detalles: "Antiinflamatorio celular natural por oleocanthal."
  },
  {
    id_alimento: 11,
    nombre: "Camarones Tigre Gigantes",
    calorias: 99,
    proteinas: 24.0,
    carbohidratos: 0.2,
    grasas: 0.3,
    id_categoria: 1,
    categoria_nombre: "Proteínas",
    badge: "⚠️ BLOQUEO ALÉRGENO",
    prioridad: "evitar",
    emoji: "🦐",
    detalles: "Contiene tropomiosina. Bloqueado por alergia severa del perfil."
  },
  {
    id_alimento: 12,
    nombre: "Leche Entera de Vaca",
    calorias: 62,
    proteinas: 3.2,
    carbohidratos: 4.8,
    grasas: 3.5,
    id_categoria: 4,
    categoria_nombre: "Bebidas",
    badge: "⚠️ BLOQUEO LACTOSA",
    prioridad: "evitar",
    emoji: "🥛",
    detalles: "Contiene disacárido de lactosa. Sustituido por bebida de almendras."
  }
];

// Usuarios base para demostración y gestión RBAC
const INITIAL_USUARIOS = [
  {
    id_usuario: 1,
    nombre: "Dr. Roberto Méndez (Admin)",
    email: "admin@biotech.fit",
    edad: 38,
    peso: 76.5,
    altura: 178,
    objetivo: "Supervisión Clínica & Rendimiento",
    calorias_diarias: 2400,
    id_rol: 1,
    rol_nombre: "Administrador",
    fecha_registro: "2026-01-01T08:00:00Z"
  },
  {
    id_usuario: 2,
    nombre: "Camila Torres",
    email: "camila.torres@biotech.fit",
    edad: 26,
    peso: 63.8,
    altura: 168,
    objetivo: "Hipertrofia Limpia & Tonificación Magra",
    calorias_diarias: 2150,
    id_rol: 2,
    rol_nombre: "Usuario",
    fecha_registro: "2026-01-15T08:00:00Z"
  },
  {
    id_usuario: 3,
    nombre: "Lic. Valeria Silva (Nutrición)",
    email: "valeria.nutri@biotech.fit",
    edad: 32,
    peso: 59.0,
    altura: 165,
    objetivo: "Metabolismo Balanceado",
    calorias_diarias: 1950,
    id_rol: 3,
    rol_nombre: "Nutricionista",
    fecha_registro: "2026-02-10T11:00:00Z"
  },
  {
    id_usuario: 4,
    nombre: "Lucas Mendoza (Atleta)",
    email: "lucas.mendoza@fitness.io",
    edad: 24,
    peso: 82.0,
    altura: 182,
    objetivo: "Pérdida de Grasa & Potencia",
    calorias_diarias: 2300,
    id_rol: 2,
    rol_nombre: "Usuario",
    fecha_registro: "2026-03-01T09:30:00Z"
  }
];

function getStoredAlimentos() {
  try {
    const raw = localStorage.getItem('nutria_alimentos');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_ALIMENTOS;
}

function saveStoredAlimentos(list) {
  try {
    localStorage.setItem('nutria_alimentos', JSON.stringify(list));
  } catch {
    // fallback
  }
}

function getStoredUsuarios() {
  try {
    const raw = localStorage.getItem('nutria_usuarios');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_USUARIOS;
}

function saveStoredUsuarios(list) {
  try {
    localStorage.setItem('nutria_usuarios', JSON.stringify(list));
  } catch {
    // fallback
  }
}

export const apiService = {
  /**
   * Obtiene la lista de alimentos (intenta backend REST, fallback a mock local)
   */
  async getAlimentos() {
    const res = await apiRequest('/alimentos');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return getStoredAlimentos();
  },

  /**
   * Crea un nuevo alimento (Exclusivo Administrador)
   */
  async createAlimento(alimentoData) {
    const res = await apiRequest('/alimentos', {
      method: 'POST',
      body: {
        nombre: alimentoData.nombre,
        calorias: alimentoData.calorias,
        proteinas: alimentoData.proteinas,
        carbohidratos: alimentoData.carbohidratos,
        grasas: alimentoData.grasas,
        id_categoria: alimentoData.id_categoria
      }
    });

    if (res.ok && res.data) {
      const created = res.data.alimento || res.data;
      return {
        ...created,
        badge: alimentoData.badge || "Añadido por Admin",
        prioridad: alimentoData.prioridad || "priorizar",
        emoji: alimentoData.emoji || "🥗"
      };
    }

    // Fallback local
    const current = getStoredAlimentos();
    const newAlimento = {
      id_alimento: Date.now(),
      nombre: alimentoData.nombre,
      calorias: Number(alimentoData.calorias) || 0,
      proteinas: Number(alimentoData.proteinas) || 0,
      carbohidratos: Number(alimentoData.carbohidratos) || 0,
      grasas: Number(alimentoData.grasas) || 0,
      id_categoria: Number(alimentoData.id_categoria) || 1,
      categoria_nombre: alimentoData.categoria_nombre || "Personalizado",
      badge: alimentoData.badge || "Añadido por Admin",
      prioridad: alimentoData.prioridad || "priorizar",
      emoji: alimentoData.emoji || "🥗",
      detalles: alimentoData.detalles || "Alimento calibrado en el catálogo clínico."
    };

    const updated = [newAlimento, ...current];
    saveStoredAlimentos(updated);
    return newAlimento;
  },

  /**
   * Elimina un alimento (Exclusivo Administrador)
   */
  async deleteAlimento(id_alimento) {
    const res = await apiRequest(`/alimentos/${id_alimento}`, {
      method: 'DELETE'
    });

    // Actualiza copia local
    const current = getStoredAlimentos();
    const updated = current.filter(item => item.id_alimento !== id_alimento);
    saveStoredAlimentos(updated);
    return { ok: res.ok, updated };
  },

  /**
   * Actualiza la prioridad de un alimento para la IA
   */
  async updatePrioridad(id_alimento, prioridad) {
    const current = getStoredAlimentos();
    const updated = current.map(item =>
      item.id_alimento === id_alimento ? { ...item, prioridad } : item
    );
    saveStoredAlimentos(updated);
    return updated;
  },

  /**
   * Obtiene la lista global de usuarios (Exclusivo Administrador: IsAdminRole)
   */
  async getUsuarios() {
    const res = await apiRequest('/usuarios');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return { ok: true, data: res.data };
    }
    if (res.status === 403) {
      return { ok: false, error: 'Acceso denegado: solo Administradores pueden consultar la lista global de usuarios.', status: 403 };
    }
    // Fallback local para demo
    return { ok: true, data: getStoredUsuarios() };
  },

  /**
   * Actualiza datos biométricos o rol de un usuario (IsOwnerOrAdmin)
   */
  async updateUsuario(id_usuario, updateData) {
    const res = await apiRequest(`/usuarios/${id_usuario}`, {
      method: 'PATCH',
      body: updateData
    });

    if (res.ok && res.data) {
      return { ok: true, usuario: res.data.usuario || res.data };
    }

    // Fallback local
    const current = getStoredUsuarios();
    const updated = current.map(u => {
      if (u.id_usuario === id_usuario) {
        return {
          ...u,
          ...updateData,
          rol_nombre: updateData.id_rol === 1 ? 'Administrador' : updateData.id_rol === 3 ? 'Nutricionista' : 'Usuario'
        };
      }
      return u;
    });
    saveStoredUsuarios(updated);
    const target = updated.find(u => u.id_usuario === id_usuario);
    return { ok: true, usuario: target };
  },

  /**
   * Obtiene perfil del usuario autenticado (vía /auth/me o token)
   */
  async getMe() {
    const res = await apiRequest('/auth/me');
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  },

  /**
   * Registro de nuevo usuario
   */
  async register(registerData) {
    const res = await apiRequest('/usuarios', {
      method: 'POST',
      skipAuth: true,
      body: registerData
    });

    if (res.ok && res.data) {
      if (res.data.access) {
        tokenStorage.setTokens(res.data.access, res.data.refresh);
      }
      return { ok: true, user: res.data.usuario, message: res.data.mensaje };
    }

    return { ok: false, error: res.error || 'Error al crear la cuenta.' };
  },

  /**
   * Autenticación / Login
   */
  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: { email, password }
    });

    if (res.ok && res.data) {
      tokenStorage.setTokens(res.data.access, res.data.refresh);
      return {
        ok: true,
        user: res.data.usuario,
        access: res.data.access,
        refresh: res.data.refresh
      };
    }

    // Fallback reactivo si backend no está activo: permite loguearse como Admin o Usuario demo
    const cleanEmail = String(email).trim().toLowerCase();
    const localUsers = getStoredUsuarios();
    const match = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (match) {
      tokenStorage.setTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
      return {
        ok: true,
        user: match,
        access: "mock-jwt-access-token",
        refresh: "mock-jwt-refresh-token"
      };
    }

    return {
      ok: false,
      error: res.error || 'Credenciales inválidas o correo no registrado.'
    };
  },

  /**
   * Envía un mensaje a NutriaBot con el contexto metabólico del usuario
   * POST /api/chat
   */
  /**
   * Envío de mensaje a NutriaBot AI
   * Intenta primero backend /api/chat; si falla o no está disponible, conmuta a OpenRouter directo o fallback inteligente.
   * POST /api/chat
   */
  async sendChatMessage(message, context = {}) {
    try {
      const backendRes = await apiRequest('/chat', {
        method: 'POST',
        body: {
          message,
          ...context
        }
      });

      if (backendRes && backendRes.ok && backendRes.data && backendRes.data.reply) {
        return backendRes;
      }
    } catch (e) {
      console.warn('Backend /api/chat no disponible, usando fallback directo:', e);
    }

    // Fallback 1: Llamada directa a OpenRouter desde cliente
    const directRes = await callOpenRouterDirect(message, context);
    if (directRes) {
      return directRes;
    }

    // Fallback 2: Asistente local contextualizado
    return generateLocalNutriResponse(message, context);
  },

  /**
   * Cierre de sesión seguro
   */
  logout() {
    tokenStorage.clearTokens();
  }
};

async function callOpenRouterDirect(message, context = {}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  if (!apiKey || !apiKey.startsWith('sk-or-')) return null;

  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
  const meta = context.metrics_override || {};
  const tdee = meta.tdee || 2150;
  const goal = meta.objetivo || 'Alimentación balanceada';
  const exclusions = (context.exclusions || []).join(', ') || 'ninguna';

  const systemPrompt = `Eres Nutri, el asistente nutricional amigable, cercano y experto de NutrIA.
Ayudas al usuario a comer de forma saludable, rica y práctica sin complicaciones.
- Meta calórica: ${tdee} kcal/día.
- Objetivo: ${goal}.
- Alergias o alimentos a evitar: ${exclusions}.
Pautas:
- Respuestas breves, ordenadas y motivadoras.
- Sugiere alimentos reales, fáciles de preparar y apetitosos.
- Menciona macros aproximados de forma clara si sugieres un plato.
- Responde siempre en español con un tono humano y natural.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://nutria.fit',
        'X-Title': 'NutrIA App'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return {
          ok: true,
          status: 200,
          data: { reply: content, model, source: 'openrouter-direct' }
        };
      }
    }
  } catch (err) {
    console.warn('OpenRouter direct call error:', err);
  }
  return null;
}

function generateLocalNutriResponse(message, context = {}) {
  const meta = context.metrics_override || {};
  const tdee = meta.tdee || 2150;
  const goal = meta.objetivo || 'Alimentación balanceada';
  const lower = (message || '').toLowerCase();

  let reply = "";
  if (lower.includes('desayuno')) {
    reply = `¡Hola! Para un **Desayuno Saludable y Energético** (~400 kcal):\n\n` +
      `• **Opción 1**: Tortilla de 2 huevos con espinacas y 2 tostadas de pan integral con un toque de aceite de oliva.\n` +
      `• **Opción 2**: Tazón de avena cocida con leche vegetal, canela, rodajas de plátano y semillas de chía.\n\n` +
      `📊 **Aporte estimado**: ~25g proteínas, 40g carbohidratos, 12g grasas saludables.`;
  } else if (lower.includes('almuerzo') || lower.includes('comida')) {
    reply = `Para un **Almuerzo Balanceado y Completo** (~650 kcal):\n\n` +
      `• **Proteína limpia**: 180g de pechuga de pollo, pavo o tofu a la plancha.\n` +
      `• **Energía**: 1 taza de arroz integral o quinoa cocida.\n` +
      `• **Vegetales frescos**: Ensalada abundante de hojas verdes, tomate cherry y pepino.\n\n` +
      `📊 **Aporte estimado**: ~45g proteínas, 60g carbohidratos, 15g grasas saludables.`;
  } else if (lower.includes('cena')) {
    reply = `Para una **Cena Ligera y Nutritiva** (~450 kcal):\n\n` +
      `• **Plato principal**: Filete de pescado o pollo al horno con espárragos y calabacín a la plancha.\n` +
      `• **Guarnición**: Media batata al vapor o puré casero.\n` +
      `• **Ensalada**: Rúcula con vinagre de manzana y aceite de oliva virgen.\n\n` +
      `📊 **Aporte estimado**: ~35g proteínas, 25g carbohidratos, 10g grasas.`;
  } else if (lower.includes('merienda') || lower.includes('snack') || lower.includes('colacion') || lower.includes('colación')) {
    reply = `Para tu **Merienda / Snack** (~220 kcal):\n\n` +
      `• 1 yogur vegetal con frutos rojos y semillas de calabaza.\n` +
      `• O bien: 1 manzana en rodajas con una cucharadita de crema de almendras.\n\n` +
      `📊 Aporte ideal para saciedad y energía sin pesadez.`;
  } else {
    reply = `¡Hola! Con tu meta de **${tdee} kcal al día** para **${goal}**, estoy aquí para acompañarte.\n\n` +
      `Puedo darte ideas para tus comidas de hoy, recetas ricas y rápidas, o cómo distribuir mejor tus macronutrientes. ¿Qué te gustaría consultar?`;
  }

  return {
    ok: true,
    status: 200,
    data: { reply, model: 'nutria-smart-assistant', source: 'local-fallback' }
  };
}
