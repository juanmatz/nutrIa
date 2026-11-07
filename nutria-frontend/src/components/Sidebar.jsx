import React from 'react';
import {
  BarChart2,
  Bot,
  UtensilsCrossed,
  Apple,
  Users,
  Flame,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMeals } from '../context/MealContext';

export default function Sidebar({ activeTab, setActiveTab, userMetrics, isMobileOpen, setIsMobileOpen }) {
  const { user, isAdmin } = useAuth();
  const { dailyTotals } = useMeals();

  const targetCalories = userMetrics?.targetCalories || 2150;
  const currentCalories = dailyTotals.calories;
  const caloriePercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const navItems = [
    {
      id: 'dashboard',
      label: 'Gráficos & Progreso',
      subtitle: 'Balance calórico y evolución',
      icon: BarChart2,
    },
    {
      id: 'diet-plan',
      label: 'Plan de Dieta',
      subtitle: 'Comidas y registro de hoy',
      icon: UtensilsCrossed,
    },
    {
      id: 'foods',
      label: 'Alimentos',
      subtitle: 'Catálogo y nutrientes',
      icon: Apple,
    },
    {
      id: 'chat',
      label: 'Asistente IA',
      subtitle: 'Recetas y consultas',
      icon: Bot,
      badge: 'Nutri'
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin-users',
      label: 'Gestión de Usuarios',
      subtitle: 'Control y permisos',
      icon: Users,
      badge: 'ADMIN',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#0B1311] border-r border-[#1F332A] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo orgánico y natural */}
          <div className="p-6 border-b border-[#1F332A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
                <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white">NutrIA</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">FIT</span>
                </div>
                <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  Nutrición Inteligente
                </p>
              </div>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Vistas Principales
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
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-[#121C18] border border-transparent hover:border-[#1F332A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-[#121C18] text-slate-400 group-hover:text-emerald-400'
                      }`}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div>
                      <div className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] truncate max-w-[140px] ${isActive ? 'text-slate-900/80 font-medium' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.badgeColor || (isActive ? 'bg-slate-950 text-emerald-400 border-slate-950' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30')
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

        {/* Tarjeta inferior limpia de resumen */}
        <div className="p-4">
          <div className="bg-[#121C18] border border-[#1F332A] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame size={14} className="text-emerald-400" /> Meta Diaria
              </span>
              <span className="text-xs font-bold text-emerald-400">{caloriePercent}%</span>
            </div>

            <div className="text-lg font-black text-white">
              {currentCalories} <span className="text-xs font-normal text-slate-400">/ {targetCalories} kcal</span>
            </div>

            <div className="w-full h-1.5 bg-[#0F1715] rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1F332A] flex items-center justify-between text-[11px] text-slate-400">
              <span>NutrIA v4.2</span>
              <span className="text-emerald-400 font-medium">Salud Activa</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
