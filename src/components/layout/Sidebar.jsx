import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/button';
import {
  LayoutDashboard,
  Megaphone,
  Award,
  CalendarCheck,
  Users,
  Database,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const { userRole, isAdmin, isDocente, isFamilia } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Panel General',
      icon: LayoutDashboard,
      roles: ['administracion', 'docente', 'estudiante_familia']
    },
    {
      id: 'comunicados',
      label: 'Tablón Comunicados',
      icon: Megaphone,
      roles: ['administracion', 'docente', 'estudiante_familia']
    },
    {
      id: 'calificaciones',
      label: isFamilia ? 'Mis Calificaciones' : 'Gestión de Notas',
      icon: Award,
      roles: ['administracion', 'docente', 'estudiante_familia']
    },
    {
      id: 'asistencia',
      label: isFamilia ? 'Mi Asistencia' : 'Control de Asistencia',
      icon: CalendarCheck,
      roles: ['administracion', 'docente', 'estudiante_familia']
    },
    {
      id: 'usuarios',
      label: 'Gestión Usuarios',
      icon: Users,
      roles: ['administracion']
    },
    {
      id: 'base_datos',
      label: 'Administración BD',
      icon: Database,
      roles: ['administracion']
    }
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="p-4 space-y-6">
        {/* Navigation Group Header */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Navegación Principal
          </p>
          <nav className="space-y-1">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-700 rounded-l-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-indigo-700" : "text-slate-400")} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security & Client-Side Notice */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs text-slate-600 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SQLite client-side</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Los datos se procesan localmente en WebAssembly y se persisten en su navegador (IndexedDB).
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        Instituto San Martín v1.0.0 &copy; 2026
      </div>
    </aside>
  );
}
