import React, { useState } from 'react';
import { X, Apple, Plus, AlertCircle } from 'lucide-react';
import { validateFoodData } from '../utils/validation';

export default function FoodModal({ isOpen, onClose, onAddFood }) {
  const [nombre, setNombre] = useState('');
  const [calorias, setCalorias] = useState('');
  const [proteinas, setProteinas] = useState('');
  const [carbohidratos, setCarbohidratos] = useState('');
  const [grasas, setGrasas] = useState('');
  const [idCategoria, setIdCategoria] = useState(1);
  const [badge, setBadge] = useState('Personalizado');
  const [prioridad, setPrioridad] = useState('priorizar');
  const [emoji, setEmoji] = useState('🥗');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const categorias = [
    { id: 1, nombre: "Proteínas", emoji: "🍗" },
    { id: 2, nombre: "Carbohidratos Complejos", emoji: "🌾" },
    { id: 3, nombre: "Grasas Saludables", emoji: "🥑" },
    { id: 4, nombre: "Bebidas & Vegetales", emoji: "🥤" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = validateFoodData({
      nombre,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      id_categoria: idCategoria
    });

    if (!validation.isValid) {
      setErrorMsg(validation.error);
      return;
    }

    const catObj = categorias.find(c => c.id === Number(idCategoria));

    onAddFood({
      nombre: validation.value.nombre,
      calorias: validation.value.calorias,
      proteinas: validation.value.proteinas,
      carbohidratos: validation.value.carbohidratos,
      grasas: validation.value.grasas,
      id_categoria: validation.value.id_categoria,
      categoria_nombre: catObj ? catObj.nombre : "Proteínas",
      badge: badge.trim() || "Añadido por Admin",
      prioridad,
      emoji: emoji.trim() || (catObj ? catObj.emoji : "🥗"),
      detalles: `Calibrado para ${catObj ? catObj.nombre : 'nutrición'} con ${validation.value.calorias} kcal.`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl glow-mint text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00F0A8]">
            <Apple size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Añadir Alimento a la Base Clínica
            </h3>
            <p className="text-xs text-slate-400">Campos sincronizados con la API REST (/api/alimentos)</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nombre del Alimento
              </label>
              <input
                type="text"
                placeholder="ej. Tofu Firme Orgánico"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Emoji / Ícono
              </label>
              <input
                type="text"
                maxLength={4}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full text-center bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-lg text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Categoría Nutricional
              </label>
              <select
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Energía (kcal / 100g)
              </label>
              <input
                type="number"
                placeholder="140"
                value={calorias}
                onChange={(e) => setCalorias(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>
          </div>

          {/* Macros por cada 100g */}
          <div className="bg-[#090D14] border border-[#1F2937] rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Macronutrientes por cada 100g:
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                  Proteínas (g)
                </label>
                <input
                  type="text"
                  placeholder="15.0"
                  value={proteinas}
                  onChange={(e) => setProteinas(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2937] focus:border-rose-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Carbos (g)
                </label>
                <input
                  type="text"
                  placeholder="3.5"
                  value={carbohidratos}
                  onChange={(e) => setCarbohidratos(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2937] focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                  Grasas (g)
                </label>
                <input
                  type="text"
                  placeholder="8.0"
                  value={grasas}
                  onChange={(e) => setGrasas(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Badge / Etiqueta Clínica
              </label>
              <input
                type="text"
                placeholder="ej. Alto en Calcio Bioactivo"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Prioridad Algorítmica IA
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="priorizar">Priorizar en Dietas</option>
                <option value="neutral">Neutral</option>
                <option value="evitar">Evitar / Bloquear</option>
              </select>
            </div>
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00F0A8] to-[#10B981] hover:from-[#00F0A8]/90 hover:to-[#10B981]/90 text-[#090D14] text-sm font-bold shadow-lg shadow-[#00F0A8]/20 flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} /> Guardar Alimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
