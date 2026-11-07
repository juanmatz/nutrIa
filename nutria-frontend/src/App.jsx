import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import DietPlanView from './components/DietPlanView';
import ChatView from './components/ChatView';
import FoodsView from './components/FoodsView';
import AdminUsersView from './components/AdminUsersView';
import WeightModal from './components/WeightModal';
import MealModal from './components/MealModal';
import AuthModal from './components/auth/AuthModal';
import RoleGate from './components/auth/RoleGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MealProvider, useMeals } from './context/MealContext';
import { Sparkles, X } from 'lucide-react';

function AppContent() {
  const { user, updateProfile } = useAuth();
  const { addMeal } = useMeals();

  // Pestaña activa ('dashboard', 'diet-plan', 'foods', 'chat', 'admin-users')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modales
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Notificación toast flotante
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSaveWeight = ({ weight, height, imc }) => {
    const newBmr = Math.round(10 * weight + 6.25 * height - 5 * (user?.edad || 26) - 161);
    const newTdee = Math.round(newBmr * 1.55);

    updateProfile({
      peso: weight,
      altura: height,
      imc,
      metabolismo_base: newBmr,
      calorias_diarias: newTdee
    });

    showToast(`✓ Datos actualizados: ${weight} kg · IMC ${imc} kg/m².`);
  };

  const handleAddMeal = (newMeal) => {
    // Guarda de forma persistente la comida en el MealContext y en localStorage
    addMeal(newMeal);
    showToast(`✓ Comida "${newMeal.nombre}" (${newMeal.calorias} kcal) añadida y registrada con éxito.`);
  };

  const handleUpdateMetricsFromChat = (newParams) => {
    updateProfile({
      peso: newParams.weight,
      altura: newParams.height,
      imc: newParams.imc,
      calorias_diarias: newParams.tdee
    });
  };

  const metricsForComponents = {
    weight: user?.peso || 63.8,
    height: user?.altura || 168,
    imc: user?.imc || 22.4,
    tdee: user?.calorias_diarias || 2150,
    bmr: user?.metabolismo_base || 1410,
    targetCalories: user?.calorias_diarias || 2150,
  };

  return (
    <div className="min-h-screen bg-[#0A100D] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500/30 selection:text-white">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userMetrics={metricsForComponents}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        {/* Header Superior Fijo */}
        <Header
          userMetrics={metricsForComponents}
          onOpenWeightModal={() => setIsWeightModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Área de Contenido Principal según la pestaña activa */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              userMetrics={metricsForComponents}
              onOpenWeightModal={() => setIsWeightModalOpen(true)}
              onOpenMealModal={() => setIsMealModalOpen(true)}
              onNavigateToDietPlan={() => setActiveTab('diet-plan')}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'diet-plan' && (
            <DietPlanView
              userMetrics={metricsForComponents}
              onOpenMealModal={() => setIsMealModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              userMetrics={metricsForComponents}
              onUpdateMetrics={handleUpdateMetricsFromChat}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'foods' && (
            <FoodsView
              onShowToast={showToast}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'admin-users' && (
            <RoleGate allowedRoles={[1]} showWarning={true}>
              <AdminUsersView
                onShowToast={showToast}
              />
            </RoleGate>
          )}
        </main>

        {/* Footer simple y limpio */}
        <footer className="border-t border-[#1F332A] py-6 px-8 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-300">NutrIA</span>
              <span>—</span>
              <span>Nutrición Inteligente y Alimentación Saludable</span>
            </div>
            <div className="text-[11px] text-slate-500">
              © 2026 NutrIA. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Flotante */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-[#121C18] border border-emerald-500/50 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <p className="text-xs font-semibold text-slate-200 leading-snug">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            aria-label="Cerrar notificación"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Modales Globales */}
      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={metricsForComponents.weight}
        currentHeight={metricsForComponents.height}
        onSave={handleSaveWeight}
      />

      <MealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onAddMeal={handleAddMeal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MealProvider>
        <AppContent />
      </MealProvider>
    </AuthProvider>
  );
}
