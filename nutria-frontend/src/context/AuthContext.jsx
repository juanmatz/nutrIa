/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { tokenStorage } from '../services/apiClient';

const AuthContext = createContext(null);

export const DEFAULT_USER = {
  id_usuario: 2,
  nombre: "Camila Torres",
  email: "camila.torres@nutria.fit",
  id_rol: 2,
  rol_nombre: "Usuario",
  rol: "Usuario",
  peso: 63.8,
  altura: 168,
  edad: 26,
  objetivo: "Hipertrofia Limpia & Tonificación Magra",
  calorias_diarias: 2150,
  metabolismo_base: 1410,
  imc: 22.4,
  imc_estado: "Saludable"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nutria_user_session');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    localStorage.removeItem('nutria_user_session');
  }, []);

  // Escuchar evento de token expirado
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('nutria:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('nutria:auth-expired', handleAuthExpired);
  }, [logout]);

  // Intentar sincronizar sesión real en el montaje
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      const token = tokenStorage.getAccessToken();
      if (token) {
        const me = await apiService.getMe();
        if (me && isMounted) {
          setUser(prev => {
            const merged = { ...prev, ...me };
            localStorage.setItem('nutria_user_session', JSON.stringify(merged));
            return merged;
          });
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }
    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    const result = await apiService.login(email, password);
    setIsLoading(false);

    if (result.ok && result.user) {
      const sessionUser = {
        ...DEFAULT_USER,
        ...result.user,
        rol_nombre: result.user.rol_nombre || (result.user.id_rol === 1 ? 'Administrador' : result.user.id_rol === 3 ? 'Nutricionista' : 'Usuario')
      };
      setUser(sessionUser);
      localStorage.setItem('nutria_user_session', JSON.stringify(sessionUser));
      return { ok: true, user: sessionUser };
    }
    return { ok: false, error: result.error };
  };

  const register = async (userData) => {
    setIsLoading(true);
    const result = await apiService.register(userData);
    setIsLoading(false);

    if (result.ok && result.user) {
      const u = result.user;
      const pesoNum = parseFloat(u.peso) || DEFAULT_USER.peso;
      const alturaNum = parseFloat(u.altura) || DEFAULT_USER.altura;
      const edadNum = parseInt(u.edad, 10) || DEFAULT_USER.edad;
      const altM = alturaNum > 3 ? alturaNum / 100 : alturaNum;
      const computedImc = Number((pesoNum / (altM * altM)).toFixed(1));
      const computedBmr = Math.round(10 * pesoNum + 6.25 * (altM * 100) - 5 * edadNum + 5);
      const computedStatus = computedImc < 18.5 ? "Bajo peso" : computedImc < 25 ? "Saludable" : computedImc < 30 ? "Sobrepeso" : "Obesidad";

      const sessionUser = {
        ...DEFAULT_USER,
        ...u,
        peso: pesoNum,
        altura: alturaNum,
        edad: edadNum,
        imc: isNaN(computedImc) ? DEFAULT_USER.imc : computedImc,
        metabolismo_base: isNaN(computedBmr) ? DEFAULT_USER.metabolismo_base : computedBmr,
        imc_estado: computedStatus,
        rol_nombre: u.rol_nombre || (u.id_rol === 1 ? 'Administrador' : u.id_rol === 3 ? 'Nutricionista' : 'Usuario')
      };
      setUser(sessionUser);
      localStorage.setItem('nutria_user_session', JSON.stringify(sessionUser));
      return { ok: true, user: sessionUser };
    }
    return { ok: false, error: result.error };
  };

  const updateProfile = async (partialData) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partialData };
      localStorage.setItem('nutria_user_session', JSON.stringify(updated));
      return updated;
    });

    if (user?.id_usuario) {
      await apiService.updateUsuario(user.id_usuario, partialData);
    }
  };

  // Selector rápido de demo: alternar entre Admin y Usuario
  const switchDemoUser = (roleType) => {
    if (roleType === 'admin') {
      const adminUser = {
        id_usuario: 1,
        nombre: "Roberto Méndez (Admin)",
        email: "admin@nutria.fit",
        id_rol: 1,
        rol_nombre: "Administrador",
        rol: "Administrador",
        peso: 76.5,
        altura: 178,
        edad: 38,
        objetivo: "Bienestar y Rendimiento",
        calorias_diarias: 2400,
        metabolismo_base: 1650,
        imc: 24.1,
        imc_estado: "Saludable"
      };
      setUser(adminUser);
      tokenStorage.setTokens("mock-admin-token", "mock-admin-refresh");
      localStorage.setItem('nutria_user_session', JSON.stringify(adminUser));
    } else {
      const regularUser = {
        ...DEFAULT_USER
      };
      setUser(regularUser);
      tokenStorage.setTokens("mock-user-token", "mock-user-refresh");
      localStorage.setItem('nutria_user_session', JSON.stringify(regularUser));
    }
  };

  const isAdmin = user?.id_rol === 1 || user?.rol_nombre?.toLowerCase() === 'administrador';
  const isNutritionist = user?.id_rol === 3 || user?.rol_nombre?.toLowerCase() === 'nutricionista';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        isNutritionist,
        login,
        register,
        logout,
        updateProfile,
        switchDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
