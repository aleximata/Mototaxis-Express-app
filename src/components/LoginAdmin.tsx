import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

interface LoginAdminProps {
  onLoginSuccess: () => void;
  onVolver: () => void;
}

export function LoginAdmin({ onLoginSuccess, onVolver }: LoginAdminProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Puedes cambiar la clave de acceso aquí por la que prefieras
  const CLAVE_SECRETA = 'admin2026*';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CLAVE_SECRETA) {
      // Guardar sesión activa en la sesión del navegador
      sessionStorage.setItem('admin_auth', 'true');
      onLoginSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">

        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Lock size={32} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Panel Protegido</h1>
          <p className="text-xs text-slate-400">Ingresa la clave de operador para acceder al sistema central.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <KeyRound size={13} className="text-amber-400" /> Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>Contraseña incorrecta. Inténtalo de nuevo.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} /> Acceder al Panel
          </button>
        </form>

        {/* Botón de volver */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            onClick={onVolver}
            className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5 mx-auto font-medium cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver al Inicio
          </button>
        </div>

      </div>
    </div>
  );
}