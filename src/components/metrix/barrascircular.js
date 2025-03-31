// src/pages/metrix2/barrascircular.js
'use client'
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { MetaStats } from 'metaapi.cloud-sdk';

// Componente CircularProgress (barra circular)
const CircularProgress = ({ percentage = 0, size = 100, strokeWidth = 10, color = "green" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = 0;
    const stepTime = 20;
    const increment = percentage / 50;

    const interval = setInterval(() => {
      start += increment;
      if (start >= percentage) {
        start = percentage;
        clearInterval(interval);
      }
      setProgress(start);
    }, stepTime);

    return () => clearInterval(interval);
  }, [percentage]);

  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Fondo del círculo */}
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#222" strokeWidth={strokeWidth} fill="none" />
      {/* Barra de progreso */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
      />
      {/* Texto del porcentaje */}
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="20" fill={color} fontWeight="bold">
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

// Componente principal Dashboard
const Dashboard = ({ brokerInitialBalance, maxAllowedDrawdownPercent, profitTargetPercent, metricsData }) => {
  const [progressData, setProgressData] = useState({
    target: { value: 0, current: 0, percentage: 0, color: "green", label: "Objetivo de Profit" },
    drawdown: { value: 0, current: 0, percentage: 0, color: "yellow", label: "Drawdown Máximo" },
    profitFactor: { value: 2, current: 0, percentage: 0, color: "blue", label: "Profit Factor" }, // Reemplazando Win Rate
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (!metricsData) {
      setLoading(false);
      setHasData(false);
      return;
    }
    if (!brokerInitialBalance) {
      setLoading(false);
      setHasData(false);
      return;
    }
    if (maxAllowedDrawdownPercent == null) {
      setLoading(false);
      setHasData(false);
      return;
    }
    if (profitTargetPercent == null) {
      setLoading(false);
      setHasData(false);
      return;
    }

    try {
      // Verificar si hay datos válidos para mostrar
      const hasValidData = metricsData && 
                         (metricsData.balance !== undefined || 
                          metricsData.maxDrawdown !== undefined || 
                          metricsData.profitFactor !== undefined);
      
      if (!hasValidData) {
        setHasData(false);
        setLoading(false);
        return;
      }
      
      // Cálculos para las barras circulares
      calculateProgressData(
        brokerInitialBalance, 
        maxAllowedDrawdownPercent, 
        profitTargetPercent, 
        metricsData
      );
      setHasData(true);
      setLoading(false);
    } catch (err) {
      console.error("Error calculando datos de progreso:", err);
      setError(err.message || "Error desconocido");
      setHasData(false);
      setLoading(false);
    }
  }, [brokerInitialBalance, maxAllowedDrawdownPercent, profitTargetPercent, metricsData]);

  /**
   * Combina:
   * - brokerInitialBalance: balance inicial 
   * - maxAllowedDrawdownPercent: máximo drawdown permitido (%)
   * - profitTargetPercent: objetivo de profit permitido (%)
   * - metricsData: datos de MetaAPI (balance actual, maxDrawdown real, profitFactor, etc.)
   */
  const calculateProgressData = (deposit, ddPercent, profitTargetPercent, metricsData) => {
    if (!metricsData) return;

    // 1) Objetivo de Profit:
    //    - Si el balance actual está por debajo del inicial => 0%
    //    - Si está por encima o igual al target => 100%
    //    - En rango intermedio => porcentaje lineal
    const currentBalance = metricsData.balance || deposit;
    const targetValue = deposit + (deposit * profitTargetPercent / 100); // Ej: deposit=10000, profitTarget=10 => 11000

    let profitPercentage = 0;
    if (currentBalance <= deposit) {
      profitPercentage = 0;
    } else if (currentBalance >= targetValue) {
      profitPercentage = 100;
    } else {
      profitPercentage = ((currentBalance - deposit) / (targetValue - deposit)) * 100;
    }
    const cappedProfitPercentage = Math.min(100, Math.max(0, profitPercentage));

    // 2) Drawdown Máximo
    const drawdownAllowed = ddPercent;
    const drawdownReal = metricsData.maxDrawdown || 0; // % real
    let drawdownPercentage = (drawdownReal / drawdownAllowed) * 100;
    const cappedDrawdownPercentage = Math.min(100, Math.max(0, drawdownPercentage));

    // 3) Profit Factor (reemplazando Win Rate)
    // Un profit factor ideal es de 2 o superior (200%)
    const targetProfitFactor = 2;
    const currentProfitFactor = metricsData.profitFactor || 0;
    let profitFactorPercentage = (currentProfitFactor / targetProfitFactor) * 100;
    const cappedProfitFactorPercentage = Math.min(100, Math.max(0, profitFactorPercentage));

    setProgressData({
      // Objetivo de Profit
      // Rojo hasta 40%, amarillo hasta 80%, verde después
      target: {
        value: targetValue,
        current: currentBalance,
        percentage: cappedProfitPercentage,
        color:
          cappedProfitPercentage >= 80 ? "green" :
          cappedProfitPercentage >= 40 ? "yellow" :
          "red",
        label: "Objetivo de Profit"
      },
      // Drawdown Máximo
      // Verde hasta 40%, amarillo hasta 80%, rojo después
      drawdown: {
        value: drawdownAllowed,
        current: drawdownReal,
        percentage: cappedDrawdownPercentage,
        color:
          cappedDrawdownPercentage >= 80 ? "red" :
          cappedDrawdownPercentage >= 40 ? "yellow" :
          "green",
        label: "Drawdown Máximo"
      },
      // Profit Factor
      // Rojo hasta 40%, amarillo hasta 80%, verde después
      profitFactor: {
        value: targetProfitFactor,
        current: currentProfitFactor,
        percentage: cappedProfitFactorPercentage,
        color:
          cappedProfitFactorPercentage >= 80 ? "green" :
          cappedProfitFactorPercentage >= 40 ? "yellow" :
          "red",
        label: "Profit Factor"
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-white bg-black my-6 rounded-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500 bg-black my-6 rounded-md">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center p-4 bg-black rounded-lg shadow-md text-white border-zinc-700 shadow-black my-6">
        No hay datos disponibles para mostrar.
      </div>
    );
  }

  // Definir los colores hexadecimales para cada color
  const getColorHex = (colorName) => {
    switch (colorName) {
      case "green":
        return "#10B981"; // Verde más intenso
      case "yellow":
        return "#F59E0B"; // Amarillo ámbar
      case "red":
        return "#EF4444"; // Rojo más intenso
      default:
        return "#3B82F6"; // Azul por defecto
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-white bg-black my-6 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.keys(progressData).map((key) => {
          const item = progressData[key];
          const textColorClass =
            item.color === "green" ? "text-green-500" :
            item.color === "yellow" ? "text-yellow-500" :
            item.color === "red" ? "text-red-500" :
            "text-blue-500";

          // Formatear la visualización
          let currentDisplay, targetDisplay;
          if (key === "target") {
            // Ej: "$9800.00" / "$10200.00"
            currentDisplay = `$${item.current.toFixed(2)}`;
            targetDisplay = `$${item.value.toFixed(2)}`;
          } else if (key === "drawdown") {
            // Ej: "6.00%" / "10.00%"
            currentDisplay = `${item.current.toFixed(2)}%`;
            targetDisplay = `${item.value.toFixed(2)}%`;
          } else if (key === "profitFactor") {
            // Ej: "1.50" / "2.00"
            currentDisplay = item.current.toFixed(2);
            targetDisplay = item.value.toFixed(2);
          }

          return (
            <div key={key} className="flex gap-4">
              <CircularProgress
                percentage={item.percentage}
                color={getColorHex(item.color)}
              />
              <div>
                <p className="text-gray-400">{item.label}</p>
                <p className="text-xl font-bold">{targetDisplay}</p>
                <p className={textColorClass}>Actual</p>
                <p className={`${textColorClass} font-bold`}>{currentDisplay}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;