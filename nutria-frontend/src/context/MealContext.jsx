/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../services/api';
import { tokenStorage } from '../services/apiClient';
import { useAuth } from './AuthContext';

const MealContext = createContext(null);

function getLocalDateISO(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MealProvider({ children }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [waterMeta, setWaterMeta] = useState(2000);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateISO());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar comidas y agua desde la API del backend
  const loadData = useCallback(async () => {
    // Si no hay token de acceso, evitamos peticiones no autenticadas
    if (!tokenStorage.getAccessToken()) {
      setMeals([]);
      setWaterMl(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [mealsRes, waterRes] = await Promise.all([
        apiService.getComidas(selectedDate),
        apiService.getAguaHoy()
      ]);

      if (mealsRes.ok && Array.isArray(mealsRes.data)) {
        setMeals(mealsRes.data);
      } else if (mealsRes.error) {
        setError(mealsRes.error);
      }

      if (waterRes.ok && waterRes.data) {
        setWaterMl(Number(waterRes.data.cantidad_ml) || 0);
        if (waterRes.data.meta_ml) {
          setWaterMeta(Number(waterRes.data.meta_ml));
        }
      }
    } catch (err) {
      console.warn('Error al sincronizar comidas/agua con backend:', err);
      setError('Error de conexión al cargar datos de nutrición.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Recargar cuando cambie el usuario autenticado o la fecha seleccionada
  useEffect(() => {
    loadData();
  }, [loadData, user?.id_usuario]);

  // Agregar una nueva comida (POST /api/comidas) con actualización optimista
  const addMeal = async (newMeal) => {
    const tempId = newMeal.id || Date.now();
    const optimisticMeal = {
      ...newMeal,
      id: tempId,
      id_comida: tempId,
      completado: newMeal.completado !== undefined ? newMeal.completado : true,
      hora: newMeal.hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Actualización optimista inmediata (sin parpadeo)
    setMeals((prev) => [...prev, optimisticMeal]);

    const payload = {
      tipo: newMeal.tipo || 'Almuerzo',
      nombre: newMeal.nombre,
      hora: optimisticMeal.hora,
      calorias: Number(newMeal.calorias) || 0,
      proteinas: Number(newMeal.proteinas) || 0,
      carbohidratos: Number(newMeal.carbohidratos) || 0,
      grasas: Number(newMeal.grasas) || 0,
      completado: optimisticMeal.completado,
      fecha: selectedDate,
      items: Array.isArray(newMeal.items) ? newMeal.items : []
    };

    const res = await apiService.createComida(payload);
    if (res.ok && res.comida) {
      // Reemplazar ID temporal con ID real de la base de datos
      const actualComida = {
        ...res.comida,
        id: res.comida.id || res.comida.id_comida
      };
      setMeals((prev) => prev.map((m) => (m.id === tempId ? actualComida : m)));
      return { ok: true, comida: actualComida };
    } else {
      // Revertir en caso de error
      setMeals((prev) => prev.filter((m) => m.id !== tempId));
      setError(res.error || 'Error al guardar la comida en el servidor.');
      return { ok: false, error: res.error };
    }
  };

  // Eliminar comida (DELETE /api/comidas/:id) con rollback
  const removeMeal = async (id) => {
    const previousMeals = meals;
    const targetMeal = meals.find((m) => m.id === id || m.id_comida === id);
    const actualId = targetMeal?.id_comida || targetMeal?.id || id;

    setMeals((prev) => prev.filter((m) => m.id !== id && m.id_comida !== id));

    const res = await apiService.deleteComida(actualId);
    if (!res.ok) {
      setMeals(previousMeals);
      setError(res.error || 'Error al eliminar la comida.');
      return { ok: false, error: res.error };
    }
    return { ok: true };
  };

  // Alternar estado completado/consumido (PATCH /api/comidas/:id)
  const toggleMealCompleted = async (id) => {
    const targetMeal = meals.find((m) => m.id === id || m.id_comida === id);
    if (!targetMeal) return;

    const actualId = targetMeal.id_comida || targetMeal.id || id;
    const newStatus = !targetMeal.completado;
    setMeals((prev) =>
      prev.map((m) => (m.id === id || m.id_comida === id ? { ...m, completado: newStatus } : m))
    );

    const res = await apiService.updateComida(actualId, { completado: newStatus });
    if (!res.ok) {
      // Revertir
      setMeals((prev) =>
        prev.map((m) => (m.id === id || m.id_comida === id ? { ...m, completado: !newStatus } : m))
      );
      setError(res.error || 'Error al actualizar estado de la comida.');
      return { ok: false, error: res.error };
    }
    return { ok: true, comida: res.comida };
  };

  // Hidratación: Sumar agua (POST /api/agua)
  const addWater = async (ml = 250) => {
    const prevWater = waterMl;
    const optimisticTotal = Math.min(prevWater + ml, 10000);
    setWaterMl(optimisticTotal);

    const res = await apiService.addAgua(ml);
    if (res.ok && res.data) {
      setWaterMl(Number(res.data.cantidad_ml) || optimisticTotal);
      return { ok: true, data: res.data };
    } else {
      setWaterMl(prevWater);
      setError(res.error || 'Error al registrar consumo de agua.');
      return { ok: false, error: res.error };
    }
  };

  // Hidratación: Restar agua sincronizada
  const removeWater = async (ml = 250) => {
    const prevWater = waterMl;
    const targetMl = Math.max(0, prevWater - ml);
    setWaterMl(targetMl);

    const res = await apiService.setAguaTotal(targetMl);
    if (res.ok && res.data) {
      setWaterMl(Number(res.data.cantidad_ml) || targetMl);
      return { ok: true, data: res.data };
    } else {
      setWaterMl(prevWater);
      setError(res.error || 'Error al actualizar consumo de agua.');
      return { ok: false, error: res.error };
    }
  };

  // Hidratación: Reiniciar agua
  const resetWater = async () => {
    const prevWater = waterMl;
    setWaterMl(0);

    const res = await apiService.resetAgua();
    if (res.ok && res.data) {
      setWaterMl(Number(res.data.cantidad_ml) || 0);
      return { ok: true, data: res.data };
    } else {
      setWaterMl(prevWater);
      setError(res.error || 'Error al reiniciar agua.');
      return { ok: false, error: res.error };
    }
  };

  // Totales calculados (comidas completadas vs todas)
  const dailyTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let totalPlannedCalories = 0;

    meals.forEach((m) => {
      totalPlannedCalories += Number(m.calorias) || 0;
      if (m.completado) {
        calories += Number(m.calorias) || 0;
        protein += Number(m.proteinas) || 0;
        carbs += Number(m.carbohidratos) || 0;
        fat += Number(m.grasas) || 0;
      }
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      totalPlannedCalories: Math.round(totalPlannedCalories)
    };
  }, [meals]);

  return (
    <MealContext.Provider
      value={{
        meals,
        waterMl,
        waterMeta,
        dailyTotals,
        isLoading,
        error,
        selectedDate,
        setSelectedDate,
        addMeal,
        removeMeal,
        toggleMealCompleted,
        addWater,
        removeWater,
        resetWater,
        refreshMeals: loadData,
        refreshWater: loadData
      }}
    >
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMeals debe ser utilizado dentro de un MealProvider');
  }
  return context;
}
