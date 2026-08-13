import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAIResponse } from '../services/aiService';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  User, 
  ChevronDown,
  Compass
} from 'lucide-react';

const TAB_PILLS = {
  dashboard: [
    { label: '📌 ¿Qué hay en esta página?', prompt: '¿Qué puedo hacer en la página actual?' },
    { label: '📊 Mis notas', prompt: 'Ver mis calificaciones' },
    { label: '📅 Asistencia', prompt: 'Ver resumen de asistencia' },
    { label: '📢 Comunicados', prompt: 'Ver últimos comunicados' }
  ],
  comunicados: [
    { label: '📢 Explica este tablón', prompt: '¿Para qué sirve esta página de comunicados?' },
    { label: '📌 Ver avisos fijados', prompt: '¿Qué comunicados están fijados?' },
    { label: '📝 ¿Cómo publicar?', prompt: '¿Cómo publico un aviso en comunicados?' }
  ],
  calificaciones: [
    { label: '📝 Explica esta sección', prompt: '¿Qué puedo hacer en la página de calificaciones?' },
    { label: '📊 Ver mis notas', prompt: 'Ver mi boletín de calificaciones' },
    { label: '⭐ Promedio por materia', prompt: '¿Cuál es mi promedio general?' }
  ],
  asistencia: [
    { label: '📅 Explica esta sección', prompt: '¿Qué información muestra la página de asistencia?' },
    { label: '📋 Récord de inasistencias', prompt: 'Ver mi récord de asistencia' },
    { label: '📝 ¿Cómo justificar?', prompt: '¿Cómo justifico una inasistencia?' }
  ],
  usuarios: [
    { label: '👤 Explica esta sección', prompt: '¿Para qué sirve la gestión de usuarios?' },
    { label: '🔑 Permisos por rol', prompt: '¿Qué diferencia hay entre los roles?' },
    { label: '🔒 Seguridad de claves', prompt: '¿Cómo se guardan las contraseñas?' }
  ],
  base_datos: [
    { label: '💾 Explica esta sección', prompt: '¿Qué ofrece la pestaña de base de datos?' },
    { label: '⚙️ Tecnología SQLite WASM', prompt: 'Explica la arquitectura de SQLite en WebAssembly' },
    { label: '📥 Exportar .sqlite', prompt: '¿Cómo descargar el archivo binario de la base de datos?' }
  ]
};

const TAB_LABELS = {
  dashboard: 'Panel Principal',
  comunicados: 'Comunicados',
  calificaciones: 'Calificaciones',
  asistencia: 'Asistencia',
  usuarios: 'Usuarios',
  base_datos: 'Base de Datos'
};

export function Chatbot({ currentTab = 'dashboard' }) {
  const { currentUser, studentInfo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const activeTabName = TAB_LABELS[currentTab] || 'Página Actual';

  const initialMessage = {
    id: 'welcome',
    sender: 'ai',
    text: `¡Hola ${currentUser?.nombre || 'Usuario'}! 👋 Soy **San Martín IA**.\n\nActualmente estás en **${activeTabName}**.\n¿Qué deseas consultar sobre esta vista o sobre la plataforma?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState([initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const responseText = await getAIResponse(queryText, currentUser, studentInfo, currentTab);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        ...initialMessage,
        id: Date.now().toString(),
        text: `¡Hola ${currentUser?.nombre || 'Usuario'}! 👋 Conversación reiniciada.\n\nEstás en **${activeTabName}**. ¿En qué puedo ayudarte?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;

      // Bold parsing **text**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-indigo-950 dark:text-indigo-200">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_')) {
          return <em key={pIdx} className="italic text-slate-600 dark:text-slate-300">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-700 dark:text-indigo-300">{part.slice(1, -1)}</code>;
        }
        return part;
      });

      return (
        <React.Fragment key={idx}>
          {formattedParts}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const pills = TAB_PILLS[currentTab] || TAB_PILLS.dashboard;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* CHATBOT WINDOW */}
      {isOpen && (
        <div 
          className="pointer-events-auto mb-4 w-80 sm:w-96 h-[520px] max-h-[82vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-indigo-500/30 flex items-center justify-center border border-indigo-300/40 shadow-inner">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700"></span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-semibold text-sm leading-tight text-white">San Martín IA</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/40 text-indigo-100 border border-indigo-400/30">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> IA
                  </span>
                </div>
                <div className="flex items-center text-[10px] text-indigo-100/90 mt-0.5 space-x-1">
                  <Compass className="w-3 h-3 text-indigo-300" />
                  <span className="truncate max-w-[170px]">Vista: {activeTabName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearHistory}
                title="Limpiar conversación"
                className="p-1.5 rounded-lg text-indigo-100/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimizar chatbot"
                className="p-1.5 rounded-lg text-indigo-100/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 dark:bg-slate-950/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="h-7 w-7 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 shadow-sm text-slate-800 dark:text-slate-100 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  <div>{renderFormattedText(msg.text)}</div>
                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user'
                        ? 'text-indigo-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Context-aware Pills */}
            <div className="pt-2">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5 px-1 uppercase tracking-wider">
                Sugerencias para {activeTabName}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pills.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(pill.prompt)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 text-[11px] rounded-full transition-all text-left shadow-2xs"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Typing Animation */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-sm flex items-center space-x-1.5">
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Pregunta sobre ${activeTabName}...`}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-sm shrink-0 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING BUTTON TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Cerrar asistente virtual' : `Abrir San Martín IA (Vista: ${activeTabName})`}
        className="pointer-events-auto relative group flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-400/40"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </span>

        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200 rotate-90" />
        ) : (
          <div className="relative">
            <Bot className="h-7 w-7 transition-transform duration-200 group-hover:rotate-12" />
            <Sparkles className="h-3.5 w-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
