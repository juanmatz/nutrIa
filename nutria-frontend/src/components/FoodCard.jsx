import React from 'react';
import { Flame, Check, Minus, Ban, Trash2 } from 'lucide-react';

export default function FoodCard({ alimento, onPriorityChange, isAdmin, onDeleteFood }) {
  const {
    id_alimento,
    nombre,
    calorias,
    proteinas,
    carbohidratos,
    grasas,
    categoria_nombre,
    prioridad = 'neutral',
    emoji = '🥗',
    detalles
  } = alimento;

  // Cálculo de porcentajes relativos de macros para la barra visual
  const totalMacros = (Number(proteinas) + Number(carbohidratos) + Number(grasas)) || 1;
  const pPct = ((Number(proteinas) / totalMacros) * 100).toFixed(0);
  const cPct = ((Number(carbohidratos) / totalMacros) * 100).toFixed(0);
  const gPct = ((Number(grasas) / totalMacros) * 100).toFixed(0);

  const getPriorityBorder = () => {
    if (prioridad === 'priorizar') return 'border-emerald-500/50 hover:border-emerald-400';
    if (prioridad === 'evitar') return 'border-rose-500/40 hover:border-rose-500 bg-rose-950/10';
    return 'border-[#1F332A] hover:border-emerald-500/30';
  };

  return (
    <div
      className={`bg-[#121C18] border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group relative ${getPriorityBorder()}`}
    >
      <div>
        {/* Cabecera de la card: Categoría & Acciones */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#0F1715] border border-[#1F332A] text-emerald-300">
            {categoria_nombre || "Alimento"}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Acción de eliminación exclusiva para Administrador */}
            {isAdmin && onDeleteFood && (
              <button
                type="button"
                onClick={() => onDeleteFood(id_alimento, nombre)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Eliminar alimento del catálogo (Acción de Admin)"
                aria-label="Eliminar alimento"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Nombre y emoji */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F1715] border border-[#1F332A] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
            {emoji}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
              {nombre}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
              <Flame size={13} className="text-emerald-400" />
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
          <div className="h-1.5 w-full bg-[#0F1715] rounded-full overflow-hidden flex border border-[#1F332A]">
            <div style={{ width: `${pPct}%` }} className="bg-amber-400 h-full" title={`Proteína: ${proteinas}g`} />
            <div style={{ width: `${cPct}%` }} className="bg-emerald-400 h-full" title={`Carbos: ${carbohidratos}g`} />
            <div style={{ width: `${gPct}%` }} className="bg-yellow-400 h-full" title={`Grasas: ${grasas}g`} />
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1 border-t border-[#1F332A]">
            <div>
              <span className="text-amber-300 block text-[9px] uppercase font-semibold">Prot</span>
              <span className="font-bold text-white text-xs">{proteinas}g</span>
            </div>
            <div>
              <span className="text-emerald-300 block text-[9px] uppercase font-semibold">Carb</span>
              <span className="font-bold text-white text-xs">{carbohidratos}g</span>
            </div>
            <div>
              <span className="text-yellow-300 block text-[9px] uppercase font-semibold">Grasa</span>
              <span className="font-bold text-white text-xs">{grasas}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de preferencia rápida */}
      <div className="pt-2 border-t border-[#1F332A] flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">Preferencia:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'priorizar')}
            aria-label="Priorizar este alimento"
            className={`p-1.5 rounded-lg text-xs transition ${
              prioridad === 'priorizar'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#16231E]'
            }`}
            title="Priorizar en mis comidas"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'neutral')}
            aria-label="Preferencia neutral"
            className={`p-1.5 rounded-lg text-xs transition ${
              prioridad === 'neutral'
                ? 'bg-slate-700/40 text-slate-200 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#16231E]'
            }`}
            title="Preferencia normal"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'evitar')}
            aria-label="Evitar este alimento"
            className={`p-1.5 rounded-lg text-xs transition ${
              prioridad === 'evitar'
                ? 'bg-rose-500/20 text-rose-400 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#16231E]'
            }`}
            title="Evitar en mis planes"
          >
            <Ban size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
