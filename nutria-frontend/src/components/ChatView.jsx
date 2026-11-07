import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageCircleHeart,
  Flame,
  Sparkles,
  Heart,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';

const INITIAL_WELCOME_MESSAGE = {
  id: 1,
  sender: 'bot',
  time: 'Ahora',
  text: '¡Hola! Soy Nutri, tu compañera de alimentación saludable. ¿Qué te gustaría preparar hoy? Puedo darte ideas para tus comidas, sugerirte recetas con lo que tengas en casa o ayudarte a balancear tus platos.'
};

export default function ChatView({ userId = 'guest', userMetrics, onShowToast }) {
  const storageKey = `nutria_chat_history_${userId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback a mensaje inicial si falla lectura de localStorage
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Ignorar errores de cuota en localStorage
    }
  }, [messages, storageKey]);

  const handleClearChat = () => {
    const resetMessages = [
      {
        ...INITIAL_WELCOME_MESSAGE,
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(resetMessages);
    try {
      localStorage.setItem(storageKey, JSON.stringify(resetMessages));
    } catch {
      // Ignorar
    }
    if (onShowToast) {
      onShowToast('✓ Conversación reiniciada.');
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = typeof customText === 'string' ? customText : inputMessage;
    if (!textToSend || !textToSend.trim() || isTyping) return;

    const trimmed = textToSend.trim();

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed
    };

    const priorHistory = messages
      .filter((m) => m.id !== 1 && !m.isError && m.text)
      .slice(-12)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await apiService.sendChatMessage(trimmed, {
        history: priorHistory,
        metrics_override: {
          peso: userMetrics?.weight || 63.8,
          altura: userMetrics?.height || 168,
          tdee: userMetrics?.targetCalories || 2150,
          imc: userMetrics?.imc || 22.4,
          objetivo: userMetrics?.goal || 'Mantenimiento Saludable',
          scheme: userMetrics?.dietScheme || 'Alta en Proteína'
        }
      });

      if (res && res.ok && res.data && res.data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: res.data.reply,
            model: res.data.model,
            isContingency: Boolean(res.data.mock)
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `⚠️ ${res?.error || 'No se pudo obtener respuesta de NutriaBot. Verifica que el backend esté en ejecución.'}`,
            isError: true
          }
        ]);
      }
    } catch (err) {
      console.warn('Error en chat:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: '⚠️ Error de conexión con el servidor de NutriaBot. Por favor intenta de nuevo en unos segundos.',
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    '¿Qué puedo cenar ligero y rico hoy?',
    'Dame una receta rápida para el desayuno',
    '¿Qué merienda me recomiendas si tengo hambre?',
    'Ideas para comer más vegetales'
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Encabezado Cálido */}
      <div className="p-4 md:p-6 border-b border-[var(--border-card)] bg-[var(--bg-app)]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageCircleHeart size={22} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              Nutri — Tu Guía de Alimentación
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Ideas prácticas de platos, recetas y motivación para tu día.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-card)] px-3 py-1.5 rounded-xl text-xs shadow-sm">
            <Flame size={14} className="text-emerald-500" />
            <span className="text-[var(--text-secondary)]">Tu meta:</span>
            <span className="font-bold text-[var(--text-primary)]">{userMetrics?.targetCalories || 2150} kcal</span>
          </div>

          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              title="Limpiar conversación"
              className="flex items-center gap-1.5 bg-[var(--bg-card)] hover:bg-rose-500/10 border border-[var(--border-card)] hover:border-rose-500/40 text-[var(--text-secondary)] hover:text-rose-400 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm"
            >
              <Trash2 size={14} />
              <span className="hidden md:inline">Limpiar chat</span>
            </button>
          )}
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
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1">
                <Heart size={16} className="fill-emerald-400/20" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none shadow-md font-medium'
                  : 'bg-[var(--bg-card-sub)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line text-sm leading-relaxed font-normal text-[var(--text-primary)]">
                {msg.text}
              </div>
              <div
                className={`text-[10px] mt-2 font-medium ${
                  msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-[var(--text-muted)]'
                }`}
              >
                {msg.time}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 mt-1 text-xs shadow-sm">
                Tú
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Heart size={16} />
            </div>
            <div className="bg-[var(--bg-card-sub)] border border-[var(--border-card)] rounded-2xl rounded-bl-none p-3.5 text-xs text-[var(--text-secondary)] flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Nutri está escribiendo una sugerencia rica y sana...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas Rápidas sugeridas */}
      <div className="px-4 py-2.5 bg-[var(--bg-app)] border-t border-[var(--border-card)] flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-[var(--text-secondary)] font-semibold whitespace-nowrap flex items-center gap-1">
          <Sparkles size={12} className="text-emerald-500" /> Ideas rápidas:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="py-1 px-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-emerald-500 text-[var(--text-primary)] hover:text-emerald-600 dark:hover:text-emerald-400 text-xs whitespace-nowrap transition shadow-sm font-medium"
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
        className="p-3 md:p-4 bg-[var(--bg-card)] border-t border-[var(--border-card)] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Escribe tu pregunta (ej. ¿Qué puedo preparar con huevos y aguacate?)..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isTyping}
          aria-label="Escribe tu mensaje para Nutri"
          className="flex-1 bg-[var(--bg-app)] border border-[var(--border-card)] focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder-[var(--text-muted)] focus:ring-1 focus:ring-emerald-400 shadow-sm"
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
