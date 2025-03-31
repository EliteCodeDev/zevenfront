// src/pages/consulta-meta.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Componente simple para consumir la API usando el metaId
export default function ConsultaMeta() {
  const router = useRouter();
  const { metaId: urlMetaId } = router.query;

  const [currentMetaId, setCurrentMetaId] = useState('');
  const [inputMetaId, setInputMetaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Inicializar con el metaId de la URL si existe
  useEffect(() => {
    if (urlMetaId) {
      setInputMetaId(urlMetaId);
      setCurrentMetaId(urlMetaId);
    }
  }, [urlMetaId]);

  // Función para obtener los datos
  const fetchMetaStats = async (id) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Llamar a nuestra API route
      const response = await fetch(`/api/meta-stats/${id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error al consultar API:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar datos cuando cambie el metaId actual
  useEffect(() => {
    if (currentMetaId) {
      fetchMetaStats(currentMetaId);
    }
  }, [currentMetaId]);

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMetaId.trim()) {
      setCurrentMetaId(inputMetaId.trim());
      
      // Opcionalmente actualizar la URL sin recargar la página (para bookmarking)
      window.history.pushState({}, '', `?metaId=${inputMetaId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Consulta de MetaStats</h1>

        {/* Formulario para consulta manual */}
        <div className="bg-gray-800 shadow-md rounded-lg p-6 mb-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-grow">
              <input
                type="text"
                value={inputMetaId}
                onChange={(e) => setInputMetaId(e.target.value)}
                placeholder="Ingresa el Meta ID"
                className="w-full px-4 py-2 border bg-gray-700 border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Mostrar resultados */}
        <div className="bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-300">Cargando datos...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                Datos para Meta ID: {data.metaId}
              </h2>
              
              {/* Métricas principales con estilo oscuro */}
              {data.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 p-4 rounded-lg border border-blue-800">
                    <h3 className="font-medium text-blue-400">Balance</h3>
                    <p className="text-2xl font-bold mt-1 text-white">
                      ${data.metrics.balance?.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg border border-green-800">
                    <h3 className="font-medium text-green-400">Profit</h3>
                    <p className={`text-2xl font-bold mt-1 ${
                      data.metrics.profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${data.metrics.profit?.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg border border-purple-800">
                    <h3 className="font-medium text-purple-400">Win Rate</h3>
                    <p className="text-2xl font-bold mt-1 text-white">
                      {data.metrics.wonTradesCount && data.metrics.lostTradesCount 
                        ? `${((data.metrics.wonTradesCount / (data.metrics.wonTradesCount + data.metrics.lostTradesCount)) * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Datos completos en un solo JSON */}
              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-medium mb-4 text-blue-400">Datos Completos (JSON)</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs max-h-96 border border-gray-700 text-gray-300">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {!loading && !error && !data && !currentMetaId && (
            <p className="text-gray-400 text-center py-4">
              Ingresa un Meta ID para consultar sus datos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}