// src/pages/metrix2/winloss.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WinLoss({ data }) {
  const [chartData, setChartData] = useState({
    wonTradesPercent: 0,
    lostTradesPercent: 0,
    wonBalance: 0,
    lostBalance: 0,
    averageWin: 0,
    averageLoss: 0,
    totalTrades: 0,
    wonTrades: 0,
    lostTrades: 0,
    profitFactor: 0,
    netProfit: 0,
  });

  useEffect(() => {
    if (data) {
      // Extraer los datos con valores por defecto para evitar errores
      const wonTrades = data.wonTrades || 0;
      const lostTrades = data.lostTrades || 0;
      const averageWin = data.averageWin || 0;
      const averageLoss = data.averageLoss || 0;
      const wonTradesPercent = data.wonTradesPercent || 0;
      const lostTradesPercent = data.lostTradesPercent || 0;
      const profitFactor = data.profitFactor || 0;
      const totalProfit = data.profit || 0;

      // Calcular ganancia total y pérdida total
      const wonBalance = wonTrades * averageWin;
      const lostBalance = Math.abs(lostTrades * averageLoss);

      setChartData({
        wonTradesPercent,
        lostTradesPercent,
        wonBalance,
        lostBalance,
        averageWin,
        averageLoss: Math.abs(averageLoss), // Convertir a positivo para mostrar
        totalTrades: wonTrades + lostTrades,
        wonTrades,
        lostTrades,
        profitFactor,
        netProfit: totalProfit,
      });
    }
  }, [data]);

  const noTrades = chartData.totalTrades === 0;

  // Función para formatear números como moneda
  const formatCurrency = (value) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full">
      <Card className="bg-white dark:bg-zinc-900">
        <CardContent className="pt-6">
          {noTrades ? (
            <div className="text-center py-8 text-muted-foreground">
              Without results, no trades have been made.
            </div>
          ) : (
            <>
              {/* Barra de porcentaje Win/Loss */}
              <div className="w-full mb-6">
                <div className="flex justify-between mb-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>
                      Win Rate: {chartData.wonTradesPercent.toFixed(1)}% (
                      {chartData.wonTrades} trades)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>
                      Loss Rate: {chartData.lostTradesPercent.toFixed(1)}% (
                      {chartData.lostTrades} trades)
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                  {/* Porcentaje de Wins */}
                  {chartData.wonTradesPercent > 0 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 text-xs font-medium text-center text-white flex items-center justify-center"
                      style={{
                        width: `${chartData.wonTradesPercent}%`,
                        minWidth:
                          chartData.wonTradesPercent < 10 ? "40px" : "auto",
                      }}
                    >
                      {chartData.wonTradesPercent > 5
                        ? `${chartData.wonTradesPercent.toFixed(1)}%`
                        : ""}
                    </div>
                  )}

                  {/* Porcentaje de Losses */}
                  {chartData.lostTradesPercent > 0 && (
                    <div
                      className="absolute top-0 h-full bg-red-500 text-xs font-medium text-center text-white flex items-center justify-center"
                      style={{
                        left: `${chartData.wonTradesPercent}%`,
                        width: `${chartData.lostTradesPercent}%`,
                        minWidth:
                          chartData.lostTradesPercent < 10 ? "40px" : "auto",
                      }}
                    >
                      {chartData.lostTradesPercent > 5
                        ? `${chartData.lostTradesPercent.toFixed(1)}%`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas de ganancia/pérdida promedio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="text-green-700 dark:text-green-400 font-semibold mb-1">
                    Average Win
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    ${formatCurrency(chartData.averageWin)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Total profit: ${formatCurrency(chartData.wonBalance)}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="text-red-700 dark:text-red-400 font-semibold mb-1">
                    Average Loss
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-300">
                    ${formatCurrency(chartData.averageLoss)}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Total loss: ${formatCurrency(chartData.lostBalance)}
                  </div>
                </div>
              </div>

              {/* Factor de ganancias y beneficio neto */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex justify-between">
                  <div>
                    <div className="text-blue-700 dark:text-blue-400 font-semibold mb-1">
                      Profit Factor
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      {chartData.profitFactor.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      (Ratio Profit/loss)
                    </div>
                  </div>

                  <div>
                    <div className="text-blue-700 dark:text-blue-400 font-semibold mb-1">
                      Net profit
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        chartData.netProfit >= 0
                          ? "text-green-600 dark:text-green-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      ${formatCurrency(chartData.netProfit)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      (Total Profit - Total Loss)
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
