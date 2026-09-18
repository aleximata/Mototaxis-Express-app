import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TarifaAdmin {
  id: string;
  tipo: string;
  nombre: string;
  precio: number;
  updated_at: string;
}

export const AdminPanelTarifas: React.FC = () => {
  const [tarifas, setTarifas] = useState<TarifaAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // 1. Cargar las tarifas desde Supabase al iniciar el panel de administración
  useEffect(() => {
    fetchTarifas();
  }, []);

  const fetchTarifas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tarifas_carrera')
        .select('*')
        .order('precio', { ascending: true });

      if (error) throw error;
      if (data) setTarifas(data);
    } catch (err) {
      console.error('Error al cargar tarifas:', err);
      setMensajeFeedback({ tipo: 'error', texto: 'No se pudieron cargar las tarifas.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejar el cambio local del precio antes de guardar
  const handlePrecioChange = (id: string, nuevoPrecio: string) => {
    setTarifas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, precio: parseFloat(nuevoPrecio) || 0 } : t))
    );
  };

  // 3. Guardar el precio actualizado en Supabase
  const handleGuardarCambios = async (id: string, tipo: string, precioActualizado: number) => {
    setGuardandoId(id);
    setMensajeFeedback(null);

    try {
      const { error } = await supabase
        .from('tarifas_carrera')
        .update({
          precio: precioActualizado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setMensajeFeedback({
        tipo: 'success',
        texto: `¡Tarifa "${tipo === 'carrera_corta' ? 'Carrera Corta' : 'Carrera Larga'}" actualizada a $${precioActualizado.toFixed(2)}!`
      });

      // Recargar datos para sincronizar marcas de tiempo
      fetchTarifas();
    } catch (err) {
      console.error('Error al actualizar la tarifa:', err);
      setMensajeFeedback({ tipo: 'error', texto: 'Error al actualizar el precio en la base de datos.' });
    } finally {
      setGuardandoId(null);
      setTimeout(() => setMensajeFeedback(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 text-gray-500 font-medium">
        Cargando panel de administración de tarifas...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Panel de Administración - Tarifas</h2>
          <p className="text-sm text-gray-500">Modifica los valores base de las carreras corta y larga en tiempo real.</p>
        </div>
        {mensajeFeedback && (
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
            mensajeFeedback.tipo === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {mensajeFeedback.texto}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Tipo de Servicio</th>
              <th className="py-3 px-4">Identificador</th>
              <th className="py-3 px-4">Precio Actual ($)</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tarifas.map((tarifa) => {
              const isSaving = guardandoId === tarifa.id;
              return (
                <tr key={tarifa.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-gray-800">
                    {tarifa.nombre}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {tarifa.tipo}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative max-w-[140px]">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={tarifa.precio}
                        onChange={(e) => handlePrecioChange(tarifa.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-900"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleGuardarCambios(tarifa.id, tarifa.tipo, Number(tarifa.precio))}
                      disabled={isSaving}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                        isSaving
                          ? 'bg-blue-300 text-white cursor-wait'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                      }`}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};