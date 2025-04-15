// src/pages/metrix2/[documentId].js
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Loader from "../../components/loaders/loader";
import WinLoss from "../../components/metrix/winloss";
import Statistics from "../../components/metrix/statistics";
import MyPage from "../../components/metrix/grafico";
import Objetivos from "../../components/metrix/objetivos";
import RelatedChallenges from "../../components/challenges/RelatedChallenges";
import { BarChart, Landmark, FileChartColumn, ChartCandlestick, FileChartPie } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import DataAdminViewer from "../../components/metrix/DataAdminViewer"; // Importamos el componente para ver meta_history

// Fetcher para GET requests (incluye token)
const fetcher = (url, token) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token || process.env.NEXT_PUBLIC_API_TOKEN}`,
    },
  }).then((res) => {
    if (!res.ok) {
      console.error(`Error en respuesta: ${res.status} ${res.statusText}`);
      throw new Error(`Error API: ${res.status}`);
    }
    return res.json();
  });

// Función para determinar el stage correcto basado en la fase actual y los stages disponibles
const determineCorrectStage = (currentPhase, stages) => {
  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    console.warn("No hay stages disponibles");
    return null;
  }
  const totalStages = stages.length;
  let stageIndex = 0;
  if (totalStages === 1) {
    stageIndex = 0;
  } else if (totalStages === 2) {
    stageIndex = currentPhase === 3 ? 1 : 0;
  } else if (totalStages === 3) {
    stageIndex = currentPhase - 1;
  } else {
    stageIndex = Math.min(currentPhase - 1, totalStages - 1);
  }
  return stages[stageIndex];
};

const Metrix = () => {
  const router = useRouter();
  const { documentId } = router.query;
  const { data: session } = useSession();

  // Estados para almacenar datos procesados
  const [metadataStats, setMetadataStats] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [initialBalance, setInitialBalance] = useState(null);
  const [dynamicBalance, setDynamicBalance] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeConfig, setChallengeConfig] = useState(null);

  // Estados para valores monetarios para la gráfica
  const [ddPercent, setDdPercent] = useState(10);
  const [profitTargetPercent, setProfitTargetPercent] = useState(10);
  const [maxDrawdownAbsolute, setMaxDrawdownAbsolute] = useState(null);
  const [profitTargetAbsolute, setProfitTargetAbsolute] = useState(null);

  // Obtener datos básicos del usuario y sus challenges mediante SWR
  let { data: userData, error, isLoading } = useSWR(
    session?.jwt && documentId
      ? [
          session?.roleName === "Webmaster"
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?populate[challenges][populate]=*`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?populate[challenges][populate]=*`,
          session.jwt,
        ]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  // Para el rol Webmaster filtramos los challenges por documentId
  if (session?.roleName === "Webmaster") {
    userData = userData?.filter((user) =>
      user.challenges.some((challenge) => challenge.documentId === documentId)
    );
    userData = userData?.[0];
  }

  // Buscar el challenge específico y obtener sus detalles completos
  useEffect(() => {
    if (userData?.challenges && documentId && session?.jwt) {
      const basicChallenge = userData.challenges.find(
        (challenge) => challenge.documentId === documentId
      );
      if (basicChallenge && basicChallenge.id) {
        const queryParams = new URLSearchParams({
          "populate[broker_account]": "*",
          "populate[challenge_relation][populate][challenge_stages]": "*",
        }).toString();
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenges/${basicChallenge.documentId}?${queryParams}`,
          { headers: { Authorization: `Bearer ${session.jwt}` } }
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Error API: ${res.status}`);
            return res.json();
          })
          .then((response) => {
            const detailedChallenge = response.data || response;
            let brokerAccount = detailedChallenge.broker_account;
            setCurrentChallenge({
              ...basicChallenge,
              ...detailedChallenge,
              broker_account: brokerAccount,
            });
          })
          .catch((err) => {
            console.error("Error al obtener detalles del challenge:", err);
            setCurrentChallenge(basicChallenge);
          });
      } else {
        console.warn("No se encontró challenge con documentId:", documentId);
        setCurrentChallenge(null);
      }
    }
  }, [userData, documentId, session?.jwt]);

  // Procesar la metadata del challenge
  useEffect(() => {
    if (!currentChallenge) return;
    const brokerInitialBalance = currentChallenge.broker_account?.balance;
    setInitialBalance(brokerInitialBalance);
    const dynBalance = currentChallenge.dynamic_balance || "-";
    setDynamicBalance(dynBalance);
    if (currentChallenge.metadata) {
      try {
        const metadata =
          typeof currentChallenge.metadata === "string"
            ? JSON.parse(currentChallenge.metadata)
            : currentChallenge.metadata;
        if (metadata && (metadata.metrics || metadata.trades)) {
          const statsToUse = { ...metadata.metrics || metadata };
          if (metadata.equityChart) {
            statsToUse.equityChart = metadata.equityChart;
          } else if (metadata.metrics && metadata.metrics.equityChart) {
            statsToUse.equityChart = metadata.metrics.equityChart;
          }
          if (!statsToUse.equityChart) {
            if (statsToUse.balance && statsToUse.equity) {
              statsToUse.equityChart = [
                {
                  timestamp: new Date().getTime() - 86400000,
                  equity: brokerInitialBalance || 0,
                  balance: brokerInitialBalance || 0,
                },
                {
                  timestamp: new Date().getTime(),
                  equity: statsToUse.equity,
                  balance: statsToUse.balance,
                },
              ];
            }
          }
          statsToUse.broker_account = currentChallenge.broker_account;
          statsToUse.initialBalance = brokerInitialBalance;
          if (!statsToUse.equityChart) {
            statsToUse.equityChart = [
              {
                timestamp: new Date().getTime() - 86400000,
                equity: brokerInitialBalance || 0,
                balance: brokerInitialBalance || 0,
              },
              {
                timestamp: new Date().getTime(),
                equity: brokerInitialBalance || 0,
                balance: brokerInitialBalance || 0,
              },
            ];
          }
          const challengePhase = currentChallenge.phase;
          const stages =
            metadata.challenge_stages ||
            (currentChallenge.challenge_relation &&
              currentChallenge.challenge_relation.challenge_stages);
          const selectedStage = determineCorrectStage(challengePhase, stages);
          if (selectedStage) {
            const stageParameter = metadata.stage_parameters.find(
              (param) => param.challenge_stage.documentId === selectedStage.documentId
            );
            const newStage = {
              ...selectedStage,
              maximumTotalLoss: stageParameter?.maximumTotalLoss,
              profitTarget: stageParameter?.profitTarget,
              maximumDailyLoss: stageParameter?.maximumDailyLoss,
              minimumTradingDays: stageParameter?.minimumTradingDays,
            };
            setCurrentStage(newStage);
            const maxLoss = selectedStage.maximumTotalLoss || 10;
            const profitTarget = selectedStage.profitTarget || 10;
            const maxDailyLoss = selectedStage.maximumDailyLoss || 5;
            const minTradingDays = selectedStage.minimumTradingDays || 0;
            setDdPercent(maxLoss);
            setProfitTargetPercent(profitTarget);
            setChallengeConfig({
              minimumTradingDays: minTradingDays,
              maximumDailyLossPercent: maxDailyLoss,
              maxDrawdownPercent: maxLoss,
              profitTargetPercent: profitTarget,
            });
            if (brokerInitialBalance) {
              const ddAbsolute = brokerInitialBalance - (maxLoss / 100) * brokerInitialBalance;
              setMaxDrawdownAbsolute(ddAbsolute);
              const ptAbsolute = brokerInitialBalance + (profitTarget / 100) * brokerInitialBalance;
              setProfitTargetAbsolute(ptAbsolute);
            }
          }
          if (!statsToUse.maxDrawdown && (statsToUse.balance || statsToUse.equity) && brokerInitialBalance) {
            const currentBalance = statsToUse.balance || statsToUse.equity;
            const drawdownAmount = brokerInitialBalance - currentBalance;
            statsToUse.maxDrawdown = drawdownAmount > 0 ? drawdownAmount : 0;
            statsToUse.maxDrawdownPercent = (statsToUse.maxDrawdown / brokerInitialBalance) * 100;
          }
          if (!statsToUse.profit && statsToUse.balance && brokerInitialBalance) {
            statsToUse.profit = statsToUse.balance - brokerInitialBalance;
            statsToUse.profitPercent = (statsToUse.profit / brokerInitialBalance) * 100;
          }
          setMetadataStats(statsToUse);
        } else {
          console.warn("La metadata no contiene datos válidos de métricas");
          createBasicStats(currentChallenge, brokerInitialBalance);
        }
      } catch (parseError) {
        console.error("Error al parsear metadata:", parseError);
        createBasicStats(currentChallenge, brokerInitialBalance);
      }
    } else {
      console.warn("No se encontró el campo metadata en el challenge");
      createBasicStats(currentChallenge, brokerInitialBalance);
    }
  }, [currentChallenge]);

  const createBasicStats = (challenge, brokerInitialBalance) => {
    if (brokerInitialBalance) {
      const basicStats = {
        balance: brokerInitialBalance,
        equity: brokerInitialBalance,
        profit: 0,
        profitPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        broker_account: challenge.broker_account,
        initialBalance: brokerInitialBalance,
        equityChart: [
          {
            timestamp: new Date().getTime() - 86400000,
            equity: brokerInitialBalance,
            balance: brokerInitialBalance,
          },
          {
            timestamp: new Date().getTime(),
            equity: brokerInitialBalance,
            balance: brokerInitialBalance,
          },
        ],
      };
      setMetadataStats(basicStats);
    }
    if (challenge.challenge_relation && challenge.challenge_relation.challenge_stages) {
      const stages = challenge.challenge_relation.challenge_stages;
      const selectedStage = determineCorrectStage(challenge.phase, stages);
      if (selectedStage) {
        setCurrentStage(selectedStage);
        const maxLoss = selectedStage.maximumTotalLoss || 10;
        const profitTarget = selectedStage.profitTarget || 10;
        const maxDailyLoss = selectedStage.maximumDailyLoss || 5;
        const minTradingDays = selectedStage.minimumTradingDays || 0;
        setDdPercent(maxLoss);
        setProfitTargetPercent(profitTarget);
        setChallengeConfig({
          minimumTradingDays: minTradingDays,
          maximumDailyLossPercent: maxDailyLoss,
          maxDrawdownPercent: maxLoss,
          profitTargetPercent: profitTarget,
        });
        if (brokerInitialBalance) {
          const ddAbsolute = brokerInitialBalance - (maxLoss / 100) * brokerInitialBalance;
          setMaxDrawdownAbsolute(ddAbsolute);
          const ptAbsolute = brokerInitialBalance + (profitTarget / 100) * brokerInitialBalance;
          setProfitTargetAbsolute(ptAbsolute);
        }
      }
    }
  };

  if (isLoading || !session) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (error || !userData) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 text-center text-white">
          <div className="p-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-full">
            <h1 className="text-2xl font-bold text-red-600">🚧 Connection error 🚧</h1>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              The data could not be loaded. Please try again later.
            </p>
            {error && error.message && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded text-sm text-red-800 dark:text-red-200">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!currentChallenge) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 text-center text-white">
          <div className="p-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-full">
            <h1 className="text-2xl font-bold text-yellow-600">⚠️ Challenge not found ⚠️</h1>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              No challenge was found with the ID provided in your account.
              Verify that the ID is correct and that you have access to this Challenge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header: Account Balance */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Landmark className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
            <h2 className="text-lg font-semibold">Account balance</h2>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {dynamicBalance != null ? dynamicBalance : "-"}
            </div>
            <div className="flex items-center justify-end text-xs">
              <span className="mr-2">
                Equity: $
                {metadataStats?.equity != null
                  ? metadataStats.equity
                  : dynamicBalance != null
                  ? dynamicBalance
                  : "-"}
              </span>
              <span className="mr-2">
                Initial balance: $
                {initialBalance != null ? initialBalance : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Left Column: Charts and secondary components */}
          <div className="w-full lg:w-8/12">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
              <MyPage
                statisticsData={metadataStats?.equityChart || []}
                maxDrawdownAbsolute={maxDrawdownAbsolute}
                profitTargetAbsolute={profitTargetAbsolute}
              />
            </div>
            <div className="block lg:hidden mt-4 bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
              <h2 className="text-lg font-semibold flex items-center mb-2">
                <FileChartColumn className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
                Goals
              </h2>
              <Objetivos
                challengeConfig={challengeConfig}
                metricsData={metadataStats}
                initBalance={initialBalance}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <h2 className="text-lg font-semibold flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
                Win/Loss Rates
              </h2>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                <WinLoss data={metadataStats || {}} />
              </div>
              <h2 className="text-lg font-semibold flex items-center">
                <FileChartColumn className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
                Statistics
              </h2>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                <Statistics
                  data={{
                    ...metadataStats,
                    phase: currentChallenge?.phase || "-",
                    brokerInitialBalance: initialBalance,
                  }}
                />
              </div>
              {metadataStats?.currencySummary && metadataStats?.currencySummary.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <ChartCandlestick className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
                    Summary by instruments
                  </h2>
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {metadataStats.currencySummary.slice(0, 4).map((currency, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-zinc-900 p-3 rounded-md">
                          <h3 className="text-sm font-semibold mb-1">{currency.currency}</h3>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div>
                              Total trades: <span className="font-medium">{currency.total.trades}</span>
                            </div>
                            <div>
                              Profit:{" "}
                              <span className={`font-medium ${currency.total.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                                ${currency.total.profit?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              Won:{" "}
                              <span className="font-medium text-green-500">
                                {currency.total.wonTrades || 0} ({currency.total.wonTradesPercent?.toFixed(1) || 0}%)
                              </span>
                            </div>
                            <div>
                              Lost:{" "}
                              <span className="font-medium text-red-500">
                                {currency.total.lostTrades || 0} ({currency.total.lostTradesPercent?.toFixed(1) || 0}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right Column: Additional Data */}
          <div className="w-full lg:w-4/12">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                <div className="flex items-center">
                  <FileChartPie className="w-5 h-5 mr-2 text-[var(--app-primary)]" />
                  Record CH{currentChallenge?.id || "-"}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Platform</h3>
                  <span className="bg-[var(--app-primary)] text-white text-xs px-2 py-1 rounded">METATRADER 5</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Type of account</h3>
                  <span className="bg-amber-100 text-[var(--app-secondary)] text-xs px-2 py-1 rounded">
                    {currentStage?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Phase</h3>
                  <span className="font-medium">{currentChallenge?.phase || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Account size:</h3>
                  <span className="font-bold">{initialBalance != null ? initialBalance : "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Start period:</h3>
                  <span className="font-medium">
                    {currentChallenge?.startDate ? new Date(currentChallenge.startDate).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">End of the period:</h3>
                  <span className="font-medium">
                    {currentChallenge?.endDate ? new Date(currentChallenge.endDate).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Total rewards</h3>
                  <span className="font-bold">
                    {typeof metadataStats?.profit === "number" ? `$${metadataStats.profit.toFixed(2)}` : "-"}
                  </span>
                </div>
              </div>
              <div className="hidden lg:block bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                <h2 className="text-base font-semibold mb-2">Goals</h2>
                <Objetivos
                  challengeConfig={challengeConfig}
                  metricsData={metadataStats}
                  initBalance={initialBalance}
                />
              </div>
              <div className="hidden lg:block">
                <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
                  <h2 className="text-base font-semibold mb-2">Certificates</h2>
                  {currentChallenge?.certificates && currentChallenge?.certificates.length > 0 ? (
                    <>
                      {currentChallenge.phase === 3 && currentChallenge.certificates && currentChallenge.certificates[0] && (
                        <Link href={`/certificates/verify/${currentChallenge.certificates[0].documentId}`}>
                          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full">
                            <BadgeCheck size={20} /> See Certificate Phase 3
                          </button>
                        </Link>
                      )}
                      {currentChallenge.phase !== 3 && currentChallenge.result === "approved" && currentChallenge.certificates && currentChallenge.certificates[0] && (
                        <Link href={`/certificates/verify/${currentChallenge.certificates[0].documentId}`}>
                          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full">
                            <BadgeCheck size={20} /> See certificate
                          </button>
                        </Link>
                      )}
                      {currentChallenge.phase === 3 && currentChallenge.result === "withdrawal" && currentChallenge.certificates && currentChallenge.certificates.length > 1 && (
                        <Link href={`/certificates/verify/${currentChallenge.certificates[1].documentId}`}>
                          <button className="flex mt-3 items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full">
                            <BadgeCheck size={20} /> See retired certificate
                          </button>
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-center p-3">No available certificates information</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Si el usuario es Webmaster, se consulta a Strapi para obtener el campo dataAdmin (que contiene meta_history) */}
      {session?.roleName === "Webmaster" && currentChallenge && (
        <div className="mt-8">
          <DataAdminViewer documentId={currentChallenge.documentId} />
        </div>
      )}

      {/* Related Challenges */}
      {userData?.challenges && (
        <div className="mt-4">
          <RelatedChallenges currentChallenge={currentChallenge} userChallenges={userData.challenges} />
        </div>
      )}
    </div>
  );
};

export default Metrix;
