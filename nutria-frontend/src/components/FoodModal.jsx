import React, { useState } from 'react';
import { X, Apple, Plus, AlertCircle, Calculator } from 'lucide-react';

export default function FoodModal({ isOpen, onClose, onAddFood }) {
  const [nombre, setNombre] = useState('');
  const [proteinas, setProteinas] = useState('');
  const [carbohidratos, setCarbohidratos] = useState('');
  const [grasas, setGrasas] = useState('');
  const [idCategoria, setIdCategoria] = useState(1);
  const [emoji, setEmoji] = useState('🥗');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const categorias = [
    { id: 1, nombre: "Proteínas", emoji: "🍗" },
    { id: 2, nombre: "Carbohidratos", emoji: "🌾" },
    { id: 3, nombre: "Grasas Saludables", emoji: "🥑" },
    { id: 4, nombre: "Frutas y Verduras", emoji: "🥦" },
    { id: 5, nombre: "Bebidas", emoji: "🥤" },
  ];

  // Cálculo automático de calorías por 100g
  const pNum = parseFloat(proteinas) || 0;
  const cNum = parseFloat(carbohidratos) || 0;
  const gNum = parseFloat(grasas) || 0;
  const caloriasCalculadas = Math.round((pNum * 4) + (cNum * 4) + (gNum * 9));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa el nombre del alimento.');
      return;
    }

    if (pNum < 0 || cNum < 0 || gNum < 0) {
      setErrorMsg('Los macronutrientes deben ser valores positivos.');
      return;
    }

    const catObj = categorias.find(c => c.id === Number(idCategoria));

    onAddFood({
      nombre: nombre.trim(),
      calorias: caloriasCalculadas,
      proteinas: pNum,
      carbohidratos: cNum,
      grasas: gNum,
      id_categoria: Number(idCategoria),
      categoria_nombre: catObj ? catObj.nombre : "Proteínas",
      emoji: emoji.trim() || (catObj ? catObj.emoji : "🥗"),
      detalles: `Porción de 100g: ${caloriasCalculadas} kcal (${pNum}g P, ${cNum}g C, ${gNum}g G).`
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#0F1715] border border-[#1F332A] rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#16231E] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Apple size={22} />
          </div>
          <div>
            <h2 id="food-modal-title" className="text-lg font-bold text-white">
              Añadir Alimento al Catálogo
            </h2>
            <p className="text-xs text-slate-400">
              Registra un alimento; las calorías se calculan en base a sus nutrientes.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label htmlFor="food-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Alimento
              </label>
              <input
                id="food-name"
                type="text"
                placeholder="ej. Tofu Firme, Pechuga de Pavo, Avena"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label htmlFor="food-emoji" className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                Ícono
              </label>
              <input
                id="food-emoji"
                type="text"
                maxLength={4}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full text-center bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2 text-lg text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="food-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoría
            </label>
            <select
              id="food-category"
              value={idCategoria}
              onChange={(e) => setIdCategoria(e.target.value)}
              className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Macronutrientes por cada 100g */}
          <div className="bg-[#13221C] border border-[#1F332A] rounded-2xl p-4 space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Macronutrientes (por cada 100g):
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="food-p" className="block text-xs font-semibold text-amber-300 mb-1">
                  Proteínas (g)
                </label>
                <input
                  id="food-p"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={proteinas}
                  onChange={(e) => setProteinas(e.target.value)}
                  className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="food-c" className="block text-xs font-semibold text-emerald-300 mb-1">
                  Carbohidratos (g)
                </label>
                <input
                  id="food-c"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={carbohidratos}
                  onChange={(e) => setCarbohidratos(e.target.value)}
                  className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="food-g" className="block text-xs font-semibold text-yellow-300 mb-1">
                  Grasas (g)
                </label>
                <input
                  id="food-g"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={grasas}
                  onChange={(e) => setGrasas(e.target.value)}
                  className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-yellow-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Campo de Calorías calculado automáticamente */}
          <div className="bg-[#162520] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Calculator size={15} /> Calorías calculadas automáticamente:
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ({pNum}g × 4) + ({cNum}g × 4) + ({gNum}g × 9)
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{caloriasCalculadas}</span>
              <span className="text-xs text-slate-300 ml-1">kcal / 100g</span>
            </div>
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} /> Guardar Alimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
