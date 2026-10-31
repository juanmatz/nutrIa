import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ChatView from './components/ChatView';
import FoodsView from './components/FoodsView';
import AdminUsersView from './components/AdminUsersView';
import WeightModal from './components/WeightModal';
import MealModal from './components/MealModal';
import AuthModal from './components/auth/AuthModal';
import RoleGate from './components/auth/RoleGate';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sparkles, X } from 'lucide-react';

function AppContent() {
  const { user, updateProfile } = useAuth();

  // Pestaña activa ('dashboard', 'chat', 'foods', 'admin-users')
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

    showToast(`✓ Biometría actualizada: ${weight} kg · IMC ${imc} kg/m² sincronizado.`);
  };

  const handleAddMeal = (newMeal) => {
    showToast(`✓ Comida "${newMeal.nombre}" (${newMeal.calorias} kcal) añadida al plan de hoy.`);
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
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-[#00F0A8]/30 selection:text-white">
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
              onNavigateToChat={() => setActiveTab('chat')}
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

        {/* Footer sutil clínico */}
        <footer className="border-t border-[#1F2937]/70 py-6 px-8 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F0A8]" />
              <span className="font-semibold text-slate-300">NutrIA Bio-Platform v4.2</span>
              <span>—</span>
              <span>Nutria Fit: Intelligent Fuel</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Certificación Grado Clínico & Despliegue Seguro Vercel/Django · Todos los derechos reservados © 2026
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Flotante Bioadaptativo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#111827] border border-[#00F0A8]/50 text-white p-4 rounded-2xl shadow-2xl glow-mint flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00F0A8]/20 text-[#00F0A8] flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <p className="text-xs font-semibold text-slate-200 leading-snug">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
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
      <AppContent />
    </AuthProvider>
  );
}
