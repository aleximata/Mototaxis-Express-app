import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CheckCircle, Clock, Bike, ShieldAlert, MessageSquare, Send } from 'lucide-react';

export function UbicacionCliente({ ordenId }: { ordenId: string }) {
  const [estadoOrden, setEstadoOrden] = useState<string>('PENDIENTE_VERIFICACION');
  const [motorizadoAsignado, setMotorizadoAsignado] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [errorGps, setErrorGps] = useState<string | null>(null);

  // Estados para el Chat
  const [mensaje, setMensaje] = useState('');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  const [clienteNombre, setClienteNombre] = useState('Cliente');

  useEffect(() => {
    if (!ordenId) return;

    const cargarDatosOrden = async () => {
      try {
        const { data } = await supabase
          .from('ordenes')
          .select('estado, motorizado_asignado, cliente_nombre, chat_mensajes')
          .eq('id', ordenId)
          .single();

        if (data) {
          setEstadoOrden(data.estado || 'PENDIENTE_VERIFICACION');
          setMotorizadoAsignado(data.motorizado_asignado);
          if (data.cliente_nombre) setClienteNombre(data.cliente_nombre);
          if (data.chat_mensajes && Array.isArray(data.chat_mensajes)) {
            setMensajesChat(data.chat_mensajes);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    cargarDatosOrden();

    // Sincronización continua cada 1.5 segundos para refrescar mensajes y estado
    const intervalo = setInterval(() => {
      cargarDatosOrden();
    }, 1500);

    // Canal en tiempo real de Supabase optimizado
    const channel = supabase
      .channel(`chat-cliente-${ordenId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ordenes', filter: `id=eq.${ordenId}` },
        (payload: any) => {
          if (payload.new) {
            if (payload.new.estado) setEstadoOrden(payload.new.estado);
            if (payload.new.motorizado_asignado) setMotorizadoAsignado(payload.new.motorizado_asignado);
            if (payload.new.chat_mensajes && Array.isArray(payload.new.chat_mensajes)) {
              setMensajesChat(payload.new.chat_mensajes);
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(channel);
    };
  }, [ordenId]);

  const enviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const nuevoMsg = {
      remitente: 'cliente',
      autor: clienteNombre,
      texto: mensaje.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Combinar mensajes actuales con el nuevo mensaje
    const nuevosMensajes = [...mensajesChat, nuevoMsg];

    // Actualizar vista local inmediatamente
    setMensajesChat(nuevosMensajes);
    const textoAEnviar = mensaje;
    setMensaje('');

    try {
      // Guardar en la base de datos de Supabase para que el motorizado lo reciba
      const { error } = await supabase
        .from('ordenes')
        .update({ chat_mensajes: nuevosMensajes })
        .eq('id', ordenId);

      if (error) {
        console.error('Error al guardar mensaje en Supabase:', error);
      }
    } catch (err) {
      console.error('Excepción al enviar mensaje:', err);
    }
  };

  const compartirUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorGps('Tu navegador no soporta geolocalización.');
      return;
    }

    setCompartiendo(true);
    setErrorGps(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          await supabase
            .from('ordenes')
            .update({ latitud: lat, longitud: lon })
            .eq('id', ordenId);

          setCompartiendo(false);
          alert('¡Ubicación GPS sincronizada exitosamente!');
        } catch (err) {
          console.error(err);
          setCompartiendo(false);
          setErrorGps('Error al guardar la ubicación en la nube.');
        }
      },
      (error) => {
        setCompartiendo(false);
        setErrorGps('No se pudo obtener tu ubicación. Da permisos de GPS.');
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">

      {/* Banner de Estado en Tiempo Real */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Estatus de tu Solicitud</div>

        {estadoOrden === 'PENDIENTE_VERIFICACION' && (
          <div className="flex flex-col items-center justify-center gap-1.5 text-amber-400">
            <Clock size={24} className="animate-pulse" />
            <span className="text-xs font-black">Verificando Pago Móvil...</span>
            <p className="text-[11px] text-slate-400">El administrador está validando tu referencia. Esta pantalla se actualizará sola.</p>
          </div>
        )}

        {(estadoOrden === 'APROBADO' || estadoOrden === 'EN_CAMINO') && (
          <div className="flex flex-col items-center justify-center gap-1.5 text-emerald-400">
            <CheckCircle size={24} />
            <span className="text-xs font-black">
              {estadoOrden === 'EN_CAMINO' ? '¡Motorizado en Camino!' : '¡Pago Aprobado con Éxito!'}
            </span>
            <p className="text-[11px] text-slate-300">
              {motorizadoAsignado
                ? `Repartidor: ${motorizadoAsignado}`
                : 'Tu orden ha sido aceptada. Un motorizado la tomará en breve.'}
            </p>
          </div>
        )}

        {estadoOrden === 'RECHAZADO' && (
          <div className="flex flex-col items-center justify-center gap-1.5 text-rose-400">
            <ShieldAlert size={24} />
            <span className="text-xs font-black">Pago No Verificado / Rechazado</span>
            <p className="text-[11px] text-slate-400">Por favor verifica los datos de tu pago móvil.</p>
          </div>
        )}
      </div>

      {/* Cuadro de Chat Sincronizado */}
      {(estadoOrden === 'APROBADO' || estadoOrden === 'EN_CAMINO') && (
        <div className="bg-slate-950/90 border border-blue-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-400">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-black text-white text-xs">
                Chat con Motorizado {motorizadoAsignado ? `(${motorizadoAsignado})` : ''}
              </h3>
              <p className="text-[10px] text-slate-400">Mensajes sincronizados en tiempo real</p>
            </div>
          </div>

          <div className="h-48 overflow-y-auto bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
            {mensajesChat.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[11px] italic">
                Escribe un mensaje para coordinar la entrega con el motorizado.
              </div>
            ) : (
              mensajesChat.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.remitente === 'cliente' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs space-y-0.5 ${
                    m.remitente === 'cliente' 
                      ? 'bg-blue-600 text-white font-medium' 
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
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <Send size={12} /> Enviar
            </button>
          </form>
        </div>
      )}

      {/* Botón de Ubicación GPS */}
      <div className="space-y-2 text-center pt-2">
        <p className="text-xs text-slate-300">
          Para que el motorizado llegue exacto a tu puerta, comparte tu ubicación actual por GPS:
        </p>

        <button
          onClick={compartirUbicacion}
          disabled={compartiendo}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <MapPin size={16} /> {compartiendo ? 'Obteniendo GPS...' : 'Compartir mi Ubicación GPS Actual'}
        </button>

        {errorGps && (
          <p className="text-[11px] text-rose-400 font-medium">{errorGps}</p>
        )}
      </div>

    </div>
  );
}