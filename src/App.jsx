import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Comunicados } from './pages/Comunicados';
import { Calificaciones } from './pages/Calificaciones';
import { Asistencia } from './pages/Asistencia';
import { Usuarios } from './pages/Usuarios';
import { BaseDatos } from './pages/BaseDatos';
import { GraduationCap } from 'lucide-react';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 animate-bounce">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-300">Cargando base de datos SQLite (WASM)...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setTab={setCurrentTab} />;
      case 'comunicados':
        return <Comunicados />;
      case 'calificaciones':
        return <Calificaciones />;
      case 'asistencia':
        return <Asistencia />;
      case 'usuarios':
        return <Usuarios />;
      case 'base_datos':
        return <BaseDatos />;
      default:
        return <Dashboard setTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors duration-200">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} setTab={setCurrentTab} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

