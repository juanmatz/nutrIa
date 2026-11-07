import React from 'react';
import {
  BarChart2,
  UtensilsCrossed,
  Apple,
  MessageCircleHeart,
  Users,
  Flame,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMeals } from '../context/MealContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Sidebar({ activeTab, setActiveTab, userMetrics, isMobileOpen, setIsMobileOpen }) {
  const { isAdmin } = useAuth();
  const { dailyTotals } = useMeals();
  const { setIsAccessibilityModalOpen } = useAccessibility();

  const targetCalories = userMetrics?.targetCalories || 2150;
  const currentCalories = dailyTotals.calories;
  const caloriePercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const navItems = [
    {
      id: 'dashboard',
      label: 'Progreso y Gráficos',
      subtitle: 'Balance calórico de hoy',
      icon: BarChart2,
    },
    {
      id: 'diet-plan',
      label: 'Plan de Alimentación',
      subtitle: 'Tus comidas del día',
      icon: UtensilsCrossed,
    },
    {
      id: 'foods',
      label: 'Catálogo de Alimentos',
      subtitle: 'Nutrientes por cada 100g',
      icon: Apple,
    },
    {
      id: 'chat',
      label: 'Conversar con Nutri',
      subtitle: 'Consejos e ideas de cocina',
      icon: MessageCircleHeart,
      badge: 'Guía'
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin-users',
      label: 'Gestión de Usuarios',
      subtitle: 'Permisos y perfiles',
      icon: Users,
      badge: 'ADMIN',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
    });
  }

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          aria-label="Cerrar menú móvil"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[var(--bg-app)] border-r border-[var(--border-card)] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo orgánico y saludable */}
          <div className="p-6 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">NutrIA</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--chip-bg)] text-[var(--chip-text)] border border-[var(--chip-border)]">
                    NATURAL
                  </span>
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                  Vida & Alimentación
                </p>
              </div>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Menú Principal
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-card)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:text-emerald-500'
                      }`}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div>
                      <div className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] truncate max-w-[140px] ${isActive ? 'text-slate-900/80 font-medium' : 'text-[var(--text-secondary)]'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.badgeColor || (isActive ? 'bg-slate-950 text-emerald-400 border-slate-950' : 'bg-[var(--chip-bg)] text-[var(--chip-text)] border-[var(--chip-border)]')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tarjeta inferior de Meta Diaria + Botón Accesibilidad */}
        <div className="p-4 space-y-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Flame size={14} className="text-emerald-500" /> Meta Diaria
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{caloriePercent}%</span>
            </div>

            <div className="text-lg font-black text-[var(--text-primary)]">
              {currentCalories} <span className="text-xs font-normal text-[var(--text-secondary)]">/ {targetCalories} kcal</span>
            </div>

            <div className="w-full h-1.5 bg-[var(--bg-card-sub)] rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>

          {/* Botón de acceso a Accesibilidad */}
          <button
            onClick={() => setIsAccessibilityModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-[var(--bg-card)] hover:bg-emerald-500/10 border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Eye size={15} className="text-emerald-500" />
            <span>Ajustes de Accesibilidad</span>
          </button>
        </div>
      </aside>
    </>
  );
}
