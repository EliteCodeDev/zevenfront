// src/pages/metrix2/objetivos.js
"use client";

import React, { useState, useEffect } from "react";

// Custom SVG Icons
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 mr-2 rounded-lg text-white bg-green-500">
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
    </svg>
);

const XMarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 mr-2 rounded-lg text-white bg-red-500">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

// Utility function to format days
const formatDays = (days, minimumDays) => {
    const integerDays = Math.floor(days);
    const percentage = minimumDays > 0 ? (integerDays / minimumDays) * 100 : 100;
    return {
        displayDays: integerDays,
        displayPercentage: percentage.toFixed(2)
    };
};

// Utility function to format profit/loss
const formatProfit = (initialBalance, currentProfit, profitTarget) => {
    const profit = Math.max(0, currentProfit);
    const percentage = initialBalance > 0 ? (profit / initialBalance) * 100 : 0;
    const targetPercentage = initialBalance > 0 ? (profitTarget / initialBalance) * 100 : 0;

    return {
        displayProfit: profit.toFixed(2),
        displayPercentage: percentage.toFixed(2),
        isTargetMet: profit >= profitTarget
    };
};

export default function Objetivos({ challengeConfig, metricsData, initBalance, pase }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [objetivos, setObjetivos] = useState([]);

    // Usar un valor de balance por defecto si no se proporciona
    const balance = initBalance || 10000;

    useEffect(() => {
        if (!challengeConfig || !metricsData) return;

        try {
            // Extraer los datos reales del trading desde metricsData
            const tradeDayCount = metricsData.daysSinceTradingStarted || 0;

            // Para maxDailyDrawdown, podemos usar la peor pérdida diaria desde dailyGrowth
            let maxDailyDrawdown = 0;

            if (Array.isArray(metricsData.dailyGrowth) && metricsData.dailyGrowth.length > 0) {
                const profits = metricsData.dailyGrowth
                    .map(day => day.profit)
                    .filter(profit => typeof profit === "number" && !isNaN(profit)); // Filtra valores inválidos

                if (profits.length > 0) {
                    maxDailyDrawdown = Math.abs(Math.min(...profits, 0));
                }
            }

            // Calcular la pérdida total directamente de metricsData
            let maxAbsoluteDrawdown = Math.abs(metricsData.maxDrawdown || 0);

            // Si tenemos datos de trades, calculamos la pérdida total
            if (metricsData.lostTrades > 0 && metricsData.averageLoss) {
                const totalLoss = Math.abs(metricsData.lostTrades * metricsData.averageLoss);
                // Usamos el valor mayor entre la pérdida total y el maxDrawdown actual
                maxAbsoluteDrawdown = Math.max(totalLoss, maxAbsoluteDrawdown);
            }

            // Para maxRelativeProfit, usamos profit del SDK
            const maxRelativeProfit = metricsData.profit || 0;

            // Extraer configuraciones
            const minimumTradingDays = challengeConfig.minimumTradingDays || 0;
            const maximumDailyLossPercent = challengeConfig.maximumDailyLossPercent || 5;
            const maxDrawdownPercent = challengeConfig.maxDrawdownPercent || 10;
            const profitTargetPercent = challengeConfig.profitTargetPercent || 8;

            // Crear array de objetivos basado en la configuración del desafío
            const newObjetivos = [
                {
                    nombre: `Mínimo ${minimumTradingDays} Días de Trading`,
                    ...(() => {
                        const { displayDays, displayPercentage } = formatDays(
                            tradeDayCount,
                            minimumTradingDays
                        );
                        return {
                            resultado: `${displayDays} días (${displayPercentage}%)`,
                            estado: displayDays >= minimumTradingDays,
                        };
                    })(),
                    descripcion: "Este valor representa el número de sus días de trading activos medidos en la zona horaria CE(S)T.",
                    videoUrl: "https://www.youtube.com/watch?v=lPd0uOoRzsY",
                },
                {
                    nombre: `Pérdida máxima del día - $${(balance * maximumDailyLossPercent / 100).toFixed(2)}`,
                    resultado: `$${maxDailyDrawdown.toFixed(2)} (${(
                        (maxDailyDrawdown / (balance * maximumDailyLossPercent / 100)) *
                        100
                    ).toFixed(2)}%)`,
                    estado: maxDailyDrawdown <= balance * maximumDailyLossPercent / 100,
                    descripcion:
                        "Este valor representa la caída de capital más baja registrada en un día concreto. Contiene su P/L flotante y sólo puede ser sustituido por una pérdida mayor.",
                    videoUrl: "https://www.youtube.com/watch?v=WaeBEto7Tkk",
                },
                {
                    nombre: `Pérdida Máx. - $${(balance * maxDrawdownPercent / 100).toFixed(2)}`,
                    resultado: `$${maxAbsoluteDrawdown.toFixed(2)} (${(
                        (maxAbsoluteDrawdown / (balance * maxDrawdownPercent / 100)) * 100).toFixed(2)}%)`,
                    estado: maxAbsoluteDrawdown <= balance * maxDrawdownPercent / 100,
                    descripcion: "Este valor representa el capital registrado más bajo en su cuenta desde el momento en que se empezó a operar.",
                    videoUrl: "https://www.youtube.com/watch?v=AsNUg0O-9iQ",
                },
            ];

            // Agregar objetivo de profit si está configurado
            if (profitTargetPercent) {
                const profitTarget = balance * profitTargetPercent / 100;
                const { displayProfit, displayPercentage, isTargetMet } = formatProfit(
                    balance,
                    maxRelativeProfit,
                    profitTarget
                );

                newObjetivos.push({
                    nombre: `Objetivo de Beneficio - $${profitTarget.toFixed(2)}`,
                    resultado: `$${displayProfit} (${displayPercentage}%)`,
                    estado: isTargetMet,
                    descripcion: "Este valor representa su ganancia en el capital.",
                    videoUrl: "https://www.youtube.com/watch?v=DWJts3chO_I",
                });
            }

            setObjetivos(newObjetivos);
        } catch (error) {
            console.error("Error al procesar objetivos:", error);
            // Establecer objetivos vacíos en caso de error
            setObjetivos([]);
        }
    }, [challengeConfig, metricsData, balance]);

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Si no hay datos, mostrar mensaje de carga
    if (!objetivos.length) {
        return (
            <div className="border-gray-500 dark:border-zinc-800 dark:shadow-black bg-white rounded-md shadow-md dark:bg-zinc-800 dark:text-white p-6 text-center">
                <p>Cargando objetivos...</p>
            </div>
        );
    }

    return (
        <div className="border-gray-500 dark:border-zinc-800 dark:shadow-black bg-white rounded-md shadow-md dark:bg-zinc-800 dark:text-white">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-500 dark:border-zinc-600">
                        <th className="px-6 py-4 text-md text-start text-gray-700 dark:text-white">
                            Objetivos de Trading
                        </th>
                        <th className="px-6 py-4 text-md text-start text-gray-700 dark:text-white">
                            Resultados
                        </th>
                        <th className="px-6 py-4 text-md text-start text-gray-700 dark:text-white">
                            Estado
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {objetivos.map((obj, index) => (
                        <React.Fragment key={index}>
                            <tr
                                className={`cursor-pointer dark:hover:bg-zinc-700 hover:bg-gray-100 ${index === objetivos.length - 1 ? "" : "border-b border-gray-500 dark:border-zinc-600"
                                    }`}
                                onClick={() => toggleExpand(index)}
                            >
                                <td className="px-6 py-4 text-[var(--app-primary)] font-semibold">
                                    {expandedIndex === index ? `- ${obj.nombre}` : `+ ${obj.nombre}`}
                                </td>
                                <td className="px-6 py-4 bg-gray-100 dark:bg-zinc-900">{obj.resultado}</td>
                                <td className="px-6 py-4">
                                    {obj.estado ? (
                                        <div className="flex items-center">
                                            <CheckIcon className="h-6 w-6 mr-2 rounded-lg text-white bg-green-500" />
                                            <span>Aprobado</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <XMarkIcon className="h-6 w-6 mr-2 rounded-lg text-white bg-red-500" />
                                            <span>No aprobado</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                            {expandedIndex === index && (
                                <tr>
                                    <td colSpan="3" className="text-center align-middle px-6 py-6">
                                        <div className="flex flex-col items-center">
                                            <p>{obj.descripcion}</p>
                                            <div className="mt-4 flex justify-center">
                                                <iframe
                                                    width="200"
                                                    src={obj.videoUrl.replace("watch?v=", "embed/")}
                                                    title="YouTube video"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}