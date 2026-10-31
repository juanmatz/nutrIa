import React from 'react';
import {
  LayoutDashboard,
  Bot,
  UtensilsCrossed,
  ChevronRight,
  Flame,
  ShieldCheck,
  Users,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, userMetrics, isMobileOpen, setIsMobileOpen }) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & Progreso',
      subtitle: 'Métricas, IMC & Plan diario',
      icon: LayoutDashboard,
    },
    {
      id: 'chat',
      label: 'NutriaBot Asistente',
      subtitle: 'IA Bioadaptativa & Chat',
      icon: Bot,
      badge: 'v4.2 AI'
    },
    {
      id: 'foods',
      label: 'Gestión de Alimentos',
      subtitle: 'Despensa & Alergias clínicas',
      icon: UtensilsCrossed,
    },
  ];

  // Si el usuario es Administrador (rol 1), añade el panel de gestión de usuarios
  if (isAdmin) {
    navItems.push({
      id: 'admin-users',
      label: 'Gestión de Usuarios',
      subtitle: 'Control RBAC & Biometría',
      icon: Users,
      badge: 'ADMIN',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#0B0F19] border-r border-[#1F2937] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Logo & Branding */}
        <div>
          <div className="p-6 border-b border-[#1F2937]">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0A8] to-[#06B6D4] p-[1.5px] shadow-lg shadow-[#00F0A8]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#090D14] rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00F0A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00F0A8] rounded-full border-2 border-[#090D14] animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white">Nutria Fit</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00F0A8]/10 text-[#00F0A8] border border-[#00F0A8]/30">PRO</span>
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Intelligent Fuel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Ecosistema Clínico</span>
              {isAdmin && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  ADMIN ACTIVO
                </span>
              )}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#00F0A8] text-[#090D14] font-bold shadow-lg shadow-[#00F0A8]/20 scale-[1.01]'
                      : 'text-slate-300 hover:text-white hover:bg-[#111827] border border-transparent hover:border-[#1F2937]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[#090D14]/15 text-[#090D14]'
                          : 'bg-[#111827] text-slate-400 group-hover:text-[#00F0A8]'
                      }`}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div>
                      <div className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[11px] truncate max-w-[140px] ${isActive ? 'text-[#090D14]/80 font-medium' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.badge && !isActive && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={16} strokeWidth={3} className="text-[#090D14]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Card Inferior: Perfil Calórico & Versión */}
        <div className="p-4 m-4 rounded-2xl bg-[#111827] border border-[#1F2937] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00F0A8]/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={13} className="text-amber-400" /> Metabolismo Base
            </span>
            <span className="text-[10px] font-bold text-[#00F0A8] px-1.5 py-0.5 rounded bg-[#00F0A8]/10 border border-[#00F0A8]/30">
              Calibrado
            </span>
          </div>

          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {userMetrics?.tdee || "2,140"}
              </span>
              <span className="text-xs text-slate-400 font-semibold">kcal / día</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              TDEE Óptimo para {user?.objetivo ? user.objetivo.split('&')[0] : 'Tonificación'}
            </p>
          </div>

          {/* Barra de progreso segmentada */}
          <div className="space-y-1.5 mb-3">
            <div className="h-2 w-full bg-[#090D14] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[#1F2937]">
              <div className="h-full bg-cyan-400 rounded-sm" style={{ width: '65%' }} title="Basal (BMR): 1,410 kcal" />
              <div className="h-full bg-amber-400 rounded-sm" style={{ width: '10%' }} title="TEF (Digestión): 210 kcal" />
              <div className="h-full bg-[#00F0A8] rounded-sm" style={{ width: '25%' }} title="NEAT + Ejercicio: 520 kcal" />
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase">
              <span className="text-cyan-400">● BMR 65%</span>
              <span className="text-amber-400">● TEF 10%</span>
              <span className="text-[#00F0A8]">● ACT 25%</span>
            </div>
          </div>

          {/* Versión y estado clínico */}
          <div className="pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck size={13} className="text-[#00F0A8]" />
              <span className="font-semibold text-slate-300">v2.4 Pro Metabolic</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-ping" />
          </div>
        </div>
      </aside>
    </>
  );
}
