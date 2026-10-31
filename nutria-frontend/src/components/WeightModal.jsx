import React, { useState } from 'react';
import { X, Scale, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateWeight, validateHeight } from '../utils/validation';

export default function WeightModal({ isOpen, onClose, currentWeight, currentHeight, onSave }) {
  const [weight, setWeight] = useState(currentWeight || 63.8);
  const [height, setHeight] = useState(currentHeight || 168);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Cálculo de IMC: peso / (altura_m ^ 2)
  const heightM = (parseFloat(height) || 168) / 100;
  const imc = heightM > 0 ? ((parseFloat(weight) || 63.8) / (heightM * heightM)).toFixed(1) : 0;

  const getStatus = (val) => {
    if (val < 18.5) return { text: "Bajo Peso", color: "text-amber-400 border-amber-400/40 bg-amber-500/10" };
    if (val <= 24.9) return { text: "Saludable / Óptimo", color: "text-[#00F0A8] border-[#00F0A8]/40 bg-[#00F0A8]/10" };
    if (val <= 29.9) return { text: "Sobrepeso Leve", color: "text-amber-400 border-amber-400/40 bg-amber-500/10" };
    return { text: "Obesidad Clínica", color: "text-rose-400 border-rose-400/40 bg-rose-500/10" };
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

    setIsSaved(true);
    setTimeout(() => {
      onSave({ weight: weightCheck.value, height: heightCheck.value, imc: Number(imc) });
      setIsSaved(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl glow-cyan text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Scale size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Actualizar Biometría & IMC
            </h3>
            <p className="text-xs text-slate-400">Sincronización con el sensor metabólico</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Peso Corporal (kg)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] focus:ring-1 focus:ring-[#00F0A8] rounded-xl px-3 py-2.5 text-base font-semibold text-white outline-none transition"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">kg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Estatura (cm)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] focus:ring-1 focus:ring-[#00F0A8] rounded-xl px-3 py-2.5 text-base font-semibold text-white outline-none transition"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium">cm</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de preview IMC en tiempo real */}
          <div className="bg-[#090D14] border border-[#1F2937] rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                IMC Proyectado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-cyan-400">{imc}</span>
                <span className="text-xs text-slate-500">kg/m²</span>
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${status.color}`}>
              ● {status.text}
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
              disabled={isSaved}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00F0A8] to-[#10B981] hover:from-[#00F0A8]/90 hover:to-[#10B981]/90 text-[#090D14] text-sm font-bold shadow-lg shadow-[#00F0A8]/20 flex items-center justify-center gap-2 transition"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={16} /> Sincronizado
                </>
              ) : (
                <>
                  Guardar & Calibrar <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
