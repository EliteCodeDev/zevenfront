// src/pages/historial/index.js
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { useStrapiData } from '../../services/strapiServiceJWT';
import { useState, useEffect } from "react";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ChartBarIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ClockIcon,
    DocumentIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Historial() {
    const { data: session } = useSession();
    const token = session?.jwt;

    // Obtener datos del usuario con challenges poblados usando useStrapiData
    const { data, error, isLoading } = useStrapiData(
        token ? 'users/me?populate[challenges][populate][0]=broker_account&populate[challenges][populate][1]=certificates' : null,
        token
    );

    const [searchParentId, setSearchParentId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredGroups, setFilteredGroups] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Definir colores para los estados
    const statusColors = {
        approved: 'text-green-600 dark:text-green-400',
        disapproved: 'text-red-600 dark:text-red-400',
        progress: 'text-yellow-600 dark:text-yellow-400',
        init: 'text-blue-600 dark:text-blue-400',
        withdrawal: 'text-purple-600 dark:text-purple-400',
        retry: 'text-orange-600 dark:text-orange-400',
    };

    // Definir colores para los gradientes con mejores gradientes para ambos modos
    const statusGradients = {
        approved: 'from-green-200 via-green-100/80 to-white dark:from-green-900/40 dark:via-green-800/20 dark:to-zinc-900',
        disapproved: 'from-red-200 via-red-100/80 to-white dark:from-red-900/40 dark:via-red-800/20 dark:to-zinc-900',
        progress: 'from-amber-200 via-amber-100/80 to-white dark:from-amber-900/40 dark:via-amber-800/20 dark:to-zinc-900',
        init: 'from-blue-200 via-blue-100/80 to-white dark:from-blue-900/40 dark:via-blue-800/20 dark:to-zinc-900',
        withdrawal: 'from-purple-200 via-purple-100/80 to-white dark:from-purple-900/40 dark:via-purple-800/20 dark:to-zinc-900',
        retry: 'from-orange-200 via-orange-100/80 to-white dark:from-orange-900/40 dark:via-orange-800/20 dark:to-zinc-900',
    };

    // Quitar los bordes de color basados en el estado
    const statusBorderColors = {
        approved: '',
        disapproved: '',
        progress: '',
        init: '',
        withdrawal: '',
        retry: '',
    };

    // Filtrar y agrupar challenges
    useEffect(() => {
        if (data?.challenges) {
            // Agrupar challenges por parentId
            const grouped = data.challenges.reduce((acc, challenge) => {
                const key = challenge.parentId || challenge.documentId;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(challenge);
                acc[key].sort((a, b) => a.phase - b.phase); // Ordenar por fase
                return acc;
            }, {});

            // Filtrar por parentId y rango de fechas
            const filtered = Object.entries(grouped).filter(([parentId, challenges]) => {
                const groupStart = new Date(Math.min(...challenges.map(c => new Date(c.startDate))));
                const groupEnd = new Date(Math.max(...challenges.map(c => new Date(c.endDate || new Date()))));

                const matchesParentId = parentId.toLowerCase().includes(searchParentId.toLowerCase());
                const matchesStart = !startDate || groupStart >= new Date(startDate);
                const matchesEnd = !endDate || groupEnd <= new Date(endDate);

                return matchesParentId && matchesStart && matchesEnd;
            });

            setFilteredGroups(Object.fromEntries(filtered));
        }
    }, [data, searchParentId, startDate, endDate]);

    // Mostrar loader mientras se cargan los datos
    if (isLoading) {
        return (
            <Layout>
                <Loader />
            </Layout>
        );
    }

    // Mostrar error si ocurre
    if (error) {
        return (
            <Layout>
                <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                    Error al cargar los datos: {error.message}
                </div>
            </Layout>
        );
    }

    // Determinar el estado del grupo de challenges
    const getGroupStatus = (challenges) => {
        const lastChallenge = challenges[challenges.length - 1];
        if (lastChallenge.result === "disapproved") return "disapproved";
        if (lastChallenge.result === "progress") return "progress";
        if (lastChallenge.result === "init") return "init";
        if (lastChallenge.result === "withdrawal") return "withdrawal";
        if (lastChallenge.result === "approved" && lastChallenge.phase === 3) return "approved";
        if (lastChallenge.result === "retry") return "retry";
        return "init"; // Estado por defecto
    };

    // Alternar visibilidad de los detalles del grupo
    const toggleGroup = (parentId) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [parentId]: !prev[parentId],
        }));
    };

    // Formatear fecha en formato legible
    const formatDate = (dateString) => {
        if (!dateString) return "En curso";
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Verificar si un challenge tiene certificados
    const hasCertificates = (challenge) => {
        return challenge?.certificates && challenge.certificates.length > 0;
    };

    // Obtener los certificados del challenge
    const getCertificates = (challenge) => {
        return challenge?.certificates || [];
    };

    // Determinar si debe mostrarse el botón de certificado
    const shouldShowCertificateButton = (challenge) => {
        return challenge.result === 'approved' || challenge.result === 'withdrawal';
    };

    // Renderizar botones de certificados
    const renderCertificateButtons = (challenge) => {
        if (!shouldShowCertificateButton(challenge)) {
            return null;
        }

        const certificates = getCertificates(challenge);

        // Si no hay certificados, mostrar botón de "Sin certificado"
        if (certificates.length === 0) {
            return (
                <div className="flex h-8 bg-gray-200 border border-gray-300 justify-center rounded-lg shadow-sm dark:bg-zinc-700/50 dark:border-zinc-600/50 items-center px-3 space-x-1 text-xs text-gray-500 dark:text-gray-400 transition-all duration-200 cursor-not-allowed">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    <span>Sin certificado</span>
                </div>
            );
        }

        // Organizar certificados por tipo
        const phaseCertificates = certificates.filter(cert => cert.tipoChallenge.startsWith('fase'));
        const withdrawalCertificates = certificates.filter(cert => cert.tipoChallenge === 'retirado');

        return (
            <div className="flex space-x-2">
                {/* Certificados de fase */}
                {phaseCertificates.map((cert, index) => (
                    <Link key={`phase-${index}`} href={`/certificates/verify/${cert.documentId}`}>
                        <button className="flex h-8 bg-white border border-gray-300 justify-center rounded-lg shadow-sm dark:bg-zinc-700/90 dark:border-zinc-500/50 dark:hover:bg-zinc-600/80 hover:bg-gray-50 items-center px-3 py-1.5 space-x-1 text-xs transition-all duration-200">
                            <DocumentIcon className="h-4 w-4 mr-1" />
                            <span>Certificado Fase {cert.tipoChallenge.replace('fase', '')}</span>
                        </button>
                    </Link>
                ))}

                {/* Certificados de retiro */}
                {withdrawalCertificates.map((cert, index) => (
                    <Link key={`withdrawal-${index}`} href={`/certificates/verify/${cert.documentId}`}>
                        <button className="flex h-8 bg-white border border-gray-300 justify-center rounded-lg shadow-sm dark:bg-zinc-700/90 dark:border-zinc-500/50 dark:hover:bg-zinc-600/80 hover:bg-gray-50 items-center px-3 py-1.5 space-x-1 text-xs transition-all duration-200">
                            <DocumentIcon className="h-4 w-4 mr-1" />
                            <span>Certificado de Retiro</span>
                        </button>
                    </Link>
                ))}
            </div>
        );
    };

    return (
        <Layout>
            {/* Cabecera del historial - Mejorada para ambos modos */}
            <div className="bg-gradient-to-r from-white to-gray-50 p-5 rounded-lg shadow-md border border-gray-100 dark:border-zinc-700/50 dark:bg-gradient-to-r dark:from-zinc-800 dark:to-zinc-900 dark:shadow-black dark:text-white transition-all duration-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <ClockIcon className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                        <h1 className="text-xl font-semibold">Historial de Challenges</h1>
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="bg-[var(--app-primary)] rounded-lg text-black font-medium hover:bg-[var(--app-secondary)] inline-flex items-center px-4 py-2 space-x-2 transition-all duration-200 shadow-sm"
                    >
                        <FunnelIcon className="h-5 w-5" />
                        <span className="font-medium">Filtros</span>
                    </button>
                </div>
            </div>

            {/* Sección de filtros - Mejorada */}
            <div className="mt-4">
                {isFilterOpen && (
                    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100 dark:border-zinc-700/50 dark:bg-gradient-to-b dark:from-zinc-800 dark:to-zinc-900 dark:shadow-black dark:text-white transition-all duration-200">
                        <p className="text-base font-semibold mb-3">Opciones de filtrado</p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="relative">
                                <div className="flex absolute inset-y-0 items-center left-0 pl-3 pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 text-gray-400 w-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por ID"
                                    value={searchParentId}
                                    onChange={(e) => setSearchParentId(e.target.value)}
                                    className="border p-2 rounded-lg w-full bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800/80 dark:border-zinc-600 dark:text-white focus:border-transparent focus:ring-[var(--app-primary)] focus:ring-2 pl-10 transition-all duration-200"
                                />
                            </div>
                            <div className="relative">
                                <div className="flex absolute inset-y-0 items-center left-0 pl-3 pointer-events-none">
                                    <CalendarIcon className="h-5 text-gray-400 w-5" />
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border p-2 rounded-lg w-full bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800/80 dark:border-zinc-600 dark:text-white focus:border-transparent focus:ring-[var(--app-primary)] focus:ring-2 pl-10 transition-all duration-200"
                                    placeholder="Fecha inicio"
                                />
                            </div>
                            <div className="relative">
                                <div className="flex absolute inset-y-0 items-center left-0 pl-3 pointer-events-none">
                                    <CalendarIcon className="h-5 text-gray-400 w-5" />
                                </div>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border p-2 rounded-lg w-full bg-gray-50 border-gray-200 text-gray-800 dark:bg-zinc-800/80 dark:border-zinc-600 dark:text-white focus:border-transparent focus:ring-[var(--app-primary)] focus:ring-2 pl-10 transition-all duration-200"
                                    placeholder="Fecha fin"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Contenedor principal de challenges - Mejorado para ambos modos */}
            <div className="bg-gradient-to-b from-white to-gray-50 p-4 rounded-lg shadow-md border border-gray-100 dark:border-zinc-700/50 dark:bg-gradient-to-b dark:from-zinc-800 dark:to-black dark:shadow-black dark:text-white mt-4 transition-all duration-200">
                {/* Grupos de Challenges */}
                <div className="space-y-4">
                    {Object.entries(filteredGroups).length === 0 ? (
                        <div className="bg-white p-8 rounded-lg text-center dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/70 shadow-sm transition-all duration-200">
                            <p className="text-gray-500 dark:text-gray-400">No hay challenges que coincidan con los filtros.</p>
                        </div>
                    ) : (
                        Object.entries(filteredGroups).map(([parentId, challenges]) => {
                            const status = getGroupStatus(challenges);
                            const lastChallenge = challenges[challenges.length - 1];
                            const isExpanded = expandedGroups[parentId];
                            const startDateFormatted = formatDate(Math.min(...challenges.map(c => new Date(c.startDate))));
                            const endDateFormatted = formatDate(lastChallenge.endDate);

                            return (
                                <div
                                    key={parentId}
                                    className={`bg-gradient-to-b ${statusGradients[status]} rounded-lg shadow-md border overflow-hidden relative transition-all duration-200`}
                                >
                                    {/* Cabecera del Challenge - Mejorada para ambos modos */}
                                    <div className="flex flex-col p-4 relative z-10">
                                        {/* Identificador del challenge y botón de expansión en una fila */}
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="bg-[var(--app-primary)] rounded-lg shadow-md text-black text-center text-base font-bold px-3 py-1.5 transition-all duration-200"                                            >
                                                <span className="block" title={parentId}>CH-{challenges[0].id}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => toggleGroup(parentId)}
                                                    className="p-1.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-zinc-600/70 mr-2 transition-all duration-200"
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUpIcon className="h-5 text-gray-600 w-5 dark:text-gray-300" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 text-gray-600 w-5 dark:text-gray-300" />
                                                    )}
                                                </button>

                                                {/* Botón de metrix - PRIMERA MODIFICACIÓN */}
                                                <Link href={`/metrix/${lastChallenge.documentId}`}>
                                                    <button className="flex bg-white border border-gray-300 justify-center rounded-lg shadow-sm dark:bg-zinc-700/90 dark:border-zinc-500 dark:hover:bg-zinc-600 hover:bg-gray-50 items-center px-3 py-1.5 space-x-1 text-sm transition-all duration-200">
                                                        <ChartBarIcon className="h-4 w-4 mr-1" />
                                                        <span>Metrix</span>
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Información principal - Mejorada para ambos modos */}
                                        <div className="pl-1">
                                            {/* Estado y fase actual */}
                                            <div className="flex flex-wrap gap-2 items-center mb-2">
                                                <div className="gap-1 inline-flex items-center">
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === 'approved' ? 'bg-green-500 dark:bg-green-400' :
                                                        status === 'progress' ? 'bg-yellow-500 dark:bg-yellow-400' :
                                                            status === 'disapproved' ? 'bg-red-500 dark:bg-red-400' :
                                                                status === 'init' ? 'bg-blue-500 dark:bg-blue-400' :
                                                                    status === 'withdrawal' ? 'bg-purple-500 dark:bg-purple-400' :
                                                                        'bg-orange-500 dark:bg-orange-400'
                                                        }`} />
                                                    <span className={`font-semibold text-sm ${statusColors[status]}`}>
                                                        {status === 'approved' ? 'Aprobado' :
                                                            status === 'progress' ? 'En progreso' :
                                                                status === 'disapproved' ? 'Desaprobado' :
                                                                    status === 'init' ? 'Por Iniciar' :
                                                                        status === 'withdrawal' ? 'Retirado' :
                                                                            status === 'retry' ? 'Rechazado' : 'Desconocido'}
                                                    </span>
                                                </div>
                                                <span className="text-gray-500 dark:text-gray-400 hidden md:inline">|</span>
                                                <span className="bg-white/90 backdrop-blur-sm rounded-md text-gray-600 text-xs dark:text-gray-300 px-2 py-0.5 dark:bg-zinc-700/60 border border-gray-200 dark:border-zinc-600/30 shadow-sm transition-all duration-200">
                                                    Fase {lastChallenge.phase}
                                                </span>
                                            </div>

                                            {/* Período */}
                                            <div className="flex text-gray-500 text-xs dark:text-gray-400 items-center mb-2">
                                                <span className="font-medium mr-1">Período:</span>
                                                <span className="bg-white/90 backdrop-blur-sm rounded-md text-gray-700 dark:text-gray-300 px-2 py-0.5 dark:bg-zinc-700/60 text-xs border border-gray-200 dark:border-zinc-600/30 shadow-sm transition-all duration-200">
                                                    {startDateFormatted} - {endDateFormatted}
                                                </span>
                                            </div>

                                            {/* Última actualización */}
                                            <div className="flex text-xs gap-1 items-center">
                                                <span className="text-black dark:text-white font-semibold">Última actualización:</span>
                                                <span className="bg-white/90 backdrop-blur-sm rounded-md text-gray-600 dark:text-gray-300 px-2 py-0.5 dark:bg-zinc-700/60 border border-gray-200 dark:border-zinc-600/30 shadow-sm transition-all duration-200">
                                                    {formatDate(lastChallenge.endDate ? lastChallenge.endDate : lastChallenge.startDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalles del Challenge - Mejorados para ambos modos */}
                                    {isExpanded && (
                                        <div className="bg-white/90 dark:bg-zinc-900/80 border-t border-gray-200 dark:border-zinc-700/60 px-4 py-3 transition-all duration-200">
                                            <h3 className="text-gray-800 text-xs dark:text-gray-300 font-semibold mb-3">Historial de fases</h3>
                                            <div className="space-y-3">
                                                {challenges.map((challenge, index) => {
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg shadow-sm border bg-gradient-to-b ${statusGradients[challenge.result]} relative overflow-hidden transition-all duration-200`}
                                                        >
                                                            <div className="flex flex-col justify-between sm:flex-row relative z-10">
                                                                {/* Info de la fase */}
                                                                <div className="mb-2 sm:mb-0">
                                                                    <div className="flex items-center mb-1">
                                                                        <span className="text-gray-800 text-sm dark:text-white font-semibold">
                                                                            Fase {challenge.phase}
                                                                        </span>
                                                                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[challenge.result]} backdrop-blur-sm ${challenge.result === 'approved' ? 'bg-green-100 dark:bg-green-900/50' :
                                                                            challenge.result === 'progress' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
                                                                                challenge.result === 'disapproved' ? 'bg-red-100 dark:bg-red-900/50' :
                                                                                    challenge.result === 'init' ? 'bg-blue-100 dark:bg-blue-900/50' :
                                                                                        challenge.result === 'withdrawal' ? 'bg-purple-100 dark:bg-purple-900/50' :
                                                                                            'bg-orange-100 dark:bg-orange-900/50'
                                                                            } 
                                                                        border ${challenge.result === 'approved' ? 'border-green-200 dark:border-green-700/50' :
                                                                                challenge.result === 'progress' ? 'border-yellow-200 dark:border-yellow-700/50' :
                                                                                    challenge.result === 'disapproved' ? 'border-red-200 dark:border-red-700/50' :
                                                                                        challenge.result === 'init' ? 'border-blue-200 dark:border-blue-700/50' :
                                                                                            challenge.result === 'withdrawal' ? 'border-purple-200 dark:border-purple-700/50' :
                                                                                                'border-orange-200 dark:border-orange-700/50'
                                                                            } 
                                                                        shadow-sm transition-all duration-200`}>
                                                                            {challenge.result === 'approved' ? 'Aprobado' :
                                                                                challenge.result === 'progress' ? 'En progreso' :
                                                                                    challenge.result === 'disapproved' ? 'Desaprobado' :
                                                                                        challenge.result === 'init' ? 'Por Iniciar' :
                                                                                            challenge.result === 'withdrawal' ? 'Retirado' :
                                                                                                challenge.result === 'retry' ? 'Rechazado' : challenge.result}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex text-gray-600 text-xs dark:text-gray-300 items-center mt-1">
                                                                        <CalendarIcon className="h-4 text-gray-500 w-3 mr-1" />
                                                                        <span>
                                                                            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* Botones de acción */}
                                                                <div className="flex space-x-2 overflow-x-auto overflow-y-hidden">
                                                                    {/* Botones de certificado */}
                                                                    {renderCertificateButtons(challenge)}
                                                                    {/* Botón de detalles - SEGUNDA MODIFICACIÓN */}
                                                                    <Link href={`/metrix/${challenge.documentId}`}>
                                                                        <button className="flex h-8 bg-white border border-gray-300 justify-center rounded-lg shadow-sm dark:bg-zinc-700/90 dark:border-zinc-500/50 dark:hover:bg-zinc-600/80 hover:bg-gray-50 items-center px-3 py-1.5 space-x-1 text-xs transition-all duration-200">
                                                                            <ChartBarIcon className="h-4 w-4 mr-1" />
                                                                            <span>Ver detalles</span>
                                                                        </button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Layout>
    );
}