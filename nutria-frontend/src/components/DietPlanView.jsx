import React from 'react';
import {
  Utensils,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  Heart
} from 'lucide-react';
import { useMeals } from '../context/MealContext';

export default function DietPlanView({ userMetrics, onOpenMealModal, onShowToast }) {
  const { meals, dailyTotals, toggleMealCompleted, removeMeal } = useMeals();

  const targetCalories = userMetrics?.targetCalories || 2150;
  const targetProtein = Math.round((targetCalories * 0.3) / 4);
  const targetCarbs = Math.round((targetCalories * 0.4) / 4);
  const targetFat = Math.round((targetCalories * 0.3) / 9);

  // Fecha actual formateada para saber qué día es
  const today = new Date();
  const dateFormattedFull = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const capitalizedDateFull = dateFormattedFull.charAt(0).toUpperCase() + dateFormattedFull.slice(1);

  const completedMealsCount = meals.filter(m => m.completado).length;
  const totalMealsCount = meals.length;
  const mealsPercent = totalMealsCount > 0 ? Math.round((completedMealsCount / totalMealsCount) * 100) : 0;

  const handleToggle = (meal) => {
    toggleMealCompleted(meal.id);
    const newStatus = !meal.completado;
    if (onShowToast) {
      onShowToast(
        newStatus
          ? `✓ "${meal.nombre}" marcada como lista (+${meal.calorias} kcal).`
          : `"${meal.nombre}" marcada como pendiente.`
      );
    }
  };

  const handleDelete = (id, nombre) => {
    if (confirm(`¿Deseas quitar la comida "${nombre}" de tu plan de hoy?`)) {
      removeMeal(id);
      if (onShowToast) onShowToast(`Comida retirada de tu plan.`);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Encabezado con Fecha y Cumplimiento */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-card)]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Calendar size={13} />
                {capitalizedDateFull}
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                · Cumplimiento: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{completedMealsCount} de {totalMealsCount} comidas listas</strong> ({mealsPercent}%)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Plan de Alimentación
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
              Organiza tus comidas de hoy y marca cada plato consumido para llevar el control exacto de tus calorías.
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
          <div className="bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Calorías del Plan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">{dailyTotals.calories}</span>
              <span className="text-xs text-[var(--text-secondary)]">/ {targetCalories} kcal</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card-sub)] rounded-full mt-2 overflow-hidden border border-[var(--border-card)]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.calories / targetCalories) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 block mb-1">Proteínas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">{dailyTotals.protein}g</span>
              <span className="text-xs text-[var(--text-secondary)]">/ {targetProtein}g</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card-sub)] rounded-full mt-2 overflow-hidden border border-[var(--border-card)]">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.protein / targetProtein) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 block mb-1">Carbohidratos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">{dailyTotals.carbs}g</span>
              <span className="text-xs text-[var(--text-secondary)]">/ {targetCarbs}g</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card-sub)] rounded-full mt-2 overflow-hidden border border-[var(--border-card)]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.carbs / targetCarbs) * 100))}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-300 block mb-1">Grasas Buenas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">{dailyTotals.fat}g</span>
              <span className="text-xs text-[var(--text-secondary)]">/ {targetFat}g</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card-sub)] rounded-full mt-2 overflow-hidden border border-[var(--border-card)]">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((dailyTotals.fat / targetFat) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Comidas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Utensils size={18} className="text-emerald-500" />
            Tus Platos ({meals.length})
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">
            Toca el círculo para marcar como lista
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-card)] rounded-3xl p-12 text-center text-[var(--text-secondary)] space-y-3">
            <Utensils size={36} className="mx-auto text-[var(--text-muted)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Aún no hay platos en tu menú</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Empieza agregando tu desayuno o almuerzo para llevar tu control.
            </p>
            <button
              onClick={onOpenMealModal}
              className="mt-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition shadow-sm"
            >
              + Agregar Comida
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`bg-[var(--bg-card)] border rounded-3xl p-5 md:p-6 transition shadow-sm ${
                  meal.completado
                    ? 'border-emerald-500/50'
                    : 'border-[var(--border-card)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Izquierda: Checkbox + Info */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggle(meal)}
                      aria-label={`Marcar ${meal.nombre} como ${meal.completado ? 'pendiente' : 'consumida'}`}
                      className="mt-1 transition focus:outline-none"
                    >
                      {meal.completado ? (
                        <CheckCircle2 size={26} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={26} className="text-[var(--text-muted)] hover:text-emerald-500 shrink-0" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-[var(--chip-bg)] border border-[var(--chip-border)] text-xs font-bold text-[var(--chip-text)]">
                          {meal.tipo}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium">
                          <Clock size={12} /> {meal.hora || 'Hoy'}
                        </span>
                        {meal.completado && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            ✓ Consumida
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mt-1.5">
                        {meal.nombre}
                      </h3>

                      {/* Lista de alimentos o ingredientes */}
                      {meal.items && meal.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {meal.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{it.nombre}</span>
                              {it.porcion && <span className="text-[var(--text-muted)]">({it.porcion})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Derecha: Desglose de macronutrientes & botón eliminar */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-card)]">
                    <div className="flex items-center gap-2.5 text-center">
                      <div className="bg-[var(--bg-app)] px-3 py-2 rounded-xl border border-[var(--border-card)] shadow-sm">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Calorías</span>
                        <span className="text-sm font-extrabold text-[var(--text-primary)]">{meal.calorias} kcal</span>
                      </div>
                      <div className="bg-[var(--bg-app)] px-2.5 py-2 rounded-xl border border-[var(--border-card)] shadow-sm">
                        <span className="text-[10px] text-amber-600 dark:text-amber-300 uppercase block font-bold">Prot</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{meal.proteinas}g</span>
                      </div>
                      <div className="bg-[var(--bg-app)] px-2.5 py-2 rounded-xl border border-[var(--border-card)] shadow-sm">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-300 uppercase block font-bold">Carb</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{meal.carbohidratos}g</span>
                      </div>
                      <div className="bg-[var(--bg-app)] px-2.5 py-2 rounded-xl border border-[var(--border-card)] shadow-sm">
                        <span className="text-[10px] text-yellow-600 dark:text-yellow-300 uppercase block font-bold">Grasa</span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{meal.grasas}g</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(meal.id, meal.nombre)}
                      aria-label="Eliminar comida"
                      className="p-2 text-[var(--text-muted)] hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition"
                      title="Eliminar plato del plan"
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
