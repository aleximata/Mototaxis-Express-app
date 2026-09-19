import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigation, MessageSquare, Clock, CheckCircle2, Bike, Send, Check } from 'lucide-react';

export function UbicacionCliente({ ordenId }: { ordenId: string }) {
  const [orden, setOrden] = useState<any>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);

  useEffect(() => {
    if (!ordenId) return;

    const fetchOrden = async () => {
      const { data } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', ordenId)
        .single();
      if (data) {
        setOrden(data);
        if (data.chat_mensajes && Array.isArray(data.chat_mensajes)) {
          setMensajesChat(data.chat_mensajes);
        }
      }
    };

    fetchOrden();

    const channel = supabase
      .channel(`cliente-orden-${ordenId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ordenes', filter: `id=eq.${ordenId}` }, (payload) => {
        setOrden(payload.new);
        if (payload.new.chat_mensajes && Array.isArray(payload.new.chat_mensajes)) {
          setMensajesChat(payload.new.chat_mensajes);
        }
      })
      .subscribe();

    const intervalo = setInterval(fetchOrden, 2500);

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(channel);
    };
  }, [ordenId]);

  const compartirUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setCargandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const { error } = await supabase
            .from('ordenes')
            .update({ latitud: lat, longitud: lon })
            .eq('id', ordenId);

          if (error) throw error;
          alert('¡Ubicación GPS compartida con éxito con el motorizado!');
        } catch (err) {
          console.error(err);
          alert('Error al actualizar la ubicación en la base de datos.');
        } finally {
          setCargandoUbicacion(false);
        }
      },
      (error) => {
        console.error(error);
        alert('No se pudo obtener tu ubicación. Asegúrate de dar permisos de GPS.');
        setCargandoUbicacion(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const enviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim() || !orden) return;

    const nuevoMsg = {
      remitente: 'cliente',
      autor: orden.cliente_nombre || 'Cliente',
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
        .eq('id', ordenId);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    }
  };

  if (!orden) {
    return <div className="text-center text-xs text-slate-400 py-4">Cargando detalles de tu solicitud...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-400">Estatus Actual:</span>
          {orden.estado === 'PENDIENTE' && (
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <Clock size={12} /> Verificando Pago Móvil...
            </span>
          )}
          {orden.estado === 'APROBADO' && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <CheckCircle2 size={12} /> Pago Aprobado (Buscando Motorizado)
            </span>
          )}
          {orden.estado === 'EN_CAMINO' && (
            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <Bike size={12} /> En Camino ({orden.motorizado_asignado || 'Motorizado'})
            </span>
          )}
          {orden.estado === 'COMPLETADO' && (
            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <Check size={12} /> Servicio Finalizado con Éxito
            </span>
          )}
        </div>

        {(orden.estado === 'APROBADO' || orden.estado === 'EN_CAMINO') && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-slate-300">
              {orden.latitud ? '✅ Tu ubicación GPS ya fue compartida.' : '⚠️ Tu pago fue aprobado. Comparte tu ubicación exacta para que el motorizado llegue rápido:'}
            </p>
            <button
              onClick={compartirUbicacion}
              disabled={cargandoUbicacion}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Navigation size={15} /> {cargandoUbicacion ? 'Obteniendo GPS...' : 'Compartir mi Ubicación GPS Actual'}
            </button>
          </div>
        )}
      </div>

      {orden.estado === 'EN_CAMINO' && (
        <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <MessageSquare size={16} className="text-blue-400" />
            <span className="text-xs font-bold text-white">Chat con el motorizado: {orden.motorizado_asignado}</span>
          </div>

          <div className="h-44 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
            {mensajesChat.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[11px] italic">
                Escribe un mensaje al motorizado para coordinar detalles...
              </div>
            ) : (
              mensajesChat.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.remitente === 'cliente' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-1.5 text-[11px] space-y-0.5 ${
                    m.remitente === 'cliente' 
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    <div className="text-[8px] opacity-75 font-bold">{m.autor} • {m.hora}</div>
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
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <Send size={13} /> Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}