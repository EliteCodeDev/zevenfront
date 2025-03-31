"use client";

import DashboardLayout from "..";
import { useState, useEffect } from "react";
import { BanknotesIcon, FlagIcon, HandRaisedIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { useWooCommerce } from "@/services/useWoo";
import { useStrapiData } from "@/services/strapiService";
import { useAllOrders } from "@/services/allOrders";

const tabs = ["General", "Risk"];
const timeframes = [
  "This Week",
  "This Month",
  "Last 3 Months",
  "Last 6 Months",
  "All History",
];

// Valores por defecto para las estadísticas
const defaultCohortStats = [
  { id: "totalSales", label: "Total Ventas", value: "$0.00" },
  { id: "totalOrders", label: "Total Pedidos", value: "0" },
  { id: "totalChallenges", label: "Challenges Totales", value: "0" },
  { id: "newChallenges", label: "Nuevos Challenges (Hoy)", value: "0" },
  { id: "prevActiveChallenges", label: "Number of Prev. Active Challenges", value: "0" },
  { id: "winningChallenges", label: "Challenges Ganados", value: "0" },
  { id: "lostChallenges", label: "Challenges Perdidos", value: "0" },
  { id: "recurrentUsers", label: "% Recurrent Users", value: "0" },
  { id: "brokenRules", label: "Most Broken Rules", value: "-" },
];

export default function Index() {
  const [selectedTab, setSelectedTab] = useState("General");
  const [selectedTimeframe, setSelectedTimeframe] = useState("This Week");
  const [cohortStatsData, setCohortStatsData] = useState({});
  const [stats, setStats] = useState([
    { label: "$0.00", subLabel: "from 0 Orders" },
    { label: "0", subLabel: "New Challenges (Today)" },
    { label: "0", subLabel: "Winning Challenges" },
  ]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [todayRange, setTodayRange] = useState({ startDate: "", endDate: "" });

  // Calcular rangos de fechas iniciales y actualizarlos con el timeframe
  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    setTodayRange({
      startDate: todayStart.toISOString(),
      endDate: todayEnd.toISOString(),
    });

    let startDate = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (selectedTimeframe) {
      case "This Week":
        startDate.setDate(now.getDate() - now.getDay()); // Inicio de la semana (domingo)
        startDate.setHours(0, 0, 0, 0);
        break;
      case "This Month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Inicio del mes
        break;
      case "Last 3 Months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "Last 6 Months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "All History":
        startDate = new Date(2000, 0, 1); // Fecha antigua para todo
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    setDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }, [selectedTimeframe]);

  // Consultas a las APIs con filtrado por timeframe
  const {
    data: filteredOrders,
    error: filteredOrdersError,
    isLoading: filteredOrdersLoading,
    refetch: refetchFilteredOrders,
  } = useWooCommerce(
    dateRange.startDate && dateRange.endDate
      ? `orders?after=${dateRange.startDate}&before=${dateRange.endDate}&per_page=100`
      : null
  );

  const {
    data: products,
    error: productsError,
    isLoading: productsLoading,
  } = useWooCommerce("products/10576/variations?per_page=100");

  const {
    data: filteredChallenges,
    error: filteredChallengesError,
    isLoading: filteredChallengesLoading,
    refetch: refetchFilteredChallenges,
  } = useStrapiData(
    dateRange.startDate && dateRange.endDate
      ? `challenges?filters[createdAt][$gte]=${dateRange.startDate}&filters[createdAt][$lte]=${dateRange.endDate}`
      : null
  );

  const {
    data: todayChallenges,
    error: todayChallengesError,
    isLoading: todayChallengesLoading,
  } = useStrapiData(
    todayRange.startDate && todayRange.endDate
      ? `challenges?filters[createdAt][$gte]=${todayRange.startDate}&filters[createdAt][$lte]=${todayRange.endDate}`
      : null
  );

  const { allOrders, isLoading: allOrdersLoading, isComplete } = useAllOrders();

  // Total de challenges filtrado por timeframe (no histórico)
  const {
    data: totalChallenges,
    error: totalChallengesError,
    isLoading: totalChallengesLoading,
    refetch: refetchTotalChallenges,
  } = useStrapiData(
    dateRange.startDate && dateRange.endDate
      ? `challenges?filters[createdAt][$gte]=${dateRange.startDate}&filters[createdAt][$lte]=${dateRange.endDate}`
      : null
  );

  const {
    data: winningChallengesFiltered,
    error: winningChallengesFilteredError,
    isLoading: winningChallengesFilteredLoading,
    refetch: refetchWinningChallenges,
  } = useStrapiData(
    dateRange.startDate && dateRange.endDate
      ? `challenges?filters[result][$eq]=approved&filters[createdAt][$gte]=${dateRange.startDate}&filters[createdAt][$lte]=${dateRange.endDate}`
      : null
  );

  const {
    data: lostChallengesFiltered,
    error: lostChallengesFilteredError,
    isLoading: lostChallengesFilteredLoading,
    refetch: refetchLostChallenges,
  } = useStrapiData(
    dateRange.startDate && dateRange.endDate
      ? `challenges?filters[result][$eq]=disapproved&filters[createdAt][$gte]=${dateRange.startDate}&filters[createdAt][$lte]=${dateRange.endDate}`
      : null
  );

  // Forzar refetch al cambiar el timeframe
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      refetchFilteredOrders?.();
      refetchFilteredChallenges?.();
      refetchTotalChallenges?.();
      refetchWinningChallenges?.();
      refetchLostChallenges?.();
    }
  }, [
    dateRange,
    refetchFilteredOrders,
    refetchFilteredChallenges,
    refetchTotalChallenges,
    refetchWinningChallenges,
    refetchLostChallenges,
  ]);

  // Procesar datos cuando estén disponibles
  useEffect(() => {
    if (
      filteredOrdersLoading ||
      filteredChallengesLoading ||
      todayChallengesLoading ||
      totalChallengesLoading ||
      winningChallengesFilteredLoading ||
      lostChallengesFilteredLoading ||
      !dateRange.startDate ||
      !todayRange.startDate
    ) {
      return; // Salir si algo está cargando o falta
    }

    const totalSales =
      filteredOrders?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;
    const totalOrdersCount = filteredOrders?.length || 0;
    const newChallengesCount = todayChallenges?.length || 0;
    const totalChallengesCount = totalChallenges?.length || 0;
    const winningChallengesCount = winningChallengesFiltered?.length || 0;
    const lostChallengesCount = lostChallengesFiltered?.length || 0;

    setCohortStatsData({
      totalSales: `$${totalSales.toFixed(2)}`,
      totalOrders: totalOrdersCount.toString(),
      totalChallenges: totalChallengesCount.toString(),
      newChallenges: newChallengesCount.toString(),
      winningChallenges: winningChallengesCount.toString(),
      lostChallenges: lostChallengesCount.toString(),
    });

    setStats([
      { label: `$${totalSales.toFixed(2)}`, subLabel: `from ${totalOrdersCount} Orders` },
      { label: newChallengesCount.toString(), subLabel: "New Challenges (Today)" },
      {
        label: winningChallengesCount.toString(),
        subLabel: `Winning Challenges (${selectedTimeframe})`,
      },
    ]);
  }, [
    filteredOrders,
    filteredChallenges,
    todayChallenges,
    totalChallenges,
    winningChallengesFiltered,
    lostChallengesFiltered,
    dateRange,
    todayRange,
    filteredOrdersLoading,
    filteredChallengesLoading,
    todayChallengesLoading,
    totalChallengesLoading,
    winningChallengesFilteredLoading,
    lostChallengesFilteredLoading,
    selectedTimeframe,
  ]);

  // Combinar datos con valores por defecto
  const cohortStats = defaultCohortStats.map((stat) => ({
    ...stat,
    value: cohortStatsData[stat.id] !== undefined ? cohortStatsData[stat.id] : stat.value,
  }));

  // Indicador de carga
  const isLoading =
    filteredOrdersLoading ||
    filteredChallengesLoading ||
    todayChallengesLoading ||
    totalChallengesLoading ||
    winningChallengesFilteredLoading ||
    lostChallengesFilteredLoading ||
    !dateRange.startDate ||
    !todayRange.startDate;

  return (
    <DashboardLayout>
      <div className="p-8 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 rounded-xl shadow-xl min-h-screen border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${selectedTab === tab
                  ? "bg-[var(--app-secondary)] text-black dark:text-white shadow-md"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                  }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Panel de Control</h1>
          <div className="flex items-center gap-3">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Periodo:</span>
            <select
              className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 px-4 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--app-secondary)] focus:border-transparent transition-all"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              {timeframes.map((timeframe) => (
                <option key={timeframe} value={timeframe}>
                  {timeframe}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[BanknotesIcon, FlagIcon, HandRaisedIcon].map((Icon, index) => (
            <div key={index} className="bg-white dark:bg-zinc-800 p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-shadow duration-300 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center">
              <div className="bg-[var(--app-secondary)]/20 p-4 rounded-full mb-4">
                <Icon className="w-10 h-10 text-[var(--app-secondary)]" />
              </div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">{stats[index].label}</p>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">{stats[index].subLabel}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Estadísticas  <span className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">({selectedTimeframe})</span></h2>
        </div>

        {isLoading ? (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-800 rounded-xl text-center border border-zinc-200 dark:border-zinc-700 shadow-md">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-secondary)] mb-4"></div>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <CohortStatsTable cohortStats={cohortStats} />
        )}
      </div>
    </DashboardLayout>
  );
}

export function CohortStatsTable({ cohortStats }) {
  return (
    <div className="rounded-xl mt-4 border border-zinc-300 dark:border-zinc-800 overflow-hidden shadow-md bg-white dark:bg-zinc-800">
      <table className="w-full text-left text-zinc-900 dark:text-zinc-300">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-700 border-b border-zinc-300 dark:border-zinc-700">
            <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Métrica</th>
            <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Valor</th>
          </tr>
        </thead>
        <tbody>
          {cohortStats.map((stat, index) => (
            <tr
              key={index}
              className={`border-b border-zinc-200 dark:border-zinc-700 bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/80 transition-colors duration-150`}
            >
              <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                {stat.label}
              </td>
              <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}