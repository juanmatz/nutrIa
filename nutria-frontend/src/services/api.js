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
    nombre: "Roberto Méndez (Admin)",
    email: "admin@nutria.fit",
    edad: 38,
    peso: 76.5,
    altura: 178,
    objetivo: "Bienestar & Rendimiento",
    calorias_diarias: 2400,
    id_rol: 1,
    rol_nombre: "Administrador",
    fecha_registro: "2026-01-01T08:00:00Z"
  },
  {
    id_usuario: 2,
    nombre: "Camila Torres",
    email: "camila.torres@nutria.fit",
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
    nombre: "Valeria Silva",
    email: "valeria.nutri@nutria.fit",
    edad: 32,
    peso: 59.0,
    altura: 165,
    objetivo: "Alimentación Balanceada",
    calorias_diarias: 1950,
    id_rol: 3,
    rol_nombre: "Nutricionista",
    fecha_registro: "2026-02-10T11:00:00Z"
  },
  {
    id_usuario: 4,
    nombre: "Lucas Mendoza",
    email: "lucas.mendoza@fitness.io",
    edad: 24,
    peso: 82.0,
    altura: 182,
    objetivo: "Pérdida de Grasa & Energía",
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

// Alergias base y storage helpers
export const INITIAL_ALERGIAS = [
  {
    id: 1,
    id_alergia: 1,
    nombre: "Mariscos y Crustáceos",
    reemplazos: "Pechuga de pavo, claras de huevo, salmón o legumbres."
  },
  {
    id: 2,
    id_alergia: 2,
    nombre: "Lactosa y Derivados Lácteos",
    reemplazos: "Bebida de almendras o avena, tofu firme, yogur de coco."
  },
  {
    id: 3,
    id_alergia: 3,
    nombre: "Frutos Secos",
    reemplazos: "Semillas de girasol, chía, lino y semillas de calabaza."
  }
];

export function getStoredAlergias() {
  try {
    const raw = localStorage.getItem('nutria_alergias');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_ALERGIAS;
}

export function saveStoredAlergias(list) {
  try {
    localStorage.setItem('nutria_alergias', JSON.stringify(list));
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
      detalles: alimentoData.detalles || "Alimento registrado en el catálogo nutricional."
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
   * Registro de nuevo usuario (POST /api/auth/register con fallback a /api/usuarios)
   */
  async register(registerData) {
    let res = await apiRequest('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: registerData
    });

    if (!res.ok && res.status === 404) {
      res = await apiRequest('/usuarios', {
        method: 'POST',
        skipAuth: true,
        body: registerData
      });
    }

    if (res.ok && res.data) {
      if (res.data.access) {
        tokenStorage.setTokens(res.data.access, res.data.refresh);
      }
      return {
        ok: true,
        user: res.data.usuario,
        access: res.data.access,
        refresh: res.data.refresh,
        message: res.data.mensaje
      };
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
   * Envío de mensaje a NutriaBot AI a través del proxy seguro del backend.
   * POST /api/chat
   */
  async sendChatMessage(message, context = {}) {
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

    return {
      ok: false,
      status: backendRes?.status || 503,
      error: backendRes?.error || 'No fue posible conectar con NutriaBot en este momento.'
    };
  },

  // ============================================================
  // COMIDAS (MILESTONE 3: PARIDAD CON BACKEND)
  // ============================================================

  /**
   * Obtiene las comidas del usuario autenticado para una fecha dada (default: hoy).
   * GET /api/comidas?fecha=YYYY-MM-DD
   */
  async getComidas(fecha = null) {
    const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    const res = await apiRequest(`/comidas${query}`);
    if (res.ok && Array.isArray(res.data)) {
      return { ok: true, data: res.data };
    }
    return { ok: false, data: [], error: res.error || 'Error al obtener comidas' };
  },

  /**
   * Registra una nueva comida en el backend.
   * POST /api/comidas
   */
  async createComida(comidaData) {
    const res = await apiRequest('/comidas', {
      method: 'POST',
      body: comidaData
    });
    if (res.ok && res.data) {
      return { ok: true, comida: res.data.comida || res.data };
    }
    return { ok: false, error: res.error || 'Error al registrar comida' };
  },

  /**
   * Actualiza parcialmente una comida (ej: alternar completado).
   * PATCH /api/comidas/:id
   */
  async updateComida(id, patchData) {
    const res = await apiRequest(`/comidas/${id}`, {
      method: 'PATCH',
      body: patchData
    });
    if (res.ok && res.data) {
      return { ok: true, comida: res.data.comida || res.data };
    }
    return { ok: false, error: res.error || 'Error al actualizar comida' };
  },

  /**
   * Elimina una comida del plan diario.
   * DELETE /api/comidas/:id
   */
  async deleteComida(id) {
    const res = await apiRequest(`/comidas/${id}`, {
      method: 'DELETE'
    });
    return { ok: res.ok, error: res.error };
  },

  // ============================================================
  // REGISTRO DE AGUA (MILESTONE 3: PARIDAD CON BACKEND)
  // ============================================================

  /**
   * Obtiene el registro de hidratación de hoy para el usuario autenticado.
   * GET /api/agua/hoy
   */
  async getAguaHoy() {
    const res = await apiRequest('/agua/hoy');
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return { ok: false, data: { cantidad_ml: 0, meta_ml: 2000 }, error: res.error };
  },

  /**
   * Suma una toma de agua (por defecto 250 ml).
   * POST /api/agua
   */
  async addAgua(cantidad_ml = 250) {
    const res = await apiRequest('/agua', {
      method: 'POST',
      body: { cantidad_ml: Number(cantidad_ml) || 0 }
    });
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return { ok: false, error: res.error || 'Error al registrar agua' };
  },

  /**
   * Reinicia el contador de agua del día a 0 ml.
   * POST /api/agua con { reset: true, cantidad_ml: 0 }
   */
  async resetAgua() {
    const res = await apiRequest('/agua', {
      method: 'POST',
      body: { reset: true, cantidad_ml: 0 }
    });
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return { ok: false, error: res.error || 'Error al reiniciar agua' };
  },

  /**
   * Ajusta el total acumulado de agua a una cantidad fija (para restar o calibrar).
   */
  async setAguaTotal(total_ml) {
    const target = Math.max(0, Math.min(10000, Number(total_ml) || 0));
    const resetRes = await apiRequest('/agua', {
      method: 'POST',
      body: { reset: true, cantidad_ml: 0 }
    });
    if (!resetRes.ok) return resetRes;
    if (target === 0) return { ok: true, data: resetRes.data };

    const addRes = await apiRequest('/agua', {
      method: 'POST',
      body: { cantidad_ml: target }
    });
    if (addRes.ok && addRes.data) {
      return { ok: true, data: addRes.data };
    }
    return { ok: false, error: addRes.error || 'Error al ajustar agua' };
  },

  // ============================================================
  // ALERGIAS (MILESTONE 3: PARIDAD CON BACKEND)
  // ============================================================

  /**
   * Obtiene la lista de alergias registradas del usuario autenticado.
   * GET /api/alergias
   */
  async getAlergias() {
    const res = await apiRequest('/alergias');
    if (res.ok && Array.isArray(res.data)) {
      return res.data;
    }
    return getStoredAlergias();
  },

  /**
   * Registra una nueva alergia o alimento a evitar.
   * POST /api/alergias
   */
  async createAlergia(alergiaData) {
    const res = await apiRequest('/alergias', {
      method: 'POST',
      body: {
        nombre: String(alergiaData.nombre || '').trim(),
        reemplazos: String(alergiaData.reemplazos || '').trim()
      }
    });

    if (res.ok && res.data) {
      const created = res.data;
      const current = getStoredAlergias();
      const updated = [created, ...current.filter(a => (a.id_alergia || a.id) !== (created.id_alergia || created.id))];
      saveStoredAlergias(updated);
      return { ok: true, data: created };
    }

    // Fallback reactivo local
    const current = getStoredAlergias();
    const newAlergia = {
      id: Date.now(),
      id_alergia: Date.now(),
      nombre: alergiaData.nombre,
      reemplazos: alergiaData.reemplazos || 'Alternativas saludables sugeridas por el asistente'
    };
    saveStoredAlergias([newAlergia, ...current]);
    return { ok: true, data: newAlergia };
  },

  /**
   * Elimina una alergia registrada por id.
   * DELETE /api/alergias/:id
   */
  async deleteAlergia(id_alergia) {
    const res = await apiRequest(`/alergias/${id_alergia}`, {
      method: 'DELETE'
    });

    const current = getStoredAlergias();
    const updated = current.filter(item => (item.id_alergia || item.id) !== id_alergia);
    saveStoredAlergias(updated);
    return { ok: res.ok, updated };
  },

  // ============================================================
  // PROGRESO SEMANAL (MILESTONE 3: PARIDAD CON BACKEND)
  // ============================================================

  /**
   * Obtiene la adherencia calórica de los últimos 7 días terminando en hoy.
   * GET /api/progreso/semanal
   */
  async getProgresoSemanal() {
    const res = await apiRequest('/progreso/semanal');
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return { ok: true, data: res.data };
    }
    return { ok: false, data: [] };
  },

  /**
   * Cierre de sesión seguro
   */
  logout() {
    tokenStorage.clearTokens();
  }
};
