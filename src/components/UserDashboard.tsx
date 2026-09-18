import React from 'react';
import { AdminPanelTarifas } from '../components/AdminPanelTarifas';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Panel de Control (Admin)</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión general del sistema, configuraciones y parámetros globales.</p>
        </div>

        {/* Aquí insertas el panel de administración de tarifas */}
        <AdminPanelTarifas />
      </div>
    </div>
  );
}