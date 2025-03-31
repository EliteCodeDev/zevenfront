// src/pages/metrix2/grafico.tsx
"use client";
import React, { useEffect, useState } from "react";
import { LineChart } from "@/components/ui/chart-line";

// Definición de interfaces
interface StatisticsDataItem {
  brokerTime: string;
  lastEquity: number;
  [key: string]: any;
}

interface ChartDataItem {
  date: string;
  balance?: number;
  max_drawdown?: number;
  profit_target?: number;
  tooltipBalance?: number;
  tooltipMaxDrawdown?: number;
  tooltipProfitTarget?: number;
  [key: string]: any;
}

interface HorizontalLinesState {
  maxDrawdown: number | null;
  profitTarget: number | null;
}

interface MyPageProps {
  statisticsData: StatisticsDataItem[];
  maxDrawdownAbsolute: number | null;
  profitTargetAbsolute: number | null;
}

export default function MyPage({
  statisticsData,
  maxDrawdownAbsolute,
  profitTargetAbsolute,
}: MyPageProps): JSX.Element {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [horizontalLines, setHorizontalLines] = useState<HorizontalLinesState>({
    maxDrawdown: null,
    profitTarget: null,
  });


  // Formateador del eje Y para moneda
  const yFormatter = (tick: number): string => {
    if (typeof tick === "number") {
      return `$ ${new Intl.NumberFormat("us").format(tick)}`;
    }
    return "";
  };

  useEffect(() => {
    if (!statisticsData || statisticsData.length === 0) return;
    if (maxDrawdownAbsolute == null) return;
    if (profitTargetAbsolute == null) return;

    // Guardar los valores para referencias y leyendas
    setHorizontalLines({
      maxDrawdown: maxDrawdownAbsolute,
      profitTarget: profitTargetAbsolute,
    });

    // Procesar los datos para el gráfico utilizando el enfoque híbrido
    const chartData = processDataForChart(
      statisticsData,
      maxDrawdownAbsolute,
      profitTargetAbsolute
    );
    setData(chartData);
  }, [statisticsData, maxDrawdownAbsolute, profitTargetAbsolute]);

  /**
   * Procesa los datos para el componente LineChart
   * Usamos un enfoque híbrido - series separadas para visualización de líneas
   * pero aseguramos que los tooltips muestren todos los valores
   */
  const processDataForChart = (
    dataArray: StatisticsDataItem[],
    ddAbsolute: number,
    ptAbsolute: number
  ): ChartDataItem[] => {
    if (!dataArray || dataArray.length === 0) return [];

    // Ordenar por fecha/hora
    const sortedData = [...dataArray].sort((a, b) => {
      const dateA = new Date(a.brokerTime).getTime();
      const dateB = new Date(b.brokerTime).getTime();
      return dateA - dateB;
    });

    // Extraer solo los datos de balance
    const balanceData = sortedData.map((item) => {
      const date = item.brokerTime
        ? item.brokerTime.split(" ")[0] // "YYYY-MM-DD"
        : new Date().toISOString().split("T")[0];

      return {
        date,
        balance: item.lastEquity || 0,
      };
    });

    if (balanceData.length === 0) return [];

    // Extraer la primera y última fecha
    const dates = balanceData.map((item) => item.date);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    // 1. Serie completa para balance
    const balanceSeries = balanceData.map((item) => ({
      date: item.date,
      balance: item.balance,
    }));

    // 2. Serie para max_drawdown (solo 2 puntos, inicio y fin)
    const maxDrawdownSeries = [
      { date: firstDate, max_drawdown: ddAbsolute },
      { date: lastDate, max_drawdown: ddAbsolute },
    ];

    // 3. Serie para profit_target (solo 2 puntos, inicio y fin)
    const profitTargetSeries = [
      { date: firstDate, profit_target: ptAbsolute },
      { date: lastDate, profit_target: ptAbsolute },
    ];

    // 4. Serie para tooltips (todos los puntos con todos los valores)
    const tooltipSeries = balanceData.map((item) => ({
      date: item.date,
      tooltipBalance: item.balance,
      tooltipMaxDrawdown: ddAbsolute,
      tooltipProfitTarget: ptAbsolute,
    }));

    // Combinar todas las series
    return [
      ...balanceSeries,
      ...maxDrawdownSeries,
      ...profitTargetSeries,
      ...tooltipSeries,
    ];
  };

  /**
   * Personaliza el tooltip para mostrar solo el balance
   */
  const customTooltipFormatter = (
    dataPoint: any,
    category: string
  ): string | null => {
    // Solo mostrar balance, ocultar las líneas horizontales
    if (category === "balance" && dataPoint.balance !== undefined) {
      return `balance: ${yFormatter(dataPoint.balance)}`;
    }

    // No mostrar nada para max_drawdown y profit_target
    if (category === "max_drawdown" || category === "profit_target") {
      return null;
    }

    // Por defecto
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        No hay datos disponibles para mostrar.
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">
        Evolución del Balance por hora
      </h2>
      <div className="dark:bg-zinc-800  bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
        <LineChart
          data={data}
          index="date"
          
          categories={["balance", "max_drawdown", "profit_target"]}
          yFormatter={yFormatter}
          colors={["#FBBF24", "red", "green"]}
          // Aserción de tipo para incluir todas las props
          {...({
            valueFormatter: customTooltipFormatter,
            showLegend: true,
            showGridLines: true,
            startEndOnly: false,
            showXAxis: true,
            showYAxis: true,
            curveType: "linear",
            connectNulls: true,
            tooltip: {
              shared: false,
              trigger: "item",
              confine: true,
              position: "fixed",
            },
          } as any)}
        />
      </div>
    </>
  );
}
