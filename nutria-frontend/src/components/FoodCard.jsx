import React from 'react';
import { Flame, Check, Minus, Ban, Trash2, Shield } from 'lucide-react';

export default function FoodCard({ alimento, onPriorityChange, isAdmin, onDeleteFood }) {
  const {
    id_alimento,
    nombre,
    calorias,
    proteinas,
    carbohidratos,
    grasas,
    categoria_nombre,
    badge,
    prioridad = 'neutral',
    emoji = '🥗',
    detalles
  } = alimento;

  // Cálculo de porcentajes relativos de macros para la barrita visual
  const totalMacros = (Number(proteinas) + Number(carbohidratos) + Number(grasas)) || 1;
  const pPct = ((Number(proteinas) / totalMacros) * 100).toFixed(0);
  const cPct = ((Number(carbohidratos) / totalMacros) * 100).toFixed(0);
  const gPct = ((Number(grasas) / totalMacros) * 100).toFixed(0);

  const getPriorityBorder = () => {
    if (prioridad === 'priorizar') return 'border-[#00F0A8]/40 hover:border-[#00F0A8] glow-mint';
    if (prioridad === 'evitar') return 'border-rose-500/40 hover:border-rose-500 glow-crimson bg-rose-950/10';
    return 'border-[#1F2937] hover:border-slate-600';
  };

  return (
    <div
      className={`bg-[#111827] border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group relative ${getPriorityBorder()}`}
    >
      <div>
        {/* Cabecera de la card: Categoría & Badge de recomendación */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#090D14] border border-[#1F2937] text-slate-400">
            {categoria_nombre || "General"}
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide truncate max-w-[140px] ${
                prioridad === 'evitar'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-[#00F0A8]/10 text-[#00F0A8] border-[#00F0A8]/30'
              }`}
            >
              {badge || "Bio-Optimizado"}
            </span>

            {/* Acción de eliminación exclusiva para Administrador */}
            {isAdmin && onDeleteFood && (
              <button
                type="button"
                onClick={() => onDeleteFood(id_alimento, nombre)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Eliminar alimento del catálogo (Acción de Admin)"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Nombre y emoji */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#090D14] border border-[#1F2937] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
            {emoji}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#00F0A8] transition-colors leading-tight">
              {nombre}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
              <Flame size={13} className="text-amber-400" />
              <span className="font-extrabold text-white text-sm">{calorias}</span>
              <span className="text-[11px] text-slate-400">kcal / 100g</span>
            </div>
          </div>
        </div>

        {detalles && (
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {detalles}
          </p>
        )}

        {/* Barra proporcional de macros */}
        <div className="space-y-1.5 mb-4">
          <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden flex">
            <div style={{ width: `${pPct}%` }} className="bg-rose-500 h-full" title={`Proteína: ${proteinas}g`} />
            <div style={{ width: `${cPct}%` }} className="bg-amber-400 h-full" title={`Carbos: ${carbohidratos}g`} />
            <div style={{ width: `${gPct}%` }} className="bg-cyan-400 h-full" title={`Grasas: ${grasas}g`} />
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1 border-t border-[#1F2937]/50">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Prot</span>
              <span className="font-bold text-rose-400">{proteinas}g</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Carb</span>
              <span className="font-bold text-amber-400">{carbohidratos}g</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Grasa</span>
              <span className="font-bold text-cyan-400">{grasas}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control de Prioridad de IA (Preferencia individual) */}
      <div className="pt-2 border-t border-[#1F2937]">
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
          <span>Prioridad de IA</span>
          <span className="text-[#00F0A8]">
            {prioridad === 'priorizar' ? '★ Priorizado' : prioridad === 'evitar' ? '✖ Bloqueado' : '● Neutral'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-[#090D14] p-1 rounded-xl border border-[#1F2937]">
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'priorizar')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
              prioridad === 'priorizar'
                ? 'bg-[#00F0A8] text-[#090D14] shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Check size={11} strokeWidth={3} /> Priorizar
          </button>

          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'neutral')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition flex items-center justify-center gap-1 ${
              prioridad === 'neutral'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Minus size={11} /> Neutral
          </button>

          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'evitar')}
            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
              prioridad === 'evitar'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
          >
            <Ban size={11} /> Evitar
          </button>
        </div>
      </div>
    </div>
  );
}
