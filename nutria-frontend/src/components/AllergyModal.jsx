import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Check } from 'lucide-react';

export default function AllergyModal({ isOpen, onClose, onAddAllergy, allergies = [], onSaveAllergies }) {
  const [nombre, setNombre] = useState('');
  const [reemplazos, setReemplazos] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const newAllergy = {
      id: Date.now(),
      nombre: nombre.trim(),
      reemplazos: reemplazos.trim() || "Alternativas saludables sugeridas por el asistente"
    };

    if (onAddAllergy) {
      onAddAllergy(newAllergy);
    } else if (onSaveAllergies) {
      onSaveAllergies([...allergies, newAllergy]);
    }

    setNombre('');
    setReemplazos('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="allergy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#0F1715] border border-[#1F332A] rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#16231E] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 id="allergy-modal-title" className="text-lg font-bold text-white">
              Alergias e Intolerancias
            </h2>
            <p className="text-xs text-slate-400">
              Indica qué alimentos debes evitar en tus sugerencias y recetas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="allergy-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alimento a Evitar
            </label>
            <input
              id="allergy-name"
              type="text"
              placeholder="ej. Gluten, Mariscos, Lactosa, Maní"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
              required
            />
          </div>

          <div>
            <label htmlFor="allergy-substitutes" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alimentos Sustitutos Favoritos (Opcional)
            </label>
            <input
              id="allergy-substitutes"
              type="text"
              placeholder="ej. Leche de avena, Pechuga de pollo, Tofu"
              value={reemplazos}
              onChange={(e) => setReemplazos(e.target.value)}
              className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-[#16231E] text-slate-300 text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <Check size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
