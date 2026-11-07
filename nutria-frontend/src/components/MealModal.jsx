import React, { useState } from 'react';
import { X, Utensils, Plus, Trash2, Calculator, Sparkles, Check } from 'lucide-react';

export default function MealModal({ isOpen, onClose, onAddMeal }) {
  const [tipo, setTipo] = useState('Almuerzo');
  const [nombrePlato, setNombrePlato] = useState('');
  
  // Lista dinámica de alimentos que componen esta comida
  const [items, setItems] = useState([
    { id: 1, nombre: '', porcion: '100g', p: '', c: '', g: '' }
  ]);

  if (!isOpen) return null;

  // Presets rápidos y sencillos para ahorrar tiempo
  const quickPresets = [
    {
      label: "Desayuno con Huevos y Avena",
      tipo: "Desayuno",
      nombre: "Huevos revueltos y avena con fruta",
      items: [
        { id: 1, nombre: "Huevos revueltos con espinacas", porcion: "2 unidades", p: 14, c: 2, g: 10 },
        { id: 2, nombre: "Avena cocida con manzana", porcion: "1 taza", p: 6, c: 32, g: 3 }
      ]
    },
    {
      label: "Pollo con Arroz y Ensalada",
      tipo: "Almuerzo",
      nombre: "Pechuga de pollo con arroz integral y verduras",
      items: [
        { id: 1, nombre: "Pechuga de pollo a la plancha", porcion: "150g", p: 40, c: 0, g: 4 },
        { id: 2, nombre: "Arroz integral cocido", porcion: "1 taza", p: 5, c: 45, g: 2 },
        { id: 3, nombre: "Ensalada verde con aceite de oliva", porcion: "Plato hondo", p: 1, c: 5, g: 7 }
      ]
    },
    {
      label: "Yogur con Fruta y Nueces",
      tipo: "Merienda",
      nombre: "Yogur natural con frutos rojos",
      items: [
        { id: 1, nombre: "Yogur natural o vegetal", porcion: "1 vaso (200g)", p: 10, c: 12, g: 4 },
        { id: 2, nombre: "Frutos rojos y nueces", porcion: "1 puñado", p: 4, c: 10, g: 9 }
      ]
    }
  ];

  const handleApplyPreset = (preset) => {
    setTipo(preset.tipo);
    setNombrePlato(preset.nombre);
    setItems(preset.items.map((it, idx) => ({ ...it, id: Date.now() + idx })));
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), nombre: '', porcion: '100g', p: '', c: '', g: '' }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        return { ...it, [field]: value };
      }
      return it;
    }));
  };

  // Cálculo automático acumulado de macronutrientes
  const totalProteinas = items.reduce((acc, it) => acc + (parseFloat(it.p) || 0), 0);
  const totalCarbos = items.reduce((acc, it) => acc + (parseFloat(it.c) || 0), 0);
  const totalGrasas = items.reduce((acc, it) => acc + (parseFloat(it.g) || 0), 0);

  // FÓRMULA ESTÁNDAR: (Proteínas * 4) + (Carbohidratos * 4) + (Grasas * 9)
  const caloriasCalculadas = Math.round(
    (totalProteinas * 4) + (totalCarbos * 4) + (totalGrasas * 9)
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const alimentosValidos = items.filter(it => it.nombre.trim());
    const tituloFinal = nombrePlato.trim() || (
      alimentosValidos.length > 0
        ? alimentosValidos.map(a => a.nombre).join(' + ')
        : `${tipo} saludable`
    );

    const mealData = {
      id: Date.now(),
      tipo,
      nombre: tituloFinal,
      items: alimentosValidos.map(it => ({
        nombre: it.nombre.trim(),
        porcion: it.porcion.trim() || '1 porción',
        p: parseFloat(it.p) || 0,
        c: parseFloat(it.c) || 0,
        g: parseFloat(it.g) || 0
      })),
      calorias: caloriasCalculadas,
      proteinas: Math.round(totalProteinas * 10) / 10,
      carbohidratos: Math.round(totalCarbos * 10) / 10,
      grasas: Math.round(totalGrasas * 10) / 10,
      completado: true,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddMeal(mealData);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[#0F1715] border border-[#1F332A] rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#16231E] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X size={20} />
        </button>

        {/* Encabezado limpio */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Utensils size={22} />
          </div>
          <div>
            <h2 id="meal-modal-title" className="text-xl font-bold text-white">
              Registrar Comida
            </h2>
            <p className="text-xs text-slate-400">
              Agrega los alimentos consumidos; las calorías se calculan automáticamente.
            </p>
          </div>
        </div>

        {/* Opciones rápidas */}
        <div className="mb-5 bg-[#13221C] border border-[#1F332A] rounded-2xl p-3.5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Sparkles size={14} /> Sugerencias rápidas:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left p-2.5 rounded-xl bg-[#0F1715] border border-[#1F332A] hover:border-emerald-500/60 transition text-xs group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                  {p.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {p.tipo}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Momento del día y Título */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="meal-tipo" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Momento del día
              </label>
              <select
                id="meal-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Merienda">Merienda / Snack</option>
                <option value="Cena">Cena</option>
                <option value="Colación">Colación extra</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meal-nombre" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre general de la comida
              </label>
              <input
                id="meal-nombre"
                type="text"
                placeholder="ej. Almuerzo balanceado con pollo y arroz"
                value={nombrePlato}
                onChange={(e) => setNombrePlato(e.target.value)}
                className="w-full bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Sección dinámica de alimentos que componen la comida */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Alimentos e Ingredientes en esta comida
              </label>
              <span className="text-[11px] text-slate-400">
                {items.length} {items.length === 1 ? 'alimento' : 'alimentos'}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-[#13221C] border border-[#1F332A] rounded-2xl p-3.5 space-y-2.5 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400">
                      Alimento #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Eliminar alimento ${index + 1}`}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Nombre (ej. Pechuga de pollo, Quinoa)"
                        value={item.nombre}
                        onChange={(e) => handleUpdateItem(item.id, 'nombre', e.target.value)}
                        className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        required={index === 0}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Porción (ej. 150g)"
                        value={item.porcion}
                        onChange={(e) => handleUpdateItem(item.id, 'porcion', e.target.value)}
                        className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Macronutrientes por alimento */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-300 mb-1">
                        Proteína (g)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={item.p}
                        onChange={(e) => handleUpdateItem(item.id, 'p', e.target.value)}
                        className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-emerald-300 mb-1">
                        Carbohidratos (g)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={item.c}
                        onChange={(e) => handleUpdateItem(item.id, 'c', e.target.value)}
                        className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-yellow-300 mb-1">
                        Grasas (g)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={item.g}
                        onChange={(e) => handleUpdateItem(item.id, 'g', e.target.value)}
                        className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-yellow-400 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para agregar más alimentos a la comida */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/5 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Plus size={15} /> + Agregar otro alimento a esta comida
            </button>
          </div>

          {/* Tarjeta de Cálculo Automático de Calorías (No editable manualmente) */}
          <div className="bg-[#162520] border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Calculator size={15} /> Calorías calculadas automáticamente:
              </span>
              <span className="text-2xl font-black text-white">
                {caloriasCalculadas} <span className="text-xs font-normal text-slate-300">kcal</span>
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Fórmula nutricional: ({totalProteinas.toFixed(1)}g Proteína × 4) + ({totalCarbos.toFixed(1)}g Carbos × 4) + ({totalGrasas.toFixed(1)}g Grasas × 9)
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#1F332A] text-center">
              <div>
                <span className="text-[10px] text-amber-300 font-semibold block">Proteínas totales</span>
                <span className="text-sm font-bold text-white">{totalProteinas.toFixed(1)} g</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 font-semibold block">Carbos totales</span>
                <span className="text-sm font-bold text-white">{totalCarbos.toFixed(1)} g</span>
              </div>
              <div>
                <span className="text-[10px] text-yellow-300 font-semibold block">Grasas totales</span>
                <span className="text-sm font-bold text-white">{totalGrasas.toFixed(1)} g</span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-[#16231E] text-slate-300 text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <Check size={18} /> Guardar Comida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
