import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, ShieldCheck, Circle } from 'lucide-react';

export function ControlMotorizadosAdmin() {
  const [motorizados, setMotorizados] = useState<any[]>([]);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [codigoNuevo, setCodigoNuevo] = useState('');

  const cargarMotorizados = async () => {
    const { data } = await supabase.from('motorizados').select('*');
    if (data) setMotorizados(data);
  };

  useEffect(() => {
    cargarMotorizados();

    const channel = supabase
      .channel('admin_motorizados_cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'motorizados' }, () => {
        cargarMotorizados();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const registrarMotorizado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo || !codigoNuevo) return;

    const { error } = await supabase.from('motorizados').insert([
      { nombre: nombreNuevo.trim(), codigo: codigoNuevo.trim().toUpperCase(), en_linea: false }
    ]);

    if (error) {
      alert('Error al registrar (es posible que el código ya exista).');
    } else {
      setNombreNuevo('');
      setCodigoNuevo('');
      alert('Motorizado registrado con éxito.');
      cargarMotorizados();
    }
  };

  const motorizadosEnLinea = motorizados.filter((m) => m.en_linea).length;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 text-white mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-black flex items-center gap-2">
            <Users size={18} className="text-amber-400" /> Control de Motorizados
          </h2>
          <p className="text-xs text-slate-400">Gestiona accesos y monitorea personal activo</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-2">
          <Circle size={8} className="fill-emerald-400 animate-pulse" />
          {motorizadosEnLinea} Motorizados en Línea
        </div>
      </div>

      <form onSubmit={registrarMotorizado} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Nombre del Motorizado</label>
          <input
            type="text"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Ej: Carlos Pérez"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Código Asignado</label>
          <input
            type="text"
            value={codigoNuevo}
            onChange={(e) => setCodigoNuevo(e.target.value)}
            placeholder="Ej: MOT-001"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <UserPlus size={14} /> Registrar
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400">Personal Registrado:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {motorizados.map((m) => (
            <div key={m.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center">
              <div>
                <div className="font-bold text-xs text-white">{m.nombre}</div>
                <div className="text-[10px] text-slate-400 font-mono">Código: {m.codigo}</div>
              </div>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                m.en_linea 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-500'
              }`}>
                <ShieldCheck size={12} /> {m.en_linea ? 'En Línea' : 'Desconectado'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}