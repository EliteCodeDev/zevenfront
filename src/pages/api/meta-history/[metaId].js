// src/pages/api/meta-history/[metaId].js
import MetaApi from 'metaapi.cloud-sdk';

/**
 * Handler para obtener historial de órdenes y operaciones (deals) de una cuenta MetaApi
 * @param {object} req - Objeto Request de Next.js
 * @param {object} res - Objeto Response de Next.js
 */
export default async function handler(req, res) {
  // Permitimos únicamente método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Tomamos el metaId de los parámetros de la ruta
    const { metaId } = req.query;
    if (!metaId) {
      return res.status(400).json({ error: 'Se requiere un metaId válido' });
    }

    // Inicializamos la librería MetaApi con nuestro token de ambiente
    // y un dominio personalizado en caso de que uses uno (sino, puedes omitirlo o dejarlo vacío).
    const metaApi = new MetaApi(process.env.NEXT_PUBLIC_TOKEN_META_API, {
      domain: process.env.NEXT_PUBLIC_METAAPI_DOMAIN || ''
    });

    // Obtenemos la cuenta de MetaTrader con ese metaId
    const account = await metaApi.metatraderAccountApi.getAccount(metaId);

    // Esperamos a que la cuenta se conecte y sincronice
    await account.waitConnected();
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    // Fecha de corte: últimos 3 meses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Obtenemos historial de órdenes
    const historyOrders = await connection.getHistoryOrdersByTimeRange(
      threeMonthsAgo,
      new Date()
    );

    // Obtenemos historial de deals (operaciones financieras)
    const historyDeals = await connection.getDealsByTimeRange(
      threeMonthsAgo,
      new Date()
    );

    // Devolvemos en la respuesta ambos resultados
    return res.status(200).json({
      success: true,
      metaId,
      historyOrders,
      historyDeals
    });
  } catch (error) {
    console.error('Error al obtener datos de MetaApi:', error);
    return res.status(500).json({
      error: 'Error al obtener datos de MetaApi',
      message: error.message,
      // Para evitar exponer tu stack trace en producción, solo lo mostramos en dev:
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
