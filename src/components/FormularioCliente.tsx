import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface FormularioClienteProps {
  onVolver: () => void;
  onOrdenCreada: (id: string) => void;
}

export const FormularioCliente: React.FC<FormularioClienteProps> = ({ onVolver, onOrdenCreada }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    tipoServicio: 'Carrera Express (Mototaxi)',
    monto: '3.00',
    bancoEmisor: 'Banesco (0134)',
    cedula: '',
    referencia: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('ordenes')
        .insert([
          {
            cliente_nombre: formData.nombre,
            cliente_telefono: formData.telefono,
            tipo_servicio: formData.tipoServicio,
            monto: parseFloat(formData.monto),
            metodo_pago: `Pago Móvil (${formData.bancoEmisor})`,
            cedula_pagador: formData.cedula,
            referencia_pago: formData.referencia,
            estado: 'PENDIENTE', // <--- Corregido: entra como PENDIENTE para que el admin lo apruebe
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data && data.id) {
        onOrdenCreada(data.id);
      }
    } catch (error: any) {
      console.error('Error al enviar la solicitud:', error.message);
      alert('Hubo un error al enviar la solicitud. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-black text-white">Solicitar Servicio Express</h2>
          <p className="text-xs text-slate-400">Completa los datos de pago móvil y envío</p>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Ej: Carlos Pérez"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Ej: 04141234567"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Servicio</label>
          <select
            value={formData.tipoServicio}
            onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="Carrera Express (Mototaxi)">Carrera Express (Mototaxi)</option>
            <option value="Envios / Delivery">Envios / Delivery</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Monto (USD)</label>
          <select
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          >
            <option value="3.00">Carrera Corta - $3.00</option>
            <option value="5.00">Carrera Larga - $5.00</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Banco Emisor</label>
          <select
            value={formData.bancoEmisor}
            onChange={(e) => setFormData({ ...formData, bancoEmisor: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="Banesco (0134)">Banesco (0134)</option>
            <option value="Mercantil (0105)">Mercantil (0105)</option>
            <option value="Provincial (0108)">Provincial (0108)</option>
            <option value="Otro Banco">Otro Banco</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Cédula del Pagador</label>
          <input
            type="text"
            value={formData.cedula}
            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Ej: 12345678"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Últimos Ref. Pago Móvil</label>
          <input
            type="text"
            value={formData.referencia}
            onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Ej: 4567"
            maxLength={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading ? 'Enviando solicitud...' : 'Registrar Pago y Solicitar Servicio'}
        </button>
      </form>
    </div>
  );
};