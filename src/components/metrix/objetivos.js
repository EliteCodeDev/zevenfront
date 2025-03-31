// src/pages/historial/objetivos.js
"use client";

import React, { useState, useEffect } from "react";

// Minimal SVG Icons
const Icon = {
    Check: () => (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-green-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    ),
    X: () => (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
    ),
    Info: () => (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-400">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
        </svg>
    )
};

// Utility functions
const fmt = {
    days: (days, min) => {
        const d = Math.max(0, Math.floor(days));
        const p = (d / Math.max(1, min)) * 100;
        return { days: d, pct: p.toFixed(0) };
    },
    profit: (profit, target) => {
        const p = Math.max(0, profit);
        const pct = p === 0 ? 0 : (p / target) * 100;
        return { profit: p.toFixed(0), pct: pct.toFixed(0), met: p >= target };
    }
};

export default function Objetivos({ challengeConfig, metricsData, initBalance }) {
    const [expanded, setExpanded] = useState(null);
    const [objetivos, setObjetivos] = useState([]);
    const balance = initBalance || 10000;

    useEffect(() => {
        if (!challengeConfig || !metricsData) return;

        // Config values
        const minDays = challengeConfig.minimumTradingDays || 0;
        const maxDailyLossPct = challengeConfig.maximumDailyLoss || 5;
        const maxTotalLossPct = challengeConfig.maximumTotalLoss || 10;
        const profitTargetPct = challengeConfig.profitTarget || 8;

        // Absolute values
        const maxDailyLossAmt = (balance * maxDailyLossPct) / 100;
        const maxTotalLossAmt = (balance * maxTotalLossPct) / 100;
        const profitTargetAmt = (balance * profitTargetPct) / 100;

        // Trading metrics
        const days = Math.max(0, metricsData.daysSinceTradingStarted || 0);

        // Max daily loss
        let maxDailyLoss = 0;
        if (Array.isArray(metricsData.dailyGrowth) && metricsData.dailyGrowth.length) {
            maxDailyLoss = metricsData.dailyGrowth.reduce((max, day) =>
                Math.max(max, day.profit < 0 ? Math.abs(day.profit) : 0,
                    day.drawdownProfit > 0 ? day.drawdownProfit : 0), 0);
        } else if (metricsData.worstTrade < 0) {
            maxDailyLoss = Math.abs(metricsData.worstTrade);
        } else if (metricsData.profit < 0) {
            maxDailyLoss = Math.abs(metricsData.profit);
        }

        // Max total loss
        const maxTotalLoss = typeof metricsData.maxDrawdown === 'number'
            ? (balance * metricsData.maxDrawdown) / 100
            : (metricsData.profit < 0 ? Math.abs(metricsData.profit) : 0);

        // Profit
        const profit = metricsData.profit > 0 ? metricsData.profit : 0;

        // Format data
        const daysData = fmt.days(days, minDays);

        // Create objectives
        const newObjetivos = [
            {
                nombre: ` ${minDays} Días  Mínimo de Trading`,
                resultado: `${daysData.days} días (${daysData.pct}%)`,
                estado: daysData.days >= minDays,
                descripcion: "Días activos en zona CE(S)T",
                videoUrl: "https://www.youtube.com/watch?v=lPd0uOoRzsY",
            },
            {
                nombre: `Pérdida Díaria Máx: $${maxDailyLossAmt.toFixed(0)}`,
                resultado: `$${maxDailyLoss.toFixed(0)} (${((maxDailyLoss / maxDailyLossAmt) * 100).toFixed(0)}%)`,
                estado: maxDailyLoss <= maxDailyLossAmt,
                descripcion: "Pérdida máxima en un día",
                videoUrl: "https://www.youtube.com/watch?v=WaeBEto7Tkk",
            },
            {
                nombre: `Pérdida Total Máx: $${maxTotalLossAmt.toFixed(0)}`,
                resultado: `$${maxTotalLoss.toFixed(0)} (${((maxTotalLoss / maxTotalLossAmt) * 100).toFixed(0)}%)`,
                estado: maxTotalLoss <= maxTotalLossAmt,
                descripcion: "Pérdida máxima desde inicio",
                videoUrl: "https://www.youtube.com/watch?v=AsNUg0O-9iQ",
            },
        ];

        // Add profit objective if configured
        if (profitTargetPct) {
            const profitData = fmt.profit(profit, profitTargetAmt);
            newObjetivos.push({
                nombre: `Beneficio Objetivo: $${profitTargetAmt.toFixed(0)}`,
                resultado: `$${profitData.profit} (${profitData.pct}%)`,
                estado: profitData.met,
                descripcion: "Ganancia objetivo",
                videoUrl: "https://www.youtube.com/watch?v=DWJts3chO_I",
            });
        }

        setObjetivos(newObjetivos);
    }, [challengeConfig, metricsData, balance]);

    if (!objetivos.length) {
        return <div className="bg-zinc-800 text-white rounded p-2 text-xs text-center">Sin datos</div>;
    }

    return (
        <div className="space-y-1.5">
            {objetivos.map((obj, idx) => (
                <div key={idx} className=" bg-white dark:bg-zinc-900    text-white rounded text-xs overflow-hidden">
                    <div className="p-1.5">
                        <div className="flex justify-between items-center">
                            <span className="dark:text-amber-400 text-amber-500  font-medium">{obj.nombre}</span>
                            <button onClick={() => setExpanded(expanded === idx ? null : idx)} className="text-gray-400">
                                <Icon.Info />
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className={obj.estado ? "dark:text-green-400 text-green-500" : " dark:text-red-400 text-red-500   "}>{obj.resultado}</span>
                            {obj.estado ? <Icon.Check /> : <Icon.X />}
                        </div>
                    </div>

                    {expanded === idx && (
                        <div className="border-t border-gray-700 p-1.5">
                            <p className="text-gray-300 mb-1.5">{obj.descripcion}</p>
                            <div className="flex justify-center">
                                <iframe
                                    width="140"
                                    height="80"
                                    src={obj.videoUrl.replace("watch?v=", "embed/")}
                                    title="Video"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}