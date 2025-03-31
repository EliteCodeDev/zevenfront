// src/pages/historial/StatisticsHistorical.jsx
"use client";

import React from 'react';

/**
 * StatisticsHistorical Component
 * Displays trading statistics from metadata
 * 
 * @param {Object} metadata - Trading metadata
 * @param {string|number} phase - Challenge phase
 * @param {Object} stageConfig - Challenge stage configuration
 * @param {number} brokerInitialBalance - Initial balance from broker
 */
export default function StatisticsHistorical({ metadata, phase, stageConfig, brokerInitialBalance }) {
  // Safely extract data with fallbacks to prevent errors
  const extractData = () => {
    // Handle null or undefined metadata
    if (!metadata) return {};
    
    // Try to find metrics data in different possible locations
    const metricsData = metadata.metrics || metadata;
    
    // Get initial balance from various possible sources
    const initialBalance = 
      brokerInitialBalance || 
      metricsData.deposits || 
      metricsData.initialBalance || 
      10000;
    
    // Extract all needed metrics with fallbacks
    return {
      trades: metricsData.trades || 0,
      wonTrades: metricsData.wonTrades || 0,
      lostTrades: metricsData.lostTrades || 0,
      wonTradesPercent: metricsData.wonTradesPercent || 0,
      lostTradesPercent: metricsData.lostTradesPercent || 0,
      averageWin: metricsData.averageWin || 0,
      averageLoss: metricsData.averageLoss || 0,
      profitFactor: metricsData.profitFactor || 0,
      expectancy: metricsData.expectancy || 0,
      balance: metricsData.balance || initialBalance,
      equity: metricsData.equity || initialBalance,
      profit: metricsData.profit || 0,
      lots: metricsData.lots || 0,
      pips: metricsData.pips || 0,
      initialBalance: initialBalance
    };
  };

  // Get processed data
  const data = extractData();
  
  // Calculate derived metrics
  const rrr = Math.abs(data.averageLoss) !== 0 
    ? (data.averageWin / Math.abs(data.averageLoss)).toFixed(2) 
    : "N/A";
  
  // If expectancy isn't provided, calculate it
  const calculatedExpectancy = data.wonTradesPercent && data.averageWin && data.averageLoss 
    ? ((data.wonTradesPercent / 100 * data.averageWin) - 
       ((100 - data.wonTradesPercent) / 100 * Math.abs(data.averageLoss))).toFixed(2)
    : "N/A";
  
  // Use provided expectancy or calculated value
  const expectancyValue = data.expectancy ? data.expectancy.toFixed(2) : calculatedExpectancy;

  // Format to 2 decimal places for display
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  // Define metrics to display
  const metrics = [
    { label: "Capital:", value: `$${formatValue(data.initialBalance)}` },
    { label: "Beneficio promedio:", value: `$${formatValue(data.averageWin)}` },
    { label: "Balance:", value: `$${formatValue(data.balance)}` },
    { label: "Pérdida promedio:", value: `$${formatValue(Math.abs(data.averageLoss))}` },
    { label: "No. de trades:", value: data.trades },
    { label: "RRR Promedio:", value: rrr },
    { label: "Lotes:", value: formatValue(data.lots) },
    { label: "Expectativa:", value: expectancyValue },
    { label: "Tasa de éxito:", value: `${formatValue(data.wonTradesPercent)}%` },
    { label: "Coeficiente de Beneficio:", value: formatValue(data.profitFactor) },
  ];

  return (
    <div className="border-gray-200 border-2 dark:border-zinc-800 dark:shadow-black bg-white rounded-md shadow-md dark:bg-zinc-800 dark:text-white">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {metrics.map(({ label, value }, index) => (
          <li
            key={index}
            className={`flex flex-col px-6 py-4 ${
              index < metrics.length - 2 ? "border-b border-gray-300 dark:border-zinc-500 w-full" : ""
            }`}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-left mt-0.5">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}