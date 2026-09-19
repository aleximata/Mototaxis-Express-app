import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bike, CheckCircle2, Clock, MapPin, Phone, User, LogOut, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface Orden {
  id: string;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  detalles_pedido: string;
  referencia_pago: string;
  estado: string;
  motorizado_asignado?: string;
  created_at: string;
}

interface PanelMotorizadoProps {
  onVolver: () => void;
}

export function PanelMotorizado({ onVolver }: PanelMotorizadoProps) {
  const [autenticado, setAutenticado] = useState<boolean>(() => {
    return sessionStorage.getItem('motorizado_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'aprobados' | 'en_camino' | 'completados'>('aprobados');

  // PIN de acceso para motorizados (puedes cambiarlo aquí si deseas)
  const PIN_CORRECTO = '1234';

  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CORRECTO) {
      sessionStorage.setItem('motorizado_auth', 'true');
      setAutenticado(true);
      setErrorPin(false);
    } else {
      setErrorPin(true);
      setPin('');
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem('motorizado_auth');
    setAutenticado(false);
    setPin('');
  };

  const cargarOrdenesMotorizado = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrdenes(data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      cargarOrdenesMotorizado();
      // Suscripción en tiempo real para nuevas órdenes o cambios de estado
      const channel = supabase
        .channel('motorizado_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
          cargarOrdenesMotorizado();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [autenticado]);

  const cambiarEstadoOrden = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      cargarOrdenesMotorizado();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('No se pudo actualizar el estado de la orden.');
    }
  };

  // Si no está autenticado, mostramos la pantalla de acceso con PIN
  if (!autenticado) {
    return (
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Lock size={30} />
          </div>
          <h2 className="text-xl font-black text-white">Portal de Motorizados</h2>
          <p className="text-xs text-slate-400">Ingrese el PIN de acceso asignado para ver las entregas disponibles.</p>
        </div>

        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">PIN de Acceso</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-white focus:outline-none focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          {errorPin && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              <AlertCircle size={16} /> PIN incorrecto. Intente nuevamente (PIN por defecto: 1234).
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            Ingresar <ArrowRight size={16} />
          </button>
        </form>

        <button
          onClick={onVolver}
          className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold py-2.5 rounded-xl border border-slate-700/60 transition text-xs cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // Filtrar órdenes según la pestaña seleccionada
  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtroEstado === 'aprobados') return o.estado === 'aprobado' || o.estado === 'pagado';
    if (filtroEstado === 'en_camino') return o.estado === 'en_camino';
    if (filtroEstado === 'completados') return o.estado === 'completado';
    return true; // 'todos'
  });

  return (
    <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
            <Bike size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Panel de Motorizados</h2>
            <p className="text-xs text-slate-400">Gestión de entregas y rutas activas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={cerrarSesion}
            className="flex-1 sm:flex-none bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2 px-4 rounded-xl border border-rose-500/20 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
          <button
            onClick={onVolver}
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl border border-slate-700 transition text-xs cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex flex-wrap gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setFiltroEstado('aprobados')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            filtroEstado === 'aprobados' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          Disponibles / Aprobados
        </button>
        <button
          onClick={() => setFiltroEstado('en_camino')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            filtroEstado === 'en_camino' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          En Camino
        </button>
        <button
          onClick={() => setFiltroEstado('completados')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            filtroEstado === 'completados' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          Completadas
        </button>
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            filtroEstado === 'todos' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Listado de Órdenes */}
      {cargando ? (
        <div className="text-center py-12 text-slate-500 text-xs animate-pulse">Cargando entregas...</div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2">
          <Clock className="mx-auto text-slate-600" size={32} />
          <p className="text-xs text-slate-400 font-medium">No hay entregas en esta sección en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {ordenesFiltradas.map((orden) => (
            <div
              key={orden.id}
              className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                    ID: {orden.id.slice(0, 8)}...
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      orden.estado === 'completado'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : orden.estado === 'en_camino'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {orden.estado.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(orden.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <User size={13} className="text-blue-400" /> Cliente:
                  </div>
                  <p className="text-white font-medium pl-5">{orden.nombre_cliente}</p>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold pt-1">
                    <Phone size={13} className="text-emerald-400" /> Teléfono:
                  </div>
                  <a href={`tel:${orden.telefono}`} className="text-emerald-400 hover:underline font-medium pl-5 block">
                    {orden.telefono}
                  </a>
                </div>

                <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <MapPin size={13} className="text-rose-400" /> Dirección de Entrega:
                  </div>
                  <p className="text-white font-medium pl-5">{orden.direccion}</p>
                  <div className="text-slate-400 font-bold pt-1">Detalles del Servicio:</div>
                  <p className="text-slate-300 pl{-5}">{orden.detalles_pedido}</p>
                </div>
              </div>

              {/* Botones de Acción para el Motorizado */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
                {orden.estado !== 'en_camino' && orden.estado !== 'completado' && (
                  <button
                    onClick={() => cambiarEstadoOrden(orden.id, 'en_camino')}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    <Bike size={14} /> Tomar Pedido / En Camino
                  </button>
                )}

                {orden.estado === 'en_camino' && (
                  <button
                    onClick={() => cambiarEstadoOrden(orden.id, 'completado')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                  >
                    <CheckCircle2 size={14} /> Marcar como Completado / Entregado
                  </button>
                )}

                {orden.estado === 'completado' && (
                  <div className="w-full text-center py-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    ✓ Entrega finalizada con éxito
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PanelMotorizado;