import React, { useState } from 'react';
import { X, Utensils, Plus, Sparkles } from 'lucide-react';

export default function MealModal({ isOpen, onClose, onAddMeal }) {
  const [tipo, setTipo] = useState('Almuerzo');
  const [nombre, setNombre] = useState('');
  const [calorias, setCalorias] = useState('');
  const [proteinas, setProteinas] = useState('');
  const [carbohidratos, setCarbohidratos] = useState('');
  const [grasas, setGrasas] = useState('');
  const [badges, setBadges] = useState('Sin Lactosa, Hipertrofia');

  if (!isOpen) return null;

  const quickPresets = [
    { label: "Shake Proteico Aislado", tipo: "Merienda", cal: 180, p: 32, c: 4, g: 2, badge: "Cero Lactosa, Rápida Absorción" },
    { label: "Pechuga & Batata Asada", tipo: "Almuerzo", cal: 480, p: 46, c: 52, g: 8, badge: "Libre de Gluten, Magro" },
    { label: "Tortilla de Claras & Aguacate", tipo: "Desayuno", cal: 340, p: 28, c: 12, g: 18, badge: "Keto Friendly, Grasas Buenas" },
  ];

  const handleApplyPreset = (p) => {
    setTipo(p.tipo);
    setNombre(p.label);
    setCalorias(p.cal);
    setProteinas(p.p);
    setCarbohidratos(p.c);
    setGrasas(p.g);
    setBadges(p.badge);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onAddMeal({
      id: Date.now(),
      tipo,
      nombre,
      calorias: Number(calorias) || 0,
      proteinas: Number(proteinas) || 0,
      carbohidratos: Number(carbohidratos) || 0,
      grasas: Number(grasas) || 0,
      badges: badges.split(',').map(b => b.trim()).filter(Boolean),
      completado: true,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-2xl glow-mint text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#00F0A8]/15 border border-[#00F0A8]/30 flex items-center justify-center text-[#00F0A8]">
            <Utensils size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Registrar Comida & Macros
            </h3>
            <p className="text-xs text-slate-400">Ingreso bio-metabólico para el balance diario</p>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#00F0A8]" /> Presets Rápidos de NutriaBot:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left p-2.5 rounded-xl bg-[#090D14] border border-[#1F2937] hover:border-[#00F0A8]/60 transition text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-[#00F0A8] truncate">{p.label}</div>
                <div className="text-[11px] text-slate-400 mt-1">{p.cal} kcal · {p.p}g P</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Momento / Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Merienda">Merienda</option>
                <option value="Cena">Cena</option>
                <option value="Snack Post-Entreno">Snack Post-Entreno</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Calorías Totales (kcal)
              </label>
              <input
                type="number"
                placeholder="ej. 450"
                value={calorias}
                onChange={(e) => setCalorias(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descripción de la Comida / Plato
            </label>
            <input
              type="text"
              placeholder="ej. Salmón a la plancha con puré de calabaza"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                Proteínas (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="35"
                value={proteinas}
                onChange={(e) => setProteinas(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-rose-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Carbos (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="40"
                value={carbohidratos}
                onChange={(e) => setCarbohidratos(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                Grasas (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="12"
                value={grasas}
                onChange={(e) => setGrasas(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-cyan-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Etiquetas Clínicas / Atributos (Separadas por comas)
            </label>
            <input
              type="text"
              placeholder="Libre de Gluten, Sin Lactosa, Rico en Omega 3"
              value={badges}
              onChange={(e) => setBadges(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#00F0A8] hover:bg-[#10B981] text-[#090D14] text-sm font-bold shadow-lg shadow-[#00F0A8]/20 flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} /> Registrar en Timeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

