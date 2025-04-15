// src/pages/prueba/index.js
import React, { useState } from 'react';
import useSWR from 'swr';

// Función fetcher para SWR
const fetcher = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    return res.json();
  });

/**
 * Componente que muestra la visualización de las transacciones financieras.
 * Recibe la data de transacciones ("dealsData") directamente del SDK.
 */
const TradingDealsVisualization = ({ dealsData }) => {
  const deals = dealsData; // Se espera un array con la data de transacciones

  // Calcular la duración del trade (solo para transacciones BUY y SELL)
  const buyDeal = deals.find((deal) => deal.type === 'DEAL_TYPE_BUY');
  const sellDeal = deals.find((deal) => deal.type === 'DEAL_TYPE_SELL');

  let durationMinutes = 0;
  let durationSeconds = 0;
  if (buyDeal && sellDeal) {
    const startTime = new Date(buyDeal.time);
    const endTime = new Date(sellDeal.time);
    const durationMs = endTime - startTime;
    durationMinutes = Math.floor(durationMs / 60000);
    durationSeconds = Math.floor((durationMs % 60000) / 1000);
  }

  // Calcular resultados financieros
  const totalProfit = deals.reduce((sum, deal) => sum + deal.profit, 0);
  const totalCommission = deals.reduce((sum, deal) => sum + deal.commission, 0);
  const netResult = totalProfit + totalCommission;

  // Calcular diferencia de precio y porcentaje de ganancia (para BUY y SELL)
  let priceDifference = 0;
  let percentageGain = 0;
  if (buyDeal && sellDeal) {
    priceDifference = sellDeal.price - buyDeal.price;
    percentageGain = (priceDifference / buyDeal.price) * 100;
  }

  // Función para formatear fechas
  const formatDate = (dateString) => {
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

  // Funciones para determinar colores y estilos (incluyen dark mode)
  const getDealTypeColor = (type) => {
    if (type === 'DEAL_TYPE_BUY') return 'bg-green-100 dark:bg-green-900';
    if (type === 'DEAL_TYPE_SELL') return 'bg-red-100 dark:bg-red-900';
    return 'bg-blue-100 dark:bg-blue-900';
  };

  const getDealTypeTextColor = (type) => {
    if (type === 'DEAL_TYPE_BUY') return 'text-green-700 dark:text-green-300';
    if (type === 'DEAL_TYPE_SELL') return 'text-red-700 dark:text-red-300';
    return 'text-blue-700 dark:text-blue-300';
  };

  const getDealTypeBorderColor = (type) => {
    if (type === 'DEAL_TYPE_BUY') return 'border-green-500';
    if (type === 'DEAL_TYPE_SELL') return 'border-red-500';
    return 'border-blue-500';
  };

  const getDealTypeText = (type) => {
    if (type === 'DEAL_TYPE_BUY') return 'COMPRA';
    if (type === 'DEAL_TYPE_SELL') return 'VENTA';
    if (type === 'DEAL_TYPE_BALANCE') return 'BALANCE';
    return type;
  };

  // Formatear números a 2 decimales
  const formatNumber = (num) => {
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center">Historial de Transacciones Financieras</h1>
      
      {/* Resumen Financiero */}
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Resumen Financiero</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2 lg:col-span-1">
            <p className="font-medium">
              Beneficio Total:{' '}
              <span className={`font-bold ${netResult >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatNumber(netResult)} USD
              </span>
            </p>
            <p className="font-medium">
              Comisiones:{' '}
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatNumber(totalCommission)} USD
              </span>
            </p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="font-medium">
              Movimiento de Precio:{' '}
              <span className={`font-bold ${priceDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatNumber(priceDifference)} USD
              </span>
            </p>
            <p className="font-medium">
              Rendimiento:{' '}
              <span className={`font-bold ${percentageGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {percentageGain.toFixed(4)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Resumen del ciclo de trading (solo si hay transacciones BUY y SELL) */}
      {buyDeal && sellDeal && (
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Ciclo de Trading Completo</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="font-medium">Símbolo: <span className="font-bold">{buyDeal.symbol}</span></p>
              <p className="font-medium">Volumen: <span className="font-bold">{buyDeal.volume}</span></p>
              <p className="font-medium">Precio Entrada: <span className="font-bold">{formatNumber(buyDeal.price)} USD</span></p>
            </div>
            <div>
              <p className="font-medium">Duración: <span className="font-bold">{durationMinutes} min {durationSeconds} seg</span></p>
              <p className="font-medium">Precio Salida: <span className="font-bold">{formatNumber(sellDeal.price)} USD</span></p>
              <p className="font-medium">Beneficio: <span className={`font-bold ${sellDeal.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatNumber(sellDeal.profit)} USD
              </span></p>
            </div>
          </div>
        </div>
      )}

      {/* Línea de Tiempo 
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Línea de Tiempo</h2>
        <div className="relative">
          <div className="absolute h-1 bg-gray-300 dark:bg-gray-600 left-0 right-0 top-6"></div>
          <div className="flex justify-between relative h-14">
            {deals.map((deal, index) => (
              <div key={deal.id} className="relative z-10 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getDealTypeColor(deal.type)} border-2 border-white shadow-md`}>
                  <span className={`font-bold ${getDealTypeTextColor(deal.type)}`}>
                    {index + 1}
                  </span>
                </div>
                <div className={`mt-2 text-sm font-medium ${getDealTypeTextColor(deal.type)}`}>
                  {getDealTypeText(deal.type)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(deal.time)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>*/}

      {/* Detalles de cada transacción */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Detalles de las Transacciones</h2>
        <div className="grid grid-cols-1 gap-4">
          {deals.map((deal) => (
            <div 
              key={deal.id} 
              className={`p-4 rounded-lg shadow-md ${getDealTypeColor(deal.type)} border-l-4 ${getDealTypeBorderColor(deal.type)}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`font-bold ${getDealTypeTextColor(deal.type)}`}>
                  {getDealTypeText(deal.type)}
                </span>
                <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  ID: {deal.id}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Fecha:</span> {formatDate(deal.time)}</p>
                  <p><span className="font-medium">Hora broker:</span> {deal.brokerTime}</p>
                  <p><span className="font-medium">Plataforma:</span> {deal.platform.toUpperCase()}</p>
                  {deal.symbol && <p><span className="font-medium">Símbolo:</span> {deal.symbol}</p>}
                </div>
                {(deal.type === 'DEAL_TYPE_BUY' || deal.type === 'DEAL_TYPE_SELL') && (
                  <div>
                    <p><span className="font-medium">Precio:</span> {formatNumber(deal.price)} USD</p>
                    <p><span className="font-medium">Volumen:</span> {deal.volume}</p>
                    <p><span className="font-medium">Tipo de entrada:</span> {deal.entryType === 'DEAL_ENTRY_IN' ? 'ENTRADA' : 'SALIDA'}</p>
                    <p><span className="font-medium">Razón:</span> {deal.reason === 'DEAL_REASON_MOBILE' ? 'MÓVIL' : deal.reason}</p>
                  </div>
                )}
                <div>
                  <p>
                    <span className="font-medium">Beneficio:</span>{' '}
                    <span className={`ml-1 ${deal.profit > 0 ? 'text-green-600 dark:text-green-400' : deal.profit < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {formatNumber(deal.profit)} USD
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Comisión:</span>{' '}
                    <span className={`ml-1 ${deal.commission < 0 ? 'text-red-600 dark:text-red-400' : deal.commission > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {formatNumber(deal.commission)} USD
                    </span>
                  </p>
                  <p><span className="font-medium">Swap:</span> {formatNumber(deal.swap)} USD</p>
                  {(deal.type === 'DEAL_TYPE_BUY' || deal.type === 'DEAL_TYPE_SELL') && (
                    <p><span className="font-medium">Orden ID:</span> {deal.orderId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección para visualizar la data en JSON */}
      <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-700">
        <h2 className="text-xl font-semibold mb-4">Datos en JSON</h2>
        <pre className="text-xs overflow-x-auto p-2 bg-gray-200 dark:bg-gray-600 rounded">
          {JSON.stringify(deals, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default function Prueba() {
  const [metaId, setMetaId] = useState('');
  const [submittedMetaId, setSubmittedMetaId] = useState('');

  // Se activa la petición solo cuando se ingresa un metaId
  const { data, error } = useSWR(
    submittedMetaId ? `/api/meta-history/${submittedMetaId}` : null,
    fetcher
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputId = e.target.elements.metaId.value.trim();
    if (inputId !== '') {
      setSubmittedMetaId(inputId);
      setMetaId(inputId);
    }
  };

  // Extraer la data de deals del endpoint, considerando que puede venir encapsulada
  const deals = Array.isArray(data?.historyDeals)
    ? data.historyDeals
    : data?.historyDeals?.deals || [];

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">Historial de Cuenta MetaAPI</h1>
        <form onSubmit={handleSubmit} className="mb-8 flex justify-center items-center">
          <input
            type="text"
            name="metaId"
            placeholder="Ingresa el metaId (ej. 1234567890)"
            className="p-2 border border-gray-300 rounded mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={metaId}
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Consultar
          </button>
        </form>

        {error && (
          <div className="mb-4 text-center text-red-600">
            Error: {error.message}
          </div>
        )}
        {submittedMetaId && !data && !error && (
          <div className="mb-4 text-center">Cargando datos...</div>
        )}
        {data && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Resultados para metaId: {data.metaId}</h2>
            <TradingDealsVisualization dealsData={deals} />
          </div>
        )}
      </div>
    </div>
  );
}
