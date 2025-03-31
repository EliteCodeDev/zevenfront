/* src/pages/dashboard/UserPanel.js */
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChartBarIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Loader from '../../components/loaders/loader';
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ButtonInit from 'src/pages/dashboard/button_init';
import MetaApi, { MetaStats } from 'metaapi.cloud-sdk';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import NeoChallengeCard from './neoCard';
import BilleteraCripto from '../../components/wallet/crypto-wallet';
import CredencialesModal from './credentials';

const fetcher = async (url, token) => {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
};

// Componente para los títulos de fase mejorados
const PhaseTitle = ({ stageName }) => {
  // Determinar el color y el icono según la fase
  const getPhaseStyles = (stageName) => {
    switch (stageName) {
      case "Fase 1":
        return {
          color: "from-blue-500 to-blue-700",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-700",
          textColor: "text-blue-700 dark:text-blue-300",
          number: "1"
        };
      case "Fase 2":
        return {
          color: "from-purple-500 to-purple-700",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-700",
          textColor: "text-purple-700 dark:text-purple-300",
          number: "2"
        };
      case "Fase Real":
        return {
          color: "from-[var(--app-primary)] to-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/10",
          borderColor: "border-yellow-200 dark:border-yellow-700/50",
          textColor: "text-[var(--app-primary)] dark:text-yellow-300",
          number: "R"
        };
      default:
        return {
          color: "from-gray-500 to-gray-700",
          bgColor: "bg-gray-50 dark:bg-gray-800/50",
          borderColor: "border-gray-200 dark:border-gray-700",
          textColor: "text-gray-700 dark:text-gray-300",
          number: "•"
        };
    }
  };

  const { color, bgColor, borderColor, textColor, number } = getPhaseStyles(stageName);

  return (
    <div className="flex flex-col space-y-1 mb-4">
      <div className="flex items-center">
        <div className={`flex items-center ${bgColor} ${borderColor} border rounded-lg px-4 py-2`}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r ${color} text-white mr-2 font-bold text-md shadow-sm`}>
            {number}
          </div>
          <span className={`text-lg font-bold ${textColor}`}>{stageName}</span>
        </div>
        <div className="h-[2px] flex-grow ml-3 bg-gradient-to-r from-gray-300 to-transparent dark:from-zinc-700"></div>
      </div>
    </div>
  );
};

export default function Index() {
    const { data: session } = useSession();
    const router = useRouter();

    // URL modificada para incluir challenge_relation y sus stages
    const { data, error, isLoading } = useSWR(
        session?.jwt
            ? [
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?populate[challenges][populate][broker_account]=*&populate[challenges][populate][withdraw]=*&populate[challenges][populate][challenge_relation][populate][challenge_stages]=*`,
                session.jwt
            ]
            : null,
        ([url, token]) => fetcher(url, token)
    );

    const [balances, setBalances] = useState({});
    const [isLoadingBalances, setIsLoadingBalances] = useState(true);
    const [visibility, setVisibility] = useState(() => {
        if (typeof window !== "undefined") {
            return JSON.parse(localStorage.getItem("visibility") || "{}");
        }
        return {};
    });

    useEffect(() => {
        if (data?.challenges) {
            const fetchBalances = async () => {
                setIsLoadingBalances(true);
                const metaStats = new MetaStats(process.env.NEXT_PUBLIC_TOKEN_META_API);
                const newBalances = {};

                for (const challenge of data.challenges) {
                    if (challenge.broker_account?.idMeta) {
                        try {
                            const metrics = await metaStats.getMetrics(challenge.broker_account.idMeta);
                            newBalances[challenge.id] = metrics.balance;
                        } catch (error) {
                            console.error(`Error obteniendo el balance para ${challenge.broker_account.idMeta}:`, error);
                            newBalances[challenge.id] = challenge.broker_account.balance || "No disponible";
                        }
                    } else {
                        newBalances[challenge.id] = "1000000";
                    }
                }
                setBalances(newBalances);
                setIsLoadingBalances(false);
            };

            fetchBalances();
        }
    }, [data?.challenges]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("visibility", JSON.stringify(visibility));
        }
    }, [visibility]);

    // Función para obtener el nombre del stage según la fase del challenge
    const getStageName = (challenge) => {
        switch (challenge.phase) {
            case 1:
                return "Fase 1";
            case 2:
                return "Fase 2";
            case 3:
                return "Fase Real";
            default:
                return `Fase ${challenge.phase}`;
        }
    };

    if (isLoading) return <Loader />;
    if (error) return <p className="text-center text-red-500">Error al cargar los datos: {error.message}</p>;

    const isVerified = data?.isVerified;
    const toggleVisibility = (id) => setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));

    // Filtrar challenges que están "en curso" o "por iniciar"
    const activeChallenges = data?.challenges
        ?.map((challenge) => {
            return challenge;
        })
        .filter((challenge) => {
            // Siempre mostrar challenges en init o progress
            if (challenge.isactive === false) {
                return false;
            }
            if (challenge.result === "init" || challenge.result === "progress") {
                return true;
            }

            // Para challenges en phase 3
            if (challenge.phase === 3) {
                // Mostrar si está aprobado y NO tiene retiro
                return challenge.result === "approved" && !challenge.withdraw;
            }

            return false;
        }) || [];

    // Agrupar los challenges por stage (fase)
    const groupedChallengesByStage = activeChallenges.reduce((acc, challenge) => {
        const stageName = getStageName(challenge);
        if (!acc[stageName]) {
            acc[stageName] = [];
        }
        acc[stageName].push(challenge);
        return acc;
    }, {});

    // Ordenar los stages por su número de fase
    const sortedStages = Object.keys(groupedChallengesByStage).sort((a, b) => {
        const phaseOrder = { "Fase 1": 1, "Fase 2": 2, "Fase Real": 3 };
        return (phaseOrder[a] || 999) - (phaseOrder[b] || 999); // 999 como fallback para fases no mapeadas
    });

    return (
        <div>
            {activeChallenges.length === 0 && <NeoChallengeCard />}

            {sortedStages.length > 0 ? (
                sortedStages.map((stageName) => {
                    const stageChallengers = groupedChallengesByStage[stageName];
                    return (
                        <div key={stageName} className="mb-8">
                            <PhaseTitle stageName={stageName} />

                            {stageChallengers.map((challenge, index) => {
                                const isVisible = visibility[challenge.id] ?? true;

                                let balanceDisplay;
                                if (!challenge?.broker_account?.balance) {
                                    balanceDisplay = "No disponible";
                                } else {
                                    balanceDisplay = challenge.broker_account.balance;
                                }

                                return (
                                    <div
                                        key={index}
                                        className="relative p-3 mb-3 bg-white dark:bg-zinc-800 shadow-md rounded-lg border border-gray-100 dark:border-zinc-700 transition-all duration-300 hover:shadow-lg dark:hover:shadow-md dark:shadow-zinc-900/30 overflow-hidden max-w-7xl mx-auto"
                                    >
                                        {/* Accent border on left side */}
                                        <div className="absolute left-0 top-0 w-1 h-full bg-[var(--app-primary)]"></div>

                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-zinc-800 mb-2 dark:text-zinc-200 text-base flex items-center">
                                                <span className='font-bold text-[var(--app-primary)] mr-1'>Login:</span>
                                                <span className="">
                                                    {challenge.broker_account?.login || "-"}
                                                </span>
                                            </p>

                                            {/* Status indicator */}
                                            <div className="flex items-center">
                                                <div className={`h-2 w-2 rounded-full mr-2 ${challenge.result === 'progress' ? 'bg-[var(--app-primary)] animate-pulse' :
                                                    challenge.result === 'approved' ? 'bg-green-500' :
                                                        challenge.result === 'disapproved' ? 'bg-red-500' :
                                                            'bg-gray-400'
                                                    }`}></div>
                                                <span className={`text-xs font-medium ${challenge.result === 'progress' ? 'text-[var(--app-primary)]' :
                                                    challenge.result === 'approved' ? 'text-green-500' :
                                                        challenge.result === 'disapproved' ? 'text-red-500' :
                                                            'text-gray-400 dark:text-gray-300'
                                                    }`}>
                                                    {{
                                                        init: "Por iniciar",
                                                        progress: "En curso",
                                                        disapproved: "Desaprobado",
                                                        approved: "Aprobado",
                                                        retry: "Repetir",
                                                    }[challenge.result] || challenge.result}
                                                </span>
                                            </div>
                                        </div>

                                        {isVisible && (
                                            <>
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <div className="p-2 bg-gray-50 dark:bg-zinc-700/30 rounded-lg transition-colors flex items-center justify-between">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            Balance
                                                        </p>
                                                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                                                            {typeof balanceDisplay === "number" ? `$${balanceDisplay.toLocaleString()}` : balanceDisplay}
                                                        </p>
                                                    </div>

                                                    <div className="p-2 bg-gray-50 dark:bg-zinc-700/30 rounded-lg transition-colors flex items-center justify-between">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            Inicio
                                                        </p>
                                                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                                                            {challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : "-"}
                                                        </p>
                                                    </div>

                                                    <div className="p-2 bg-gray-50 dark:bg-zinc-700/30 rounded-lg transition-colors flex items-center justify-between">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            Fin
                                                        </p>
                                                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                                                            {challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : "-"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2 items-center">
                                                    {/* Solo mostrar el botón de Metrix cuando el challenge NO esté en estado "init" */}
                                                    {challenge.result !== "init" && (
                                                        <Link href={`/metrix/${challenge.documentId}`}>
                                                            <button className="flex items-center justify-center space-x-1 px-3 py-1 rounded-lg transition-all duration-200 bg-white hover:bg-gray-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600 shadow-sm hover:shadow text-sm">
                                                                <ChartBarIcon className="h-7 w-6 text-[var(--app-primary)]" />
                                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Metrix</span>
                                                            </button>
                                                        </Link>
                                                    )}
                                                    
                                                    <CredencialesModal 
                                                        login={challenge.broker_account?.login || "-"}
                                                        password={challenge.broker_account?.password || "-"}
                                                        server={challenge.broker_account?.server || "-"}
                                                        platform={challenge.broker_account?.platform || "MT4"}
                                                        inversorPass={challenge.broker_account?.inversorPass || "-"}
                                                    />

                                                    {/* Mover el botón ButtonInit a esta sección cuando sea necesario mostrarlo */}
                                                    <ButtonInit
                                                        documentId={challenge.documentId}
                                                        result={challenge.result}
                                                        phase={challenge.phase}
                                                        className="text-sm"
                                                    />

                                                    {!isVerified && challenge.phase === 3 &&
                                                        challenge.result === "approved" && (
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 border-l-2 border-[var(--app-primary)]/30 pl-2">
                                                                Debes estar verificado para retirar tus ganancias
                                                            </p>
                                                        )}

                                                    {isVerified &&
                                                        challenge.phase === 3 &&
                                                        challenge.result === "approved" && (
                                                            <div className="flex gap-2 items-center">
                                                                <BilleteraCripto
                                                                    balance={balances[challenge.id] || 1000000}
                                                                    brokerBalance={challenge.broker_account?.balance || "0"}
                                                                    userId={data?.id}
                                                                    challengeId={challenge.documentId}
                                                                />
                                                            </div>
                                                        )}
                                                </div>
                                            </>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`visible-mode-${challenge.id}-${index}`}
                                                    checked={!isVisible}
                                                    onCheckedChange={() => toggleVisibility(challenge.id)}
                                                    className="data-[state=checked]:bg-[var(--app-primary)]"
                                                />
                                                <Label
                                                    htmlFor={`visible-mode-${challenge.id}-${index}`}
                                                    className="text-sm font-medium text-gray-600 dark:text-gray-300"
                                                >
                                                    {isVisible ? "Mostrar menos" : "Mostrar más"}
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay challenges disponibles.</p>
            )}
        </div>
    );
}