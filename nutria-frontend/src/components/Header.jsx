import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Activity,
  Droplets,
  Apple,
  Sparkles,
  ChevronDown,
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
      title: 'Meta de Hidratación',
      desc: 'Buen momento para tomar un vaso de agua fresca.',
      time: 'Hace 20 min',
      icon: Droplets,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 2,
      title: 'Progreso de Proteínas',
      desc: 'Estás muy cerca de completar tu meta de proteína diaria.',
      time: 'Hace 1 hora',
      icon: Apple,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  const roleBadgeLabel = isAdmin ? 'Administrador' : isNutritionist ? 'Nutricionista' : (user?.rol || 'Atleta');

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#0D1512]/90 backdrop-blur-md border-b border-[#1F332A] px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Hamburger (mobile) + Pills */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú de navegación"
          className="p-2.5 rounded-xl bg-[#121C18] border border-[#1F332A] text-slate-300 hover:text-white md:hidden focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <Menu size={20} />
        </button>

        {/* Status Pills sencillas */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Plan Pill */}
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-normal hidden sm:inline">Objetivo:</span>
            <span>{user?.objetivo ? user.objetivo.split('&')[0] : 'Vida Saludable'}</span>
          </div>

          {/* IMC Pill */}
          <button
            onClick={onOpenWeightModal}
            aria-label="Ver y editar índice de masa corporal y peso"
            className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 flex items-center gap-2 text-xs font-semibold text-emerald-300 tracking-wide transition group focus:outline-none focus:ring-1 focus:ring-emerald-400"
            title="Haz clic para actualizar tu peso e IMC"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400 font-normal hidden sm:inline">IMC:</span>
            <span>{userMetrics?.imc || user?.imc || "22.4"} Saludable</span>
            <span className="text-[10px] text-emerald-300 underline opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              Editar
            </span>
          </button>
        </div>
      </div>

      {/* Right side: Notifications + User Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Ver notificaciones"
            className="relative p-2.5 rounded-xl bg-[#121C18] border border-[#1F332A] hover:border-emerald-500/40 text-slate-300 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full ring-4 ring-[#121C18]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#0F1715] border border-[#1F332A] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F332A]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Recordatorios del Día</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {notifications.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="divide-y divide-[#1F332A] mt-1 max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="py-3 flex gap-3 hover:bg-[#121C18] rounded-xl px-2 transition">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${n.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-white">{n.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.desc}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Avatar y Menú de Perfil */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-label="Abrir menú de usuario"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-[#121C18] border border-[#1F332A] hover:border-emerald-500/40 transition group focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                {(user.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                  {user.nombre || 'Usuario'}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  {roleBadgeLabel}
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-transform" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Iniciar Sesión
            </button>
          )}

          {/* Menú desplegable del Perfil */}
          {showProfileMenu && user && (
            <div className="absolute right-0 mt-3 w-56 bg-[#0F1715] border border-[#1F332A] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-[#1F332A]">
                <p className="text-xs font-bold text-white">{user.nombre}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenWeightModal();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#121C18] transition flex items-center gap-2"
                >
                  <UserCheck size={14} className="text-emerald-400" />
                  Actualizar Datos Físicos
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
