import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de que la ruta a tu cliente de supabase sea correcta

export const FormularioCliente: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    tipoServicio: 'Carrera Express (Mototaxi)',
    monto: '3.00', // Valor por defecto inicial
    bancoEmisor: 'Banesco (0134)',
    cedula: '',
    referencia: '',
  });

  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensajeExito('');

    try {
      // Inserción de datos en la tabla correspondiente de Supabase
      const { error } = await supabase.from('servicios').insert([
        {
          nombre: formData.nombre,
          telefono: formData.telefono,
          tipo_servicio: formData.tipoServicio,
          monto: parseFloat(formData.monto),
          banco_emisor: formData.bancoEmisor,
          cedula: formData.cedula,
          referencia: formData.referencia,
          estado: 'Pendiente',
        },
      ]);

      if (error) throw error;

      setMensajeExito('¡Solicitud enviada con éxito!');
      setFormData({
        nombre: '',
        telefono: '',
        tipoServicio: 'Carrera Express (Mototaxi)',
        monto: '3.00',
        bancoEmisor: 'Banesco (0134)',
        cedula: '',
        referencia: '',
      });
    } catch (error: any) {
      console.error('Error al enviar la solicitud:', error.message);
      alert('Hubo un error al enviar la solicitud. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 p-6 rounded-xl shadow-xl border border-slate-800 text-white">
      <h2 className="text-2xl font-bold mb-2 text-yellow-400">Solicitar Servicio Express</h2>
      <p className="text-sm text-slate-400 mb-6">Completa los datos de pago móvil y envío</p>

      {mensajeExito && (
        <div className="mb-4 p-3 bg-emerald-900/50 border border-emerald-500 text-emerald-300 rounded-lg text-sm">
          {mensajeExito}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>

        {/* Teléfono / WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono / WhatsApp</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            placeholder="Ej: 04128526545"
            required
          />
        </div>

        {/* Tipo de Servicio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Servicio</label>
          <select
            value={formData.tipoServicio}
            onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          >
            <option value="Carrera Express (Mototaxi)">Carrera Express (Mototaxi)</option>
            <option value="Envios / Delivery">Envios / Delivery</option>
          </select>
        </div>

        {/* Monto (USD) - Selector de Carrera Corta / Larga */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Carrera / Monto (USD)</label>
          <select
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            required
          >
            <option value="3.00">Carrera Corta - $3.00</option>
            <option value="5.00">Carrera Larga - $5.00</option>
          </select>
        </div>

        {/* Banco Emisor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Banco Emisor</label>
          <select
            value={formData.bancoEmisor}
            onChange={(e) => setFormData({ ...formData, bancoEmisor: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
          >
            <option value="Banesco (0134)">Banesco (0134)</option>
            <option value="Mercantil (0105)">Mercantil (0105)</option>
            <option value="Provincial (0108)">Provincial (0108)</option>
            <option value="BOD / Otro">Otro Banco</option>
          </select>
        </div>

        {/* Cédula del Pagador */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cédula del Pagador</label>
          <input
            type="text"
            value={formData.cedula}
            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            placeholder="Ej: 12345678"
            required
          />
        </div>

        {/* Útimos Ref. Pago Móvil */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Últimos Ref. Pago Móvil</label>
          <input
            type="text"
            value={formData.referencia}
            onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            placeholder="Ej: 4567"
            maxLength={4}
            required
          />
        </div>

        {/* Botón de Enviar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 px-4 rounded-lg transition duration-200 mt-4 disabled:opacity-50"
        >
          {loading ? 'Enviando solicitud...' : 'Solicitar Servicio'}
        </button>
      </form>
    </div>
  );
};