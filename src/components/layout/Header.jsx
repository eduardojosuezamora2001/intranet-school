import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { exportSqliteFile } from '../../services/db';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ThemeSwitcher } from '../ui/theme-switcher';
import { GraduationCap, Download, LogOut, User, Database } from 'lucide-react';

export function Header() {
  const { currentUser, userRole, logout, studentInfo, linkedStudents, selectedStudentId, setSelectedStudentId } = useAuth();

  const roleBadgeMap = {
    administracion: <Badge variant="admin">Administración</Badge>,
    docente: <Badge variant="docente">Docente</Badge>,
    estudiante_familia: <Badge variant="familia">Estudiante / Familia</Badge>
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white m-0 p-0 leading-tight">
              Instituto Educativo San Martín
            </h1>
            <p className="text-[11px] text-slate-400 m-0 p-0 tracking-wide uppercase font-medium">
              Intranet Escolar Client-Side (SQLite WASM)
            </p>
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center space-x-3">
          {/* Theme Selector */}
          <ThemeSwitcher />

          {/* Export SQLite Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportSqliteFile}
            className="hidden sm:inline-flex bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            title="Descargar archivo .sqlite actual guardado en IndexedDB"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Exportar BD (.sqlite)
          </Button>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-indigo-300 font-semibold text-xs border border-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-white leading-tight">
                  {currentUser?.nombre}
                </span>
                {roleBadgeMap[userRole]}
              </div>
              {linkedStudents.length > 1 ? (
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[11px] text-indigo-300 font-medium">Estudiante:</span>
                  <select
                    value={selectedStudentId || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-slate-900 border border-indigo-500/50 text-indigo-200 text-[11px] rounded px-1.5 py-0.5 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  >
                    {linkedStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nombre} ({st.curso})
                      </option>
                    ))}
                  </select>
                </div>
              ) : studentInfo ? (
                <span className="text-[11px] text-indigo-300 block">
                  Tutor de: {studentInfo.nombre} ({studentInfo.curso})
                </span>
              ) : null}
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
