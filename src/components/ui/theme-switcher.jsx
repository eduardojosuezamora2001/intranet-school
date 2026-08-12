import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Trees, Palette, Check, ChevronDown } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const icons = {
    Sun: Sun,
    Moon: Moon,
    Trees: Trees,
    Palette: Palette
  };

  const currentThemeObj = availableThemes.find((t) => t.id === theme) || availableThemes[0];
  const CurrentIcon = icons[currentThemeObj.icon] || Sun;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
        title="Cambiar tema visual de la interfaz"
      >
        <CurrentIcon className="w-4 h-4 text-indigo-400" />
        <span className="hidden md:inline">{currentThemeObj.name}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
            Temas Visuales
          </div>
          {availableThemes.map((t) => {
            const Icon = icons[t.icon] || Sun;
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition-colors cursor-pointer ${
                  isSelected ? 'text-indigo-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${t.badgeColor} border border-white/20`} />
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
