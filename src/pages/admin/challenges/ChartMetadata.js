// src/pages/historial/ChartMetadata.jsx
'use client'
import React, { useEffect, useState } from 'react'
import { LineChart } from '@/components/ui/chart-line'

const ChartMetadata = ({ metadata, stageConfig, initialBalance }) => {
    const [chartData, setChartData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Formateador del eje Y para moneda
    const yFormatter = (tick) => {
        if (typeof tick === 'number') {
            return `$ ${new Intl.NumberFormat('us').format(tick)}`
        }
        return ''
    }

    // Personalizador del tooltip para mostrar solo el balance
    const customTooltipFormatter = (dataPoint, category) => {
        // Solo mostrar balance, ocultar las líneas horizontales
        if (category === 'balance' && dataPoint.balance !== undefined) {
            return `Balance: ${yFormatter(dataPoint.balance)}`
        }

        // No mostrar nada para max_drawdown y profit_target en tooltip
        if (category === 'max_drawdown' || category === 'profit_target') {
            return null
        }

        // Por defecto
        return null
    }

    useEffect(() => {
        if (!metadata) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Determinar si los datos están en metrics o directamente en metadata
            const metrics = metadata.metrics || metadata

            // Obtener el balance inicial
            // Prioridad: 1. valor pasado como prop, 2. valor en metrics.deposits, 3. valor por defecto
            const baseBalance = initialBalance || metrics.deposits || 10000

            // Obtener los valores de profit target y max drawdown del stageConfig
            // Si no están disponibles, usar valores por defecto
            let profitTargetPercent = 10;  // Valor por defecto: 10%
            let maxDrawdownPercent = 10;   // Valor por defecto: 10%

            if (stageConfig) {
                // Buscar valores en diferentes ubicaciones posibles
                if (typeof stageConfig.profitTarget === 'number') {
                    profitTargetPercent = stageConfig.profitTarget;
                } else if (stageConfig.targets && typeof stageConfig.targets.profit_target === 'number') {
                    profitTargetPercent = stageConfig.targets.profit_target;
                } else if (typeof stageConfig.profitTargetPercent === 'number') {
                    profitTargetPercent = stageConfig.profitTargetPercent;
                }

                // Para max drawdown, buscar valores en diferentes ubicaciones
                if (typeof stageConfig.maximumTotalLoss === 'number') {
                    maxDrawdownPercent = stageConfig.maximumTotalLoss;
                } else if (typeof stageConfig.maximumDailyLoss === 'number') {
                    maxDrawdownPercent = stageConfig.maximumDailyLoss;
                } else if (typeof stageConfig.maxDrawdownPercent === 'number') {
                    maxDrawdownPercent = stageConfig.maxDrawdownPercent;
                } else if (stageConfig.targets) {
                    if (typeof stageConfig.targets.max_loss === 'number') {
                        maxDrawdownPercent = stageConfig.targets.max_loss;
                    } else if (typeof stageConfig.targets.max_daily_loss === 'number') {
                        maxDrawdownPercent = stageConfig.targets.max_daily_loss;
                    }
                }
            }

            // Cálculo de valores absolutos para líneas horizontales
            const maxDrawdownAbsolute = baseBalance * (1 - maxDrawdownPercent / 100);
            const profitTargetAbsolute = baseBalance * (1 + profitTargetPercent / 100);

            // Priorizar el uso de equityChart si está disponible
            if (metadata.equityChart && metadata.equityChart.length > 0) {
                const processedData = processDataForChart(
                    metadata.equityChart,
                    maxDrawdownAbsolute,
                    profitTargetAbsolute,
                    'brokerTime', // clave de tiempo en equityChart
                    'lastBalance' // clave de balance en equityChart
                )
                setChartData(processedData)
            }
            // Si no hay equityChart pero hay dailyGrowth, usarlo
            else if (metrics.dailyGrowth && metrics.dailyGrowth.length > 0) {
                const processedData = processDataForChart(
                    metrics.dailyGrowth,
                    maxDrawdownAbsolute,
                    profitTargetAbsolute,
                    'date', // clave de tiempo en dailyGrowth
                    'balance' // clave de balance en dailyGrowth
                )
                setChartData(processedData)
            }
            // Si no hay suficientes datos, generar datos de ejemplo
            else {
                console.warn("No hay datos suficientes para el gráfico, usando valores simulados")
                const sampleData = generateSampleDataForChart(
                    baseBalance,
                    maxDrawdownAbsolute,
                    profitTargetAbsolute
                )
                setChartData(sampleData)
            }

            setLoading(false)
        } catch (err) {
            console.error("Error procesando datos para el gráfico:", err)
            setError(err.message || "Error desconocido")
            setLoading(false)
        }
    }, [metadata, stageConfig, initialBalance])

    /**
     * Procesa los datos para el componente LineChart con líneas horizontales completas
     * Usa enfoque similar al del componente de metrix2/grafico.tsx
     */
    const processDataForChart = (
        dataArray,
        ddAbsolute,
        ptAbsolute,
        dateKey = 'date',
        balanceKey = 'balance'
    ) => {
        if (!dataArray || dataArray.length === 0) return []

        // Ordenar por fecha/hora
        const sortedData = [...dataArray].sort((a, b) => {
            // Manejar diferentes formatos de fecha
            const dateAStr = a[dateKey];
            const dateBStr = b[dateKey];

            // Convertir a objetos Date
            const dateA = new Date(dateAStr).getTime()
            const dateB = new Date(dateBStr).getTime()
            return dateA - dateB
        })

        // Extraer solo los datos de balance
        const balanceData = sortedData.map(item => {
            // Extraer solo la parte de fecha (YYYY-MM-DD)
            const fullDateStr = item[dateKey];
            const date = fullDateStr
                ? (fullDateStr.includes(' ') ? fullDateStr.split(' ')[0] : fullDateStr)
                : new Date().toISOString().split('T')[0]

            // Buscar el valor de balance en diferentes propiedades posibles
            const balance =
                item[balanceKey] ||
                item.lastBalance ||
                item.lastEquity ||
                item.startBalance ||
                0;

            return {
                date,
                balance
            }
        })

        if (balanceData.length === 0) return []

        // Extraer la primera y última fecha
        const dates = balanceData.map(item => item.date)
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        // 1. Serie completa para balance
        const balanceSeries = balanceData.map(item => ({
            date: item.date,
            balance: item.balance
        }))

        // 2. Serie para max_drawdown (solo 2 puntos, inicio y fin)
        const maxDrawdownSeries = [
            { date: firstDate, max_drawdown: ddAbsolute },
            { date: lastDate, max_drawdown: ddAbsolute }
        ]

        // 3. Serie para profit_target (solo 2 puntos, inicio y fin)
        const profitTargetSeries = [
            { date: firstDate, profit_target: ptAbsolute },
            { date: lastDate, profit_target: ptAbsolute }
        ]

        // Combinar todas las series para el gráfico final
        // El orden es importante para que las líneas se dibujen correctamente
        return [
            ...balanceSeries,
            ...maxDrawdownSeries,
            ...profitTargetSeries
        ]
    }

    /**
     * Genera datos de ejemplo para el gráfico con líneas horizontales completas
     */
    const generateSampleDataForChart = (initialBalance, ddAbsolute, ptAbsolute) => {
        const today = new Date()
        // Crear los datos de balance simulados
        const balanceSeries = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(today)
            date.setDate(date.getDate() - (29 - i))
            const formattedDate = date.toISOString().split('T')[0]

            // Simular fluctuación del balance
            const dayChange = Math.random() * 500 - 200
            const balance = initialBalance + (i * 100) + dayChange

            return {
                date: formattedDate,
                balance: balance
            }
        })

        // Extraer primera y última fecha para las líneas horizontales
        const firstDate = balanceSeries[0].date
        const lastDate = balanceSeries[balanceSeries.length - 1].date

        // Crear puntos para líneas horizontales
        const maxDrawdownSeries = [
            { date: firstDate, max_drawdown: ddAbsolute },
            { date: lastDate, max_drawdown: ddAbsolute }
        ]

        const profitTargetSeries = [
            { date: firstDate, profit_target: ptAbsolute },
            { date: lastDate, profit_target: ptAbsolute }
        ]

        // Combinar todas las series
        return [
            ...balanceSeries,
            ...maxDrawdownSeries,
            ...profitTargetSeries
        ]
    }

    // Mostrar indicador de carga
    if (loading) {
        return (
            <div className="flex justify-center items-center h-60 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-primary)]"></div>
            </div>
        )
    }

    // Mostrar error si lo hay
    if (error) {
        return (
            <div className="text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg dark:bg-zinc-800 shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black p-4">
                Error cargando datos del gráfico: {error}
            </div>
        )
    }

    // Mensaje cuando no hay datos
    if (chartData.length === 0) {
        return (
            <div className="text-center bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black p-4">
                No hay datos disponibles para mostrar.
            </div>
        )
    }

    // Renderizar gráfico
    return (
        <>
            <h2 className="text-lg font-semibold mb-4">Evolución del Balance por hora</h2>
            <div className="dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black ">
                <LineChart
                    data={chartData}
                    index="date"
                    categories={[
                        'balance',
                        'max_drawdown',
                        'profit_target'
                    ]}
                    yFormatter={yFormatter}
                    colors={["#FBBF24", "red", "green"]}
                    valueFormatter={customTooltipFormatter}
                    showLegend={true}
                    showGridLines={true}
                    startEndOnly={false}
                    showXAxis={true}
                    showYAxis={true}
                    curveType="linear"
                    connectNulls={true}
                    tooltip={{
                        shared: false,
                        trigger: 'item',
                        confine: true
                    }}
                />
            </div>
        </>
    )
}

export default ChartMetadata