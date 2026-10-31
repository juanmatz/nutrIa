import React, { useState } from 'react';
import {
  TrendingDown,
  Droplets,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Scale,
  Sparkles,
  Bot,
  Zap,
  Moon,
  HeartPulse,
  ChevronRight,
  Info
} from 'lucide-react';

export default function DashboardView({
  userMetrics,
  onOpenWeightModal,
  onOpenMealModal,
  onNavigateToChat,
  onShowToast
}) {
  const [period, setPeriod] = useState('Semana actual');
  const [waterMl, setWaterMl] = useState(2400); // 2.4L de 3.0L
  const [meriendaBonus, setMeriendaBonus] = useState(false);

  // Comidas del día
  const [meals, setMeals] = useState([
    {
      id: 1,
      tipo: 'Desayuno',
      hora: '07:30',
      nombre: 'Omelette de espinacas y claras con tostadas de centeno',
      calorias: 420,
      proteinas: 32,
      carbohidratos: 38,
      grasas: 12,
      completado: true,
      badges: ['Sin lácteos', 'Centeno Orgánico'],
      img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      tipo: 'Almuerzo',
      hora: '13:15',
      nombre: 'Bowl de quinoa, pechuga a la plancha, palta y semillas de calabaza',
      calorias: 680,
      proteinas: 54,
      carbohidratos: 65,
      grasas: 22,
      completado: true,
      badges: ['Libre de Gluten', 'Grasas Saludables'],
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      tipo: 'Merienda',
      hora: '17:00',
      nombre: meriendaBonus
        ? 'Yogur de almendras con frutos rojos, nueces y +15g Proteína Aislada'
        : 'Yogur de almendras con frutos rojos y nueces de pecán',
      calorias: meriendaBonus ? 340 : 280,
      proteinas: meriendaBonus ? 33 : 18,
      carbohidratos: 26,
      grasas: 8,
      completado: false,
      badges: ['Bio-Adaptado', 'Omega 3'],
      img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=160&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      tipo: 'Cena',
      hora: '21:00',
      nombre: 'Salmón al vapor con espárragos trigueros y batata asada',
      calorias: 460,
      proteinas: 38,
      carbohidratos: 32,
      grasas: 14,
      completado: false,
      badges: ['Antiinflamatorio', 'Cero Lactosa'],
      img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=160&auto=format&fit=crop&q=80'
    }
  ]);

  const toggleMealComplete = (id) => {
    setMeals(prev =>
      prev.map(m => (m.id === id ? { ...m, completado: !m.completado } : m))
    );
  };

  const handleApplyProteinBonus = () => {
    if (meriendaBonus) {
      if (onShowToast) onShowToast("El ajuste de +15g de proteína ya fue aplicado a la Merienda.");
      return;
    }
    setMeriendaBonus(true);
    setMeals(prev =>
      prev.map(m => {
        if (m.tipo === 'Merienda') {
          return {
            ...m,
            nombre: 'Yogur de almendras con frutos rojos, nueces y +15g Proteína Aislada',
            calorias: 340,
            proteinas: 33,
            badges: [...m.badges, '+15g Proteína Post-Gym']
          };
        }
        return m;
      })
    );
    if (onShowToast) {
      onShowToast("✓ Ajuste post-entreno aplicado con éxito: +15g de proteína sumados a tu Merienda.");
    }
  };

  // Controles de agua
  const addWater = (amount) => {
    setWaterMl(prev => Math.min(Math.max(0, prev + amount), 4000));
  };

  // Total consumido
  const totalCalsConsumed = meals.reduce((acc, m) => acc + (m.completado ? m.calorias : 0), 0) + (meriendaBonus ? 60 : 0);
  const targetCals = userMetrics?.targetCalories || 2150;
  const calsRemaining = Math.max(0, targetCals - (totalCalsConsumed || 1840));

  // Proteína actual
  const currentProtein = meals.reduce((acc, m) => acc + (m.completado ? m.proteinas : 0), 0) + (meriendaBonus ? 15 : 0) || 142;

  // Datos para el gráfico de línea interactivo
  const weightTrend = [
    { cx: 10, cy: 25, sem: 'Sem 1', peso: '65.0 kg', imc: '23.0' },
    { cx: 100, cy: 45, sem: 'Sem 2', peso: '64.5 kg', imc: '22.8' },
    { cx: 200, cy: 70, sem: 'Sem 3', peso: '64.1 kg', imc: '22.6' },
    { cx: 300, cy: 95, sem: 'Sem 4 (Hoy)', peso: `${userMetrics?.weight || 63.8} kg`, imc: `${userMetrics?.imc || 22.4}` }
  ];
  const [hoveredTrend, setHoveredTrend] = useState(null);

  // SVG circular progress calculation
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (0.85 * ringCircumference);

  // Racha semanal: L M X J V S D
  const weekDays = [
    { day: 'L', done: true },
    { day: 'M', done: true },
    { day: 'X', done: true },
    { day: 'J', done: true },
    { day: 'V', done: true },
    { day: 'S', done: true },
    { day: 'D', done: false, isToday: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── ENCABEZADO DE BIENVENIDA ─────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0A8]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            {/* Tag superior */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0A8]/10 border border-[#00F0A8]/30 text-xs font-bold text-[#00F0A8] tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-ping" />
              ● METABOLISMO SINCRONIZADO · 31 OCT 2026
            </div>

            {/* H1 */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
              ¡Hola Camila! Hoy estás al <span className="text-[#00F0A8]">84%</span> de tus objetivos nutricionales
            </h1>

            {/* Subtítulo descriptivo */}
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Balance hídrico óptimo (<span className="text-cyan-400 font-semibold">+0.4L</span>) y aporte proteico en rango anabólico objetivo (<span className="text-[#00F0A8] font-semibold">{currentProtein}g alcanzados</span>).
            </p>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector Semana/Mes */}
            <div className="bg-[#090D14] border border-[#1F2937] p-1 rounded-2xl flex items-center">
              <button
                onClick={() => setPeriod('Semana actual')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  period === 'Semana actual'
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana actual
              </button>
              <button
                onClick={() => setPeriod('Mes')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  period === 'Mes'
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>

            {/* Botón Actualizar Peso / IMC */}
            <button
              onClick={onOpenWeightModal}
              className="px-4 py-2.5 rounded-2xl bg-[#090D14] border border-[#1F2937] hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition group"
            >
              <Scale size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>+ / - Actualizar Peso / IMC</span>
            </button>

            {/* Botón Principal Registrar Comida */}
            <button
              onClick={onOpenMealModal}
              className="px-5 py-2.5 rounded-2xl bg-[#00F0A8] hover:bg-[#10B981] text-[#090D14] text-xs font-black shadow-lg shadow-[#00F0A8]/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={3} />
              <span>+ Registrar Comida</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── GRID DE 4 MÉTRICAS CLAVE (KPI CARDS SUPERIORES) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Índice de Masa Corporal (IMC) */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300 group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Índice de Masa Corporal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00F0A8]/10 border border-[#00F0A8]/30 text-[10px] font-bold text-[#00F0A8]">
                ● Saludable
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">
                {userMetrics?.imc || "22.4"}
              </span>
              <span className="text-xs font-semibold text-slate-400">kg/m²</span>
            </div>

            {/* Rango visual (Bajo / Normal / Sobrepeso) */}
            <div className="space-y-1 mb-4">
              <div className="h-2 w-full bg-[#090D14] rounded-full overflow-hidden flex relative border border-[#1F2937]">
                <div style={{ width: '25%' }} className="bg-amber-500/40 h-full" title="Bajo (<18.5)" />
                <div style={{ width: '45%' }} className="bg-[#00F0A8] h-full" title="Normal (18.5 - 24.9)" />
                <div style={{ width: '30%' }} className="bg-rose-500/40 h-full" title="Sobrepeso (>25)" />
                {/* Pointer de posición actual */}
                <span
                  className="absolute top-0 bottom-0 w-1 bg-white ring-2 ring-cyan-400 rounded-full shadow-md"
                  style={{ left: '52%' }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                <span>Bajo</span>
                <span className="text-[#00F0A8]">Normal (18.5-24.9)</span>
                <span>Sobrepeso</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between text-xs">
            <span className="text-slate-400">Peso actual:</span>
            <div className="flex items-center gap-1 font-bold text-white">
              <span>{userMetrics?.weight || "63.8"} kg</span>
              <span className="text-[11px] text-[#00F0A8] flex items-center">
                <TrendingDown size={13} /> -1.2 kg mes
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Energía & Macros */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col justify-between hover:border-[#00F0A8]/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Energía & Macros
              </span>
              <span className="text-[10px] font-bold text-[#00F0A8]">85% Meta</span>
            </div>

            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">1,840</span>
                  <span className="text-xs text-slate-400">/ 2,150 kcal</span>
                </div>
                <p className="text-[11px] text-[#00F0A8] font-semibold mt-0.5">
                  {calsRemaining || 310} kcal restantes hoy
                </p>
              </div>

              {/* Anillo de progreso circular SVG */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    className="stroke-[#1F2937]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    className="stroke-[#00F0A8] transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-white">85%</span>
              </div>
            </div>

            {/* Barras lineales de macros */}
            <div className="space-y-2 pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold">
                  <span className="text-slate-400">Proteínas</span>
                  <span className="text-rose-400 font-bold">{currentProtein}g / 150g (95%)</span>
                </div>
                <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold">
                  <span className="text-slate-400">Carbohidratos</span>
                  <span className="text-amber-400 font-bold">185g / 225g (82%)</span>
                </div>
                <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-semibold">
                  <span className="text-slate-400">Grasas</span>
                  <span className="text-cyan-400 font-bold">52g / 67g (78%)</span>
                </div>
                <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Hidratación Diaria */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hidratación Diaria
              </span>
              <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Meta 3,000 ml
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">
                {(waterMl / 1000).toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 3.0 L</span>
              <span className="text-xs font-bold text-cyan-400 ml-auto">
                {Math.round((waterMl / 3000) * 100)}%
              </span>
            </div>

            {/* 10 vasos iluminados */}
            <div className="grid grid-cols-5 gap-2 my-3">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = i < Math.floor(waterMl / 300);
                return (
                  <div
                    key={i}
                    onClick={() => setWaterMl((i + 1) * 300)}
                    className={`h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                      filled
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                        : 'bg-[#090D14] border-[#1F2937] text-slate-700 hover:border-slate-500'
                    }`}
                    title={`Vaso ${i + 1}: ${(i + 1) * 300} ml`}
                  >
                    <Droplets size={13} className={filled ? 'fill-cyan-400' : ''} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de incremento rápido */}
          <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between gap-1.5">
            <button
              onClick={() => addWater(-250)}
              className="flex-1 py-1 px-2 rounded-xl bg-[#090D14] border border-[#1F2937] hover:border-slate-500 text-[10px] font-bold text-slate-400 hover:text-white transition"
            >
              -250 ml
            </button>
            <button
              onClick={() => addWater(250)}
              className="flex-1 py-1 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-400 transition"
            >
              +250 ml
            </button>
            <button
              onClick={() => addWater(500)}
              className="flex-1 py-1 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-400 transition"
            >
              +500 ml
            </button>
          </div>
        </div>

        {/* Card 4: Racha de Consistencia */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Racha de Consistencia
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400">
                Nivel 3: Hábito Consolidado
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">18 Días</span>
              <Award size={18} className="text-amber-400" />
            </div>

            {/* Tracker semanal de días activos */}
            <div className="grid grid-cols-7 gap-1.5 my-3">
              {weekDays.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border text-xs font-bold ${
                      item.done
                        ? 'bg-[#00F0A8]/20 border-[#00F0A8] text-[#00F0A8] shadow-sm shadow-[#00F0A8]/20'
                        : item.isToday
                        ? 'bg-[#111827] border-[#00F0A8] border-dashed text-slate-300'
                        : 'bg-[#090D14] border-[#1F2937] text-slate-600'
                    }`}
                  >
                    {item.done ? '✓' : item.isToday ? '●' : '·'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1F2937] text-[11px] text-slate-400 leading-snug">
            <span className="text-amber-400 font-semibold">Próxima insignia:</span> Meta de 21 días (Faltan 3 días para Bio-Adaptación Nivel 4).
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN INFERIOR DE 2 COLUMNAS ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── COLUMNA IZQUIERDA: PLAN DE DIETA ACTIVO (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl">
            {/* Cabecera de estado */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#1F2937]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Plan de Dieta Activo</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00F0A8]/10 text-[#00F0A8] border border-[#00F0A8]/30 text-xs font-bold">
                    En Curso
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Déficit Controlado & Tonificación Magra (-300 kcal)
                </p>
              </div>

              <button
                onClick={onOpenMealModal}
                className="px-3.5 py-2 rounded-xl bg-[#090D14] border border-[#1F2937] hover:border-[#00F0A8] text-xs font-bold text-slate-200 hover:text-[#00F0A8] transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Añadir Comida
              </button>
            </div>

            {/* Timeline cronológico de comidas */}
            <div className="divide-y divide-[#1F2937]/60 mt-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`py-4 transition-colors rounded-2xl px-3 ${
                    meal.completado ? 'opacity-95' : 'hover:bg-[#090D14]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox interactivo */}
                    <button
                      onClick={() => toggleMealComplete(meal.id)}
                      className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        meal.completado
                          ? 'bg-[#00F0A8] border-[#00F0A8] text-[#090D14]'
                          : 'border-slate-600 hover:border-[#00F0A8] bg-[#090D14] text-transparent'
                      }`}
                      title={meal.completado ? "Marcar como pendiente" : "Marcar como completada"}
                    >
                      <CheckCircle2 size={16} strokeWidth={3} className={meal.completado ? 'opacity-100' : 'opacity-0'} />
                    </button>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#1F2937]">
                      <img
                        src={meal.img}
                        alt={meal.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                            {meal.tipo}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">· {meal.hora}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            meal.completado
                              ? 'bg-[#00F0A8]/10 text-[#00F0A8] border border-[#00F0A8]/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {meal.completado ? 'Completado' : 'Pendiente'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                        {meal.nombre}
                      </h4>

                      {/* Macros de la comida */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                        <span className="font-extrabold text-white">{meal.calorias} kcal</span>
                        <span>·</span>
                        <span className="text-rose-400 font-semibold">{meal.proteinas}g Prot</span>
                        <span>·</span>
                        <span className="text-amber-400 font-semibold">{meal.carbohidratos}g Carb</span>
                        <span>·</span>
                        <span className="text-cyan-400 font-semibold">{meal.grasas}g Grasas</span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {meal.badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#090D14] border border-[#1F2937] text-slate-400"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: TENDENCIA BIOMÉTRICA & ASISTENTE (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Gráfico interactivo: Evolución de IMC y Peso */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Tendencia Biométrica
                </h3>
                <p className="text-xs text-slate-400">Evolución de Peso e IMC últimas 4 semanas</p>
              </div>
              <span className="text-xs font-bold text-[#00F0A8] bg-[#00F0A8]/10 border border-[#00F0A8]/30 px-2 py-0.5 rounded-full">
                Curva Favorable
              </span>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl p-4 relative">
              <div className="h-44 w-full relative flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0A8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00F0A8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid horizontal lines */}
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#1F2937" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="#1F2937" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="320" y2="100" stroke="#1F2937" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path
                    d="M 10 25 C 90 40, 180 65, 300 95 L 300 120 L 10 120 Z"
                    fill="url(#curveGradient)"
                  />

                  {/* Smooth line */}
                  <path
                    d="M 10 25 C 90 40, 180 65, 300 95"
                    fill="none"
                    stroke="#00F0A8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  {weightTrend.map((pt, i) => (
                    <g
                      key={i}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredTrend(pt)}
                      onMouseLeave={() => setHoveredTrend(null)}
                    >
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r="6"
                        className="fill-[#111827] stroke-[#00F0A8] stroke-[3px] group-hover:r-8 transition-all"
                      />
                    </g>
                  ))}
                </svg>

                {/* Floating tooltip */}
                {hoveredTrend && (
                  <div className="absolute top-2 right-2 bg-[#111827] border border-[#00F0A8] p-2 rounded-xl text-xs shadow-xl animate-in fade-in">
                    <span className="font-bold text-white block">{hoveredTrend.sem}</span>
                    <span className="text-[#00F0A8] font-semibold">{hoveredTrend.peso}</span> ·{' '}
                    <span className="text-cyan-400">IMC {hoveredTrend.imc}</span>
                  </div>
                )}
              </div>

              {/* Labels eje X */}
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase mt-3 pt-2 border-t border-[#1F2937]">
                <span>Sem 1 (65.0kg)</span>
                <span>Sem 2</span>
                <span>Sem 3</span>
                <span className="text-[#00F0A8] font-bold">Sem 4: {userMetrics?.weight || "63.8"}kg</span>
              </div>
            </div>
          </div>

          {/* Tarjeta NutriaBot Cognitivo */}
          <div className="bg-[#111827] border border-[#00F0A8]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden glow-mint">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00F0A8]/15 border border-[#00F0A8]/30 flex items-center justify-center text-[#00F0A8]">
                <Bot size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#00F0A8] uppercase tracking-wider">
                  Recomendación Cognitiva en Tiempo Real
                </span>
                <h4 className="text-sm font-bold text-white">NutriaBot Bioadaptativo</h4>
              </div>
            </div>

            <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl p-4 text-xs text-slate-300 leading-relaxed space-y-2 mb-4">
              <p>
                ⚡ <strong className="text-white">Ajuste post-entrenamiento detectado:</strong> Sesión intensa de tren superior registrada. Tu tasa metabólica post-esfuerzo (EPOC) requiere <span className="text-[#00F0A8] font-bold">+15g de proteína limpia</span> para maximizar la síntesis miofibrilar sin interferir con la digestión.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onNavigateToChat}
                className="py-2.5 px-3 rounded-xl bg-[#090D14] border border-[#1F2937] hover:border-[#00F0A8] text-xs font-bold text-slate-200 hover:text-[#00F0A8] transition flex items-center justify-center gap-1.5"
              >
                <Bot size={15} /> Hablar con NutriaBot
              </button>

              <button
                onClick={handleApplyProteinBonus}
                className="py-2.5 px-3 rounded-xl bg-[#00F0A8] hover:bg-[#10B981] text-[#090D14] text-xs font-black shadow-md shadow-[#00F0A8]/20 transition flex items-center justify-center gap-1.5"
              >
                <Zap size={15} strokeWidth={3} /> Aplicar +15g a Merienda
              </button>
            </div>
          </div>

          {/* Barra de estado de recuperación bio-sensor */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Moon size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bio-Sensor de Recuperación
                </span>
                <span className="font-bold text-white">
                  Calidad de sueño 88% · HRV Equilibrado (Excelente)
                </span>
              </div>
            </div>

            <div className="w-2.5 h-2.5 rounded-full bg-[#00F0A8] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
