/**
 * NutrIA - Cliente HTTP Modular & Robusto
 * Características:
 * - Base URL dinámica mediante variable de entorno `VITE_API_URL`
 * - Soporte para despliegue productivo en Vercel y desarrollo local
 * - Normalización de rutas con y sin trailing slash
 * - Interceptor de requests para inyección de token JWT Bearer
 * - Interceptor de respuestas para detección de 401 y auto-refresh de tokens
 * - Cola de espera concurrente durante la renovación del token
 */

const STORAGE_KEY_ACCESS = 'nutria_access_token';
const STORAGE_KEY_REFRESH = 'nutria_refresh_token';

// Base URL dinámica: si se define VITE_API_URL en Vercel/.env, se usa; si no, fallback a '/api' o proxy local
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }
  return '/api';
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEY_ACCESS),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEY_REFRESH),
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem(STORAGE_KEY_ACCESS, access);
    if (refresh) localStorage.setItem(STORAGE_KEY_REFRESH, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
  }
};

// Variable para controlar refrescos concurrentes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Cliente HTTP principal
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // Interceptor de Request: inyectar token JWT si existe y no se omitió
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (fetchOptions.body && typeof fetchOptions.body === 'object') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Caso 401: Token expirado o inválido -> intentar renovación automática
    if (response.status === 401 && !options._retry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent('nutria:auth-expired'));
        return { ok: false, status: 401, error: 'Sesión expirada. Inicia sesión nuevamente.' };
      }

      if (isRefreshing) {
        // Encolar peticiones pendientes mientras se renueva el token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            options._retry = true;
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            return apiRequest(endpoint, options);
          })
          .catch((err) => ({ ok: false, status: 401, error: err.message }));
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccess = refreshData.access;
          tokenStorage.setTokens(newAccess, refreshData.refresh || refreshToken);
          processQueue(null, newAccess);

          // Reintentar la petición original con el nuevo token
          options._retry = true;
          return await apiRequest(endpoint, options);
        } else {
          // Refresh fallido: limpiar sesión y notificar
          tokenStorage.clearTokens();
          processQueue(new Error('Refresh token inválido'));
          window.dispatchEvent(new CustomEvent('nutria:auth-expired'));
          return { ok: false, status: 401, error: 'La sesión no pudo ser renovada.' };
        }
      } catch (refreshErr) {
        tokenStorage.clearTokens();
        processQueue(refreshErr);
        window.dispatchEvent(new CustomEvent('nutria:auth-expired'));
        return { ok: false, status: 401, error: 'Error de red al renovar la sesión.' };
      } finally {
        isRefreshing = false;
      }
    }

    // Procesar respuesta exitosa o errores regulares
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errMsg = 'Error en la petición.';
      if (typeof data === 'object' && data !== null) {
        errMsg = data.error || data.detail || data.mensaje || JSON.stringify(data);
      } else if (typeof data === 'string') {
        errMsg = data;
      }
      return {
        ok: false,
        status: response.status,
        error: errMsg,
        data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
    };
  } catch (netErr) {
    return {
      ok: false,
      status: 0,
      error: `Error de conexión con el servidor (${netErr.message || 'Network Error'}).`,
      data: null,
    };
  }
}

