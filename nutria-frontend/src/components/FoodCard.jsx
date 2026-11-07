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

  const totalMacros = (Number(proteinas) + Number(carbohidratos) + Number(grasas)) || 1;
  const pPct = ((Number(proteinas) / totalMacros) * 100).toFixed(0);
  const cPct = ((Number(carbohidratos) / totalMacros) * 100).toFixed(0);
  const gPct = ((Number(grasas) / totalMacros) * 100).toFixed(0);

  const getPriorityBorder = () => {
    if (prioridad === 'priorizar') return 'border-emerald-500 shadow-sm shadow-emerald-500/10';
    if (prioridad === 'evitar') return 'border-rose-500/50 bg-rose-500/5';
    return 'border-[var(--border-card)] hover:border-emerald-500/50';
  };

  return (
    <div
      className={`bg-[var(--bg-card)] border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 group relative shadow-sm ${getPriorityBorder()}`}
    >
      <div>
        {/* Cabecera: Categoría & Acciones */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-xl bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[var(--chip-text)]">
            {categoria_nombre || "Alimento"}
          </span>

          <div className="flex items-center gap-1.5">
            {isAdmin && onDeleteFood && (
              <button
                type="button"
                onClick={() => onDeleteFood(id_alimento, nombre)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                title="Eliminar alimento del catálogo"
                aria-label="Eliminar alimento"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Nombre y emoji */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-card)] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            {emoji}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
              {nombre}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Flame size={13} className="text-amber-500 shrink-0" />
              <span className="font-extrabold text-[var(--text-primary)] text-sm">{calorias}</span>
              <span className="text-[11px] text-[var(--text-secondary)]">kcal / 100g</span>
            </div>
          </div>
        </div>

        {detalles && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
            {detalles}
          </p>
        )}

        {/* Barra proporcional de macros */}
        <div className="space-y-1.5 mb-4">
          <div className="h-2 w-full bg-[var(--bg-card-sub)] rounded-full overflow-hidden flex border border-[var(--border-card)]">
            <div style={{ width: `${pPct}%` }} className="bg-amber-400 h-full" title={`Proteína: ${proteinas}g`} />
            <div style={{ width: `${cPct}%` }} className="bg-emerald-500 h-full" title={`Carbos: ${carbohidratos}g`} />
            <div style={{ width: `${gPct}%` }} className="bg-yellow-400 h-full" title={`Grasas: ${grasas}g`} />
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1.5 border-t border-[var(--border-card)]">
            <div>
              <span className="text-amber-500 dark:text-amber-300 block text-[10px] uppercase font-bold">Prot</span>
              <span className="font-extrabold text-[var(--text-primary)] text-xs">{proteinas}g</span>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-300 block text-[10px] uppercase font-bold">Carb</span>
              <span className="font-extrabold text-[var(--text-primary)] text-xs">{carbohidratos}g</span>
            </div>
            <div>
              <span className="text-yellow-600 dark:text-yellow-300 block text-[10px] uppercase font-bold">Grasa</span>
              <span className="font-extrabold text-[var(--text-primary)] text-xs">{grasas}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de preferencia rápida */}
      <div className="pt-2.5 border-t border-[var(--border-card)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-secondary)] font-medium">Preferencia:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'priorizar')}
            aria-label="Priorizar este alimento"
            className={`p-1.5 rounded-xl text-xs transition ${
              prioridad === 'priorizar'
                ? 'bg-emerald-500 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-sub)]'
            }`}
            title="Priorizar en mis comidas"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'neutral')}
            aria-label="Preferencia normal"
            className={`p-1.5 rounded-xl text-xs transition ${
              prioridad === 'neutral'
                ? 'bg-[var(--bg-card-sub)] text-[var(--text-primary)] font-bold border border-[var(--border-card)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-sub)]'
            }`}
            title="Preferencia normal"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => onPriorityChange(id_alimento, 'evitar')}
            aria-label="Evitar este alimento"
            className={`p-1.5 rounded-xl text-xs transition ${
              prioridad === 'evitar'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-sub)]'
            }`}
            title="Evitar en mis comidas"
          >
            <Ban size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
