import React from 'react';
import { X, Eye, Type, Sun, Moon } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityModal({ isOpen, onClose }) {
  const { settings, updateSetting } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-2xl text-[var(--text-primary)] transition-colors">
        <button
          onClick={onClose}
          aria-label="Cerrar panel de accesibilidad"
          className="absolute top-5 right-5 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-sub)] transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Eye size={22} />
          </div>
          <div>
            <h2 id="accessibility-title" className="text-xl font-bold text-[var(--text-primary)]">
              Opciones de Accesibilidad y Lectura
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Personaliza el tamaño del texto, contraste y estilo visual según tus necesidades.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Tamaño del texto */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Type size={15} /> Tamaño de Letra
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'normal', label: 'Normal', preview: '100%' },
                { id: 'large', label: 'Grande', preview: '115%' },
                { id: 'xlarge', label: 'Muy Grande', preview: '130%' }
              ].map(opt => {
                const isActive = settings.fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('fontSize', opt.id)}
                    className={`py-3 px-3 rounded-2xl border text-center transition ${
                      isActive
                        ? 'bg-emerald-500 text-white font-extrabold border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-[var(--bg-card-sub)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{opt.preview}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tema Visual (Claro / Oscuro Saludable) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Sun size={15} /> Modo de Color
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting('theme', 'healthy-dark')}
                className={`py-3 px-4 rounded-2xl border flex items-center gap-3 transition ${
                  settings.theme === 'healthy-dark'
                    ? 'bg-emerald-500 text-white font-extrabold border-emerald-500 shadow-md'
                    : 'bg-[var(--bg-card-sub)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-emerald-500/50'
                }`}
              >
                <Moon size={18} />
                <div className="text-left">
                  <div className="text-xs font-bold">Verde Bosque</div>
                  <div className="text-[10px] opacity-80">Oscuro relajante</div>
                </div>
              </button>

              <button
                onClick={() => updateSetting('theme', 'healthy-light')}
                className={`py-3 px-4 rounded-2xl border flex items-center gap-3 transition ${
                  settings.theme === 'healthy-light'
                    ? 'bg-emerald-500 text-white font-extrabold border-emerald-500 shadow-md'
                    : 'bg-[var(--bg-card-sub)] border-[var(--border-card)] text-[var(--text-primary)] hover:border-emerald-500/50'
                }`}
              >
                <Sun size={18} />
                <div className="text-left">
                  <div className="text-xs font-bold">Lino & Hoja</div>
                  <div className="text-[10px] opacity-80">Claro natural</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Alto Contraste y Reducir Animaciones */}
          <div className="space-y-3 pt-2 border-t border-[var(--border-card)]">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-card)]">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Modo de Alto Contraste</span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Resalta bordes y textos para máxima legibilidad.
                </span>
              </div>
              <button
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                role="switch"
                aria-checked={settings.highContrast}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  settings.highContrast ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white block transform transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-card)]">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Reducir Movimiento</span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Desactiva transiciones y animaciones rápidas.
                </span>
              </div>
              <button
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                role="switch"
                aria-checked={settings.reducedMotion}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  settings.reducedMotion ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white block transform transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border-card)] flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            Listo, Aplicar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
}
