import React from 'react';
import {
  Utensils,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  Flame,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useMeals } from '../context/MealContext';

export default function DietPlanView({ userMetrics, onOpenMealModal, onShowToast }) {
  const { meals, dailyTotals, toggleMealCompleted, removeMeal } = useMeals();

  const targetCalories = userMetrics?.targetCalories || 2150;
  const targetProtein = Math.round((targetCalories * 0.3) / 4); // ~30%
  const targetCarbs = Math.round((targetCalories * 0.4) / 4);   // ~40%
  const targetFat = Math.round((targetCalories * 0.3) / 9);     // ~30%

  const handleToggle = (meal) => {
    toggleMealCompleted(meal.id);
    const newStatus = !meal.completado;
    if (onShowToast) {
      onShowToast(
        newStatus
          ? `✓ "${meal.nombre}" marcada como consumida (+${meal.calorias} kcal).`
          : `"${meal.nombre}" marcada como pendiente.`
      );
    }
  };

  const handleDelete = (id, nombre) => {
    if (confirm(`¿Eliminar la comida "${nombre}" del plan?`)) {
      removeMeal(id);
      if (onShowToast) onShowToast(`Comida eliminada del plan.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Encabezado Principal */}
      <div className="bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F332A]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Calendar size={15} />
              <span>Menú del Día · Alimentación Saludable</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Plan de Alimentación
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Organiza tus comidas diarias, revisa el aporte de cada plato y marca lo que vas consumiendo.
            </p>
          </div>

          <button
            onClick={onOpenMealModal}
            className="self-start sm:self-center py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Plus size={18} /> Registrar Comida
          </button>
        </div>

        {/* Resumen Nutricional del Plan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-6">
          <div className="bg-[#0F1715] border border-[#1F332A] rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-400 block mb-1">Calorías Consumidas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{dailyTotals.calories}</span>
              <span className="text-xs text-slate-400">/ {targetCalories} kcal</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.calories / targetCalories) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0F1715] border border-[#1F332A] rounded-2xl p-4">
            <span className="text-xs font-medium text-amber-300 block mb-1">Proteínas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{dailyTotals.protein}g</span>
              <span className="text-xs text-slate-400">/ {targetProtein}g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.protein / targetProtein) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0F1715] border border-[#1F332A] rounded-2xl p-4">
            <span className="text-xs font-medium text-emerald-300 block mb-1">Carbohidratos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{dailyTotals.carbs}g</span>
              <span className="text-xs text-slate-400">/ {targetCarbs}g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.carbs / targetCarbs) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0F1715] border border-[#1F332A] rounded-2xl p-4">
            <span className="text-xs font-medium text-yellow-300 block mb-1">Grasas Saludables</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{dailyTotals.fat}g</span>
              <span className="text-xs text-slate-400">/ {targetFat}g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.fat / targetFat) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Comidas del Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Utensils size={18} className="text-emerald-400" />
            Comidas Programadas ({meals.length})
          </h2>
          <span className="text-xs text-slate-400">
            Haz clic en el círculo para marcar como consumida
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="bg-[#121C18] border border-dashed border-[#1F332A] rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Utensils size={36} className="mx-auto text-slate-500" />
            <h3 className="text-base font-semibold text-slate-200">No hay comidas registradas para hoy</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Comienza añadiendo tu desayuno, almuerzo o cena con el botón "Registrar Comida".
            </p>
            <button
              onClick={onOpenMealModal}
              className="mt-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition"
            >
              + Agregar Primera Comida
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`bg-[#121C18] border rounded-3xl p-5 md:p-6 transition shadow-md ${
                  meal.completado
                    ? 'border-emerald-500/40 bg-[#121C18]'
                    : 'border-[#1F332A] opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Izquierda: Checkbox + Info principal */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggle(meal)}
                      aria-label={`Marcar ${meal.nombre} como ${meal.completado ? 'pendiente' : 'consumida'}`}
                      className="mt-1 transition focus:outline-none"
                    >
                      {meal.completado ? (
                        <CheckCircle2 size={26} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Circle size={26} className="text-slate-500 hover:text-emerald-300 shrink-0" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#162520] border border-[#1F332A] text-xs font-bold text-emerald-300">
                          {meal.tipo}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {meal.hora || 'Hoy'}
                        </span>
                        {meal.completado && (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            ✓ Consumida
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base md:text-lg font-bold text-white mt-1.5 ${meal.completado ? '' : 'text-slate-200'}`}>
                        {meal.nombre}
                      </h3>

                      {/* Lista de alimentos o ingredientes */}
                      {meal.items && meal.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {meal.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                              <span>{it.nombre}</span>
                              {it.porcion && <span className="text-slate-400">({it.porcion})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Derecha: Desglose de macronutrientes & botón eliminar */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1F332A]">
                    <div className="flex items-center gap-3 text-center">
                      <div className="bg-[#0F1715] px-3 py-2 rounded-xl border border-[#1F332A]">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Calorías</span>
                        <span className="text-sm font-extrabold text-white">{meal.calorias} kcal</span>
                      </div>
                      <div className="bg-[#0F1715] px-2.5 py-2 rounded-xl border border-[#1F332A]">
                        <span className="text-[10px] text-amber-300 uppercase block font-semibold">Prot</span>
                        <span className="text-xs font-bold text-white">{meal.proteinas}g</span>
                      </div>
                      <div className="bg-[#0F1715] px-2.5 py-2 rounded-xl border border-[#1F332A]">
                        <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Carb</span>
                        <span className="text-xs font-bold text-white">{meal.carbohidratos}g</span>
                      </div>
                      <div className="bg-[#0F1715] px-2.5 py-2 rounded-xl border border-[#1F332A]">
                        <span className="text-[10px] text-yellow-300 uppercase block font-semibold">Grasa</span>
                        <span className="text-xs font-bold text-white">{meal.grasas}g</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(meal.id, meal.nombre)}
                      aria-label="Eliminar comida"
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-[#16231E] transition"
                      title="Eliminar comida del plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
