// src/pages/billing/index.js
import React, { useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { DocumentTextIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import strapiService from '../../services/server/strapiService';

// Obtener datos desde el servidor
export async function getServerSideProps(context) {
    try {
        // Obtener la sesión del servidor
        const session = await getSession(context);

        // Si no hay sesión, redirigir al login
        if (!session) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        // Obtener el token JWT
        const token = session.jwt;

        if (!token) {
            console.error('No JWT token available in session');
            return {
                props: {
                    initialWithdrawals: [],
                    error: 'Authentication required',
                },
            };
        }

        // Hacer la petición a Strapi con el mismo populate complejo
        const userData = await strapiService.authenticatedRequest(
            'users/me?populate[challenges][populate][withdraw]=*&populate[challenges][populate][challenge_relation][populate][challenge_stages]=*',
            {
                method: 'GET',
            },
            token
        );

        // Procesar los retiros de la misma manera que en el componente original
        const withdrawals = [];

        if (userData?.challenges) {
            userData.challenges.forEach(challenge => {
                if (challenge.withdraw) {
                    withdrawals.push({
                        ...challenge.withdraw,
                        challengeId: challenge.challengeId,
                        phase: challenge.phase,
                        challenge: challenge.documentId,
                        challenge_relation: challenge.challenge_relation
                    });
                }
            });
        }

        // Devolver datos procesados al cliente
        return {
            props: {
                initialWithdrawals: withdrawals,
            },
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);

        // Devolver error en caso de fallo
        return {
            props: {
                initialWithdrawals: [],
                error: error.message || 'Failed to load withdrawals',
            },
        };
    }
}

// Componente cliente que recibe datos pre-procesados
const WithdrawalsPage = ({ initialWithdrawals = [], error = null }) => {
    // Mantener useSession para datos de la sesión actual (como el estado de autenticación)
    const { data: session } = useSession();

    // Usar estado con los datos iniciales pre-cargados
    const [withdrawals] = useState(initialWithdrawals);
    const [isLoading] = useState(false);

    // Si hay un error devuelto desde el servidor
    if (error) {
        return (
            <Layout>
                <div className="p-6 text-red-600 dark:text-red-400">
                    Error loading data: {error}
                </div>
            </Layout>
        );
    }

    // Si está cargando (esto ya no debería ocurrir con SSR, pero lo mantenemos por compatibilidad)
    if (isLoading) {
        return (
            <Layout>
                <Loader />
            </Layout>
        );
    }

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Función para mostrar el estado del retiro con un color adecuado
    const getStatusBadge = (status) => {
        let statusMessage = "";
        let bgColor = "bg-yellow-100 text-yellow-800";

        if (status === "pagado" || status === "completed") {
            bgColor = "bg-green-100 text-green-800";
            statusMessage = "Paid";
        } else if (status === "cancelado") {
            bgColor = "bg-red-100 text-red-800";
            statusMessage = "Cancelled";
        } else {
            statusMessage = "Pending";
        }

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor}`}>
                {statusMessage || "processing"}
            </span>
        );
    };

    // Function to get the stage name from challenge_stages
    const getStageName = (withdrawal) => {
        const { phase, challenge_relation } = withdrawal;

        // Default fallback if no data is available
        const fallbackName = `Phase ${phase}`;

        // If no challenge_relation or challenge_stages, return fallback
        if (!challenge_relation?.challenge_stages ||
            !Array.isArray(challenge_relation.challenge_stages) ||
            challenge_relation.challenge_stages.length === 0) {
            return fallbackName;
        }

        // Sort stages by ID
        const sortedStages = [...challenge_relation.challenge_stages].sort((a, b) => a.id - b.id);

        // Get stage name for the current phase
        if (phase > 0 && phase <= sortedStages.length) {
            // Always use the name from challenge_stages if available
            return sortedStages[phase - 1].name || fallbackName;
        }

        return fallbackName;
    };

    return (
        <Layout>
            {/* Cabecera de Mis Retiros */}
            <div className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-all">
                <div className="absolute h-1 top-0 left-0 right-0 bg-[var(--app-primary)]"></div>

                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-[var(--app-primary)]/10">
                            <BanknotesIcon className="w-5 h-5 text-[var(--app-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
                            My Withdrawals
                        </h1>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 overflow-x-auto dark:bg-black bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Challenge</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">State</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {withdrawals.length > 0 ? (
                            withdrawals.map((withdrawal, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {/* Always use getStageName for stage display */}
                                        {getStageName(withdrawal)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(withdrawal.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="truncate max-w-[150px] inline-block">
                                            {withdrawal.wallet}
                                        </span>
                                    </TableCell>
                                    <TableCell>${withdrawal.amount}</TableCell>
                                    <TableCell className="text-right">
                                        {getStatusBadge(withdrawal.estado)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                    There are no Withdrawals to show.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Layout>
    );
};

export default WithdrawalsPage;