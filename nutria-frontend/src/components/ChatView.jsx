import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  Paperclip,
  Sparkles,
  ShieldCheck,
  Flame,
  Scale,
  Activity,
  Check,
  X,
  RefreshCw,
  ChevronRight,
  Sliders,
  Utensils,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';

export default function ChatView({ userMetrics, onUpdateMetrics, onShowToast }) {
  // Estado del panel izquierdo (calibración)
  const [height, setHeight] = useState(userMetrics?.height ? (userMetrics.height / 100).toFixed(2) : 1.68);
  const [weight, setWeight] = useState(userMetrics?.weight || 63.8);
  const [gender, setGender] = useState('Femenino');
  const [activityLevel, setActivityLevel] = useState('Moderada 4d');
  const [goal, setGoal] = useState('Ganancia limpia');
  const [dietScheme, setDietScheme] = useState('Alta en Proteína');
  const [exclusions, setExclusions] = useState(['Sin Frutos Cáscara', 'Sin Mariscos', 'Sin Lactosa']);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Cálculo en vivo de IMC y TDEE
  const hNum = parseFloat(height) || 1.68;
  const wNum = parseFloat(weight) || 63.8;
  const imcLive = (wNum / (hNum * hNum)).toFixed(1);
  const basalLive = Math.round(10 * wNum + 6.25 * (hNum * 100) - 5 * 26 - (gender === 'Femenino' ? 161 : -5));
  const tdeeLive = Math.round(basalLive * 1.55);

  // Chat state
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      time: '10:14 AM',
      text: 'Hola NutriaBot, actualicé mi peso a 63.8 kg y quiero una dieta de 2,000 kcal enfocada en tonificación, recordando que soy alérgica a mariscos y lactosa.'
    },
    {
      id: 2,
      sender: 'bot',
      time: '10:14 AM',
      type: 'clinical_plan',
      greeting: '¡Hola Camila! He recalculado tus biomarcadores con tu peso actual de 63.8 kg e IMC de 22.4 kg/m².',
      analysis: 'Para tu fase de Hipertrofia Limpia & Tonificación Magra con un déficit metabólico leve de 150 kcal sobre tu TDEE (2,150 kcal), he estructurado un balance de 2,000 kcal optimizado para síntesis de miofibrillas y regeneración del tejido conectivo.',
      macros: {
        protein: { g: 150, pct: '30%' },
        carbs: { g: 200, pct: '40%' },
        fats: { g: 65, pct: '30%' }
      },
      safetyTag: 'Filtro de seguridad validado: 0g crustáceos, 0g caseína / suero lácteo (0 alérgenos detectados).',
      plan: {
        title: 'Plan Diario Inteligente — Día Tipo · Tonificación & Fuerza',
        totalKcal: 1995,
        mealsCount: 5,
        firstMeal: {
          name: 'Comida 1: Desayuno Bio-Anabólico (410 kcal)',
          items: [
            'Tortilla francesa de 3 claras pasteurizadas + 1 huevo entero con espinacas baby salteadas en AOVE.',
            '2 rebanadas de pan de centeno germinado 100% integral.',
            'Infusión de té verde matcha con infusión de jengibre y semillas de chía hidratadas.'
          ]
        },
        otherMeals: [
          { name: 'Media Mañana (260 kcal)', desc: 'Batido de proteína de guisante/arroz con leche de almendras y arándanos silvestres.' },
          { name: 'Almuerzo Metabólico (650 kcal)', desc: '180g pechuga de pavo braseada con 80g quinoa andina y 1/2 aguacate hass.' },
          { name: 'Merienda Pre-Entreno (275 kcal)', desc: 'Tazón de avena sin gluten con fresas laminadas y semillas de calabaza tostadas.' },
          { name: 'Cena de Reparación Celular (400 kcal)', desc: '160g lomo de salmón salvaje al horno con espárragos trigueros y calabacín a la plancha.' }
        ]
      }
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    if (isTyping) return false;
    const query = typeof textToSend === 'string' ? textToSend : inputMessage;
    if (!query || !query.trim()) return false;

    const trimmedQuery = query.trim();

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmedQuery
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setErrorMessage(null);
    setIsTyping(true);

    try {
      const res = await apiService.sendChatMessage(trimmedQuery, {
        exclusions,
        metrics_override: {
          peso: Number(weight),
          altura: Number(height),
          edad: 26,
          sexo: gender,
          objetivo: goal,
          tdee: Number(tdeeLive),
          imc: Number(imcLive),
          dietScheme
        }
      });

      if (res && res.ok && res.data) {
        const replyText = res.data.reply || res.data.message || 'Respuesta recibida de NutriaBot.';
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: replyText
        };

        setMessages(prev => [...prev, botMsg]);
        return true;
      } else {
        const errorText = res?.error || 'Error de conexión con NutriaBot';
        setErrorMessage(errorText);
        onShowToast?.(errorText, 'error');
        return false;
      }
    } catch (err) {
      const errorText = err?.message || 'Error de conexión con NutriaBot';
      setErrorMessage(errorText);
      onShowToast?.(errorText, 'error');
      return false;
    } finally {
      setIsTyping(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (isRegenerating || isTyping) return;
    setIsRegenerating(true);
    setErrorMessage(null);
    try {
      onUpdateMetrics?.({
        weight: wNum,
        height: Math.round(hNum * 100),
        imc: parseFloat(imcLive),
        tdee: tdeeLive
      });
      const prompt = `He recalibrado mis parámetros biométricos: Peso ${wNum} kg, Estatura ${hNum} m, Esquema ${dietScheme}, Objetivo ${goal}. Regenera mi plan diario completo.`;
      const success = await handleSendMessage(prompt);
      if (success && onShowToast) {
        onShowToast("✓ Plan NutriaBot regenerado con los nuevos parámetros biométricos.");
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const removeExclusion = (tag) => {
    setExclusions(prev => prev.filter(t => t !== tag));
  };

  const quickChips = [
    'Cambiar desayuno por opción rápida',
    'Aumentar proteína sin batidos',
    'Añadir colación pre-entreno',
    'Verificar fuentes de calcio sin lácteos'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
      {/* ─── PANEL IZQUIERDO: CALIBRACIÓN BIOMÉTRICA & PREFERENCIAS (5 cols) ─── */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2937]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Calibración Biométrica</h3>
                <p className="text-xs text-slate-400">Ajuste de variables metabólicas</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Sensor Activo
            </span>
          </div>

          {/* Visualizador de IMC en tiempo real con indicador deslizante */}
          <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                IMC Dinámico
              </span>
              <span className="text-xs font-bold text-[#00F0A8] bg-[#00F0A8]/10 border border-[#00F0A8]/30 px-2 py-0.5 rounded-full">
                ● {imcLive} kg/m² Saludable
              </span>
            </div>

            {/* Slider visual indicador */}
            <div className="relative pt-2 pb-1">
              <div className="h-2 w-full bg-[#111827] rounded-full overflow-hidden flex border border-[#1F2937]">
                <div style={{ width: '25%' }} className="bg-amber-500/40" />
                <div style={{ width: '45%' }} className="bg-[#00F0A8]" />
                <div style={{ width: '30%' }} className="bg-rose-500/40" />
              </div>
              <div
                className="absolute top-1 w-3 h-4 bg-white border border-[#090D14] rounded-sm shadow-md transition-all duration-300"
                style={{
                  left: `${Math.min(Math.max(((parseFloat(imcLive) - 15) / 20) * 100, 5), 95)}%`
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-1">
              <span>Bajo (&lt;18.5)</span>
              <span className="text-[#00F0A8]">Saludable (18.5 - 24.9)</span>
              <span>Sobrepeso (&gt;25)</span>
            </div>
          </div>

          {/* Gasto calórico: TDEE vs Basal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#090D14] border border-[#1F2937] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                TDEE Diario
              </span>
              <span className="text-xl font-black text-white">{tdeeLive}</span>
              <span className="text-[10px] text-slate-400 block">kcal / día</span>
            </div>
            <div className="bg-[#090D14] border border-[#1F2937] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Gasto Basal (BMR)
              </span>
              <span className="text-xl font-black text-cyan-400">{basalLive}</span>
              <span className="text-[10px] text-slate-400 block">kcal mínimas</span>
            </div>
          </div>

          {/* Controles interactivos tipo stepper / slider */}
          <div className="space-y-3">
            {/* Altura */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Estatura</span>
                <span className="text-[#00F0A8] font-bold">{height} m</span>
              </div>
              <input
                type="range"
                min="1.40"
                max="2.10"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full accent-[#00F0A8] bg-[#090D14] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Peso */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Peso Corporal</span>
                <span className="text-cyan-400 font-bold">{weight} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="120"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-[#090D14] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Sexo Biológico */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sexo Biológico
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Femenino', 'Masculino'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      gender === g
                        ? 'bg-[#00F0A8] text-[#090D14] border-[#00F0A8]'
                        : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel de Actividad */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nivel de Actividad
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {['Sedentaria', 'Ligera 1-3d', 'Moderada 4d', 'Intensa 6-7d'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivityLevel(act)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition border ${
                      activityLevel === act
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Objetivo Nutricional */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Objetivo Nutricional
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {['Pérdida de grasa', 'Ganancia limpia', 'Mantenimiento', 'Rendimiento alto'].map((obj) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => setGoal(obj)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition border ${
                      goal === obj
                        ? 'bg-[#00F0A8]/20 text-[#00F0A8] border-[#00F0A8]'
                        : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                    }`}
                  >
                    ● {obj}
                  </button>
                ))}
              </div>
            </div>

            {/* Esquema Dietario */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Esquema Dietario
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {['Mediterránea', 'Alta en Proteína', 'Low-Carb', 'Flexitariana'].map((esq) => (
                  <button
                    key={esq}
                    type="button"
                    onClick={() => setDietScheme(esq)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition border ${
                      dietScheme === esq
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                    }`}
                  >
                    {esq}
                  </button>
                ))}
              </div>
            </div>

            {/* Exclusiones críticas activas */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Exclusiones Críticas Activas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exclusions.map((ex) => (
                  <span
                    key={ex}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold"
                  >
                    {ex}
                    <button
                      onClick={() => removeExclusion(ex)}
                      className="hover:text-rose-200 transition"
                      title="Remover exclusión"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Botón de Regeneración */}
          <div className="pt-2">
            <button
              onClick={handleRegeneratePlan}
              disabled={isRegenerating || isTyping}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00F0A8] to-[#10B981] hover:from-[#00F0A8]/90 hover:to-[#10B981]/90 text-[#090D14] font-black text-sm shadow-xl shadow-[#00F0A8]/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={17} className={isRegenerating ? 'animate-spin' : ''} />
              <span>{isRegenerating ? 'Recalibrando Algoritmo...' : 'Regenerar Plan NutriaBot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── PANEL DERECHO: ÁREA DE CHAT IA & PLAN DINÁMICO (7 cols) ─── */}
      <div className="lg:col-span-7 flex flex-col h-[780px] bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl">
        {/* Encabezado del Chat */}
        <div className="p-4 md:p-5 bg-[#0B0F19] border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0A8] to-cyan-500 p-[1.5px] shadow-md shadow-[#00F0A8]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#090D14] rounded-2xl flex items-center justify-center text-[#00F0A8]">
                  <Bot size={22} />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00F0A8] rounded-full border-2 border-[#0B0F19] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-extrabold text-white">
                  NutriaBot AI Bioadaptativo
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00F0A8]/10 text-[#00F0A8] border border-[#00F0A8]/30">
                  En línea
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modelo v4.2 Neural Nutrition · Sincronizado en tiempo real
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck size={16} className="text-[#00F0A8]" />
            <span>Filtro Médico Activo</span>
          </div>
        </div>

        {/* Banner de Error Dark Mode */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white p-1 rounded-lg hover:bg-red-900/30 transition shrink-0"
              title="Cerrar alerta"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end animate-in fade-in">
                  <div className="max-w-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl rounded-tr-sm p-4 text-slate-100 text-sm shadow-md">
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="text-[10px] text-slate-400 text-right mt-1.5 font-medium">
                      {msg.time} · Tú
                    </div>
                  </div>
                </div>
              );
            }

            // Mensaje de NutriaBot
            return (
              <div key={msg.id} className="flex gap-3 items-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-[#00F0A8]/15 border border-[#00F0A8]/30 flex items-center justify-center text-[#00F0A8] shrink-0 mt-1">
                  <Bot size={17} />
                </div>

                <div className="flex-1 max-w-2xl space-y-3">
                  {msg.greeting && (
                    <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 leading-relaxed space-y-2">
                      <p className="font-semibold text-white">{msg.greeting}</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{msg.analysis}</p>

                      {/* Badges de Macros Objetivo Calculados */}
                      {msg.macros && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Objetivos de Macros Diarios:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[#111827] border border-rose-500/30 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-rose-400 uppercase block">Proteínas</span>
                              <span className="text-base font-extrabold text-white">{msg.macros.protein.g}g</span>
                              <span className="text-[10px] text-slate-400 block">({msg.macros.protein.pct})</span>
                            </div>

                            <div className="bg-[#111827] border border-amber-500/30 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-amber-400 uppercase block">Carbohidratos</span>
                              <span className="text-base font-extrabold text-white">{msg.macros.carbs.g}g</span>
                              <span className="text-[10px] text-slate-400 block">({msg.macros.carbs.pct})</span>
                            </div>

                            <div className="bg-[#111827] border border-cyan-500/30 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase block">Grasas</span>
                              <span className="text-base font-extrabold text-white">{msg.macros.fats.g}g</span>
                              <span className="text-[10px] text-slate-400 block">({msg.macros.fats.pct})</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tag de Seguridad */}
                      {msg.safetyTag && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-[#00F0A8] flex items-center gap-2">
                          <ShieldCheck size={16} className="text-[#00F0A8] shrink-0" />
                          <span>{msg.safetyTag}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tarjeta embebida de Plan Diario Inteligente */}
                  {msg.plan && (
                    <div className="bg-[#090D14] border border-[#00F0A8]/30 rounded-2xl p-4 shadow-xl text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
                        <div className="font-extrabold text-white flex items-center gap-1.5 text-sm">
                          <Sparkles size={16} className="text-[#00F0A8]" />
                          {msg.plan.title}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#00F0A8] text-[#090D14] text-[10px] font-black">
                          {msg.plan.totalKcal} kcal
                        </span>
                      </div>

                      {/* Desglose de primera comida */}
                      <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl space-y-1.5">
                        <div className="font-bold text-[#00F0A8]">{msg.plan.firstMeal.name}</div>
                        <ul className="space-y-1 text-slate-300 pl-3 list-disc marker:text-[#00F0A8]">
                          {msg.plan.firstMeal.items.map((it, idx) => (
                            <li key={idx} className="leading-relaxed">{it}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Otras comidas del plan */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Comidas Siguientes:
                        </span>
                        {msg.plan.otherMeals.map((om, omIdx) => (
                          <div key={omIdx} className="p-2 rounded-lg bg-[#111827]/70 border border-[#1F2937]/50 text-slate-300">
                            <span className="font-bold text-white block">{om.name}</span>
                            <span className="text-slate-400 text-[11px]">{om.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje de texto estándar */}
                  {msg.text && (
                    <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 leading-relaxed shadow-sm whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    {msg.time} · NutriaBot Neural
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 items-center animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-[#00F0A8]/15 border border-[#00F0A8]/30 flex items-center justify-center text-[#00F0A8]">
                <Bot size={17} />
              </div>
              <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1">NutriaBot está computando macros...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div className="px-4 py-2 bg-[#0B0F19] border-t border-[#1F2937] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-[#00F0A8]" /> Sugerencias:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isTyping}
              className="px-3 py-1 rounded-full bg-[#111827] border border-[#1F2937] hover:border-[#00F0A8] text-xs font-semibold text-slate-300 hover:text-white shrink-0 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input de Chat Inferior */}
        <div className="p-4 bg-[#0B0F19] border-t border-[#1F2937]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Botón Adjuntar */}
            <button
              type="button"
              disabled={isTyping}
              onClick={() => onShowToast?.("Módulo de análisis de imágenes de platos bioactivo.")}
              className="p-2.5 rounded-xl bg-[#111827] border border-[#1F2937] text-slate-400 hover:text-white hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Adjuntar foto de comida para análisis de macros"
            >
              <Paperclip size={18} />
            </button>

            {/* Micrófono por voz */}
            <button
              type="button"
              disabled={isTyping}
              onClick={() => {
                setIsListening(!isListening);
                if (!isListening) {
                  onShowToast?.("🎙️ Escuchando audio para calibración de dieta...");
                  setTimeout(() => {
                    setInputMessage("Quiero sustituir el pescado de la cena por una fuente proteica equivalente");
                    setIsListening(false);
                  }, 2500);
                }
              }}
              className={`p-2.5 rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:text-white hover:border-slate-600'
              }`}
              title="Dictado por voz"
            >
              <Mic size={18} />
            </button>

            {/* Campo de entrada */}
            <input
              type="text"
              placeholder={isTyping ? "NutriaBot está respondiendo..." : isListening ? "Escuchando tu voz..." : "Escribe una consulta clínica a NutriaBot..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-[#111827] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-[#00F0A8] hover:bg-[#10B981] disabled:opacity-50 disabled:hover:bg-[#00F0A8] text-[#090D14] font-black transition shadow-lg shadow-[#00F0A8]/20 disabled:cursor-not-allowed"
            >
              <Send size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

