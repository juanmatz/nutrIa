import React, { useState } from 'react';
import { X, ShieldAlert, Plus } from 'lucide-react';

export default function AllergyModal({ isOpen, onClose, onAddAllergy }) {
  const [nombre, setNombre] = useState('');
  const [severidad, setSeveridad] = useState('ALTA');
  const [reemplazos, setReemplazos] = useState('');
  const [nota, setNota] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onAddAllergy({
      id: Date.now(),
      nombre: nombre.trim(),
      severidad,
      reemplazos: reemplazos.trim() || "Sustitutos validados por IA",
      nota: nota.trim() || "Exclusión inmunológica activa"
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border border-rose-500/30 rounded-2xl p-6 shadow-2xl glow-crimson text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Añadir Restricción Clínica
            </h3>
            <p className="text-xs text-slate-400">Configuración de bloqueo de seguridad inmunológica</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Alérgeno o Sensibilidad Médica
            </label>
            <input
              type="text"
              placeholder="ej. Gluten / Trigo, Soja, Sulfitos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-rose-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Severidad Inmunológica
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeveridad('ALTA')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  severidad === 'ALTA'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-[#090D14] border-[#1F2937] text-slate-400'
                }`}
              >
                ● ALTA (Exclusión Total)
              </button>
              <button
                type="button"
                onClick={() => setSeveridad('MODERADA')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  severidad === 'MODERADA'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-[#090D14] border-[#1F2937] text-slate-400'
                }`}
              >
                ● MODERADA (Sustituible)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Reemplazos Activos Sugeridos por IA
            </label>
            <input
              type="text"
              placeholder="ej. Harina de almendra, fécula de tapioca"
              value={reemplazos}
              onChange={(e) => setReemplazos(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nota Clínica / Justificación
            </label>
            <input
              type="text"
              placeholder="ej. Diagnóstico de intolerancia por prueba de hidrógeno espirado"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} /> Activar Restricción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
