import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Trash2 } from 'lucide-react';

export default function AllergyModal({
  isOpen,
  onClose,
  allergies = [],
  onAddAllergy,
  onDeleteAllergy,
  onSaveAllergies
}) {
  const [nombre, setNombre] = useState('');
  const [reemplazos, setReemplazos] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) return;

    setIsSubmitting(true);
    const newAllergy = {
      nombre: cleanNombre,
      reemplazos: reemplazos.trim() || 'Alternativas saludables sugeridas por el asistente'
    };

    try {
      if (onAddAllergy) {
        await onAddAllergy(newAllergy);
      } else if (onSaveAllergies) {
        onSaveAllergies([...allergies, { id: Date.now(), ...newAllergy }]);
      }
      setNombre('');
      setReemplazos('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="allergy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-2xl text-[var(--text-primary)] max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-card)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 id="allergy-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                Alergias e Intolerancias
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Excluye alimentos de tus sugerencias nutricionales y recetas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-sub)] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* 1. Lista de Alergias Registradas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Exclusiones Activas ({allergies.length})
              </h3>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Sincronizadas con tu cuenta
              </span>
            </div>

            {allergies.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-card)] text-center text-xs text-[var(--text-secondary)]">
                No tienes alimentos excluidos registrados. Agrega los que desees evitar a continuación.
              </div>
            ) : (
              <div className="space-y-2">
                {allergies.map((item) => {
                  const id = item.id_alergia || item.id;
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-card)] hover:border-amber-500/40 transition group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {item.nombre}
                          </h4>
                        </div>
                        {item.reemplazos && (
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 pl-4 leading-relaxed line-clamp-2">
                            <strong className="text-[var(--text-primary)] font-semibold">Sustitutos:</strong> {item.reemplazos}
                          </p>
                        )}
                      </div>

                      {onDeleteAllergy && (
                        <button
                          type="button"
                          onClick={() => onDeleteAllergy(id, item.nombre)}
                          aria-label={`Eliminar exclusión ${item.nombre}`}
                          className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title="Eliminar exclusión"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Formulario para añadir nueva alergia */}
          <form onSubmit={handleSubmit} className="pt-3 border-t border-[var(--border-card)] space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              + Agregar Nueva Exclusión
            </h3>

            <div>
              <label htmlFor="allergy-name" className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Alimento o Ingrediente a Evitar *
              </label>
              <input
                id="allergy-name"
                type="text"
                placeholder="ej. Mariscos, Maní, Gluten, Lactosa..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label htmlFor="allergy-substitutes" className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Alimentos Sustitutos Favoritos (Opcional)
              </label>
              <input
                id="allergy-substitutes"
                type="text"
                placeholder="ej. Bebida de almendras, Tofu, Pechuga de pollo..."
                value={reemplazos}
                onChange={(e) => setReemplazos(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition"
            >
              <Plus size={14} /> {isSubmitting ? 'Guardando...' : 'Registrar Exclusión'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-card)] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl border border-[var(--border-card)] hover:bg-[var(--bg-card-sub)] text-[var(--text-primary)] text-xs font-bold transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
