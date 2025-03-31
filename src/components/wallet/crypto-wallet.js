// components/wallet/crypto-wallet.js
import React, { useState, useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// Estados posibles para la solicitud de retiro desde la base de datos
const WITHDRAW_STATES = {
    PROCESS: 'proceso',
    PAID: 'pagado',
    CANCELLED: 'cancelado'
};

export default function BilleteraCripto({ balance = "1000000", userId, challengeId, brokerBalance = "0" }) {
    // // console.log("BilleteraCripto -> balance", balance);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [usdtWalletAddress, setUsdtWalletAddress] = useState("");
    const [requestStatus, setRequestStatus] = useState("idle"); // idle, requesting, completed
    const [withdrawState, setWithdrawState] = useState(null);
    const [apiResult, setApiResult] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Asegurando que balance es tratado como string en caso de ser undefined o número
    const safeBalance = String(balance || "1000000");
    const safeBrokerBalance = String(brokerBalance || "0");

    // Efecto para calcular la diferencia entre balances (lo que se puede retirar)
    useEffect(() => {
        try {
            // Calcular la diferencia entre el balance actual y el balance inicial del broker
            const currentBalance = parseFloat(safeBalance);
            const initialBalance = parseFloat(safeBrokerBalance);

            // Solo permitir retiros cuando hay una ganancia (balance actual > balance inicial)
            const difference = Math.max(currentBalance - initialBalance);
            setWithdrawAmount(difference.toFixed(2));
        } catch (error) {
            console.error("Error al calcular el monto de retiro:", error);
            setWithdrawAmount("0.00");
        }
    }, [safeBalance, safeBrokerBalance]);

    // Verificar el estado actual de la solicitud en la base de datos
    useEffect(() => {
        checkWithdrawStatus();

        // Verificar periódicamente el estado
        const interval = setInterval(checkWithdrawStatus, 30000); // Cada 30 segundos

        return () => clearInterval(interval);
    }, []);

    // Función para consultar el estado actual de la solicitud en la base de datos
    const checkWithdrawStatus = async () => {
        try {
            // Consultar el endpoint para obtener el estado actual
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/withdraws?populate[challenge][populate]=user&filters[challenge][documentId][$eq]=${challengeId}&filters[challenge][user][documentId][$eq]=${userId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
                }
            });

            // Si hay datos y tiene un estado, actualizar el estado local
            if (response.data && response.data.estado !== undefined) {
                setWithdrawState(response.data);
                // console.log("Estado actual de retiro:", response.data);
            } else {
                setWithdrawState(null);
            }
        } catch (error) {
            console.error("Error al verificar estado de solicitud:", error);
        }
    };

    // Obtener datos actualizados de la API de estadísticas
    const fetchStatisticsData = async (metaId) => {
        if (!metaId || !challengeId) return;

        setIsLoadingData(true);
        try {
            const token = process.env.NEXT_PUBLIC_TOKEN_META_API;
            const response = await fetch(
                `https://risk-management-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${metaId}/trackers/${challengeId}/statistics`,
                {
                    method: "GET",
                    headers: {
                        "auth-token": `${token}`,
                        "api-version": 1,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            setApiResult(result);

            // Si hay un balance en el resultado, actualizar el withdrawAmount
            if (result && typeof result.balance === 'number') {
                const currentBalance = result.balance;
                const initialBalance = parseFloat(safeBrokerBalance);
                const difference = Math.max(0, currentBalance - initialBalance);
                setWithdrawAmount(difference.toFixed(2));
            }
        } catch (error) {
            console.error("Error fetching statistics data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const openModal = () => {
        // Verificar nuevamente el estado antes de abrir el modal
        checkWithdrawStatus().then(() => {
            // Si hay una solicitud activa, mostrar mensaje según su estado
            if (withdrawState && withdrawState.estado) {
                const statusMessages = {
                    [WITHDRAW_STATES.PROCESS]: "Su solicitud de retiro está en proceso.",
                    [WITHDRAW_STATES.PAID]: "Su retiro fue exitoso.",
                    [WITHDRAW_STATES.CANCELLED]: "Su solicitud fue cancelada."
                };

                alert(statusMessages[withdrawState.estado] || "Ya tiene una solicitud de retiro activa.");
            } else {
                // Si no hay solicitud activa, abrir el modal
                setIsModalOpen(true);
            }
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setUsdtWalletAddress("");
        setRequestStatus("idle");
    };

    // Esta función se ejecuta cuando se hace clic en el botón "Solicitar" dentro del modal
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Validaciones básicas
            if (parseFloat(withdrawAmount) <= 0) {
                alert("No tienes fondos disponibles para retirar en este momento.");
                return;
            }

            if (!usdtWalletAddress.trim()) {
                alert("Debes ingresar una dirección de wallet USDT TRC20 válida.");
                return;
            }

            if (!challengeId) {
                alert("No se pudo obtener la información del desafío.");
                return;
            }

            // Cambiar estado a "requesting" para mostrar animación de carga
            setRequestStatus("requesting");

            // Preparar datos para enviar al webhook
            const requestData = {
                amount: withdrawAmount,
                wallet_address: usdtWalletAddress,
                user_id: userId,
                balance: safeBalance,
                challenge_id: challengeId,  // Enviamos el challengeId al webhook
                timestamp: new Date().toISOString()
            };
            // console.log("Enviando solicitud a n8n:", requestData);

            // PASO CLAVE: Enviar la solicitud al webhook de n8n
            const response = await axios.post(process.env.NEXT_PUBLIC_N8N_CHALLENGE_WITHDRAW, requestData);
            // console.log("Respuesta :", response);

            // console.log("Respuesta del webhook:", response.data);

            if (response.status >= 200 && response.status < 300) {
                // El webhook se activó correctamente
                setRequestStatus("completed");

                // Mostrar mensaje de éxito
                setTimeout(() => {
                    closeModal();

                    // Verificar el estado actualizado después de enviar la solicitud
                    checkWithdrawStatus();
                }, 3000);
                window.location.reload();
            } else {
                throw new Error("Error al enviar la solicitud al webhook");
            }
        } catch (error) {
            console.error("Error en el procesamiento de retiro:", error);
            alert("Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.");
            setRequestStatus("idle");
        }
    };

    // Determinar el estilo y texto del botón según el estado
    const getButtonStyle = () => {
        // Si no hay solicitud activa o el estado es vacío
        if (!withdrawState || !withdrawState.estado) {
            return {
                bgClass: "bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600",
                text: "Retirar",
                tooltipText: "Solicitar un retiro de fondos"
            };
        }

        // Según el estado actual de la base de datos
        switch (withdrawState.estado) {
            case WITHDRAW_STATES.PROCESS:
                return {
                    bgClass: "bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-700 dark:hover:bg-yellow-600",
                    text: "En proceso",
                    tooltipText: "Su solicitud de retiro está en proceso"
                };
            case WITHDRAW_STATES.PAID:
                return {
                    bgClass: "bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600",
                    text: "Completado",
                    tooltipText: "Su retiro fue exitoso"
                };
            case WITHDRAW_STATES.CANCELLED:
                return {
                    bgClass: "bg-red-200 hover:bg-red-300 dark:bg-red-700 dark:hover:bg-red-600",
                    text: "Cancelado",
                    tooltipText: "Su solicitud fue cancelada"
                };
            default:
                return {
                    bgClass: "bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600",
                    text: "Retirar",
                    tooltipText: "Solicitar un retiro de fondos"
                };
        }
    };

    // Determinar si el botón debe estar deshabilitado
    const isWithdrawDisabled = parseFloat(withdrawAmount) <= 0;

    const buttonStyle = getButtonStyle();

    return (
        <>
            {/* Botón de Retirar con tooltip */}
            <div className="relative">
                <button
                    onClick={openModal}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg shadow-md ${buttonStyle.bgClass} border-gray-300 dark:border-zinc-500 ${isWithdrawDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={buttonStyle.tooltipText}
                    disabled={isWithdrawDisabled}
                >
                    <CreditCardIcon className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                    <span className="text-xs lg:text-sm dark:text-zinc-200">
                        {buttonStyle.text}
                    </span>
                </button>
            </div>

            {/* Modal para retiros */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-md w-full">
                        <div className="p-4 border-b dark:border-zinc-700 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Solicitud de Retiro</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-4">
                            {requestStatus === "idle" ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Monto a retirar</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={withdrawAmount}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-zinc-600 dark:border-zinc-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Monto calculado como la diferencia entre el balance actual (${safeBalance}) y el balance inicial (${safeBrokerBalance}).
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Wallet USDT TRC20</label>
                                        <input
                                            type="text"
                                            value={usdtWalletAddress}
                                            onChange={(e) => setUsdtWalletAddress(e.target.value)}
                                            placeholder="Ingresa tu dirección de wallet USDT TRC20"
                                            required
                                            className="w-full px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded-md dark:border-zinc-600 dark:text-white"
                                        >
                                            Cancelar
                                        </button>
                                        {/* Este botón activa el webhook de n8n */}
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-[var(--app-primary)] hover:bg-[var(--app-secondary)] text-black rounded-md"
                                            disabled={parseFloat(withdrawAmount) <= 0 || !usdtWalletAddress.trim()}
                                        >
                                            Solicitar
                                        </button>
                                    </div>
                                </form>
                            ) : requestStatus === "requesting" ? (
                                <div className="py-6 text-center space-y-4">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--app-primary)] border-t-transparent"></div>
                                    </div>
                                    <p className="font-medium">Procesando solicitud...</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Tu solicitud está siendo procesada. Por favor, espera un momento.
                                    </p>
                                </div>
                            ) : (
                                <div className="py-6 text-center space-y-4">
                                    <div className="flex justify-center">
                                        <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                            ✓
                                        </div>
                                    </div>
                                    <p className="font-medium">¡Solicitud enviada!</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Tu solicitud de retiro ha sido enviada correctamente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}