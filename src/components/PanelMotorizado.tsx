import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bike, MapPin, Navigation, Compass, CheckCircle, MessageSquare, ArrowLeft, Send, Phone, User, ShieldAlert, CheckCheck, Trash2 } from 'lucide-react';

export function PanelMotorizado({ onVolver }: { onVolver: () => void }) {
  const [nombreMotorizado, setNombreMotorizado] = useState(() => localStorage.getItem('moto_nombre') || '');
  const [activo, setActivo] = useState(() => localStorage.getItem('moto_activo') === 'true');
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [chatOrden, setChatOrden] = useState<any | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);

  const cargarOrdenes = async () => {
    try {
      const { data } = await supabase.from('ordenes').select('*');
      if (data) {
        setOrdenes(data);
        if (chatOrden) {
          const ordenActualizada = data.find((o: any) => o.id === chatOrden.id);
          if (ordenActualizada) {
            if (ordenActualizada.estado === 'COMPLETADO') {
              setChatOrden(null);
            } else {
              setChatOrden(ordenActualizada);
              if (ordenActualizada.chat_mensajes && Array.isArray(ordenActualizada.chat_mensajes)) {
                setMensajesChat(ordenActualizada.chat_mensajes);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarOrdenes();

    const channel = supabase
      .channel('motorizado-canal-global-v6')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, (payload: any) => {
        cargarOrdenes();
        if (chatOrden && payload.new && payload.new.id === chatOrden.id) {
          if (payload.new.estado === 'COMPLETADO') {
            setChatOrden(null);
          } else {
            setChatOrden(payload.new);
            if (payload.new.chat_mensajes && Array.isArray(payload.new.chat_mensajes)) {
              setMensajesChat(payload.new.chat_mensajes);
            }
          }
        }
      })
      .subscribe();

    const intervalo = setInterval(() => {
      cargarOrdenes();
    }, 2000);

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(channel);
    };
  }, [chatOrden?.id]);

  const guardarPerfil = (nombre: string, est: boolean) => {
    setNombreMotorizado(nombre);
    setActivo(est);
    localStorage.setItem('moto_nombre', nombre);
    localStorage.setItem('moto_activo', est ? 'true' : 'false');
  };

  const aceptarServicio = async (orden: any) => {
    if (!nombreMotorizado.trim()) {
      alert('Por favor ingresa tu nombre de motorizado primero en la parte superior.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .update({
          estado: 'EN_CAMINO',
          motorizado_asignado: nombreMotorizado
        })
        .eq('id', orden.id)
        .select()
        .single();

      if (!error && data) {
        cargarOrdenes();
        setChatOrden(data);
        if (data.chat_mensajes && Array.isArray(data.chat_mensajes)) {
          setMensajesChat(data.chat_mensajes);
        }
      } else {
        const ordenModificada = { ...orden, estado: 'EN_CAMINO', motorizado_asignado: nombreMotorizado };
        setChatOrden(ordenModificada);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const finalizarServicio = async (ordenId: string) => {
    if (!window.confirm('¿Confirmas que el servicio fue entregado y realizado con éxito? Quedarás disponible para nuevos servicios.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({
          estado: 'COMPLETADO',
          motorizado_asignado: nombreMotorizado || 'Motorizado'
        })
        .eq('id', ordenId);

      if (!error) {
        alert('¡Servicio finalizado con éxito! Has quedado disponible.');
        setChatOrden(null);
        cargarOrdenes();
      } else {
        alert('Error al finalizar el servicio.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const limpiarPruebas = async () => {
    if (!window.confirm('⚠️ ¿Deseas limpiar todas las órdenes para reiniciar las pruebas?')) return;
    try {
      await supabase.from('ordenes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setOrdenes([]);
      setChatOrden(null);
      alert('¡Pruebas reiniciadas!');
    } catch (e) {
      console.error(e);
    }
  };

  const enviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim() || !chatOrden) return;

    const nuevoMsg = {
      remitente: 'motorizado',
      autor: nombreMotorizado || 'Motorizado',
      texto: mensaje.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nuevosMensajes = [...mensajesChat, nuevoMsg];
    setMensajesChat(nuevosMensajes);
    setMensaje('');

    try {
      await supabase
        .from('ordenes')
        .update({ chat_mensajes: nuevosMensajes })
        .eq('id', chatOrden.id);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    }
  };

  const listaOrdenesVisibles = ordenes.filter(o =>
    o.estado === 'APROBADO' || (o.estado === 'EN_CAMINO' && o.motorizado_asignado === nombreMotorizado)
  );

  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-6 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-amber-500/15 border border-amber-500/30 text-amber-400 p-3.5 rounded-2xl shadow-inner">
              <Bike size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Portal de Motorizado</h1>
              <p className="text-xs text-slate-400">Asignación de servicios y chat directo con el cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={limpiarPruebas}
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Trash2 size={13} /> Limpiar Pruebas
            </button>
            <button
              onClick={onVolver}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={14} /> Inicio
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Tu Nombre o Alias de Motorizado</label>
            <input
              type="text"
              value={nombreMotorizado}
              onChange={(e) => guardarPerfil(e.target.value, activo)}
              placeholder="Ej: Carlos Motorizado"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0">
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-300">Estatus Operativo</span>
              <span className={`text-[10px] font-semibold ${activo ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activo ? '● Activo en la zona' : '○ Desconectado'}
              </span>
            </div>
            <button
              onClick={() => guardarPerfil(nombreMotorizado, !activo)}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shadow-md ${
                activo 
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30' 
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
              }`}
            >
              {activo ? 'Desconectarse' : 'Conectarse Online'}
            </button>
          </div>
        </div>

        {chatOrden ? (
          <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Servicio Activo con: {chatOrden.cliente_nombre}</h3>
                  <p className="text-[11px] text-slate-400">Tel: {chatOrden.cliente_telefono} • <span className="text-amber-300 font-semibold">{chatOrden.tipo_servicio}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => finalizarServicio(chatOrden.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <CheckCheck size={14} /> Finalizar con Éxito
                </button>
                <button
                  onClick={() => setChatOrden(null)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer"
                >
                  ← Volver
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              {mensajesChat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  No hay mensajes todavía. Saluda al cliente para coordinar la entrega.
                </div>
              ) : (
                mensajesChat.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.remitente === 'motorizado' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs space-y-1 ${
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

            <form onSubmit={enviarMensajeChat} className="flex gap-2">
              <input
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe un mensaje al cliente..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={14} /> Enviar
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1">Servicios Disponibles en la Zona</h2>
            {!activo ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 text-center text-amber-300 text-xs space-y-2">
                <ShieldAlert size={24} className="mx-auto" />
                <p className="font-bold">Estás desconectado.</p>
                <p className="text-slate-400">Conéctate online para visualizar y aceptar servicios en tu zona.</p>
              </div>
            ) : (
              listaOrdenesVisibles.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-xs">
                  No hay servicios disponibles o activos para ti en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {listaOrdenesVisibles.map((orden) => (
                    <div key={orden.id} className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-amber-400">
                            <User size={16} />
                          </div>
                          <div>
                            <h3 className="font-black text-white text-sm">{orden.cliente_nombre}</h3>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Phone size={11} className="text-amber-400" /> {orden.cliente_telefono} | <span className="text-amber-300 font-semibold">{orden.tipo_servicio}</span>
                            </p>
                          </div>
                        </div>
                        <div>
                          {orden.estado === 'APROBADO' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full">
                              <CheckCircle size={11} /> Disponible para Tomar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full">
                              <Bike size={11} /> Tomado por ti (En Camino)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                          <MapPin size={13} /> Ubicación GPS del Usuario
                        </div>
                        {orden.latitud && orden.longitud ? (
                          <div className="space-y-2">
                            <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                              Lat: <span className="text-white font-bold">{Number(orden.latitud).toFixed(5)}</span> | Lon: <span className="text-white font-bold">{Number(orden.longitud).toFixed(5)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${orden.latitud},${orden.longitud}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition text-[11px]"
                              >
                                <Navigation size={12} /> Google Maps
                              </a>
                              <a
                                href={`https://waze.com/ul?ll=${orden.latitud},${orden.longitud}&navigate=yes`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-bold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition text-[11px]"
                              >
                                <Compass size={12} /> Waze
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-[11px] italic py-2 text-center">
                            Esperando coordenadas GPS del cliente...
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                        {orden.estado === 'APROBADO' ? (
                          <button
                            onClick={() => aceptarServicio(orden)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                          >
                            <Bike size={15} /> Aceptar y Tomar Servicio
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setChatOrden(orden);
                                if (orden.chat_mensajes && Array.isArray(orden.chat_mensajes)) {
                                  setMensajesChat(orden.chat_mensajes);
                                } else {
                                  setMensajesChat([]);
                                }
                              }}
                              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare size={14} /> Abrir Chat
                            </button>
                            <button
                              onClick={() => finalizarServicio(orden.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2.5 px-5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                            >
                              <CheckCheck size={15} /> Finalizar con Éxito
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}