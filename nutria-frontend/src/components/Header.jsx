import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Eye,
  Sun,
  Moon,
  Droplets,
  Apple,
  ChevronDown,
  LogOut,
  UserCheck,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Header({ userMetrics, onOpenWeightModal, onToggleMobileMenu, onOpenAuthModal }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, isAdmin, isNutritionist, logout } = useAuth();
  const { settings, toggleTheme, setIsAccessibilityModalOpen } = useAccessibility();

  // Fecha de hoy para el header
  const today = new Date();
  const rawDate = today.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const headerDateStr = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const notifications = [
    {
      id: 1,
      title: 'Momento de hidratarte',
      desc: 'Toma un vaso de agua fresca para mantener tu energía.',
      time: 'Hace 20 min',
      icon: Droplets,
      color: 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30'
    },
    {
      id: 2,
      title: 'Meta de proteínas',
      desc: 'Vas muy bien con tu consumo de proteína de hoy.',
      time: 'Hace 1 hora',
      icon: Apple,
      color: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30'
    }
  ];

  const roleLabel = isAdmin ? 'Administrador' : isNutritionist ? 'Nutricionista' : 'Usuario';

  return (
    <header className="sticky top-0 z-30 h-20 bg-[var(--bg-app)]/95 backdrop-blur-md border-b border-[var(--border-card)] px-4 md:px-8 flex items-center justify-between transition-colors">
      {/* Lado izquierdo: Botón Menú Móvil + Datos Rápidos */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú de navegación"
          className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] md:hidden focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <Menu size={20} />
        </button>

        {/* Indicadores claros y legibles en cualquier tema */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Fecha del día */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-secondary)] shadow-sm">
            <Calendar size={13} className="text-emerald-500" />
            <span>{headerDateStr}</span>
          </div>

          {/* Meta diaria */}
          <div className="px-3.5 py-1.5 rounded-full bg-[var(--chip-bg)] border border-[var(--chip-border)] flex items-center gap-2 text-xs font-medium text-[var(--chip-text)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="opacity-90 hidden sm:inline">Tu meta:</span>
            <span className="font-extrabold text-[var(--text-primary)]">{userMetrics?.targetCalories || 2150} kcal</span>
          </div>

          {/* Peso / IMC saludable */}
          <button
            onClick={onOpenWeightModal}
            aria-label="Actualizar peso y altura"
            className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-400/60 flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] transition group focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-sm"
            title="Haz clic para actualizar tus medidas"
          >
            <span className="text-[var(--text-secondary)] hidden sm:inline">Peso:</span>
            <span className="font-bold text-[var(--text-primary)]">{userMetrics?.weight || 63.8} kg</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold underline ml-1">
              (Editar)
            </span>
          </button>
        </div>
      </div>

      {/* Lado derecho: Accesibilidad + Tema + Notificaciones + Perfil */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* BOTÓN VISIBLE Y ACCESIBLE */}
        <button
          onClick={() => setIsAccessibilityModalOpen(true)}
          aria-label="Abrir opciones de accesibilidad y tamaño de letra"
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          title="Ajustes de accesibilidad, tamaño de letra y contraste"
        >
          <Eye size={16} className="text-emerald-500 shrink-0" />
          <span className="hidden sm:inline">Accesibilidad</span>
        </button>

        {/* BOTÓN DE MODO CLARO / OSCURO HEALTHY */}
        <button
          onClick={toggleTheme}
          aria-label={settings.theme === 'healthy-light' ? 'Cambiar a modo verde oscuro' : 'Cambiar a modo claro natural'}
          className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] transition focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          title={settings.theme === 'healthy-light' ? 'Cambiar a modo verde oscuro' : 'Cambiar a modo claro natural'}
        >
          {settings.theme === 'healthy-light' ? (
            <Moon size={18} className="text-emerald-700" />
          ) : (
            <Sun size={18} className="text-amber-400" />
          )}
        </button>

        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Ver avisos y recordatorios"
            className="relative p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] transition focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-88 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
                <span className="text-sm font-bold text-[var(--text-primary)]">Recordatorios de Hoy</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cerrar
                </button>
              </div>

              <div className="divide-y divide-[var(--border-card)] mt-1 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="py-3 flex gap-3 hover:bg-[var(--bg-card-sub)] rounded-2xl px-2 transition">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${n.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[var(--text-primary)]">{n.title}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">{n.desc}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Perfil del Usuario */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-label="Abrir menú de usuario"
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 transition group focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                {(user.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                  {user.nombre || 'Usuario'}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {roleLabel}
                </div>
              </div>
              <ChevronDown size={14} className="text-[var(--text-secondary)]" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="py-2 px-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Iniciar Sesión
            </button>
          )}

          {showProfileMenu && user && (
            <div className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-[var(--border-card)]">
                <p className="text-xs font-bold text-[var(--text-primary)]">{user.nombre}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.email}</p>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenWeightModal();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card-sub)] transition flex items-center gap-2"
                >
                  <UserCheck size={14} className="text-emerald-500" />
                  Mis Medidas
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-2"
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
