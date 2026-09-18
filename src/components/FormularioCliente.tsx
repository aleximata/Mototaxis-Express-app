import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UbicacionCliente } from './UbicacionCliente';
import { Bike, Send, CheckCircle2, ArrowLeft, DollarSign, CreditCard, User, Phone, FileText, MapPin } from 'lucide-react';

export function FormularioCliente({ onVolver }: { onVolver: () => void }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoServicio, setTipoServicio] = useState('Carrera Express');
  const [montoUsd, setMontoUsd] = useState('');
  const [referencia, setReferencia] = useState('');
  const [banco, setBanco] = useState('Banesco');
  const [cedula, setCedula] = useState('');

  const [ordenCreadaId, setOrdenCreadaId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const tasaBCV = 36.5;
      const montoBs = parseFloat(montoUsd) * tasaBCV;

      const { data, error } = await supabase
        .from('ordenes')
        .insert([
          {
            cliente_nombre: nombre,
            cliente_telefono: telefono,
            tipo_servicio: tipoServicio,
            monto_usd: parseFloat(montoUsd),
            tasa_bcv: tasaBCV,
            monto_bs: montoBs,
            numero_referencia: referencia,
            banco_emisor: banco,
            cedula_emisor: cedula,
            estado: 'PENDIENTE_VERIFICACION'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setOrdenCreadaId(data.id);
      }
    } catch (err: any) {
      alert('Error al crear la orden: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (ordenCreadaId) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6 text-center relative overflow-hidden">

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex justify-center pt-2">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 text-slate-950">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">¡Solicitud Registrada!</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Tu pago móvil ha sido enviado para verificación. Comparte tu ubicación GPS para que el motorizado sepa exactamente dónde buscarte.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <UbicacionCliente ordenId={ordenCreadaId} />
          </div>

          <button
            onClick={onVolver}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 px-4 rounded-2xl shadow-md border border-slate-700 transition-all text-sm cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden my-6">

        {/* Destellos de fondo */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-2xl shadow-inner">
              <Bike size={24} />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-tight">Solicitar Servicio Express</h1>
              <p className="text-[11px] text-slate-400">Completa los datos de pago móvil y envío</p>
            </div>
          </div>
          <button
            onClick={onVolver}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700/60 transition cursor-pointer font-medium"
          >
            <ArrowLeft size={14} /> Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
              <User size={13} className="text-amber-400" /> Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Carlos Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder-slate-600 transition text-xs font-medium"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
              <Phone size={13} className="text-amber-400" /> Teléfono / WhatsApp
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 04141234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder-slate-600 transition text-xs font-medium"
            />
          </div>

          {/* Tipo de Servicio */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
              <Bike size={13} className="text-amber-400" /> Tipo de Servicio
            </label>
            <select
              value={tipoServicio}
              onChange={(e) => setTipoServicio(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 transition text-xs cursor-pointer font-medium"
            >
              <option value="Carrera Express" className="bg-slate-900">Carrera Express (Mototaxi)</option>
              <option value="Encomienda / Envío" className="bg-slate-900">Encomienda / Envío de Paquete</option>
              <option value="Mandaditos" className="bg-slate-900">Mandaditos / Compras</option>
            </select>
          </div>

          {/* Monto y Banco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign size={13} className="text-amber-400" /> Monto (USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ej: 5.00"
                value={montoUsd}
                onChange={(e) => setMontoUsd(e.target.value)}
                className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder-slate-600 transition text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-400" /> Banco Emisor
              </label>
              <select
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 transition text-xs cursor-pointer font-medium"
              >
                <option value="Banesco" className="bg-slate-900">Banesco (0134)</option>
                <option value="Venezuela" className="bg-slate-900">Banco de Venezuela (0102)</option>
                <option value="Provincial" className="bg-slate-900">BBVA Provincial (0108)</option>
                <option value="Mercantil" className="bg-slate-900">Mercantil (0105)</option>
              </select>
            </div>
          </div>

          {/* Cédula y Referencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-amber-400" /> Cédula del Pagador
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder-slate-600 transition text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-amber-400" /> Últimos Ref. Pago Móvil
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 4567"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder-slate-600 transition font-mono text-xs font-medium"
              />
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-amber-500/25 cursor-pointer text-sm transform active:scale-98"
          >
            <Send size={16} />
            <span>{enviando ? 'Registrando...' : 'Registrar Pago y Solicitar Servicio'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}