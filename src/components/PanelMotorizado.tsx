import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Navigation, Bike, CheckCircle2 } from 'lucide-react';

interface PanelMotorizadoProps {
  nombreMotorizado: string;
}

export function PanelMotorizado({ nombreMotorizado }: PanelMotorizadoProps) {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);

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
    cargarOrdenes();

    const channel = supabase
      .channel('motorizado_ordenes_cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ordenes' },
        (payload) => {
          console.log('Cambio detectado en órdenes:', payload);
          cargarOrdenes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // El motorizado acepta una orden APROBADA y pasa a EN_CAMINO
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

  // NUEVO: Marcar el servicio como concluido/completado y limpiar el panel
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
      // Cierra el chat activo si era el de esta orden y recarga
      if (chatActivoId === ordenId) {
        setChatActivoId(null);
      }
      cargarOrdenes();
    }
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

  // FILTRO: Solo muestra las APROBADAS (libres) o las EN_CAMINO de este motorizado.
  // Al marcarse como COMPLETADO, desaparece automáticamente de su vista dejándolo libre.
  const listaVisible = ordenes.filter(
    (o) =>
      o.estado === 'APROBADO' ||
      (o.estado === 'EN_CAMINO' && o.motorizado_asignado === nombreMotorizado)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-white">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-lg font-black text-white">Panel de Motorizado</h1>
          <p className="text-xs text-slate-400">
            Conectado como: <span className="text-amber-400 font-bold">{nombreMotorizado}</span>
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
          <Bike size={14} /> Disponible / En línea
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
                  <h3 className="font-black text-sm text-white">{orden.cliente_nombre}</h3>
                  <p className="text-xs text-slate-400">
                    📞 {orden.cliente_telefono} | 🛵 {orden.tipo_servicio}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-sm">${orden.monto}</span>
                  <div className="text-[10px] text-slate-400 font-mono">Pago Aprobado (Ref: {orden.referencia_pago})</div>
                </div>
              </div>

              {/* Si está APROBADO: Botón para tomar servicio */}
              {orden.estado === 'APROBADO' && (
                <button
                  onClick={() => aceptarServicioAprobado(orden.id)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                >
                  Aceptar Servicio y Salir en Camino
                </button>
              )}

              {/* Si ya está EN_CAMINO: Opciones de Chat y Concluir Servicio */}
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

                  {/* Caja del Chat en Tiempo Real */}
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