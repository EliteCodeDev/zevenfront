import React, { useState, useMemo } from "react";
import { Database, PlusCircle, RefreshCw, CheckCircle, XCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "..";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

const BrokerAccountsRedesign = () => {
    const { data: session } = useSession();
    const [selectedAccountType, setSelectedAccountType] = useState(null);
    const [formVisible, setFormVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        login: "",
        password: "",
        server: "",
        balance: "",
        platform: "mt4",
        used: false,
        inversorPass: ""
    });
    const [pageSize, setPageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

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

    const { data, error } = useSWR(
        session?.jwt
            ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/broker-accounts?filters[used][$eq]=false`, session.jwt]
            : null,
        ([url, token]) => fetcher(url, token)
    );

    const accountTypes = [
        { amount: "5000", label: "$5,000", color: "bg-blue-500", hoverColor: "hover:bg-blue-600" },
        { amount: "10000", label: "$10,000", color: "bg-green-500", hoverColor: "hover:bg-green-600" },
        { amount: "25000", label: "$25,000", color: "bg-yellow-500", hoverColor: "hover:bg-yellow-600" },
        { amount: "50000", label: "$50,000", color: "bg-red-500", hoverColor: "hover:bg-red-600" },
        { amount: "100000", label: "$100,000", color: "bg-purple-500", hoverColor: "hover:bg-purple-600" },
        { amount: "200000", label: "$200,000", color: "bg-pink-500", hoverColor: "hover:bg-pink-600" },
    ];

    const balanceCounts = useMemo(() => {
        if (!data || !data.data) return {};

        return accountTypes.reduce((acc, { amount }) => {
            acc[amount] = data.data.filter((account) => account.balance == amount).length;
            return acc;
        }, {});
    }, [data, accountTypes]);

    // Sample broker accounts data
    const brokerAccounts = data?.data || [];

    // Pagination logic
    const totalItems = brokerAccounts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAccounts = brokerAccounts.slice(startIndex, endIndex);

    // Navigation functions
    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPage = (page) => setCurrentPage(page);

    // Create array of page numbers to display
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfPagesToShow);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

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
            setFormVisible(false);
        } catch (error) {
            console.error("🚨 Error al guardar en Strapi:", error);
            toast.error("Error al guardar la cuenta.");
        }
    };

    const selectAccountType = (amount, label) => {
        setSelectedAccountType(label);
        setFormData(prev => ({
            ...prev,
            balance: amount
        }));
        setFormVisible(true);
    };

    return (
        <DashboardLayout>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900">
                <div className="max-w-7xl mx-auto">
                    {/* Header with title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white inline-block border-b-4 border-blue-500 pb-2">
                            Creador de Broker Accounts
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Gestiona y crea cuentas de broker para diferentes balances
                        </p>
                    </div>

                    {/* Dashboard summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                        {accountTypes.map(({ amount, label, color }) => (
                            <Card key={amount} className={`overflow-hidden border-0 shadow-lg ${color === 'bg-yellow-500' ? 'text-black' : 'text-white'}`}>
                                <div className={`${color} p-4 h-full flex flex-col`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-semibold uppercase opacity-75">Cuentas</span>
                                        <span className="text-xs font-semibold">{label}</span>
                                    </div>
                                    <div className="mt-3 mb-2 flex-1 flex items-center justify-center">
                                        <span className="text-4xl font-bold">{balanceCounts[amount] || 0}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                        onClick={() => selectAccountType(amount, label)}
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Agregar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Main content area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left panel - Account selection and form */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                <CardHeader className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                                    <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                                        {selectedAccountType ? `Nueva Cuenta - ${selectedAccountType}` : 'Selecciona el tipo de cuenta'}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-0">
                                    {!formVisible ? (
                                        <div className="grid grid-cols-2 gap-2 p-4">
                                            {accountTypes.map(({ amount, label, color, hoverColor }) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => selectAccountType(amount, label)}
                                                    className={`${color} ${hoverColor} text-white p-4 rounded-lg shadow-md transition-all transform hover:scale-105 hover:shadow-lg flex flex-col items-center ${color === 'bg-yellow-500' ? 'text-black' : ''}`}
                                                >
                                                    <span className="text-xl font-bold">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login</label>
                                                    <Input
                                                        name="login"
                                                        placeholder="Ingrese el login..."
                                                        value={formData.login}
                                                        onChange={handleInputChange}
                                                        className="h-10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Balance</label>
                                                    <Input
                                                        name="balance"
                                                        placeholder="Ingrese el balance..."
                                                        value={formData.balance}
                                                        onChange={handleInputChange}
                                                        className="h-10"
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Plataforma</label>
                                                    <select
                                                        name="platform"
                                                        value={formData.platform}
                                                        onChange={handleInputChange}
                                                        className="h-10 px-3 text-sm w-full bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="mt4">MT4</option>
                                                        <option value="mt5">MT5</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contraseña</label>
                                                    <div className="relative">
                                                        <Input
                                                            id="password"
                                                            name="password"
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Ingrese la contraseña..."
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            className="h-10 pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Inversor Pass</label>
                                                    <Input
                                                        name="inversorPass"
                                                        placeholder="Ingrese el inversorPass..."
                                                        value={formData.inversorPass}
                                                        onChange={handleInputChange}
                                                        className="h-10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Servidor</label>
                                                    <Input
                                                        name="server"
                                                        placeholder="Ingrese el servidor..."
                                                        value={formData.server}
                                                        onChange={handleInputChange}
                                                        className="h-10"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex space-x-4 pt-4">
                                                <Button
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                                    onClick={saveBrokerAccount}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Guardar
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-zinc-300 dark:border-zinc-600"
                                                    onClick={() => {
                                                        setFormVisible(false);
                                                        setSelectedAccountType(null);
                                                    }}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right panel - Accounts table */}
                        <div className="lg:col-span-2">
                            <Card className="shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden h-full">
                                <CardHeader className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex flex-row justify-between items-center">
                                    <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                                        Cuentas Disponibles
                                    </CardTitle>

                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-zinc-50 dark:bg-zinc-800">
                                                <tr>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Login</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Password</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Balance</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Server</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Platform</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Inversor</th>
                                                    <th className="text-left text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-700">Used</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!data?.data || data.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="p-8 text-center">
                                                            <div className="flex flex-col items-center justify-center py-12">
                                                                <Database className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                                                                <span className="text-zinc-500 dark:text-zinc-400 text-sm">No se encontraron resultados.</span>
                                                                <span className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Crea una nueva cuenta para comenzar</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedAccounts.map((account, index) => (
                                                        <tr
                                                            key={index}
                                                            className={`
                                                                border-b border-zinc-200 dark:border-zinc-700 
                                                                ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/40'}
                                                                hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors
                                                            `}
                                                        >
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{account.login}</td>
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{account.password}</td>
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">${account.balance}</td>
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{account.server}</td>
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{account.platform}</td>
                                                            <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{account.inversorPass}</td>
                                                            <td className="p-3 text-sm">
                                                                {account.used === false ? (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                                                        No
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                                                                        Sí
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {brokerAccounts.length > 0 && (
                                        <div className="mt-6 flex flex-col items-center gap-4 p-4 border-t border-zinc-200 dark:border-zinc-700">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded-full bg-blue-100 text-blue-500 disabled:opacity-50 hover:bg-blue-200 transition-colors"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                
                                                {startPage > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => goToPage(1)}
                                                            className="px-3 py-1 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 transition-colors"
                                                        >
                                                            1
                                                        </button>
                                                        {startPage > 2 && <span className="px-2">...</span>}
                                                    </>
                                                )}
                                                
                                                {pageNumbers.map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`px-3 py-1 rounded-md transition-colors ${
                                                            currentPage === page 
                                                                ? "bg-blue-500 text-white" 
                                                                : "text-zinc-700 dark:text-zinc-300 hover:bg-blue-100"
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                
                                                {endPage < totalPages && (
                                                    <>
                                                        {endPage < totalPages - 1 && <span className="px-2">...</span>}
                                                        <button
                                                            onClick={() => goToPage(totalPages)}
                                                            className="px-3 py-1 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 transition-colors"
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    </>
                                                )}
                                                
                                                <button
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 rounded-full bg-blue-100 text-blue-500 disabled:opacity-50 hover:bg-blue-200 transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                <span>
                                                    Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems}
                                                </span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="p-1 border rounded bg-white dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={5}>5 por página</option>
                                                    <option value={10}>10 por página</option>
                                                    <option value={25}>25 por página</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BrokerAccountsRedesign;