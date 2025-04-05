"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useSession } from "next-auth/react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DashboardLayout from "../..";
import { 
    AlertCircle, 
    AlertOctagon, 
    UserCircle, 
    MapPin, 
    Mail, 
    Phone, 
    Save, 
    X, 
    PencilIcon 
} from "lucide-react";

const fetcher = async (url, token) => {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        console.error("Error en la API:", res.status, res.statusText);
        throw new Error("Error al obtener datos");
    }

    const json = await res.json();
    return json;
};

export default function UserProfile() {
    const { data: session } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Se mantiene la ruta original
    const { data, error, isLoading, mutate } = useSWR(
        session?.jwt && id
            ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?filters[documentId][$eq]=${id}&populate[challenges][populate]=broker_account`, session.jwt]
            : null,
        ([url, token]) => fetcher(url, token)
    );

    // Inicializar datos del formulario cuando se cargan los datos
    React.useEffect(() => {
        if (data && data.length > 0) {
            const user = data[0];
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                country: user.country || '',
                city: user.city || '',
                street: user.street || '',
                zipCode: user.zipCode || ''
            });
        }
    }, [data]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!data || data.length === 0) return;

        setIsSaving(true);
        try {
            const user = data[0];
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.jwt}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error?.message || "Error al actualizar usuario");
            }

            toast.success("Datos actualizados correctamente");
            mutate(); // Recargar datos
            setIsEditing(false);
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Resetear form data a los valores originales
        if (data && data.length > 0) {
            const user = data[0];
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                country: user.country || '',
                city: user.city || '',
                street: user.street || '',
                zipCode: user.zipCode || ''
            });
        }
        setIsEditing(false);
    };

    const [resultFilter, setResultFilter] = useState("");
    const [phaseFilter, setPhaseFilter] = useState("");

    const filteredChallenges = useMemo(() => {
        if (!data || data.length === 0) return [];

        const user = data[0];

        return user.challenges?.filter((challenge) => {
            const matchesResult = resultFilter ? challenge.result === resultFilter : true;
            const matchesPhase = phaseFilter ? String(challenge.phase) === phaseFilter : true;
            return matchesResult && matchesPhase;
        }) || [];
    }, [data, resultFilter, phaseFilter]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-secondary)] mb-4 mx-auto"></div>
                        <p className="text-zinc-600 dark:text-zinc-400">Cargando datos...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-6 border border-red-200 dark:border-red-900 max-w-md">
                        <div className="flex items-center text-red-500 mb-2">
                            <AlertCircle className="w-6 h-6 mr-2" />
                            <p className="font-medium">Error al cargar los datos o usuario no encontrado.</p>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400">Por favor, intenta nuevamente o contacta al administrador.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const user = data[0];

    const translateResult = (result) => {
        switch (result) {
            case "init":
                return "Iniciado";
            case "approved":
                return "Aprobado";
            case "disapproved":
                return "Desaprobado";
            case "progress":
                return "En Curso";
            default:
                return "N/A";
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
                {/* Encabezado de perfil */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--app-primary)]/20 dark:border-zinc-700">
                    <div className="flex items-center">
                        <div className="bg-[var(--app-primary)]/10 dark:bg-zinc-800 p-4 rounded-full mr-4">
                            <UserCircle className="w-12 h-12 text-[var(--app-secondary)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Perfil de Usuario</h1>
                            <p className="text-zinc-600 dark:text-zinc-400">{user.firstName} {user.lastName}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${user.isVerified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {user.isVerified ? 'Verificado' : 'No Verificado'}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${user.statusSign ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {user.statusSign ? 'Firma Aprobada' : 'Firma No Aprobada'}
                        </div>
                    </div>
                </div>

                {/* Información del usuario */}
                <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800/50 p-6 rounded-lg mb-8 border border-[var(--app-primary)]/10 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Información Personal</h2>
                        {!isEditing ? (
                            <Button 
                                onClick={() => setIsEditing(true)} 
                                className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black rounded-md flex items-center gap-1"
                            >
                                <PencilIcon className="h-4 w-4" />
                                <span>Editar</span>
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleSave} 
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-1"
                                    disabled={isSaving}
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                                </Button>
                                <Button 
                                    onClick={handleCancel} 
                                    className="bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-md flex items-center gap-1"
                                >
                                    <X className="h-4 w-4" />
                                    <span>Cancelar</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {!isEditing ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Nombre Completo</p>
                                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.firstName} {user.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Email</p>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Teléfono</p>
                                    <div className="flex items-center space-x-2">
                                        <Phone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.phone || 'No disponible'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-[var(--app-primary)]/10 dark:border-zinc-700 pt-4">
                                <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Dirección</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">País</p>
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.country || 'No disponible'}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Ciudad</p>
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.city || 'No disponible'}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Calle</p>
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.street || 'No disponible'}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Código Postal</p>
                                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{user.zipCode || 'No disponible'}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Nombre</label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Apellido</label>
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Email</label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Teléfono</label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[var(--app-primary)]/10 dark:border-zinc-700 pt-4">
                                <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Dirección</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">País</label>
                                        <Input
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Ciudad</label>
                                        <Input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Calle</label>
                                        <Input
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 dark:text-zinc-400 text-sm mb-1">Código Postal</label>
                                        <Input
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleChange}
                                            className="w-full bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Challenges */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                            <span className="border-b-2 border-[var(--app-secondary)] pb-1">Challenges</span>
                        </h2>
                    </div>

                    {/* Filtros */}
                    <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-4 rounded-lg mb-6 border border-[var(--app-primary)]/20 dark:border-zinc-700 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Resultado:</span>
                            <select
                                value={resultFilter}
                                onChange={(e) => setResultFilter(e.target.value)}
                                className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                            >
                                <option value="">Todos</option>
                                <option value="approved">Aprobado</option>
                                <option value="disapproved">Desaprobado</option>
                                <option value="progress">En Curso</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Etapa:</span>
                            <select
                                value={phaseFilter}
                                onChange={(e) => setPhaseFilter(e.target.value)}
                                className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                            >
                                <option value="">Todas</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="border border-[var(--app-primary)]/20 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-[var(--app-primary)]/10 dark:bg-zinc-800">
                                <TableRow>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">ID</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Login</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Server</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Platform</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Resultado</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Etapa</TableHead>
                                    <TableHead className="text-zinc-700 dark:text-zinc-200 font-medium py-3 px-4">Balance Inicial</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChallenges.length > 0 ? (
                                    filteredChallenges.map((challenge, index) => {
                                        const broker = challenge.broker_account
                                            ? {
                                                login: challenge.broker_account.login || "N/A",
                                                server: challenge.broker_account.server || "N/A",
                                                platform: challenge.broker_account.platform || "N/A",
                                                balance: challenge.broker_account.balance || "N/A",
                                            }
                                            : { login: "N/A", server: "N/A", platform: "N/A", balance: "N/A" };

                                        return (
                                            <TableRow
                                                key={challenge.id}
                                                className={`border-b border-[var(--app-primary)]/10 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/50'
                                                    } hover:bg-[var(--app-primary)]/10 dark:hover:bg-zinc-800 transition-colors`}
                                            >
                                                <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.id}</TableCell>
                                                <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{broker.login}</TableCell>
                                                <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{broker.server}</TableCell>
                                                <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{broker.platform}</TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.result === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        challenge.result === 'disapproved' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                            challenge.result === 'progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {translateResult(challenge.result)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.phase}</TableCell>
                                                <TableCell className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">{broker.balance}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-12 text-center text-zinc-500">
                                            <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/40 p-6 rounded-lg border border-[var(--app-primary)]/10 dark:border-zinc-700 mx-8">
                                                <AlertOctagon className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-400 mb-3" />
                                                <span>No se encontraron challenges con los filtros seleccionados.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}