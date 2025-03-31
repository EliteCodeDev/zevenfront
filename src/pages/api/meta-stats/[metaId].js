// src/pages/api/meta-stats/[metaId].js
import { MetaStats } from 'metaapi.cloud-sdk';

export default async function handler(req, res) {
  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener el metaId de la ruta
    const { metaId } = req.query;

    // Validar que existe el metaId
    if (!metaId) {
      return res.status(400).json({ error: 'Se requiere un metaId válido' });
    }

    // Inicializar el SDK de MetaStats con el token de API
    const metaStats = new MetaStats(process.env.NEXT_PUBLIC_TOKEN_META_API);
    
    // Obtener las métricas para el metaId proporcionado
    const metrics = await metaStats.getMetrics(metaId);

    // También obtenemos el equity-chart para tener datos completos
    const equityChartUrl = `https://risk-management-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${metaId}/equity-chart?realTime=false`;
    
    const equityChartResponse = await fetch(equityChartUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "auth-token": process.env.NEXT_PUBLIC_TOKEN_META_API,
      },
    });

    if (!equityChartResponse.ok) {
      throw new Error(`HTTP error en equity-chart! Status: ${equityChartResponse.status}`);
    }

    const equityChartData = await equityChartResponse.json();

    // Devolver ambos conjuntos de datos en la respuesta
    return res.status(200).json({
      success: true,
      metaId,
      metrics,
      equityChart: equityChartData
    });
  } catch (error) {
    console.error('Error al obtener los datos de MetaStats:', error);
    
    // Devolver un mensaje de error detallado
    return res.status(500).json({
      error: 'Error al obtener datos de MetaStats',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}