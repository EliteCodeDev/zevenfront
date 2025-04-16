// src/components/DataAdminViewer.js
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import {
  BarChart,
  Clock,
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Usamos NEXT_PUBLIC_BACKEND_URL definida en tu .env
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Fetcher que añade el header con el token
const fetcherStrapi = (url) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });

export default function DataAdminViewer({ documentId }) {
  const [viewMode, setViewMode] = useState('summary');

  if (!documentId) {
    return <p className="text-gray-600 dark:text-gray-400">No se ha proporcionado un documentId.</p>;
  }

  // Consultamos a la API
  const apiUrl = `${BACKEND_URL}/api/challenges/${documentId}?populate=*`;
  const { data, error } = useSWR(documentId ? apiUrl : null, fetcherStrapi);

  useEffect(() => {
    if (data) {
      console.log("Data recibida de Strapi:", data);
    }
  }, [data]);

  if (error)
    return (
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        <p className="text-red-500">
          Error al cargar dataAdmin: {error.message}
        </p>
      </div>
    );

  if (!data) return (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
      <p className="text-center">Cargando dataAdmin...</p>
    </div>
  );

  // Si data.data es un array, se toma el primer elemento; de lo contrario, se usa directamente.
  const challengeData = Array.isArray(data.data) ? data.data[0] : data.data;

  // Extraer dataAdmin directamente (sin usar attributes)
  const dataAdmin = challengeData?.dataAdmin;

  if (!dataAdmin) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        <p className="text-center">No hay datos en el campo dataAdmin.</p>
      </div>
    );
  }

  // Extraer el array meta_history que está dentro de dataAdmin
  const metaHistory = dataAdmin.meta_history || [];

  // Si no hay datos de historial
  if (!metaHistory || !Array.isArray(metaHistory) || metaHistory.length === 0) {
    return (
      <>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
          Historial de Operaciones
        </h2>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">

          <p className="text-center p-6 text-gray-500 dark:text-gray-400">No se encontró historial de operaciones.</p>
        </div></>
    );
  }

  // Separar órdenes y transacciones (deals)
  const orders = metaHistory.filter(item => item.state !== undefined); // Asumiendo que las órdenes tienen un campo 'state'
  const deals = metaHistory.filter(item => item.type && item.type.includes('DEAL_TYPE')); // Asumiendo que los deals tienen un tipo que incluye 'DEAL_TYPE'

  // Funciones auxiliares
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    return Number(num).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Funciones para determinar colores y estilos basados en el tipo de operación
  const getDealTypeColor = (type) => {
    if (!type) return 'bg-gray-100 dark:bg-gray-700';
    if (type.includes('BUY')) return 'bg-green-100 dark:bg-green-900/20';
    if (type.includes('SELL')) return 'bg-red-100 dark:bg-red-900/20';
    return 'bg-blue-100 dark:bg-blue-900/20';
  };

  const getDealTypeTextColor = (type) => {
    if (!type) return 'text-gray-700 dark:text-gray-300';
    if (type.includes('BUY')) return 'text-green-700 dark:text-green-400';
    if (type.includes('SELL')) return 'text-red-700 dark:text-red-400';
    return 'text-blue-700 dark:text-blue-400';
  };

  const getDealTypeBorderColor = (type) => {
    if (!type) return 'border-gray-500';
    if (type.includes('BUY')) return 'border-green-500';
    if (type.includes('SELL')) return 'border-red-500';
    return 'border-blue-500';
  };

  const getOrderTypeText = (type) => {
    if (!type) return 'DESCONOCIDO';
    if (type.includes('BUY')) return 'COMPRA';
    if (type.includes('SELL')) return 'VENTA';
    if (type.includes('BALANCE')) return 'BALANCE';
    return type;
  };

  // Calcular el total de beneficios y comisiones
  const totalProfit = deals.reduce((sum, deal) => sum + (deal.profit || 0), 0);
  const totalCommission = deals.reduce((sum, deal) => sum + (deal.commission || 0), 0);
  const netResult = totalProfit + totalCommission;

  // Buscar transacciones de compra y venta para analizar
  const buyDeal = deals.find(deal => deal.type && deal.type.includes('BUY'));
  const sellDeal = deals.find(deal => deal.type && deal.type.includes('SELL'));

  // Calcular la duración, diferencia de precio y porcentaje
  let durationMinutes = 0;
  let durationSeconds = 0;
  let priceDifference = 0;
  let percentageGain = 0;

  if (buyDeal && sellDeal) {
    const startTime = new Date(buyDeal.time);
    const endTime = new Date(sellDeal.time);
    const durationMs = endTime - startTime;
    durationMinutes = Math.floor(durationMs / 60000);
    durationSeconds = Math.floor((durationMs % 60000) / 1000);

    priceDifference = (sellDeal.price || 0) - (buyDeal.price || 0);
    percentageGain = buyDeal.price ? (priceDifference / buyDeal.price) * 100 : 0;
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <BarChart className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
        Historial de Operaciones
      </h2>
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">


        {/* Tabs de navegación */}
        <div className="flex border-b border-gray-200 dark:border-zinc-700 mb-4">
          <button
            className={`py-2 px-4 ${viewMode === 'summary' ? 'border-b-2 border-[var(--app-primary)] text-[var(--app-primary)] font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setViewMode('summary')}
          >
            Resumen
          </button>
          <button
            className={`py-2 px-4 ${viewMode === 'orders' ? 'border-b-2 border-[var(--app-primary)] text-[var(--app-primary)] font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setViewMode('orders')}
          >
            Órdenes
          </button>
          <button
            className={`py-2 px-4 ${viewMode === 'deals' ? 'border-b-2 border-[var(--app-primary)] text-[var(--app-primary)] font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setViewMode('deals')}
          >
            Operaciones
          </button>
          <button
            className={`py-2 px-4 ${viewMode === 'json' ? 'border-b-2 border-[var(--app-primary)] text-[var(--app-primary)] font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setViewMode('json')}
          >
            JSON
          </button>
        </div>

        {/* Vista de resumen */}
        {viewMode === 'summary' && (
          <div>
            {/* Resumen Financiero */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-2">Resumen Financiero</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Beneficio Total: <span className={`font-bold ${netResult >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatNumber(netResult)} USD</span></p>
                  <p className="font-medium">Comisiones: <span className="font-bold text-red-600 dark:text-red-400">{formatNumber(totalCommission)} USD</span></p>
                </div>
                <div>
                  <p className="font-medium">Movimiento de Precio: <span className={`font-bold ${priceDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatNumber(priceDifference)} USD</span></p>
                  <p className="font-medium">Rendimiento: <span className={`font-bold ${percentageGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{percentageGain.toFixed(4)}%</span></p>
                </div>
              </div>
            </div>

            {/* Resumen del ciclo de trading (solo si hay compra y venta) */}
            {buyDeal && sellDeal && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Ciclo de Trading Completo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Símbolo: <span className="font-bold">{buyDeal.symbol || '-'}</span></p>
                    <p className="font-medium">Volumen: <span className="font-bold">{buyDeal.volume || '-'}</span></p>
                    <p className="font-medium">Precio Entrada: <span className="font-bold">{formatNumber(buyDeal.price)} USD</span></p>
                  </div>
                  <div>
                    <p className="font-medium">Duración: <span className="font-bold">{durationMinutes} min {durationSeconds} seg</span></p>
                    <p className="font-medium">Precio Salida: <span className="font-bold">{formatNumber(sellDeal.price)} USD</span></p>
                    <p className="font-medium">Beneficio:
                      <span className={`font-bold ml-1 ${sellDeal.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatNumber(sellDeal.profit)} USD
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Línea de tiempo
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Línea de Tiempo</h3>
            <div className="relative">
              {/* Línea base 
              <div className="absolute h-1 bg-gray-300 dark:bg-gray-600 left-0 right-0 top-6"></div>
              
              {/* Transacciones en la línea de tiempo (mostrar máximo 5) 
              <div className="flex justify-between relative h-14">
                {metaHistory.slice(0, 5).map((item, index) => (
                  <div key={index} className="relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getDealTypeColor(item.type)} border-2 border-white dark:border-zinc-700 shadow-md`}>
                      <span className={`font-bold ${getDealTypeTextColor(item.type)}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className={`mt-2 text-xs font-medium ${getDealTypeTextColor(item.type)}`}>
                      {getOrderTypeText(item.type)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(item.time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

            {/* Estadísticas de totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Total de Registros</h3>
                <p className="text-xl font-bold">{metaHistory.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Órdenes</h3>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{orders.length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Operaciones</h3>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{deals.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vista de órdenes */}
        {viewMode === 'orders' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Órdenes ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="text-center p-4 text-gray-500 dark:text-gray-400">No se encontraron órdenes en el historial.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                  <thead className="bg-gray-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Símbolo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volumen</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                    {orders.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{order.id || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${order.type && order.type.includes('BUY')
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                            {getOrderTypeText(order.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{order.symbol || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{order.volume || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(order.time)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${order.state && order.state.includes('FILLED')
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                            {order.state || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vista de operaciones (deals) */}
        {viewMode === 'deals' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Operaciones ({deals.length})</h3>
            {deals.length === 0 ? (
              <p className="text-center p-4 text-gray-500 dark:text-gray-400">No se encontraron operaciones en el historial.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {deals.map((deal, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg shadow-md ${getDealTypeColor(deal.type)} border-l-4 ${getDealTypeBorderColor(deal.type)}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-bold ${getDealTypeTextColor(deal.type)}`}>
                        {getOrderTypeText(deal.type)}
                      </span>
                      <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        ID: {deal.id || index}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Columna 1: Información básica */}
                      <div>
                        <p><span className="font-medium">Fecha:</span> {formatDate(deal.time)}</p>
                        <p><span className="font-medium">Hora broker:</span> {deal.brokerTime || '-'}</p>
                        <p><span className="font-medium">Plataforma:</span> {deal.platform ? deal.platform.toUpperCase() : '-'}</p>
                        {deal.symbol && <p><span className="font-medium">Símbolo:</span> {deal.symbol}</p>}
                      </div>

                      {/* Columna 2: Información de precio y volumen (si aplica) */}
                      {(deal.type === 'DEAL_TYPE_BUY' || deal.type === 'DEAL_TYPE_SELL') && (
                        <div>
                          <p><span className="font-medium">Precio:</span> {formatNumber(deal.price)} USD</p>
                          <p><span className="font-medium">Volumen:</span> {deal.volume || '-'}</p>
                          <p><span className="font-medium">Tipo de entrada:</span> {deal.entryType === 'DEAL_ENTRY_IN' ? 'ENTRADA' : 'SALIDA'}</p>
                          <p><span className="font-medium">Razón:</span> {deal.reason === 'DEAL_REASON_MOBILE' ? 'MÓVIL' : deal.reason || '-'}</p>
                        </div>
                      )}

                      {/* Columna 3: Información financiera */}
                      <div>
                        <p>
                          <span className="font-medium">Beneficio:</span>
                          <span className={`ml-1 ${deal.profit > 0 ? 'text-green-600 dark:text-green-400' : deal.profit < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {formatNumber(deal.profit)} USD
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Comisión:</span>
                          <span className={`ml-1 ${deal.commission < 0 ? 'text-red-600 dark:text-red-400' : deal.commission > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            {formatNumber(deal.commission)} USD
                          </span>
                        </p>
                        <p><span className="font-medium">Swap:</span> {formatNumber(deal.swap)} USD</p>
                        {(deal.type === 'DEAL_TYPE_BUY' || deal.type === 'DEAL_TYPE_SELL') && deal.orderId && (
                          <p><span className="font-medium">Orden ID:</span> {deal.orderId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de JSON (para depuración) */}
        {viewMode === 'json' && (
          <div className="overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Datos JSON</h3>
            <pre className="text-xs overflow-x-auto p-4 bg-gray-100 dark:bg-gray-900 rounded whitespace-pre-wrap">
              {JSON.stringify(metaHistory, null, 2)}
            </pre>
          </div>
        )}
      </div></>
  );
}