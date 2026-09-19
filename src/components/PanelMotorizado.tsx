import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Navigation, Bike, CheckCircle2, LogOut, Lock, AlertCircle, ArrowRight, MapPin, Phone, User, Compass } from 'lucide-react';

interface PanelMotorizadoProps {
  nombreMotorizado: string;
  onCerrarSesion: () => void;
}

export function PanelMotorizado({ nombreMotorizado, onCerrarSesion }: PanelMotorizadoProps) {
  // Estados de Autenticación con PIN
  const [autenticado, setAutenticado] = useState<boolean>(() => {
    return sessionStorage.getItem('motorizado_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState(false);
  const PIN_CORRECTO = '1234';

  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [mapaActivoId, setMapaActivoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);

  // Geolocalización del propio motorizado en tiempo real
  const [miUbicacion, setMiUbicacion] = useState<{ lat: number; lng: number } | null>(null);

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

  const cargarOrdenes = async () => {
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrdenes(data);
    }
  };

  useEffect(() => {
    if (autenticado) {
      cargarOrdenes();

      // Obtener la posición GPS actual del motorizado
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            setMiUbicacion({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (err) => console.error('Error obteniendo GPS:', err),
          { enableHighAccuracy: true }
        );
      }

      const channel = supabase
        .channel('motorizado_ordenes_cambios')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ordenes' },
          () => {
            cargarOrdenes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [autenticado]);

  const aceptarServicioAprobado = async (ordenId: string) => {
    const { error } = await supabase
      .from('ordenes')
      .update({
        estado: 'EN_CAMINO',
        motorizado_asignado: nombreMotorizado,
      })
      .eq('id', ordenId);

    if (error) {
      console.error('Error al tomar el servicio:', error);
      alert('No se pudo aceptar el servicio.');
    } else {
      setChatActivoId(ordenId);
      const ordenActual = ordenes.find((o) => o.id === ordenId);
      setMensajesChat(ordenActual?.chat_mensajes || []);
    }
  };

  const concluirServicio = async (ordenId: string) => {
    const confirmar = window.confirm('¿Estás seguro de que deseas marcar este servicio como concluido?');
    if (!confirmar) return;

    const { error } = await supabase
      .from('ordenes')
      .update({
        estado: 'COMPLETADO',
      })
      .eq('id', ordenId);

    if (error) {
      console.error('Error al concluir el servicio:', error);
      alert('No se pudo actualizar el estatus del servicio.');
    } else {
      if (chatActivoId === ordenId) setChatActivoId(null);
      if (mapaActivoId === ordenId) setMapaActivoId(null);
      cargarOrdenes();
    }
  };

  const manejarSalida = async () => {
    sessionStorage.removeItem('motorizado_auth');
    await supabase
      .from('motorizados')
      .update({ en_linea: false })
      .eq('nombre', nombreMotorizado);

    onCerrarSesion();
  };

  const enviarMensajeChat = async (e: React.FormEvent, ordenId: string) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const ordenActual = ordenes.find((o) => o.id === ordenId);
    const historialActual = ordenActual?.chat_mensajes || [];

    const nuevoMsg = {
      remitente: 'motorizado',
      autor: nombreMotorizado,
      texto: mensaje.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nuevosMensajes = [...historialActual, nuevoMsg];
    setMensajesChat(nuevosMensajes);
    setMensaje('');

    await supabase
      .from('ordenes')
      .update({ chat_mensajes: nuevosMensajes })
      .eq('id', ordenId);
  };

  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-white">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Lock size={30} />
          </div>
          <h2 className="text-xl font-black text-white">Seguridad de Motorizado</h2>
          <p className="text-xs text-slate-400">
            Ingresa el PIN para acceder como <span className="text-amber-400 font-bold">{nombreMotorizado}</span>.
          </p>
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
              <AlertCircle size={16} /> PIN incorrecto. (PIN por defecto: 1234).
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            Desbloquear Panel <ArrowRight size={16} />
          </button>
        </form>

        <button
          onClick={onCerrarSesion}
          className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold py-2.5 rounded-xl border border-slate-700/60 transition text-xs cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  const listaVisible = ordenes.filter(
    (o) =>
      o.estado === 'APROBADO' ||
      (o.estado === 'EN_CAMINO' && o.motorizado_asignado === nombreMotorizado)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl gap-4">
        <div>
          <h1 className="text-lg font-black text-white">Panel de Motorizado</h1>
          <p className="text-xs text-slate-400">
            Conectado como: <span className="text-amber-400 font-bold">{nombreMotorizado}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
            <Bike size={14} /> GPS Activo
          </div>
          <button
            onClick={manejarSalida}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} /> Cerrar Turno
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300">Servicios Listos para Tomar / En Curso:</h2>

        {listaVisible.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2">
            <p className="text-slate-400 font-bold">¡Tu panel está limpio y libre!</p>
            <p className="text-slate-500">Esperando nuevos servicios aprobados para tomar.</p>
          </div>
        ) : (
          listaVisible.map((orden) => (
            <div key={orden.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    <User size={14} className="text-blue-400" /> {orden.cliente_nombre}
                  </h3>
                  <p className="text-xs text-slate-400 pt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Phone size={12} className="text-emerald-400" /> {orden.cliente_telefono}</span>
                    <span>|</span>
                    <span>🛵 {orden.tipo_servicio}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-sm">${orden.monto}</span>
                  <div className="text-[10px] text-slate-400 font-mono">Ref: {orden.referencia_pago}</div>
                </div>
              </div>

              {/* Sección de Ubicación y Navegación en Tiempo Real */}
              {orden.direccion && (
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Dirección de Destino:</strong>
                        <span className="text-slate-400">{orden.direccion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Navegación GPS (Google Maps / Waze) */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(orden.direccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation size={14} /> Abrir en Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(orden.direccion)}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Compass size={14} /> Abrir en Waze
                    </a>
                    <button
                      onClick={() => setMapaActivoId(mapaActivoId === orden.id ? null : orden.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 py-2 px-3 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin size={14} /> {mapaActivoId === orden.id ? 'Ocultar Mapa' : 'Ver Mapa en Vivo'}
                    </button>
                  </div>

                  {/* Vista previa del Mapa Interactivo Integrado */}
                  {mapaActivoId === orden.id && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 h-64 relative bg-slate-950">
                      <iframe
                        title="Mapa de Entrega"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(orden.direccion)}&output=embed`}
                      ></iframe>
                    </div>
                  )}
                </div>
              )}

              {orden.estado === 'APROBADO' && (
                <button
                  onClick={() => aceptarServicioAprobado(orden.id)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                >
                  Aceptar Servicio y Salir en Camino
                </button>
              )}

              {orden.estado === 'EN_CAMINO' && (
                <div className="space-y-4 border-t border-slate-800 pt-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <Navigation size={14} /> En camino a entregar pedido
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setChatActivoId(chatActivoId === orden.id ? null : orden.id);
                          setMensajesChat(orden.chat_mensajes || []);
                        }}
                        className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare size={14} /> {chatActivoId === orden.id ? 'Ocultar Chat' : 'Chat'}
                      </button>

                      <button
                        onClick={() => concluirServicio(orden.id)}
                        className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <CheckCircle2 size={14} /> Concluir Servicio
                      </button>
                    </div>
                  </div>

                  {chatActivoId === orden.id && (
                    <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                      <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                        Chat en vivo con {orden.cliente_nombre}
                      </div>

                      <div className="h-48 overflow-y-auto space-y-2 pr-2">
                        {(!orden.chat_mensajes || orden.chat_mensajes.length === 0) ? (
                          <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                            Inicia la conversación con el cliente...
                          </div>
                        ) : (
                          orden.chat_mensajes.map((m: any, idx: number) => (
                            <div key={idx} className={`flex flex-col ${m.remitente === 'motorizado' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[75%] rounded-xl px-3 py-1.5 text-xs ${
                                m.remitente === 'motorizado'
                                  ? 'bg-amber-500 text-slate-950 font-medium'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}>
                                <div className="text-[9px] opacity-75 font-bold">{m.autor} • {m.hora}</div>
                                <div>{m.texto}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={(e) => enviarMensajeChat(e, orden.id)} className="flex gap-2">
                        <input
                          type="text"
                          value={mensaje}
                          onChange={(e) => setMensaje(e.target.value)}
                          placeholder="Escribe al cliente..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          Enviar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PanelMotorizado;