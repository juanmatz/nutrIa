import React, { useState } from 'react';
import {
  TrendingDown,
  Droplets,
  Flame,
  Scale,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  PieChart,
  BarChart2,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useMeals } from '../context/MealContext';

export default function DashboardView({
  userMetrics,
  onOpenWeightModal,
  onOpenMealModal,
  onNavigateToDietPlan,
  onShowToast
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

  // Datos semanales para el gráfico de barras
  const weeklyData = [
    { day: 'Lun', kcal: 2100, goal: targetCalories },
    { day: 'Mar', kcal: 2050, goal: targetCalories },
    { day: 'Mié', kcal: 1980, goal: targetCalories },
    { day: 'Jue', kcal: 2140, goal: targetCalories },
    { day: 'Vie', kcal: currentCalories, goal: targetCalories, isToday: true },
    { day: 'Sáb', kcal: 0, goal: targetCalories },
    { day: 'Dom', kcal: 0, goal: targetCalories }
  ];

  const maxWeeklyKcal = Math.max(...weeklyData.map(d => d.kcal), targetCalories, 2400);

  // Escala de IMC
  const imcValue = parseFloat(userMetrics?.imc || 22.4);
  const weightValue = userMetrics?.weight || 63.8;
  const heightValue = userMetrics?.height || 168;

  // Cálculo de posición en la barra de IMC (15 a 35)
  const imcPositionPercent = Math.min(100, Math.max(0, ((imcValue - 15) / 20) * 100));

  // Hidratación
  const targetWater = 3000; // 3.0 L
  const waterPercent = Math.min(100, Math.round((waterMl / targetWater) * 100));
  const waterGlasses = Math.min(10, Math.round((waterMl / 300)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── ENCABEZADO MINIMALISTA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Resumen Nutricional · Gráficos en Vivo
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Panel de Progreso
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-0.5">
            Métricas visuales de balance calórico, macronutrientes, hidratación y composición corporal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenWeightModal}
            className="py-2.5 px-4 rounded-xl bg-[#13221C] border border-[#1F332A] hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Scale size={15} className="text-emerald-400" />
            Actualizar Peso
          </button>
          <button
            onClick={onOpenMealModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition transform active:scale-95"
          >
            <Plus size={16} />
            Registrar Comida
          </button>
        </div>
      </div>

      {/* ─── FILA 1 DE GRÁFICOS: CALORÍAS (CIRCULAR) & MACRONUTRIENTES (BARRAS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: ANILLO CIRCULAR DE CALORÍAS (5 cols) */}
        <div className="lg:col-span-5 bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Flame size={17} />
              </div>
              <h2 className="text-sm font-bold text-white">Balance Calórico</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {caloriePercent}% cumplido
            </span>
          </div>

          {/* Gráfico SVG Anular */}
          <div className="flex items-center justify-center py-4 relative">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
              {/* Fondo del anillo */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#1B2E24"
                strokeWidth="11"
              />
              {/* Anillo de progreso */}
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#10B981"
                strokeWidth="11"
                strokeDasharray="301.6"
                strokeDashoffset={301.6 - (301.6 * caloriePercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Datos centrales en el anillo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-white tracking-tight">
                {currentCalories}
              </span>
              <span className="text-xs text-slate-400 font-medium">de {targetCalories} kcal</span>
              <span className="text-[11px] text-emerald-400 mt-1 font-semibold">
                {remainingCalories > 0 ? `${remainingCalories} kcal restantes` : '¡Meta alcanzada!'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1F332A] text-center">
            <div className="bg-[#0F1715] p-3 rounded-2xl border border-[#1F332A]">
              <span className="text-[11px] text-slate-400 block font-medium">Consumidas</span>
              <span className="text-lg font-bold text-white">{currentCalories} kcal</span>
            </div>
            <div className="bg-[#0F1715] p-3 rounded-2xl border border-[#1F332A]">
              <span className="text-[11px] text-slate-400 block font-medium">Meta Diaria</span>
              <span className="text-lg font-bold text-emerald-400">{targetCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: BARRAS DE MACRONUTRIENTES (7 cols) */}
        <div className="lg:col-span-7 bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <PieChart size={17} />
              </div>
              <h2 className="text-sm font-bold text-white">Distribución de Macronutrientes</h2>
            </div>
            <span className="text-xs text-slate-400">
              Gramajes del día
            </span>
          </div>

          <div className="space-y-5 my-auto">
            {/* Proteínas */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Proteínas
                </span>
                <span className="text-slate-300 font-bold">
                  {dailyTotals.protein}g <span className="text-slate-400 font-normal">/ {targetProtein}g ({proteinPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[#0F1715] rounded-full overflow-hidden border border-[#1F332A]">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Carbohidratos */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Carbohidratos
                </span>
                <span className="text-slate-300 font-bold">
                  {dailyTotals.carbs}g <span className="text-slate-400 font-normal">/ {targetCarbs}g ({carbsPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[#0F1715] rounded-full overflow-hidden border border-[#1F332A]">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Grasas */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-yellow-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  Grasas Saludables
                </span>
                <span className="text-slate-300 font-bold">
                  {dailyTotals.fat}g <span className="text-slate-400 font-normal">/ {targetFat}g ({fatPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-[#0F1715] rounded-full overflow-hidden border border-[#1F332A]">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Barra apilada de proporción */}
          <div className="pt-4 border-t border-[#1F332A] mt-4">
            <span className="text-[11px] text-slate-400 font-medium block mb-2">Proporción Actual Ingerida:</span>
            <div className="w-full h-2.5 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${(dailyTotals.protein / (dailyTotals.protein + dailyTotals.carbs + dailyTotals.fat || 1)) * 100}%` }}
                className="bg-amber-400 transition-all duration-500"
                title="Proteínas"
              />
              <div
                style={{ width: `${(dailyTotals.carbs / (dailyTotals.protein + dailyTotals.carbs + dailyTotals.fat || 1)) * 100}%` }}
                className="bg-emerald-400 transition-all duration-500"
                title="Carbohidratos"
              />
              <div
                style={{ width: `${(dailyTotals.fat / (dailyTotals.protein + dailyTotals.carbs + dailyTotals.fat || 1)) * 100}%` }}
                className="bg-yellow-400 transition-all duration-500"
                title="Grasas"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILA 2 DE GRÁFICOS: EVOLUCIÓN SEMANAL & HIDRATACIÓN & IMC ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GRÁFICO 3: EVOLUCIÓN SEMANAL (BAR CHART SVG) */}
        <div className="bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BarChart2 size={17} />
              </div>
              <h2 className="text-sm font-bold text-white">Evolución Semanal</h2>
            </div>
            <span className="text-xs text-slate-400">Lun - Dom</span>
          </div>

          {/* Gráfico visual de barras semanales */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {weeklyData.map((d, i) => {
              const heightPct = d.kcal > 0 ? Math.round((d.kcal / maxWeeklyKcal) * 100) : 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition font-mono">
                    {d.kcal}
                  </span>
                  <div className="w-full bg-[#0F1715] rounded-t-xl h-full flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        d.isToday
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30'
                          : d.kcal > 0
                          ? 'bg-emerald-800/60 group-hover:bg-emerald-600/80'
                          : 'bg-slate-800/40'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${d.isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-[#1F332A]">
            <span>Línea meta: {targetCalories} kcal</span>
            <span className="text-emerald-400 font-semibold">Hoy: {currentCalories} kcal</span>
          </div>
        </div>

        {/* GRÁFICO 4: HIDRATACIÓN INTERACTIVA */}
        <div className="bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Droplets size={17} />
              </div>
              <h2 className="text-sm font-bold text-white">Hidratación Diaria</h2>
            </div>
            <span className="text-xs font-bold text-cyan-400">{waterPercent}%</span>
          </div>

          {/* Vasos de agua interactivos */}
          <div className="my-auto py-3">
            <div className="text-center mb-3">
              <span className="text-2xl font-black text-white">{(waterMl / 1000).toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-medium"> / 3.0 Litros</span>
            </div>

            <div className="grid grid-cols-5 gap-2 px-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded-lg border transition-all duration-300 flex items-center justify-center ${
                    i < waterGlasses
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-[#0F1715] border-[#1F332A] text-slate-600'
                  }`}
                  title={`Vaso ${i + 1} (~300 ml)`}
                >
                  <Droplets size={12} />
                </div>
              ))}
            </div>
          </div>

          {/* Botones de incremento rápido */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#1F332A]">
            <button
              onClick={() => removeWater(250)}
              aria-label="Restar 250 mililitros de agua"
              className="p-2 rounded-xl bg-[#0F1715] border border-[#1F332A] hover:bg-[#16231E] text-slate-300 text-xs transition"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-300">Vasos de 250ml</span>
            <button
              onClick={() => addWater(250)}
              aria-label="Sumar 250 mililitros de agua"
              className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <Plus size={14} /> +250 ml
            </button>
          </div>
        </div>

        {/* GRÁFICO 5: ESCALA VISUAL DE IMC */}
        <div className="bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Scale size={17} />
              </div>
              <h2 className="text-sm font-bold text-white">Índice de Masa Corporal</h2>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Saludable
            </span>
          </div>

          {/* Escala Gráfica Continua */}
          <div className="my-auto py-2">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-black text-white">{imcValue}</span>
                <span className="text-xs text-slate-400 ml-1">kg/m²</span>
              </div>
              <span className="text-xs text-slate-300 font-semibold">
                {weightValue} kg · {heightValue} cm
              </span>
            </div>

            {/* Barra de color de rangos de IMC */}
            <div className="relative pt-4 pb-2">
              {/* Indicador puntero */}
              <div
                style={{ left: `${imcPositionPercent}%` }}
                className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
              >
                <span className="w-2.5 h-2.5 rotate-45 bg-white shadow-sm" />
              </div>

              {/* Barra segmentada por colores */}
              <div className="w-full h-3 rounded-full flex overflow-hidden border border-[#1F332A]">
                <div className="w-[18%] bg-cyan-500/70" title="Bajo peso (< 18.5)" />
                <div className="w-[32%] bg-emerald-500" title="Normal (18.5 - 24.9)" />
                <div className="w-[25%] bg-amber-500/80" title="Sobrepeso (25 - 29.9)" />
                <div className="w-[25%] bg-rose-500/80" title="Obesidad (≥ 30)" />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                <span>Bajo (&lt;18.5)</span>
                <span className="text-emerald-300 font-bold">Normal (18.5-24.9)</span>
                <span>Sobrepeso</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F332A]">
            <button
              onClick={onOpenWeightModal}
              className="w-full py-2 px-3 rounded-xl bg-[#0F1715] hover:bg-[#16231E] border border-[#1F332A] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              Recalcular Peso & Altura <ArrowUpRight size={14} className="text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
