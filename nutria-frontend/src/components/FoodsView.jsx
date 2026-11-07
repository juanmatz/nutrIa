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

  // Lista de alergias o intolerancias simplificada
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

  // Carga de alimentos
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
      onShowToast(`Preferencia de alimento actualizada.`);
    }
  };

  const handleAddFood = async (newFoodData) => {
    const created = await apiService.createAlimento(newFoodData);
    setAlimentos(prev => [created, ...prev]);
    if (onShowToast) {
      onShowToast(`✓ Alimento "${created.nombre}" añadido al catálogo.`);
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
    if (onShowToast) onShowToast("Preferencias de alergias actualizadas.");
  };

  // Categorías disponibles
  const categories = ['Todos', 'Proteínas', 'Carbohidratos', 'Grasas Saludables', 'Frutas y Verduras', 'Bebidas'];

  // Filtrado
  const filteredFoods = alimentos.filter(food => {
    const matchesSearch = food.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (food.categoria_nombre && food.categoria_nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategoryFilter === 'Todos' ||
                            (food.categoria_nombre && food.categoria_nombre.toLowerCase().includes(activeCategoryFilter.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="bg-[#121C18] border border-[#1F332A] rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F332A]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Apple size={15} />
              <span>Base de Alimentos Nutritivos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Catálogo de Alimentos
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Consulta el valor nutricional por cada 100g de tus alimentos favoritos y personaliza tus preferencias.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAllergyModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#0F1715] border border-[#1F332A] hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            >
              Mis Alergias ({allergies.length})
            </button>

            {isAdmin ? (
              <button
                onClick={() => setIsFoodModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <Plus size={16} /> Añadir Alimento
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="py-2.5 px-4 rounded-xl bg-[#0F1715] border border-dashed border-[#1F332A] hover:border-slate-500 text-slate-400 text-xs font-medium flex items-center gap-2 transition"
                title="Inicia sesión como Administrador para agregar alimentos a la base común"
              >
                <Lock size={14} /> Modo Usuario (Solo Lectura)
              </button>
            )}
          </div>
        </div>

        {/* Buscador & Filtros por Categoría */}
        <div className="pt-6 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre (ej. Salmón, Avena, Pollo, Aguacate)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1715] border border-[#1F332A] focus:border-emerald-400 rounded-2xl pl-11 pr-4 py-3 text-sm text-white outline-none transition placeholder-slate-500"
            />
          </div>

          {/* Botones de categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeCategoryFilter === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#0F1715] border border-[#1F332A] text-slate-300 hover:text-white hover:border-emerald-500/30'
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
          <h2 className="text-sm font-bold text-slate-300">
            {filteredFoods.length} {filteredFoods.length === 1 ? 'alimento disponible' : 'alimentos disponibles'}
          </h2>
          <button
            onClick={loadData}
            className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-[#121C18] border border-[#1F332A] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="bg-[#121C18] border border-dashed border-[#1F332A] rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <Utensils size={36} className="mx-auto text-slate-500" />
            <h3 className="text-base font-semibold text-slate-200">No se encontraron alimentos</h3>
            <p className="text-xs text-slate-400">
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
