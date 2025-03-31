import React from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { useStrapiData } from '../../services/strapiServiceJWT';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { DocumentTextIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const WithdrawalsPage = () => {
    const { data: session } = useSession();
    const token = session?.jwt;

    // Updated API call to include challenge_relation and challenge_stages
    const { data, error, isLoading } = useStrapiData('users/me?populate[challenges][populate][withdraw]=*&populate[challenges][populate][challenge_relation][populate][challenge_stages]=*', token);
    // console.log(data);
    if (isLoading) {
        return (
            <Layout>
                <Loader />
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-6 text-red-600 dark:text-red-400">
                    Error al cargar los datos: {error.message}
                </div>
            </Layout>
        );
    }

    // Extraer los retiros (withdrawals) de los challenges del usuario
    const withdrawals = [];

    if (data?.challenges) {
        data.challenges.forEach(challenge => {
            if (challenge.withdraw) {
                withdrawals.push({
                    ...challenge.withdraw,
                    challengeId: challenge.challengeId,
                    phase: challenge.phase,
                    challenge: challenge.documentId,
                    // Include challenge_relation for stage name
                    challenge_relation: challenge.challenge_relation
                });
            }
        });
    }
    // console.log(withdrawals);
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
        let bgColor = "bg-yellow-100 text-yellow-800";

        if (status === "pagado" || status === "completado") {
            bgColor = "bg-green-100 text-green-800";
        } else if (status === "rechazado") {
            bgColor = "bg-red-100 text-red-800";
        }

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor}`}>
                {status || "proceso"}
            </span>
        );
    };

    // Function to get the stage name from challenge_stages
    const getStageName = (withdrawal) => {
        const { phase, challenge_relation } = withdrawal;

        // Default fallback if no data is available
        const fallbackName = `Fase ${phase}`;

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
            <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <BanknotesIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                        <h1 className="text-xl font-semibold">Mis Retiros</h1>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 overflow-x-auto dark:bg-black bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Challenge</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
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
                                    No hay retiros para mostrar.
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