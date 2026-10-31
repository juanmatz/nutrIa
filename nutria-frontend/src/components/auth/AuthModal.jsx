import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Scale, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAge,
  validateWeight,
  validateHeight
} from '../../utils/validation';

export default function AuthModal({ isOpen, onClose, onShowToast }) {
  const { login, register, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('26');
  const [peso, setPeso] = useState('63.8');
  const [altura, setAltura] = useState('168');
  const [idRol, setIdRol] = useState('2');

  if (!isOpen) return null;

  const handleDemoSwitch = (role) => {
    switchDemoUser(role);
    if (onShowToast) {
      onShowToast(role === 'admin' ? "✓ Sesión activa como Dr. Roberto (Admin)" : "✓ Sesión activa como Camila Torres (Usuario)");
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setFormErrors(prev => ({ ...prev, email: emailCheck.error }));
      return;
    }

    if (!isRegister) {
      // Login
      if (!password) {
        setFormErrors(prev => ({ ...prev, password: 'La contraseña es requerida.' }));
        return;
      }
      setLoading(true);
      const res = await login(emailCheck.value, password);
      setLoading(false);

      if (res.ok) {
        if (onShowToast) onShowToast(`✓ Bienvenido/a ${res.user.nombre}`);
        onClose();
      } else {
        setFormErrors({ general: res.error || 'Credenciales inválidas.' });
      }
      return;
    }

    // Registro
    const nameCheck = validateName(nombre);
    if (!nameCheck.isValid) {
      setFormErrors(prev => ({ ...prev, nombre: nameCheck.error }));
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setFormErrors(prev => ({ ...prev, password: passCheck.error }));
      return;
    }

    const ageCheck = validateAge(edad);
    if (!ageCheck.isValid) {
      setFormErrors(prev => ({ ...prev, edad: ageCheck.error }));
      return;
    }

    const weightCheck = validateWeight(peso);
    if (!weightCheck.isValid) {
      setFormErrors(prev => ({ ...prev, peso: weightCheck.error }));
      return;
    }

    const heightCheck = validateHeight(altura);
    if (!heightCheck.isValid) {
      setFormErrors(prev => ({ ...prev, altura: heightCheck.error }));
      return;
    }

    setLoading(true);
    const regRes = await register({
      nombre: nameCheck.value,
      email: emailCheck.value,
      contrasena_hash: password,
      contrasena: password,
      edad: ageCheck.value,
      peso: weightCheck.value,
      altura: heightCheck.value,
      id_rol: parseInt(idRol, 10),
      calorias_diarias: 2150
    });
    setLoading(false);

    if (regRes.ok) {
      if (onShowToast) onShowToast(`✓ Cuenta creada exitosamente. ¡Bienvenido/a ${regRes.user.nombre}!`);
      onClose();
    } else {
      setFormErrors({ general: regRes.error || 'Error al registrar la cuenta.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl glow-mint text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Demo Fast Switchers */}
        <div className="mb-6 p-3 rounded-2xl bg-[#090D14] border border-[#1F2937]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            ⚡ Acceso Rápido Demo (RBAC):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSwitch('user')}
              className="p-2 rounded-xl bg-[#111827] border border-[#00F0A8]/40 hover:border-[#00F0A8] text-left text-xs transition group"
            >
              <div className="font-bold text-white group-hover:text-[#00F0A8] truncate">Camila Torres</div>
              <div className="text-[10px] text-slate-400 font-semibold">Rol: Usuario / Paciente</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch('admin')}
              className="p-2 rounded-xl bg-[#111827] border border-cyan-500/40 hover:border-cyan-400 text-left text-xs transition group"
            >
              <div className="font-bold text-white group-hover:text-cyan-400 truncate">Dr. Roberto (Admin)</div>
              <div className="text-[10px] text-cyan-400 font-semibold">Rol: Administrador (1)</div>
            </button>
          </div>
        </div>

        {/* Tab switch: Login / Register */}
        <div className="flex bg-[#090D14] p-1 rounded-2xl border border-[#1F2937] mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setFormErrors({}); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              !isRegister ? 'bg-[#00F0A8] text-[#090D14]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setFormErrors({}); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              isRegister ? 'bg-[#00F0A8] text-[#090D14]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {formErrors.general && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{formErrors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="ej. Dra. Elena Rostova"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                  required
                />
              </div>
              {formErrors.nombre && (
                <span className="text-[11px] text-rose-400 block mt-1">{formErrors.nombre}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Correo Electrónico (RFC 5322)
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="usuario@biotech.fit"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                required
              />
            </div>
            {formErrors.email && (
              <span className="text-[11px] text-rose-400 block mt-1">{formErrors.email}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                placeholder={isRegister ? "Mín. 8 caracteres (mayús, num, símbolo)" : "Tu contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
                required
              />
            </div>
            {formErrors.password && (
              <span className="text-[11px] text-rose-400 block mt-1">{formErrors.password}</span>
            )}
          </div>

          {isRegister && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Rol de Cuenta (Control RBAC)
                </label>
                <select
                  value={idRol}
                  onChange={(e) => setIdRol(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="2">2 - Usuario / Paciente</option>
                  <option value="3">3 - Nutricionista Clínico</option>
                  <option value="1">1 - Administrador de Sistema</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00F0A8] hover:bg-[#10B981] disabled:opacity-50 text-[#090D14] text-xs font-black shadow-lg shadow-[#00F0A8]/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-[#090D14] border-t-transparent animate-spin" />
            ) : (
              <>
                {isRegister ? 'Registrar y Autenticar' : 'Iniciar Sesión'} <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

