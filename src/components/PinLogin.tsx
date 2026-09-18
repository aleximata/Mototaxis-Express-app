import React, { useState } from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';

interface PinLoginProps {
  onLoginSuccess: (usuario: { nombre: string; rol: string }) => void;
  titulo?: string;
}

export function PinLogin({ onLoginSuccess, titulo = "Acceso Restringido" }: PinLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      onLoginSuccess({ nombre: 'Administrador / Central', rol: 'Admin' });
    } else {
      setError('PIN incorrecto. Usa 1234');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-sm mx-auto border border-gray-200 text-center space-y-4">
      <div className="flex justify-center text-amber-500 mb-2">
        <ShieldCheck size={40} />
      </div>

      <h2 className="font-bold text-gray-800 text-base">{titulo}</h2>
      <p className="text-xs text-gray-500">Introduce tu PIN de seguridad (1234) para continuar.</p>

      <form onSubmit={manejarLogin} className="space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <KeyRound size={18} />
          </span>
          <input
            type="password"
            maxLength={6}
            required
            placeholder="PIN (1234)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all cursor-pointer text-sm shadow-sm"
        >
          Entrar al Panel
        </button>
      </form>
    </div>
  );
}