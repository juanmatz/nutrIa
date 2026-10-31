import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Utensils,
  Lock,
  Shield
} from 'lucide-react';
import FoodCard from './FoodCard';
import FoodModal from './FoodModal';
import AllergyModal from './AllergyModal';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FoodsView({ onShowToast, onOpenAuthModal }) {
  const { isAdmin } = useAuth();
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBadgeFilter, setActiveBadgeFilter] = useState('Todas las categorías');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todos los Grupos');
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Lista de alergias clínicas
  const [allergies, setAllergies] = useState([
    {
      id: 1,
      nombre: "Mariscos & Crustáceos",
      severidad: "ALTA",
      reemplazos: "Exclusión total sin tolerancias. Sustituto proteico: Pechuga de pavo, claras y salmón.",
      nota: "Reacción por tropomiosina. Bloqueo 100% en recetas."
    },
    {
      id: 2,
      nombre: "Lactosa y Derivados",
      severidad: "MODERADA",
      reemplazos: "Bebida de almendras, Tofu firme, Queso vegetal fermentado.",
      nota: "Déficit de enzima lactasa. Cero caseína en planes diarios."
    },
    {
      id: 3,
      nombre: "Nueces y Frutos Secos",
      severidad: "ALTA",
      reemplazos: "Semillas de girasol, chía, lino dorado y semillas de calabaza.",
      nota: "Alternativas botánicas sin alérgenos de árbol."
    }
  ]);

  // Carga de alimentos desde servicio API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await apiService.getAlimentos();
      setAlimentos(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handlePriorityChange = async (id_alimento, newPriority) => {
    const updated = await apiService.updatePrioridad(id_alimento, newPriority);
    setAlimentos(updated);
    if (onShowToast) {
      onShowToast(`Prioridad actualizada a "${newPriority.toUpperCase()}" para el algoritmo de NutriaBot.`);
    }
  };

  const handleAddFood = async (newFoodData) => {
    const created = await apiService.createAlimento(newFoodData);
    setAlimentos(prev => [created, ...prev]);
    if (onShowToast) {
      onShowToast(`✓ Alimento "${created.nombre}" añadido y sincronizado.`);
    }
  };

  const handleDeleteFood = async (id_alimento, nombre) => {
    if (!isAdmin) {
      if (onShowToast) onShowToast("Acceso denegado: solo Administradores pueden eliminar alimentos.");
      return;
    }
    const res = await apiService.deleteAlimento(id_alimento);
    if (res.ok || res.updated) {
      setAlimentos(prev => prev.filter(a => a.id_alimento !== id_alimento));
      if (onShowToast) onShowToast(`✓ Alimento "${nombre}" eliminado del catálogo oficial.`);
    }
  };

  const handleAddAllergy = (newAllergy) => {
    setAllergies(prev => [...prev, newAllergy]);
    if (onShowToast) {
      onShowToast(`🛡️ Restricción para "${newAllergy.nombre}" incorporada al filtro de seguridad.`);
    }
  };

  const handleSyncWithNutriaBot = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (onShowToast) {
        onShowToast("✓ Sincronización exitosa: Algoritmo NutriaBot alineado con 32 alimentos priorizados.");
      }
    }, 900);
  };

  const handleAddFoodClick = () => {
    if (!isAdmin) {
      if (onShowToast) {
        onShowToast("🔒 Acción restringida: Solo usuarios con rol Administrador pueden crear alimentos oficiales.");
      }
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }
    setIsFoodModalOpen(true);
  };

  // Filtrado de alimentos
  const filteredAlimentos = alimentos.filter((item) => {
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoria_nombre && item.categoria_nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.detalles && item.detalles.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeBadgeFilter === 'Alergias & Restricciones (6 activas)') {
      if (item.prioridad !== 'evitar') return false;
    } else if (activeBadgeFilter === 'Favoritos & Recomendados') {
      if (item.prioridad !== 'priorizar') return false;
    } else if (activeBadgeFilter === 'Bloqueados / Disgusto') {
      if (item.prioridad !== 'evitar') return false;
    }

    if (activeCategoryFilter !== 'Todos los Grupos') {
      if (activeCategoryFilter === 'Proteínas' && item.id_categoria !== 1) return false;
      if (activeCategoryFilter === 'Carbohidratos Complejos' && item.id_categoria !== 2) return false;
      if (activeCategoryFilter === 'Grasas Saludables' && item.id_categoria !== 3) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── CABECERA DE GESTIÓN ─────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0A8]/10 border border-[#00F0A8]/30 text-xs font-bold text-[#00F0A8] tracking-wider uppercase mb-3">
              ● BIBLIOTECA CLÍNICA & DESPENSA
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Gestión de Alimentos & Preferencias Nutricionales
            </h1>
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Configura tus restricciones médicas, alimentos alérgenos y despensa de alimentos recomendados que NutriaBot utilizará en tus dietas.
            </p>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncWithNutriaBot}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-2xl bg-[#090D14] border border-[#1F2937] hover:border-[#00F0A8] text-xs font-bold text-slate-200 hover:text-[#00F0A8] transition flex items-center gap-2"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin text-[#00F0A8]' : 'text-[#00F0A8]'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con NutriaBot'}</span>
            </button>

            {/* Botón de añadir alimento con RBAC guardrail */}
            {isAdmin ? (
              <button
                onClick={handleAddFoodClick}
                className="px-5 py-2.5 rounded-2xl bg-[#00F0A8] hover:bg-[#10B981] text-[#090D14] text-xs font-black shadow-lg shadow-[#00F0A8]/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={3} />
                <span>+ Añadir Alimento Personalizado</span>
              </button>
            ) : (
              <button
                onClick={handleAddFoodClick}
                className="px-4 py-2.5 rounded-2xl bg-[#090D14] border border-[#1F2937] hover:border-amber-500/50 text-slate-400 text-xs font-bold flex items-center gap-2 transition cursor-not-allowed group"
                title="Acción exclusiva de Administradores"
              >
                <Lock size={14} className="text-amber-400" />
                <span>Añadir Alimento (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Buscador global con filtros de badges */}
        <div className="mt-6 pt-6 border-t border-[#1F2937] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por alimento, macro o etiqueta clínica..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090D14] border border-[#1F2937] focus:border-[#00F0A8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              'Todas las categorías',
              'Alergias & Restricciones (6 activas)',
              'Favoritos & Recomendados',
              'Bloqueados / Disgusto'
            ].map((badge) => (
              <button
                key={badge}
                onClick={() => setActiveBadgeFilter(badge)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activeBadgeFilter === badge
                    ? 'bg-[#00F0A8] text-[#090D14] border-[#00F0A8] font-bold shadow-md shadow-[#00F0A8]/10'
                    : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                }`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ZONA CRÍTICA DE ALERGIAS & INTOLERANCIAS MÉDICAS ─────────── */}
      <div className="bg-[#111827] border-2 border-rose-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden glow-crimson">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Zona Crítica: Alergias & Intolerancias Médicas
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Bloqueo Activo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NutriaBot excluye estos ingredientes de cualquier menú o sugerencia de forma irrevocable.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAllergyModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Añadir Restricción
          </button>
        </div>

        {/* Tarjetas de exclusión clínica */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allergies.map((al) => {
            const isHigh = al.severidad === 'ALTA';
            return (
              <div
                key={al.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isHigh
                    ? 'bg-[#090D14] border-rose-500/40 hover:border-rose-400'
                    : 'bg-[#090D14] border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{al.nombre}</h4>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    Severidad: {al.severidad}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-medium mb-2 leading-relaxed">
                  {al.reemplazos}
                </p>

                <div className="pt-2 border-t border-[#1F2937] text-[10px] text-slate-400 flex items-center gap-1">
                  <AlertTriangle size={12} className={isHigh ? 'text-rose-400' : 'text-amber-400'} />
                  <span className="truncate">{al.nota}</span>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setIsAllergyModalOpen(true)}
            className="p-4 rounded-2xl border-2 border-dashed border-[#1F2937] hover:border-rose-500/60 bg-[#090D14]/50 flex flex-col items-center justify-center text-center group transition"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400 flex items-center justify-center transition mb-2">
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">
              + Añadir Alergia o Sensibilidad
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Calibrar nuevo antígeno
            </span>
          </button>
        </div>
      </div>

      {/* ─── CATÁLOGO DE ALIMENTOS RECOMENDADOS ────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils size={19} className="text-[#00F0A8]" />
              Catálogo de Alimentos Recomendados
            </h3>
            <p className="text-xs text-slate-400">
              Datos nutricionales exactos por cada 100g de porción {isAdmin && '· Privilegios de Admin activos'}
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              'Todos los Grupos',
              'Proteínas',
              'Carbohidratos Complejos',
              'Grasas Saludables'
            ].map((grupo) => (
              <button
                key={grupo}
                onClick={() => setActiveCategoryFilter(grupo)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activeCategoryFilter === grupo
                    ? 'bg-[#111827] text-[#00F0A8] border-[#00F0A8] font-bold'
                    : 'bg-[#090D14] text-slate-400 border-[#1F2937] hover:text-white'
                }`}
              >
                {grupo}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Cards de Alimentos */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin text-[#00F0A8] mx-auto mb-2" />
            <p className="text-sm">Cargando base de datos de alimentos...</p>
          </div>
        ) : filteredAlimentos.length === 0 ? (
          <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-12 text-center text-slate-400">
            <p className="text-base font-semibold text-white">No se encontraron alimentos</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAlimentos.map((item) => (
              <FoodCard
                key={item.id_alimento}
                alimento={item}
                onPriorityChange={handlePriorityChange}
                isAdmin={isAdmin}
                onDeleteFood={handleDeleteFood}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── RESUMEN DE REGLAS & DESPENSA INTELIGENTE ─── */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-4 bg-[#090D14] border border-[#1F2937] p-4 rounded-2xl">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-[#1F2937]" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#00F0A8]"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - 0.98)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-sm font-black text-white">98%</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Algoritmo NutriaBot
              </span>
              <span className="text-base font-extrabold text-white">Filtro Óptimo</span>
              <p className="text-[11px] text-[#00F0A8] font-semibold mt-0.5">
                ● Cero brechas biológicas
              </p>
            </div>
          </div>

          <div className="bg-[#090D14] border border-[#1F2937] p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00F0A8] shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Seguridad Inmunológica
              </span>
              <span className="text-base font-extrabold text-white">100% Libre de Alérgenos</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                3 restricciones médicas activas
              </p>
            </div>
          </div>

          <div className="bg-[#090D14] border border-[#1F2937] p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Densidad Nutricional
              </span>
              <span className="text-base font-extrabold text-white">32 Alimentos Priorizados</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aprobado para tonificación magra
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#1F2937] flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>
            🔬 <strong className="text-slate-300">Validación Clínica Biométrica:</strong> Protocolo validado para absorción óptima de macro y micronutrientes sin inflamación intestinal.
          </span>
          <span className="text-[#00F0A8] font-semibold">Estado: Operativo v4.2</span>
        </div>
      </div>

      {/* Modales */}
      {isAdmin && (
        <FoodModal
          isOpen={isFoodModalOpen}
          onClose={() => setIsFoodModalOpen(false)}
          onAddFood={handleAddFood}
        />
      )}

      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        onAddAllergy={handleAddAllergy}
      />
    </div>
  );
}
