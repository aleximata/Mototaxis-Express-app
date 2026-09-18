import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Tarifa {
  id: string;
  tipo: string;
  nombre: string;
  precio: number;
}

export const PanelCarreras: React.FC = () => {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<string>('carrera_corta');
  const [loading, setLoading] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  // 1. Cargar las tarifas desde Supabase al iniciar
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setLoading(true);

        // Obtener tarifas de la base de datos
        const { data: tarifasData, error: tarifasError } = await supabase
          .from('tarifas_carrera')
          .select('*');

        if (tarifasError) throw tarifasError;
        if (tarifasData) setTarifas(tarifasData);

        // Obtener la preferencia actual de la usuaria autenticada
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('tarifa_seleccionada')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData?.tarifa_seleccionada) {
            setCarreraSeleccionada(profileData.tarifa_seleccionada);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatosIniciales();
  }, []);

  // 2. Manejar la selección y actualizar en Supabase
  const handleSeleccion = async (tipo: string) => {
    setCarreraSeleccionada(tipo);
    setGuardando(true);
    setMensajeFeedback(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ tarifa_seleccionada: tipo })
          .eq('id', user.id);

        if (error) throw error;
        setMensajeFeedback('Preferencia guardada exitosamente.');
      } else {
        setMensajeFeedback('Selección actualizada (Modo local / No autenticada).');
      }
    } catch (err) {
      console.error('Error al guardar la selección:', err);
      setMensajeFeedback('Error al guardar los cambios.');
    } finally {
      setGuardando(false);
      // Ocultar mensaje de feedback despues de 3 segundos
      setTimeout(() => setMensajeFeedback(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 text-gray-500 font-medium">
        Cargando opciones de carreras...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tipo de Servicio</h2>
          <p className="text-sm text-gray-500">Selecciona la tarifa aplicable para tu traslado.</p>
        </div>
        <div className="flex items-center space-x-2">
          {guardando && (
            <span className="text-xs text-blue-600 font-semibold animate-pulse">
              Guardando...
            </span>
          )}
          {mensajeFeedback && !guardando && (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              {mensajeFeedback}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tarifas.map((tarifa) => {
          const isSelected = carreraSeleccionada === tarifa.tipo;
          return (
            <div
              key={tarifa.id}
              onClick={() => handleSeleccion(tarifa.tipo)}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{tarifa.nombre}</h3>
                  <span className="text-2xl font-black text-blue-600">
                    ${Number(tarifa.precio).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {tarifa.tipo === 'carrera_corta'
                    ? 'Tarifa fija orientada a traslados cercanos dentro del área urbana.'
                    : 'Tarifa extendida para recorridos largos o zonas periféricas.'}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="tipo_carrera"
                    checked={isSelected}
                    onChange={() => handleSeleccion(tarifa.tipo)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    {isSelected ? 'Carrera Seleccionada' : 'Seleccionar tarifa'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};