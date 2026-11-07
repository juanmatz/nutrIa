import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, LogIn } from 'lucide-react';

export default function ProtectedRoute({ children, onOpenAuthModal }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-[#1F2937] border-t-[#00F0A8] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-2xl animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <Lock size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Autenticación Requerida</h3>
        <p className="text-xs text-slate-400 mb-6">
          Debes iniciar sesión con tu cuenta para acceder a esta sección.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="w-full py-3 px-4 rounded-xl bg-[#00F0A8] hover:bg-[#10B981] text-[#090D14] text-xs font-black transition flex items-center justify-center gap-2"
        >
          <LogIn size={16} /> Iniciar Sesión en NutrIA
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

