import React, { useState } from 'react';
import { X, Scale, Check, AlertCircle } from 'lucide-react';
import { validateWeight, validateHeight } from '../utils/validation';

export default function WeightModal({ isOpen, onClose, currentWeight, currentHeight, onSave }) {
  const [weight, setWeight] = useState(currentWeight || 63.8);
  const [height, setHeight] = useState(currentHeight || 168);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const heightM = (parseFloat(height) || 168) / 100;
  const imc = heightM > 0 ? ((parseFloat(weight) || 63.8) / (heightM * heightM)).toFixed(1) : 0;

  const getStatus = (val) => {
    if (val < 18.5) return { text: "Bajo Peso", color: "text-amber-500 border-amber-500/40 bg-amber-500/10" };
    if (val <= 24.9) return { text: "Rango Saludable", color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10" };
    if (val <= 29.9) return { text: "Sobrepeso Leve", color: "text-amber-500 border-amber-500/40 bg-amber-500/10" };
    return { text: "Rango Elevado", color: "text-rose-500 border-rose-500/40 bg-rose-500/10" };
  };

  const status = getStatus(imc);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const weightCheck = validateWeight(weight);
    if (!weightCheck.isValid) {
      setErrorMsg(weightCheck.error);
      return;
    }

    const heightCheck = validateHeight(height);
    if (!heightCheck.isValid) {
      setErrorMsg(heightCheck.error);
      return;
    }

    onSave({ weight: weightCheck.value, height: heightCheck.value, imc: Number(imc) });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-2xl text-[var(--text-primary)]">
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-sub)] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Scale size={22} />
          </div>
          <div>
            <h2 id="weight-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
              Actualizar Peso y Altura
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Mantén tus datos al día para calcular tus necesidades calóricas.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weight-input" className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Peso Actual (kg)
              </label>
              <input
                id="weight-input"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2.5 text-base font-bold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label htmlFor="height-input" className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Altura (cm)
              </label>
              <input
                id="height-input"
                type="number"
                step="1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2.5 text-base font-bold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-emerald-400"
                required
              />
            </div>
          </div>

          {/* Tarjeta de cálculo en vivo de IMC */}
          <div className="bg-[var(--chip-bg)] border border-[var(--chip-border)] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--text-secondary)] block">Tu IMC Calculado</span>
              <span className="text-2xl font-black text-[var(--text-primary)]">{imc} <span className="text-xs font-normal text-[var(--text-secondary)]">kg/m²</span></span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
              {status.text}
            </span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-card)] hover:bg-[var(--bg-card-sub)] text-[var(--text-primary)] text-sm font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-extrabold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <Check size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
