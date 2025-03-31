// src/pages/metrix2/statistics.tsx
"use client";

interface MetricsData {
    balance?: number;
    averageWin?: number;
    averageLoss?: number;
    trades?: number;
    lostTradesPercent?: number;
    equity?: number;
    wonTradesPercent?: number;
    lots?: number;
    wonTrades?: number;
    lostTrades?: number;
    brokerInitialBalance?: number | string;
    phase?: number | string;
    profitFactor?: number;
    expectancy?: number;
    deposits?: number;
}

export default function Component({ data = {} as MetricsData }) {
    // Usar el balance inicial del broker como capital, con varias opciones de fallback
    const initialCapital = typeof data.brokerInitialBalance === 'number' 
        ? data.brokerInitialBalance 
        : (data.deposits || data.equity || data.balance || 0);

    // Obtener valores directamente de los datos principales
    const tradesCount = data.trades || 0;
    const avgWin = data.averageWin || 0;
    const avgLoss = data.averageLoss || 0;
    const wonTradesPercent = data.wonTradesPercent || 0;
    const lots = data.lots || 0;
    
    // Calcular el RRR (Reward Risk Ratio)
    const rrr = avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : 0;
    
    // Usar expectancy calculada o calcularla si no está disponible
    const expectancy = data.expectancy !== undefined ? data.expectancy : 
        ((wonTradesPercent / 100 * avgWin) - ((100 - wonTradesPercent) / 100 * Math.abs(avgLoss)));
    
    // Usar el profit factor desde los datos o calcular una aproximación
    const profitFactor = data.profitFactor || 
        ((data.wonTrades || 0) * avgWin) / (Math.abs((data.lostTrades || 1) * avgLoss || 1));

    // Función para formatear valores numéricos a 2 decimales
    const formatValue = (value: number) => {
        return value.toFixed(2);
    };

    const metrics = [
        { label: "Capital:", value: `$${formatValue(initialCapital)}` },
        { label: "Beneficio promedio:", value: `$${formatValue(avgWin)}` },
        { label: "Balance:", value: `$${formatValue(data.balance ?? 0)}` },
        { label: "Pérdida promedio:", value: `$${formatValue(Math.abs(avgLoss))}` },
        { label: "No. de trades:", value: tradesCount },  // Sin decimales porque es un contador
        { label: "RRR Promedio:", value: formatValue(rrr) },
        { label: "Lotes:", value: formatValue(lots) },
        { label: "Expectativa:", value: formatValue(expectancy) },
        { label: "Tasa de éxito:", value: `${formatValue(wonTradesPercent)}%` },
        { label: "Coeficiente de Beneficio:", value: formatValue(profitFactor) },
    ];

    return (
        <div className="border-gray-200 border-2 dark:border-zinc-900 dark:shadow-black bg-white rounded-md shadow-md dark:bg-zinc-900  dark:text-white">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {metrics.map(({ label, value }, index) => (
              <li
                key={index}
                className={`flex flex-col px-6 py-4 ${
                  index < metrics.length - 2
                    ? "border-b border-gray-300 dark:border-zinc-500 w-full"
                    : ""
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