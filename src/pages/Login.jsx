import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/form-controls';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Alert } from '../components/ui/widgets';
import { GraduationCap, KeyRound, UserCheck, Shield, BookOpen, Users, ArrowRight } from 'lucide-react';

const CREDENTIALS_KEY = 'san_martin_saved_credentials';
const REMEMBER_KEY = 'san_martin_remember';

// Precarga de credenciales guardadas (si el usuario marcó "Recordar usuario")
function loadSavedCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return { username: 'admin', password: 'admin123' };
    const saved = JSON.parse(raw);
    return {
      username: saved.username ?? 'admin',
      password: saved.password ?? 'admin123',
    };
  } catch {
    return { username: 'admin', password: 'admin123' };
  }
}

// Guarda o elimina las credenciales según el estado del checkbox
function saveCredentials(user, pass, remember) {
  try {
    if (remember) {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username: user, password: pass }));
    } else {
      localStorage.removeItem(CREDENTIALS_KEY);
    }
  } catch {
    // Silenciar errores de storage (modo privado, cuota, etc.)
  }
}

export function Login() {
  const { login } = useAuth();
  const initial = loadSavedCredentials();
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState(initial.password);
  const [rememberUser, setRememberUser] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRememberChange = (e) => {
    const checked = e.target.checked;
    setRememberUser(checked);
    try {
      localStorage.setItem(REMEMBER_KEY, String(checked));
      if (!checked) localStorage.removeItem(CREDENTIALS_KEY);
    } catch {
      // Silenciar errores de storage
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      saveCredentials(username, password, rememberUser);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);
    try {
      await login(user, pass);
      saveCredentials(user, pass, rememberUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* School Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 mb-2">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">
            Instituto Educativo San Martín
          </h1>
          <p className="text-xs text-slate-400">
            Acceso a la Intranet Institucional Escolar
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="border-slate-800">
            <CardTitle className="text-white text-center text-lg">Iniciar Sesión</CardTitle>
            <CardDescription className="text-slate-400 text-center text-xs">
              Ingrese sus credenciales registradas en la institución
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <Alert variant="error" title="Error de autenticación">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de usuario
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. admin, docente.garcia1..."
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
             
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={handleRememberChange}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300">
                  Recordar usuario en este equipo
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full h-11 text-sm bg-indigo-600 hover:bg-indigo-500 font-semibold"
              >
                {loading ? 'Verificando...' : 'Ingresar a la Intranet'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="border-t border-slate-800/80 flex flex-col space-y-3 pt-4">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center w-full">
              Atajos de acceso rápido (Cuentas Demo)
            </p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-indigo-400 font-semibold text-xs mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">admin</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('docente.garcia1', 'docente123')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-emerald-400 font-semibold text-xs mb-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Docente</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">docente.garcia1</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('familia.perez1', 'familia123')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1 text-sky-400 font-semibold text-xs mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Familia</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">familia.perez1</p>
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          Prototipo de Intranet Escolar — Ejecutado enteramente en cliente (SQLite WASM)
        </p>
      </div>
    </div>
  );
}
