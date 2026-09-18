import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, CheckCircle2, Clock, ArrowLeft, Bike, DollarSign, User, Phone, MapPin, CheckCheck, AlertCircle, Trash2, History } from 'lucide-react';

export function PanelAdmin({ onVolver }: { onVolver: () => void }) {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'PENDIENTE' | 'APROBADO' | 'EN_CAMINO' | 'COMPLETADO'>('TODAS');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const cargarOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        setOrdenes(data);
      }
    } catch (e) {
      console.error('Error al cargar órdenes:', e);
    }
  };

  useEffect(() => {
    cargarOrdenes();

    const channel = supabase
      .channel('admin-ordenes-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        cargarOrdenes();
      })
      .subscribe();

    const intervalo = setInterval(() => {
      cargarOrdenes();
    }, 2500);

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(channel);
    };
  }, []);

  const actualizarEstado = async (id: string, nuevoEstado: string, motorizadoActual?: string) => {
    try {
      const payload: any = { estado: nuevoEstado };

      // Si se marca como COMPLETADO desde el admin y no tenía motorizado previo, podemos dejarlo o asignarlo si aplica
      const { error } = await supabase
        .from('ordenes')
        .update(payload)
        .eq('id', id);

      if (!error) {
        cargarOrdenes();
      } else {
        alert('Error al actualizar el estado de la orden');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Función para limpiar/eliminar todas las órdenes y reiniciar pruebas
  const limpiarTodasLasOrdenes = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar TODAS las órdenes de la base de datos para reiniciar las pruebas?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('ordenes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (!error) {
        setOrdenes([]);
        alert('¡Panel limpiado con éxito para nuevas pruebas!');
      } else {
        const { error: err2 } = await supabase
          .from('ordenes')
          .delete()
          .gte('id', 0);
        if (!err2) {
          setOrdenes([]);
          alert('¡Panel limpiado con éxito!');
        } else {
          alert('Error al limpiar las órdenes. Verifica permisos de Supabase.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const ordenesActivas = ordenes.filter(o => o.estado !== 'COMPLETADO');
  const ordenesCompletadas = ordenes.filter(o => o.estado === 'COMPLETADO');

  const ordenesFiltradas = ordenesActivas.filter(o => {
    if (filtro === 'TODAS') return true;
    return o.estado === filtro;
  });

  return (
    <div className="min-h-screen bg-[#030712] p-4 sm:p-6 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Cabecera del Panel */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 p-3.5 rounded-2xl shadow-inner">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Panel de Administración</h1>
              <p className="text-xs text-slate-400">Control de pagos, motorizados asignados y estatus de servicios</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={limpiarTodasLasOrdenes}
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Borrar todas las órdenes para reiniciar pruebas"
            >
              <Trash2 size={14} /> Limpiar Pruebas
            </button>
            <button
              onClick={onVolver}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={14} /> Inicio
            </button>
          </div>
        </div>

        {/* Botón y Sección de Historial de Servicios Realizados */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <History size={16} className="text-indigo-400" />
            <span>Servicios completados guardados: <strong className="text-white">{ordenesCompletadas.length}</strong></span>
          </div>
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            {mostrarHistorial ? 'Ocultar Historial' : 'Ver Historial de Servicios Realizados'}
          </button>
        </div>

        {/* CONTENEDOR DE HISTORIAL (Desplegable) */}
        {mostrarHistorial && (
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Historial de Servicios Realizados con Éxito</h3>
            {ordenesCompletadas.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No hay servicios completados en el historial todavía.</p>
            ) : (
              <div className="space-y-2">
                {ordenesCompletadas.map((ord) => (
                  <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ord.cliente_nombre}</span>
                        <span className="text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded font-medium">{ord.tipo_servicio}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Tel: {ord.cliente_telefono}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-300 font-bold">
                          <Bike size={12} /> Motorizado: {ord.motorizado_asignado && ord.motorizado_asignado.trim() !== '' ? ord.motorizado_asignado : 'Asignación Directa / Admin'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-slate-400">Ref: {ord.referencia_pago}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold text-[10px]">
                        Completado ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 border border-slate-800/80 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 px-2">Filtrar activas:</span>
          {(['TODAS', 'PENDIENTE', 'APROBADO', 'EN_CAMINO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtro === f 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {f === 'TODAS' ? 'Todas Activas' : f === 'EN_CAMINO' ? 'En Camino' : f}
            </button>
          ))}
        </div>

        {/* Listado de Órdenes Activas */}
        <div className="space-y-4">
          {ordenesFiltradas.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-16 text-center text-slate-500 text-xs">
              No hay servicios activos en este filtro. El panel principal se encuentra limpio.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ordenesFiltradas.map((orden) => (
                <div key={orden.id} className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">

                  {/* Fila superior */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-indigo-400">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-sm">{orden.cliente_nombre}</h3>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">ID: {orden.id.slice(0, 6)}</span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Phone size={12} className="text-indigo-400" /> {orden.cliente_telefono} | <span className="text-indigo-300 font-semibold">{orden.tipo_servicio}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {orden.estado === 'PENDIENTE' && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full">
                          <Clock size={12} /> Pago Pendiente
                        </span>
                      )}
                      {orden.estado === 'APROBADO' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Pago Aprobado (Libre)
                        </span>
                      )}
                      {orden.estado === 'EN_CAMINO' && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full">
                          <Bike size={12} /> En Camino
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={12} className="text-emerald-400" /> Pago Reportado
                      </div>
                      <div className="text-xs text-white font-medium">Método: <span className="text-slate-300">{orden.metodo_pago || 'Pago Móvil'}</span></div>
                      <div className="text-xs font-mono text-indigo-300 font-bold">Ref: {orden.referencia_pago || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Bike size={12} /> Motorizado Asignado
                      </div>
                      {orden.motorizado_asignado ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {orden.motorizado_asignado}
                          </div>
                          <div className="text-[10px] text-slate-400">Atendiendo servicio</div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic pt-1">Ningún motorizado lo ha tomado.</div>
                      )}
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} className="text-rose-400" /> Coordenadas GPS
                      </div>
                      {orden.latitud && orden.longitud ? (
                        <div className="font-mono text-[10px] text-slate-300 truncate">Lat: {Number(orden.latitud).toFixed(4)}, Lon: {Number(orden.longitud).toFixed(4)}</div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">Sin ubicación exacta</div>
                      )}
                      {orden.detalles && <div className="text-[11px] text-slate-300 truncate">Nota: {orden.detalles}</div>}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Cambiar estatus:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {orden.estado !== 'APROBADO' && (
                        <button
                          onClick={() => actualizarEstado(orden.id, 'APROBADO')}
                          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} /> Aprobar Pago
                        </button>
                      )}
                      {orden.estado !== 'PENDIENTE' && (
                        <button
                          onClick={() => actualizarEstado(orden.id, 'PENDIENTE')}
                          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <AlertCircle size={13} /> Marcar Pendiente
                        </button>
                      )}
                      <button
                        onClick={() => actualizarEstado(orden.id, 'COMPLETADO')}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck size={13} /> Marcar Realizado (Al Historial)
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}