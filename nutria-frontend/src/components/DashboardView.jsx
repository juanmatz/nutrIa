import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplets,
  Flame,
  Scale,
  Plus,
  Minus,
  Apple,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useMeals } from '../context/MealContext';
import { apiService } from '../services/api';

export default function DashboardView({
  userMetrics,
  onOpenWeightModal,
  onOpenMealModal,
  onNavigateToDietPlan
}) {
  const { dailyTotals, waterMl, addWater, removeWater } = useMeals();

  // Metas nutricionales
  const targetCalories = userMetrics?.targetCalories || 2150;
  const currentCalories = dailyTotals.calories;
  const remainingCalories = Math.max(0, targetCalories - currentCalories);
  const caloriePercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const targetProtein = Math.round((targetCalories * 0.3) / 4); // ~160g
  const targetCarbs = Math.round((targetCalories * 0.4) / 4);   // ~215g
  const targetFat = Math.round((targetCalories * 0.3) / 9);     // ~70g

  const proteinPercent = Math.min(100, Math.round((dailyTotals.protein / targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((dailyTotals.carbs / targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((dailyTotals.fat / targetFat) * 100));

  // ─── FECHA ACTUAL & CÁLCULO DINÁMICO DE LA SEMANA ───
  const today = new Date();
  const dateFormattedFull = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const capitalizedDateFull = dateFormattedFull.charAt(0).toUpperCase() + dateFormattedFull.slice(1);

  // ─── ADHERENCIA SEMANAL VÍA API (/api/progreso/semanal) ───
  // Sustituye el array hardcodeado basePastKcal por datos reales de los últimos 7 días
  const [apiWeeklyProgress, setApiWeeklyProgress] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchWeekly() {
      try {
        const res = await apiService.getProgresoSemanal();
        if (isMounted && res.ok && Array.isArray(res.data) && res.data.length > 0) {
          setApiWeeklyProgress(res.data);
        }
      } catch (err) {
        console.warn('Error al consultar progreso semanal:', err);
      }
    }
    fetchWeekly();
    return () => {
      isMounted = false;
    };
  }, [dailyTotals.calories]);

  // Construcción de los 7 días de la semana sincronizando la respuesta del backend
  const weeklyData = useMemo(() => {
    if (Array.isArray(apiWeeklyProgress) && apiWeeklyProgress.length === 7) {
      return apiWeeklyProgress.map((item) => {
        // Para el día de hoy, sincroniza reactivamente con las calorías consumidas en sesión
        const kcal = item.isToday ? currentCalories : Number(item.kcal) || 0;
        const isCompleted = kcal >= Math.round(targetCalories * 0.85);
        return {
          ...item,
          kcal,
          isCompleted
        };
      });
    }

    // Fallback dinámico si no hay respuesta de la API (sin mock data estática)
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const monthAbbr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fallbackList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayIndex = (d.getDay() + 6) % 7;
      const isToday = i === 0;
      const isPast = i > 0;
      const kcal = isToday ? currentCalories : 0;
      const isCompleted = kcal >= Math.round(targetCalories * 0.85);

      fallbackList.push({
        day: dayNames[dayIndex],
        dayNum: d.getDate(),
        dateLabel: `${d.getDate()} ${monthAbbr[d.getMonth()]}`,
        kcal,
        isToday,
        isPast,
        isFuture: false,
        isCompleted
      });
    }
    return fallbackList;
  }, [apiWeeklyProgress, currentCalories, targetCalories]);

  const completedCount = weeklyData.filter(d => (d.isPast || d.isToday) && d.isCompleted).length;
  const elapsedCount = weeklyData.filter(d => d.isPast || d.isToday).length;
  const maxWeeklyKcal = Math.max(...weeklyData.map(d => d.kcal), targetCalories, 2400);

  // Peso e IMC
  const imcValue = parseFloat(userMetrics?.imc || 22.4);
  const weightValue = userMetrics?.weight || 63.8;
  const heightValue = userMetrics?.height || 168;
  const imcPositionPercent = Math.min(100, Math.max(0, ((imcValue - 15) / 20) * 100));

  // Hidratación / Consumo de agua (consumido en vivo desde MealContext /api/agua/hoy)
  const targetWater = userMetrics?.targetWater || 2500;
  const waterPercent = Math.min(100, Math.round((waterMl / targetWater) * 100));
  const waterGlasses = Math.min(10, Math.round(waterMl / (targetWater / 10)));

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* ─── BIENVENIDA, FECHA Y ACCIONES RÁPIDAS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Calendar size={13} />
              {capitalizedDateFull}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              · Progreso de hoy: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{caloriePercent}%</strong> ({currentCalories} de {targetCalories} kcal)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Progreso del Día
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">
            Revisa tu balance de energía, nutrientes y consumo de agua para hoy.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onNavigateToDietPlan}
            className="py-2.5 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            Ver Menú del Día <ArrowRight size={14} className="text-emerald-500" />
          </button>
          <button
            onClick={onOpenMealModal}
            className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition transform active:scale-95"
          >
            <Plus size={16} /> Registrar Comida
          </button>
        </div>
      </div>

      {/* ─── FILA 1: CALORÍAS DEL DÍA & TUS NUTRIENTES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: ANILLO DE CALORÍAS (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Tu Energía de Hoy</h2>
                <p className="text-[11px] text-[var(--text-secondary)]">Calorías consumidas</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              {caloriePercent}% listo
            </span>
          </div>

          {/* Anillo visual SVG */}
          <div className="flex items-center justify-center py-6 relative">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                className="text-[var(--border-card)]"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#52B788"
                strokeWidth="10"
                strokeDasharray="301.6"
                strokeDashoffset={301.6 - (301.6 * caloriePercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Texto al centro del anillo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {currentCalories}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">de {targetCalories} kcal</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-1 font-semibold">
                {remainingCalories > 0 ? `Te faltan ${remainingCalories} kcal` : '¡Completaste tu meta!'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-card)] text-center">
            <div className="bg-[var(--bg-app)] p-3 rounded-2xl border border-[var(--border-card)] shadow-sm">
              <span className="text-[11px] text-[var(--text-secondary)] block">Has comido</span>
              <span className="text-base font-extrabold text-[var(--text-primary)]">{currentCalories} kcal</span>
            </div>
            <button
              type="button"
              onClick={onOpenWeightModal}
              className="bg-[var(--bg-app)] hover:border-emerald-500 p-3 rounded-2xl border border-[var(--border-card)] shadow-sm transition group"
              title="Haz clic para cambiar tu meta diaria"
            >
              <span className="text-[11px] text-[var(--text-secondary)] block">Tu objetivo (Editar)</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:underline">{targetCalories} kcal</span>
            </button>
          </div>
        </div>

        {/* GRÁFICO 2: TUS NUTRIENTES (BARRAS CLARAS) (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Apple size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Tus Nutrientes Principales</h2>
                <p className="text-[11px] text-[var(--text-secondary)]">Proteínas, carbohidratos y grasas</p>
              </div>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-medium">En gramos (g)</span>
          </div>

          <div className="space-y-5 my-auto">
            {/* Proteínas */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Proteínas (Fuerza y recuperación)
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {dailyTotals.protein}g <span className="text-[var(--text-secondary)] font-normal">/ {targetProtein}g</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-card)]">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Carbohidratos */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Carbohidratos (Energía diaria)
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {dailyTotals.carbs}g <span className="text-[var(--text-secondary)] font-normal">/ {targetCarbs}g</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-card)]">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Grasas saludables */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-yellow-600 dark:text-yellow-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  Grasas Saludables (Vitalidad)
                </span>
                <span className="text-[var(--text-primary)] font-bold">
                  {dailyTotals.fat}g <span className="text-[var(--text-secondary)] font-normal">/ {targetFat}g</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-card)]">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-card)] mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Distribución balanceada</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Nutrición consciente</span>
          </div>
        </div>
      </div>

      {/* ─── FILA 2: EVOLUCIÓN SEMANAL & AGUA & MEDIDAS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GRÁFICO 3: CALENDARIO DE CUMPLIMIENTO */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calendar size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Calendario de Cumplimiento</h2>
                <p className="text-[11px] text-[var(--text-secondary)]">Últimos 7 días evaluados</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {completedCount} de {elapsedCount} días cumplidos
            </span>
          </div>

          <div className="h-40 flex items-end justify-between gap-1.5 pt-3 pb-1 px-1">
            {weeklyData.map((d, i) => {
              const heightPct = d.kcal > 0 ? Math.round((d.kcal / maxWeeklyKcal) * 100) : 8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  {/* Etiqueta superior de cumplimiento */}
                  <div className="text-[9px] font-extrabold h-4 flex items-center justify-center">
                    {d.isToday ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black tracking-tighter">
                        HOY
                      </span>
                    ) : d.isCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Meta cumplida">✓</span>
                    ) : (
                      <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100">{d.kcal || '-'}</span>
                    )}
                  </div>

                  <div className="w-full bg-[var(--bg-app)] rounded-t-xl h-full flex items-end overflow-hidden border border-[var(--border-card)]">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        d.isToday
                          ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                          : d.isCompleted
                          ? 'bg-emerald-600/70 group-hover:bg-emerald-600'
                          : d.kcal > 0
                          ? 'bg-amber-500/60'
                          : 'bg-[var(--bg-card-sub)]'
                      }`}
                      title={`${d.dateLabel}: ${d.kcal} kcal`}
                    />
                  </div>

                  <div className="text-center pt-0.5">
                    <span className={`text-[11px] font-bold block leading-tight ${d.isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]'}`}>
                      {d.day}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-medium">
                      {d.dayNum}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-3 border-t border-[var(--border-card)]">
            <span>Meta: {targetCalories} kcal</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Hoy: {currentCalories} kcal ({caloriePercent}%)</span>
          </div>
        </div>

        {/* GRÁFICO 4: CONSUMO DE AGUA */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                <Droplets size={16} />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Agua de Hoy</h2>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{waterPercent}%</span>
          </div>

          <div className="my-auto py-2">
            <div className="text-center mb-3">
              <span className="text-2xl font-black text-[var(--text-primary)]">{(waterMl / 1000).toFixed(1)}</span>
              <span className="text-xs text-[var(--text-secondary)] font-medium"> de {(targetWater / 1000).toFixed(1)} Litros</span>
            </div>

            <div className="grid grid-cols-5 gap-2 px-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded-lg border transition-all duration-300 flex items-center justify-center ${
                    i < waterGlasses
                      ? 'bg-cyan-500/25 border-cyan-500 text-cyan-600 dark:text-cyan-300 font-bold'
                      : 'bg-[var(--bg-app)] border-[var(--border-card)] text-[var(--text-muted)]'
                  }`}
                  title={`Vaso ${i + 1} (~${Math.round(targetWater / 10)} ml)`}
                >
                  <Droplets size={12} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-card)]">
            <button
              onClick={() => removeWater(250)}
              aria-label="Restar 250 mililitros de agua"
              className="p-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] transition shadow-sm"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-medium text-[var(--text-secondary)]">Vasos de 250ml</span>
            <button
              onClick={() => addWater(250)}
              aria-label="Sumar 250 mililitros de agua"
              className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <Plus size={14} /> +250 ml
            </button>
          </div>
        </div>

        {/* GRÁFICO 5: TUS MEDIDAS / IMC */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Scale size={16} />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Tu Peso Saludable</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              Saludable
            </span>
          </div>

          <div className="my-auto py-2">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-black text-[var(--text-primary)]">{weightValue}</span>
                <span className="text-xs text-[var(--text-secondary)] ml-1 font-medium">kg</span>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                IMC: <strong className="text-[var(--text-primary)]">{imcValue}</strong> · Altura: {heightValue} cm
              </span>
            </div>

            {/* Barra de escala suave */}
            <div className="relative pt-4 pb-2">
              <div
                style={{ left: `${imcPositionPercent}%` }}
                className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              >
                <span className="w-2.5 h-2.5 rotate-45 bg-emerald-500 dark:bg-white shadow-sm" />
              </div>

              <div className="w-full h-2.5 rounded-full flex overflow-hidden border border-[var(--border-card)]">
                <div className="w-[20%] bg-cyan-500/70" />
                <div className="w-[30%] bg-emerald-500" />
                <div className="w-[25%] bg-amber-500/80" />
                <div className="w-[25%] bg-rose-500/70" />
              </div>

              <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-2 font-medium">
                <span>Bajo</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Normal</span>
                <span>Sobrepeso</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-card)]">
            <button
              onClick={onOpenWeightModal}
              className="w-full py-2 px-3 rounded-xl bg-[var(--bg-app)] hover:border-emerald-500 border border-[var(--border-card)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              Actualizar Medidas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
