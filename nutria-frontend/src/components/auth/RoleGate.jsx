import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function RoleGate({ allowedRoles = [1], children, fallback = null, showWarning = false }) {
  const { user } = useAuth();

  const userRoleId = user?.id_rol || (user?.rol_nombre === 'Administrador' ? 1 : 2);
  const hasAccess = allowedRoles.includes(userRoleId);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showWarning) {
    return (
      <div className="bg-[#111827] border border-rose-500/40 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-2xl glow-crimson animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Acceso Denegado (403)</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Esta vista requiere privilegios de <strong className="text-rose-400">Administrador</strong>. Tu cuenta actual (<strong className="text-white">{user?.nombre || 'Usuario'}</strong>) tiene asignado el rol de <strong className="text-[#00F0A8]">{user?.rol_nombre || 'Usuario'}</strong>.
        </p>
        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#090D14] border border-[#1F2937] text-slate-400">
          RBAC Protection Protocol v4.2
        </span>
      </div>
    );
  }

  return fallback;
}

