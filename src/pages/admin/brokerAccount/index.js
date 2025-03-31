"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import DashboardLayout from "..";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DatabaseIcon } from "lucide-react";

const brokerAccountColumns = [
    { accessorKey: "login", header: "Login" },
    { accessorKey: "password", header: "Password" },
    { accessorKey: "balance", header: "Balance" },
    { accessorKey: "server", header: "Server" },
    { accessorKey: "platform", header: "Platform" },
    { accessorKey: "inversorPass", header: "Inversor" },
    { accessorKey: "used", header: "Used" },
];

const fetcher = (url, token) =>
    fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).then((res) => res.json());

export default function BrokerAccountsTable() {
    const { data: session } = useSession();
    const { data, error } = useSWR(
        session?.jwt
            ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/broker-accounts?filters[used][$eq]=false`, session.jwt]
            : null,
        ([url, token]) => fetcher(url, token)
    );

    const [search, setSearch] = useState("");
    const [selectedAccountType, setSelectedAccountType] = useState(null);
    const [formData, setFormData] = useState({
        login: "",
        password: "",
        server: "",
        balance: "",
        platform: "mt4",
        used: false,
        inversorPass: "",
    });

    const accountTypes = [
        { amount: "5000", label: "$5,000", color: "bg-blue-500" },
        { amount: "10000", label: "$10,000", color: "bg-green-500" },
        { amount: "25000", label: "$25,000", color: "bg-yellow-500" },
        { amount: "50000", label: "$50,000", color: "bg-red-500" },
        { amount: "100000", label: "$100,000", color: "bg-purple-500" },
    ];

    const balanceCounts = useMemo(() => {
        if (!data || !data.data) return {};

        return accountTypes.reduce((acc, { amount }) => {
            acc[amount] = data.data.filter((account) => account.balance == amount).length;
            return acc;
        }, {});
    }, [data]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "login" && !/^[a-zA-Z0-9]*$/.test(value)) return;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const saveBrokerAccount = async () => {
        if (!session?.jwt) {
            toast.error("No hay sesión activa.");
            return;
        }

        if (!formData.login || !formData.password || !formData.server || !formData.balance) {
            toast.warning("Todos los campos son obligatorios.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/broker-accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.jwt}`,
                },
                body: JSON.stringify({ data: formData }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("❌ Error Strapi Response:", result);
                throw new Error(result?.error?.message || "Error desconocido en Strapi");
            }

            toast.success("Cuenta guardada exitosamente!");

            // 🔄 ACTUALIZA LA TABLA EN TIEMPO REAL
            mutate(
                [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/broker-accounts?filters[used][$eq]=false`, session.jwt],
                async (currentData) => {
                    const newData = result.data;
                    return {
                        ...currentData,
                        data: [...(currentData?.data || []), newData],
                    };
                },
                false
            );

            // Reinicia el formulario
            setFormData({
                login: "",
                password: "",
                server: "",
                balance: "",
                platform: "mt4",
                used: false,
                inversorPass: "",
            });
            setSelectedAccountType(null);
        } catch (error) {
            console.error("🚨 Error al guardar en Strapi:", error);
            toast.error("Error al guardar la cuenta.");
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
                <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white">
                    <span className="border-b-2 border-[var(--app-secondary)] pb-1">Creador de Broker Accounts</span>
                </h1>

                {/* Contadores de cuentas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {accountTypes.map(({ amount, label, color }) => (
                        <div key={amount} className={`${color} text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center h-24`}>
                            <span className="text-2xl font-bold">{balanceCounts[amount] || 0}</span>
                            <span className="text-sm mt-1">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Panel de selección de cuenta */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-2 p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-[var(--app-primary)]/20 dark:border-zinc-700">
                        <p className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Selecciona el tipo de cuenta</p>
                        <div className="grid grid-cols-2 gap-4">
                            {accountTypes.map(({ amount, label, color }) => (
                                <button
                                    key={amount}
                                    onClick={() => {
                                        setSelectedAccountType(label);
                                        setFormData({ ...formData, balance: amount });
                                    }}
                                    className={`${color} text-white p-4 rounded-lg shadow-md flex flex-col items-center hover:opacity-90 transition-all hover:shadow-lg`}
                                >
                                    <span className="text-xl font-bold">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Formulario */}
                        <div className="mt-6 rounded-lg shadow-md p-6 bg-[var(--app-primary)]/5 dark:bg-zinc-800 border border-[var(--app-primary)]/20 dark:border-zinc-700">
                            <h2 className="text-lg font-semibold text-zinc-800 dark:text-gray-200 mb-4">
                                Agregar cuenta - {selectedAccountType}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="login" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login</label>
                                    <Input
                                        id="login"
                                        name="login"
                                        placeholder="Ingrese el login..."
                                        value={formData.login}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="balance" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Balance</label>
                                    <Input
                                        id="balance"
                                        name="balance"
                                        type="number"
                                        placeholder="Ingrese el balance..."
                                        value={formData.balance}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="platform" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Plataforma</label>
                                    <select
                                        id="platform"
                                        name="platform"
                                        value={formData.platform}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm w-full bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    >
                                        <option value="mt4">MT4</option>
                                        <option value="mt5">MT5</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contraseña</label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Ingrese la contraseña..."
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="inversorPass" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Inversor Pass</label>
                                    <Input
                                        id="inversorPass"
                                        name="inversorPass"
                                        placeholder="Ingrese el inversorPass..."
                                        value={formData.inversorPass}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="server" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Servidor</label>
                                    <Input
                                        id="server"
                                        name="server"
                                        placeholder="Ingrese el servidor..."
                                        value={formData.server}
                                        onChange={handleInputChange}
                                        className="h-10 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                                    />
                                </div>

                                <Button
                                    className="mt-6 w-full bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white shadow-md transition-colors"
                                    onClick={saveBrokerAccount}
                                >
                                    Guardar Cuenta
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de cuentas */}
                    <div className="md:col-span-3 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-md mt-0 md:mt-0 h-[70vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Cuentas Disponibles</h2>
                        <div className="rounded-lg overflow-hidden border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm">
                            <Table>
                                <TableHeader className="bg-[var(--app-primary)]/5 dark:bg-zinc-800">
                                    <TableRow>
                                        {brokerAccountColumns.map((column) => (
                                            <TableHead
                                                key={column.accessorKey}
                                                className="text-zinc-700 dark:text-zinc-300 font-medium py-3 px-4 border-b border-[var(--app-primary)]/20 dark:border-zinc-700"
                                            >
                                                {column.header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!data?.data || data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={brokerAccountColumns.length} className="text-center text-zinc-500 py-12">
                                                <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/40 p-6 rounded-lg border border-[var(--app-primary)]/10 dark:border-zinc-700 mx-8">
                                                    <DatabaseIcon className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-400 mb-3" />
                                                    <span>No se encontraron resultados.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.data.map((account, index) => (
                                            <TableRow
                                                key={account.id}
                                                className={`border-b border-[var(--app-primary)]/20 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/40'
                                                    } hover:bg-[var(--app-primary)]/10 dark:hover:bg-zinc-800 transition-colors`}
                                            >
                                                {brokerAccountColumns.map((col) => (
                                                    <TableCell key={col.accessorKey} className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                                                        {col.accessorKey === "used" ? (
                                                            account[col.accessorKey] === false ? (
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                                                    No
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                                                                    Sí
                                                                </span>
                                                            )
                                                        ) : (
                                                            account[col.accessorKey] ?? account.attributes?.[col.accessorKey] ?? "N/A"
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}