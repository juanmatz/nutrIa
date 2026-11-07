import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Utensils,
  Lock,
  Apple
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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todos');
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);

  // Lista de alergias o alimentos a evitar
  const [allergies, setAllergies] = useState([
    {
      id: 1,
      nombre: "Mariscos y Crustáceos",
      reemplazos: "Pechuga de pavo, claras de huevo, salmón o legumbres."
    },
    {
      id: 2,
      nombre: "Lactosa y Derivados Lácteos",
      reemplazos: "Bebida de almendras o avena, tofu firme, yogur de coco."
    },
    {
      id: 3,
      nombre: "Frutos Secos",
      reemplazos: "Semillas de girasol, chía, lino y semillas de calabaza."
    }
  ]);

  const loadData = async () => {
    setLoading(true);
    const data = await apiService.getAlimentos();
    setAlimentos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriorityChange = async (id_alimento, newPriority) => {
    const updated = await apiService.updatePrioridad(id_alimento, newPriority);
    setAlimentos(updated);
    if (onShowToast) {
      onShowToast(`Preferencia guardada.`);
    }
  };

  const handleAddFood = async (newFoodData) => {
    const created = await apiService.createAlimento(newFoodData);
    setAlimentos(prev => [created, ...prev]);
    if (onShowToast) {
      onShowToast(`✓ "${created.nombre}" añadido al catálogo.`);
    }
  };

  const handleDeleteFood = async (id_alimento, nombre) => {
    if (!isAdmin) {
      if (onShowToast) onShowToast("Solo administradores pueden eliminar alimentos.");
      return;
    }
    const res = await apiService.deleteAlimento(id_alimento);
    if (res.ok || res.updated) {
      setAlimentos(prev => prev.filter(a => a.id_alimento !== id_alimento));
      if (onShowToast) onShowToast(`Alimento "${nombre}" eliminado.`);
    }
  };

  const handleSaveAllergies = (newList) => {
    setAllergies(newList);
    if (onShowToast) onShowToast("Preferencias de alimentos guardadas.");
  };

  const categories = ['Todos', 'Proteínas', 'Carbohidratos', 'Grasas Saludables', 'Frutas y Verduras', 'Bebidas'];

  const filteredFoods = alimentos.filter(food => {
    const matchesSearch = food.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (food.categoria_nombre && food.categoria_nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategoryFilter === 'Todos' ||
                            (food.categoria_nombre && food.categoria_nombre.toLowerCase().includes(activeCategoryFilter.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-card)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <Apple size={15} />
              <span>Base Nutricional Limpia</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Catálogo de Alimentos
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
              Consulta las calorías y nutrientes de tus alimentos por cada 100g para armar platos ricos y balanceados.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAllergyModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              Alimentos a Evitar ({allergies.length})
            </button>

            {isAdmin ? (
              <button
                onClick={() => setIsFoodModalOpen(true)}
                className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <Plus size={16} /> Añadir Alimento
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="py-2.5 px-4 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-card)] text-[var(--text-secondary)] text-xs font-medium flex items-center gap-2 transition"
                title="Inicia sesión como Administrador para agregar nuevos alimentos"
              >
                <Lock size={14} /> Modo Consulta
              </button>
            )}
          </div>
        </div>

        {/* Buscador & Categorías */}
        <div className="pt-6 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Buscar alimento (ej. Salmón, Avena, Pollo, Aguacate)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder-[var(--text-muted)] focus:ring-1 focus:ring-emerald-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`py-2 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                  activeCategoryFilter === cat
                    ? 'bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-500/20'
                    : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] hover:border-emerald-500/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Alimentos */}
      <div>
        <div className="flex items-center justify-between px-1 mb-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            {filteredFoods.length} {filteredFoods.length === 1 ? 'alimento disponible' : 'alimentos disponibles'}
          </h2>
          <button
            onClick={loadData}
            className="text-xs text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition font-medium"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-card)] rounded-3xl p-12 text-center text-[var(--text-secondary)] space-y-2">
            <Utensils size={36} className="mx-auto text-[var(--text-muted)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No se encontraron alimentos</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((alimento) => (
              <FoodCard
                key={alimento.id_alimento}
                alimento={alimento}
                onPriorityChange={handlePriorityChange}
                isAdmin={isAdmin}
                onDeleteFood={handleDeleteFood}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <FoodModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onAddFood={handleAddFood}
      />

      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        allergies={allergies}
        onSaveAllergies={handleSaveAllergies}
      />
    </div>
  );
}
