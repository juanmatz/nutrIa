import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Activity,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Shield,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ userMetrics, onOpenWeightModal, onToggleMobileMenu, onOpenAuthModal }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, isAdmin, isNutritionist, logout } = useAuth();

  const notifications = [
    {
      id: 1,
      type: 'bio',
      title: 'Ajuste Post-Entrenamiento detectado',
      desc: 'Sesión de fuerza completada (+15g de proteína recomendada).',
      time: 'Hace 12 min',
      icon: Activity,
      color: 'text-[#00F0A8] bg-[#00F0A8]/10 border-[#00F0A8]/20'
    },
    {
      id: 2,
      type: 'water',
      title: 'Meta de Hidratación al 80%',
      desc: 'Faltan 600 ml para alcanzar tu balance óptimo de hoy.',
      time: 'Hace 45 min',
      icon: Sparkles,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 3,
      type: 'safety',
      title: 'Filtro Inmunológico Activo',
      desc: '3 alérgenos bloqueados estrictamente en el plan diario.',
      time: 'Hoy, 08:00',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  const roleBadgeLabel = isAdmin ? 'Administrador (1)' : isNutritionist ? 'Nutricionista (3)' : (user?.rol || 'Premium Athlete');
  const roleBadgeColor = isAdmin
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isNutritionist
    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    : 'text-[#00F0A8] bg-[#00F0A8]/10 border-[#00F0A8]/30';

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#090D14]/90 backdrop-blur-md border-b border-[#1F2937] px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Hamburger (mobile) + Clinical Pills */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="p-2.5 rounded-xl bg-[#111827] border border-[#1F2937] text-slate-300 hover:text-white md:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Status Pills */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Plan Pill */}
          <div className="px-3 py-1.5 rounded-full bg-[#00F0A8]/10 border border-[#00F0A8]/30 flex items-center gap-2 text-xs font-semibold text-[#00F0A8] tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00F0A8] animate-pulse" />
            <span className="text-slate-400 font-medium hidden sm:inline">PLAN:</span>
            <span>{user?.objetivo ? user.objetivo.split('&')[0] : 'Hipertrofia Limpia'}</span>
          </div>

          {/* IMC Pill */}
          <button
            onClick={onOpenWeightModal}
            className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wide transition shadow-sm group"
            title="Click para calibrar peso e IMC"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">IMC:</span>
            <span>{userMetrics?.imc || user?.imc || "22.4"} Normal</span>
            <span className="text-[10px] text-cyan-300 underline opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              Editar
            </span>
          </button>

          {/* Bio-sync Pill (Desktop only) */}
          <div className="hidden lg:flex px-3 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] items-center gap-2 text-xs font-medium text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Bio-Sync: Online</span>
          </div>
        </div>
      </div>

      {/* Right side: Notifications + User Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2.5 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-slate-600 text-slate-300 hover:text-white transition"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#00F0A8] rounded-full ring-4 ring-[#111827]" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Alertas Clínicas</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00F0A8]/10 text-[#00F0A8]">
                    3 Nuevas
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="divide-y divide-[#1F2937] mt-1 max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="py-3 flex gap-3 hover:bg-[#090D14]/50 rounded-xl px-2 transition">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${n.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-400 leading-snug">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 block pt-0.5">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Info */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-slate-600 transition"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00F0A8] to-cyan-500 p-[1.5px] shadow-sm">
                <img
                  src={isAdmin ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                  alt={user?.nombre || "Usuario"}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${isAdmin ? 'bg-rose-500' : 'bg-[#00F0A8]'}`} />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {user?.nombre || "Camila Torres"}
              </div>
              <div className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded border inline-block mt-0.5 ${roleBadgeColor}`}>
                {roleBadgeLabel}
              </div>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="p-2 border-b border-[#1F2937] mb-1">
                <div className="font-bold text-white truncate">{user?.nombre || "Camila Torres"}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email || "camila.torres@biotech.fit"}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                    {roleBadgeLabel}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onOpenWeightModal();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#090D14]"
              >
                <Activity size={15} className="text-[#00F0A8]" />
                <span>Calibrar Biometría</span>
              </button>

              <button
                onClick={() => {
                  onOpenAuthModal();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-cyan-400 hover:bg-cyan-500/10 font-semibold"
              >
                <UserCheck size={15} />
                <span>Cambiar Cuenta / Auth RBAC</span>
              </button>

              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#090D14]"
              >
                <Shield size={15} className="text-slate-400" />
                <span>Historial Clínico</span>
              </button>

              <div className="border-t border-[#1F2937] mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut size={15} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
