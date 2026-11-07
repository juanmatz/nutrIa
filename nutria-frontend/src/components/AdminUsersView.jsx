import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Scale,
  Activity,
  AlertCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateWeight, validateHeight, validateAge, validateName } from '../utils/validation';

export default function AdminUsersView({ onShowToast }) {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const loadUsers = async () => {
    setLoading(true);
    const res = await apiService.getUsuarios();
    if (res.ok) {
      setUsersList(res.data || []);
    } else {
      if (onShowToast) onShowToast(res.error || 'No se pudieron cargar los usuarios.');
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const res = await apiService.getUsuarios();
      if (isMounted) {
        if (res.ok) {
          setUsersList(res.data || []);
        } else if (onShowToast) {
          onShowToast(res.error || 'No se pudieron cargar los usuarios.');
        }
        setLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [onShowToast]);

  const handleStartEdit = (user) => {
    setEditingUser({
      ...user,
      peso: user.peso || 65,
      altura: user.altura || 170,
      edad: user.edad || 25,
      calorias_diarias: user.calorias_diarias || 2150,
      id_rol: user.id_rol || 2
    });
    setEditErrors({});
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditErrors({});

    const nameCheck = validateName(editingUser.nombre);
    if (!nameCheck.isValid) {
      setEditErrors(prev => ({ ...prev, nombre: nameCheck.error }));
      return;
    }

    const weightCheck = validateWeight(editingUser.peso);
    if (!weightCheck.isValid) {
      setEditErrors(prev => ({ ...prev, peso: weightCheck.error }));
      return;
    }

    const heightCheck = validateHeight(editingUser.altura);
    if (!heightCheck.isValid) {
      setEditErrors(prev => ({ ...prev, altura: heightCheck.error }));
      return;
    }

    const ageCheck = validateAge(editingUser.edad);
    if (!ageCheck.isValid) {
      setEditErrors(prev => ({ ...prev, edad: ageCheck.error }));
      return;
    }

    setIsSaving(true);
    const updatePayload = {
      nombre: nameCheck.value,
      peso: weightCheck.value,
      altura: heightCheck.value,
      edad: ageCheck.value,
      objetivo: editingUser.objetivo,
      calorias_diarias: parseInt(editingUser.calorias_diarias, 10) || 2000,
      id_rol: parseInt(editingUser.id_rol, 10)
    };

    const res = await apiService.updateUsuario(editingUser.id_usuario, updatePayload);
    setIsSaving(false);

    if (res.ok) {
      setUsersList(prev =>
        prev.map(u => (u.id_usuario === editingUser.id_usuario ? { ...u, ...updatePayload } : u))
      );
      if (onShowToast) {
        onShowToast(`✓ Usuario "${nameCheck.value}" actualizado exitosamente.`);
      }
      setEditingUser(null);
    } else {
      setEditErrors({ general: res.error || 'Error al actualizar el usuario.' });
    }
  };

  // Filtrado de usuarios
  const filteredUsers = usersList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.objetivo?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedRoleFilter !== 'ALL') {
      return String(u.id_rol) === selectedRoleFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Cabecera del Panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mb-3">
              <Shield size={13} />
              ● Módulo de Administrador
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Gestión de Usuarios y Roles
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-3xl leading-relaxed">
              Consulta los datos de los usuarios registrados, edita medidas corporales y administra los permisos del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-card)] hover:border-emerald-500 text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
              <span>Actualizar Lista</span>
            </button>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="mt-6 pt-6 border-t border-[var(--border-card)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nombre, email u objetivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'ALL', label: 'Todos los Roles' },
              { id: '1', label: 'Administradores (1)' },
              { id: '2', label: 'Usuarios (2)' },
              { id: '3', label: 'Nutricionistas (3)' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  selectedRoleFilter === r.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-sm'
                    : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla / Grid de Usuarios */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border-card)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Users size={18} className="text-emerald-500" />
            <span>Usuarios Registrados ({filteredUsers.length})</span>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Sesión activa: <strong className="text-[var(--text-primary)]">{currentUser?.nombre}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[var(--text-secondary)]">
            <RefreshCw size={26} className="animate-spin text-emerald-500 mx-auto mb-3" />
            <p className="text-sm">Cargando base de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-[var(--text-secondary)]">
            <p className="text-base font-semibold text-[var(--text-primary)]">No se encontraron usuarios</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Prueba cambiando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-app)] text-[var(--text-secondary)] uppercase font-bold tracking-wider border-b border-[var(--border-card)]">
                <tr>
                  <th className="py-3.5 px-4">Usuario / Email</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Medidas & IMC</th>
                  <th className="py-3.5 px-4">Objetivo</th>
                  <th className="py-3.5 px-4">Calorías / Día</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredUsers.map((u) => {
                  const hM = (u.altura || 170) / 100;
                  const imc = (u.peso / (hM * hM)).toFixed(1);
                  const isAdmin = u.id_rol === 1;
                  const isNutri = u.id_rol === 3;

                  return (
                    <tr key={u.id_usuario} className="hover:bg-[var(--bg-app)]/50 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span>{u.nombre}</span>
                          {u.id_usuario === currentUser?.id_usuario && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                              TÚ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{u.email}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isAdmin
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : isNutri
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          <Shield size={11} />
                          {isAdmin ? 'Administrador (1)' : isNutri ? 'Nutricionista (3)' : 'Usuario (2)'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                          <span>{u.peso || 65} kg</span>
                          <span>·</span>
                          <span>{u.altura || 170} cm</span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">IMC {imc}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Edad: {u.edad || 25} años
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[var(--text-secondary)] font-medium">
                          {u.objetivo || 'Alimentación Saludable'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-[var(--text-primary)]">
                        {u.calorias_diarias || 2150} kcal
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Edit2 size={13} className="text-emerald-500" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición de Usuario (Admin) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-2xl text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-sub)] transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Editar Usuario y Asignar Rol
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Modificación de datos corporales y rol del usuario
                </p>
              </div>
            </div>

            {editErrors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                {editErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  required
                />
                {editErrors.nombre && (
                  <span className="text-[11px] text-rose-500 block mt-1">{editErrors.nombre}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Reasignación de Rol
                </label>
                <select
                  value={editingUser.id_rol}
                  onChange={(e) => setEditingUser({ ...editingUser, id_rol: parseInt(e.target.value, 10) })}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-bold"
                >
                  <option value={1}>1 - Administrador</option>
                  <option value={2}>2 - Usuario</option>
                  <option value={3}>3 - Nutricionista</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="text"
                    value={editingUser.peso}
                    onChange={(e) => setEditingUser({ ...editingUser, peso: e.target.value })}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    required
                  />
                  {editErrors.peso && (
                    <span className="text-[10px] text-rose-500 block mt-1">{editErrors.peso}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="text"
                    value={editingUser.altura}
                    onChange={(e) => setEditingUser({ ...editingUser, altura: e.target.value })}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    required
                  />
                  {editErrors.altura && (
                    <span className="text-[10px] text-rose-500 block mt-1">{editErrors.altura}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    value={editingUser.edad}
                    onChange={(e) => setEditingUser({ ...editingUser, edad: e.target.value })}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Objetivo
                  </label>
                  <input
                    type="text"
                    value={editingUser.objetivo || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, objetivo: e.target.value })}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Calorías Diarias
                  </label>
                  <input
                    type="number"
                    value={editingUser.calorias_diarias || 2000}
                    onChange={(e) => setEditingUser({ ...editingUser, calorias_diarias: e.target.value })}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-card)] hover:bg-[var(--bg-card-sub)] text-[var(--text-secondary)] text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
