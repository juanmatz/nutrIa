import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const MealContext = createContext(null);

const STORAGE_MEALS_KEY = 'nutria_daily_meals';
const STORAGE_WATER_KEY = 'nutria_water_ml';

const INITIAL_MEALS = [
  {
    id: 1,
    tipo: 'Desayuno',
    hora: '07:30',
    nombre: 'Omelette de espinacas con tostadas integrales',
    items: [
      { nombre: 'Huevos y claras con espinaca', porcion: '2 huevos + 2 claras', p: 26, c: 4, g: 10 },
      { nombre: 'Pan integral con aceite de oliva', porcion: '2 rebanadas', p: 6, c: 34, g: 2 }
    ],
    calorias: 420,
    proteinas: 32,
    carbohidratos: 38,
    grasas: 12,
    completado: true
  },
  {
    id: 2,
    tipo: 'Almuerzo',
    hora: '13:15',
    nombre: 'Pechuga a la plancha con quinoa y aguacate',
    items: [
      { nombre: 'Pechuga de pollo a la plancha', porcion: '180g', p: 46, c: 0, g: 5 },
      { nombre: 'Quinoa cocida', porcion: '1 taza', p: 8, c: 45, g: 3 },
      { nombre: 'Aguacate y ensalada fresca', porcion: 'Media palta', p: 0, c: 20, g: 14 }
    ],
    calorias: 680,
    proteinas: 54,
    carbohidratos: 65,
    grasas: 22,
    completado: true
  },
  {
    id: 3,
    tipo: 'Merienda',
    hora: '17:00',
    nombre: 'Yogur con frutos rojos y semillas',
    items: [
      { nombre: 'Yogur natural', porcion: '200g', p: 14, c: 12, g: 3 },
      { nombre: 'Frutos rojos y semillas de calabaza', porcion: '50g', p: 4, c: 14, g: 5 }
    ],
    calorias: 280,
    proteinas: 18,
    carbohidratos: 26,
    grasas: 8,
    completado: false
  },
  {
    id: 4,
    tipo: 'Cena',
    hora: '20:30',
    nombre: 'Salmón al horno con espárragos y batata',
    items: [
      { nombre: 'Filete de salmón', porcion: '160g', p: 34, c: 0, g: 12 },
      { nombre: 'Batata al vapor', porcion: '120g', p: 2, c: 28, g: 0 },
      { nombre: 'Espárragos salteados', porcion: '100g', p: 2, c: 4, g: 2 }
    ],
    calorias: 460,
    proteinas: 38,
    carbohidratos: 32,
    grasas: 14,
    completado: false
  }
];

export function MealProvider({ children }) {
  const [meals, setMeals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEALS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo meals de localStorage:', e);
    }
    return INITIAL_MEALS;
  });

  const [waterMl, setWaterMl] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WATER_KEY);
      if (saved !== null) return Number(saved);
    } catch (e) {
      console.warn('Error leyendo water de localStorage:', e);
    }
    return 2400; // 2.4L por defecto
  });

  // Guardar en localStorage cada vez que cambien meals
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEALS_KEY, JSON.stringify(meals));
    } catch (e) {
      console.warn('Error guardando meals en localStorage:', e);
    }
  }, [meals]);

  // Guardar en localStorage cada vez que cambie waterMl
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WATER_KEY, String(waterMl));
    } catch (e) {
      console.warn('Error guardando water en localStorage:', e);
    }
  }, [waterMl]);

  // Agregar una nueva comida
  const addMeal = (newMeal) => {
    setMeals((prev) => [
      ...prev,
      {
        ...newMeal,
        id: newMeal.id || Date.now(),
        completado: newMeal.completado !== undefined ? newMeal.completado : true,
        hora: newMeal.hora || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Eliminar comida
  const removeMeal = (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  // Alternar estado completado/consumido
  const toggleMealCompleted = (id) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completado: !m.completado } : m))
    );
  };

  // Hidratación
  const addWater = (ml = 250) => {
    setWaterMl((prev) => Math.min(prev + ml, 5000));
  };

  const removeWater = (ml = 250) => {
    setWaterMl((prev) => Math.max(prev - ml, 0));
  };

  const resetWater = () => {
    setWaterMl(0);
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
        dailyTotals,
        addMeal,
        removeMeal,
        toggleMealCompleted,
        addWater,
        removeWater,
        resetWater
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
