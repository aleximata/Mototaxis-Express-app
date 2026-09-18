import React, { useState } from 'react';
import { FormularioCliente } from './components/FormularioCliente';
import { UbicacionCliente } from './components/UbicacionCliente';
import { PanelAdmin } from './components/PanelAdmin';
import { LoginAdmin } from './components/LoginAdmin';
import { PanelMotorizado } from './components/PanelMotorizado';
import { Shield, Bike, CheckCircle2, ArrowRight, Navigation } from 'lucide-react';

export function App() {
  const [vista, setVista] = useState<'inicio' | 'cliente' | 'exito' | 'login_admin' | 'admin' | 'motorizado'>('inicio');
  const [ordenActivaId, setOrdenActivaId] = useState<string>('');

  const cerrarSesionAdmin = () => {
    sessionStorage.removeItem('admin_auth');
    setVista('inicio');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">

        {vista === 'inicio' && (
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto text-amber-400 shadow-inner animate-pulse">
              <Bike size={40} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Moto Express & Encomiendas</h1>
              <p className="text-xs text-slate-400">Servicio de transporte rápido, delivery y encomiendas en tiempo real.</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setVista('cliente')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 group"
              >
                Solicitar Servicio <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => setVista('motorizado')}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold py-3 px-6 rounded-2xl border border-blue-500/30 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation size={15} /> Portal de Motorizados
              </button>

              <button
                onClick={() => {
                  const autenticado = sessionStorage.getItem('admin_auth') === 'true';
                  setVista(autenticado ? 'admin' : 'login_admin');
                }}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold py-3 px-6 rounded-2xl border border-slate-700/80 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield size={15} className="text-amber-400" /> Panel de Administrador
              </button>
            </div>
          </div>
        )}

        {vista === 'cliente' && (
          <div className="w-full max-w-xl">
            <FormularioCliente
              onVolver={() => setVista('inicio')}
              onOrdenCreada={(id) => {
                setOrdenActivaId(id);
                setVista('exito');
              }}
            />
          </div>
        )}

        {vista === 'exito' && (
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">¡Solicitud Registrada!</h2>
              <p className="text-xs text-slate-400">Tu pago móvil ha sido enviado para verificación. Comparte tu ubicación GPS para que el motorizado sepa exactamente dónde buscarte.</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left">
              <UbicacionCliente ordenId={ordenActivaId} />
            </div>

            <button
              onClick={() => setVista('inicio')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-xl border border-slate-700 transition text-xs cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {vista === 'login_admin' && (
          <LoginAdmin
            onLoginSuccess={() => setVista('admin')}
            onVolver={() => setVista('inicio')}
          />
        )}

        {vista === 'admin' && (
          <div className="w-full">
            <PanelAdmin onVolver={cerrarSesionAdmin} />
          </div>
        )}

        {vista === 'motorizado' && (
          <div className="w-full">
            <PanelMotorizado onVolver={() => setVista('inicio')} />
          </div>
        )}

      </main>

      <footer className="py-4 text-center text-[10px] text-slate-600 font-medium">
        Moto Express Global &copy; 2026 — Todos los derechos reservados.
      </footer>

    </div>
  );
}

export default App;