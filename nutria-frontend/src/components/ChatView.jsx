import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Scale,
  Flame,
  Apple,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  SlidersHorizontal
} from 'lucide-react';
import { apiService } from '../services/api';

export default function ChatView({ userMetrics, onUpdateMetrics, onShowToast }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: 'Ahora',
      text: '¡Hola! Soy tu asistente nutricional de NutrIA. ¿En qué te puedo ayudar hoy? Puedo darte ideas para tus comidas, sugerirte recetas saludables según tus metas o ayudarte a calcular tus macronutrientes.'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Preferencias sencillas
  const [goal, setGoal] = useState('Mantener y tonificar');
  const [exclusions, setExclusions] = useState(['Sin Mariscos', 'Sin Lactosa']);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (customText) => {
    const textToSend = typeof customText === 'string' ? customText : inputMessage;
    if (!textToSend || !textToSend.trim() || isTyping) return;

    const trimmed = textToSend.trim();

    // Agregar mensaje del usuario
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await apiService.sendChatMessage(trimmed, {
        exclusions,
        metrics_override: {
          peso: userMetrics?.weight || 63.8,
          altura: userMetrics?.height || 168,
          objetivo: goal,
          tdee: userMetrics?.targetCalories || 2150,
          imc: userMetrics?.imc || 22.4
        }
      });

      if (res && res.data && res.data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: res.data.reply
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: '¡Aquí estoy! Cuéntame qué ingredientes tienes a mano y te daré una receta balanceada ajustada a tu meta calórica.'
          }
        ]);
      }
    } catch (err) {
      console.warn('Error al procesar mensaje de chat:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Para tu meta de calorías, una excelente opción es combinar una fuente de proteína magra (pollo o pescado), carbohidratos complejos (arroz o batata) y abundantes vegetales verdes.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    '¿Qué puedo cenar ligero y rico hoy?',
    'Dame una idea de desayuno alto en proteína',
    '¿Qué merienda me ayuda si tengo antojo dulce?',
    '¿Cómo aumentar mi consumo de agua?'
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#121C18] border border-[#1F332A] rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Encabezado del Chat */}
      <div className="p-4 md:p-6 border-b border-[#1F332A] bg-[#0F1715] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              Asistente Nutricional IA
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-300">
              Respuestas prácticas, recetas y consejos de alimentación en tiempo real.
            </p>
          </div>
        </div>

        {/* Resumen de meta calórica */}
        <div className="hidden sm:flex items-center gap-2 bg-[#162520] border border-[#1F332A] px-3 py-1.5 rounded-xl text-xs">
          <Flame size={14} className="text-emerald-400" />
          <span className="text-slate-300">Meta:</span>
          <span className="font-bold text-white">{userMetrics?.targetCalories || 2150} kcal</span>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                <Bot size={16} />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-900/30 font-medium'
                  : 'bg-[#0F1715] border border-[#1F332A] text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {/* Formato de párrafos */}
              <div className="whitespace-pre-line text-sm">
                {msg.text}
              </div>
              <div
                className={`text-[10px] mt-2 font-medium ${
                  msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.time}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 mt-1 text-xs">
                Tú
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-[#0F1715] border border-[#1F332A] rounded-2xl rounded-bl-none p-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Nutri está pensando una respuesta balanceada...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas Rápidas sugeridas */}
      <div className="px-4 py-2 bg-[#0F1715] border-t border-[#1F332A]/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
          <Sparkles size={12} className="text-emerald-400" /> Sugerencias:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="py-1 px-3 rounded-lg bg-[#13221C] border border-[#1F332A] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs whitespace-nowrap transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Barra de Entrada de Texto */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 md:p-4 bg-[#0F1715] border-t border-[#1F332A] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Escribe tu consulta nutricional (ej. ¿Qué puedo preparar con pechuga de pollo y arroz?)..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isTyping}
          aria-label="Escribe tu mensaje para el asistente"
          className="flex-1 bg-[#13221C] border border-[#1F332A] focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm text-white outline-none transition placeholder-slate-400 focus:ring-1 focus:ring-emerald-400"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isTyping}
          aria-label="Enviar mensaje"
          className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
