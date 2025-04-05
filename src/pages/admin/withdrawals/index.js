"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useStrapiData } from "src/services/strapiService";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DashboardLayout from "..";
import { InboxIcon, AlertCircle, RefreshCw } from "lucide-react";

const withdrawColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "nombre", header: "Usuario" },
  { accessorKey: "wallet", header: "Wallet" },
  { accessorKey: "amount", header: "Monto" },
  { accessorKey: "estado", header: "Estado" },
  { accessorKey: "createdAt", header: "Fecha de Creación" },
  { accessorKey: "action", header: "Acciones" },
];

export default function WithdrawsTable() {
  const { data, error, isLoading } = useStrapiData("withdraws?populate[challenge][populate]=user");

  // Estados para filtros
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para el modal de rechazo
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para manejar actualizaciones locales
  const [localUpdates, setLocalUpdates] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Función para refrescar datos manualmente
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    // Implementamos una recarga suave usando setTimeout para mostrar el estado de carga
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  const handleAccept = async (documentId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_CHALLENGE_WITHDRAW_STATUS || ""}`, {
        method: "POST",
        body: JSON.stringify({
          documentId: documentId,
          status: "pagado"
        }),
        headers: {
          "Content-Type": "application/json"
        },
      });
      if (response.ok) {
        // Actualizar estado localmente
        setLocalUpdates(prev => ({
          ...prev,
          [documentId]: { estado: "pagado" }
        }));

        toast.success("Retiro completado exitosamente", {
          duration: 1500
        });

        // Programar recarga de página después de mostrar el toast
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      toast.error("Error, no se pudo completar el retiro");
      console.error("Error al aceptar la solicitud de retiro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error("Por favor, introduzca un motivo de rechazo");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_CHALLENGE_WITHDRAW_STATUS || ""}`, {
        method: "POST",
        body: JSON.stringify({
          documentId: selectedWithdrawal.documentId,
          status: "rechazado",
          reason: rejectionReason
        }),
        headers: {
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        // Actualizar estado localmente
        setLocalUpdates(prev => ({
          ...prev,
          [selectedWithdrawal.documentId]: { estado: "rechazado" }
        }));

        toast.success("Retiro rechazado y notificado al usuario", {
          duration: 1500
        });

        setIsRejectModalOpen(false);

        // Refrescar datos automáticamente
        refreshData();
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      toast.error("Ha ocurrido un error al rechazar la solicitud de retiro");
      console.error("Error al rechazar la solicitud de retiro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Procesar los datos para obtener una estructura plana para la tabla
  const processedData = useMemo(() => {
    if (!data) return [];

    return data.map((item, index) => {
      const withdraw = item.attributes || item;
      const challenge = withdraw.challenge?.data?.attributes || withdraw.challenge;
      const user = challenge?.user?.data?.attributes || challenge?.user;

      // Se obtiene el nombre completo del usuario combinando firstName y lastName.
      const nombre = user && user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : "N/A";

      const rowData = {
        id: index + 1, // ID secuencial comenzando en 1
        nombre,
        documentId: withdraw.documentId,
        wallet: withdraw.wallet,
        amount: withdraw.amount,
        estado: withdraw.estado,
        createdAt: withdraw.createdAt,
        challengeId: challenge?.id || "N/A",
      };

      // Aplicar actualizaciones locales si existen
      if (localUpdates[withdraw.documentId]) {
        return { ...rowData, ...localUpdates[withdraw.documentId] };
      }

      return rowData;
    });
  }, [data, localUpdates]);

  const filteredData = useMemo(() => {
    if (!processedData.length) return [];

    return processedData.filter((item) => {
      const matchesEstado = estadoFilter ? item.estado === estadoFilter : true;

      // Filtro de fechas
      let matchesDates = true;
      if (startDateFilter || endDateFilter) {
        const itemDate = new Date(item.createdAt);
        const startDate = startDateFilter ? new Date(startDateFilter) : null;
        const endDate = endDateFilter ? new Date(endDateFilter) : null;

        if (startDate && endDate) {
          matchesDates = itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          matchesDates = itemDate >= startDate;
        } else if (endDate) {
          matchesDates = itemDate <= endDate;
        }
      }

      return matchesEstado && matchesDates;
    });
  }, [processedData, estadoFilter, startDateFilter, endDateFilter]);

  const table = useReactTable({
    data: filteredData,
    columns: withdrawColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DashboardLayout>
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg ">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            Retiros
          </h1>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          </Button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 bg-[var(--app-primary)]/10 dark:bg-zinc-800/60 p-5 rounded-lg border border-[var(--app-primary)]/30 dark:border-zinc-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Estado:</span>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)] transition-all"
              >
                <option value="">Todos</option>
                <option value="proceso">En Proceso</option>
                <option value="pagado">Pagado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </label>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Desde:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)] transition-all"
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Hasta:</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)] transition-all"
                />
              </label>
            </div>
          </div>

          <Button
            onClick={() => {
              setStartDateFilter("");
              setEndDateFilter("");
              setEstadoFilter("");
            }}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Limpiar filtros
          </Button>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--app-primary)] dark:bg-zinc-800">
                <TableRow>
                  {withdrawColumns.map((column) => (
                    <TableHead
                      key={column.accessorKey}
                      className="text-sm font-semibold text-zinc-100 py-3 px-4"
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isRefreshing ? (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[var(--app-secondary)] mb-4"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center py-8 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">Error al cargar los datos: {error.message}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={`border-b border-gray-200 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/30'
                        }`}
                    >
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{item.id}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{item.nombre}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{item.wallet}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.amount}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${item.estado === "pagado"
                          ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300"
                          : item.estado === "rechazado"
                            ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300"
                          }`}>
                          {item.estado}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={item.estado !== "proceso" || isSubmitting}
                            onClick={() => handleAccept(item.documentId)}
                            className={`px-3 py-1 text-xs font-medium rounded ${item.estado !== "proceso" || isSubmitting
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white"
                              }`}
                          >
                            {isSubmitting && selectedWithdrawal?.documentId === item.documentId ?
                              <span className="flex items-center gap-1">
                                <span className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></span>
                                Procesando
                              </span> :
                              "Completar"
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={item.estado !== "proceso" || isSubmitting}
                            onClick={() => openRejectModal(item)}
                            className={`px-3 py-1 text-xs font-medium rounded ${item.estado !== "proceso" || isSubmitting
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white"
                              }`}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/30 p-6 rounded-lg">
                        <InboxIcon className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-500 mb-3" />
                        <span className="text-zinc-600 dark:text-zinc-400">No se encontraron resultados</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Mostrando {filteredData.length} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de rechazo */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-[var(--app-primary)]/40 dark:border-zinc-700 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Rechazar Solicitud de Retiro</DialogTitle>
              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                Proporcione una razón para rechazar esta solicitud. Se compartirá con el usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Escriba la razón del rechazo"
                className="min-h-24 w-full bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)] transition-all"
              />
            </div>
            <DialogFooter className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isSubmitting}
                className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isSubmitting}
                className={`transition-colors ${!rejectionReason.trim() || isSubmitting ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  "Confirmar Rechazo"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}