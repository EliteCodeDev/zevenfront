"use client";

import React, { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
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

const withdrawColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "documentId", header: "Document ID" },
  { accessorKey: "wallet", header: "Wallet" },
  { accessorKey: "amount", header: "Monto" },
  { accessorKey: "estado", header: "Estado" },
  { accessorKey: "createdAt", header: "Fecha de Creación" },
  { accessorKey: "username", header: "Usuario" },
  { accessorKey: "challengeId", header: "ID del Challenge" },
  { accessorKey: "action", header: "Acciones" },
  // { accessorKey: "challengeDocumentId", header: "Document ID del Challenge" },
];

export default function WithdrawsTable() {
  const { data, error, isLoading } = useStrapiData("withdraws?populate[challenge][populate]=user");

  // Estados para filtros
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  // Estados para el modal de rechazo
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleAccept = async (documentId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://n8n.neocapitalfunding.com/webhook/withdraw-status1`, {
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
        // console.log("Respuesta del servidor:", response);s
        toast.success("Retiro completado ", response.respuesta || response.ok);
        // Force page reload after successful withresponse.respuesta || response.okdrawal acceptance
        setTimeout(() => {
          // window.location.reload();
        }, 1000); // Delay of 1 second to allow the toast to be visible
      } else {
        throw new Error("Error en la respuesta del servidor", response.respuesta || response.error);
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
      toast.error("Error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://n8n.neocapitalfunding.com/webhook/withdraw-status1`, {
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
        toast.success("Retiro rechazado y notificado al usuario. ", response.respuesta || response.ok);
        setIsRejectModalOpen(false);
      } else {
        throw new Error("Error en la respuesta del servidor", response.respuesta || response.error);
      }
    } catch (error) {
      toast.error("Ha ocurrido un error al rechazar la solicitud de retiro.");
      console.error("Error al rechazar la solicitud de retiro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Procesar los datos para obtener una estructura plana para la tabla
  const processedData = useMemo(() => {
    if (!data) return [];

    return data.map(item => {
      // Manejar ambas posibles estructuras de datos (directa o con atributos)
      const withdraw = item.attributes || item;
      const challenge = withdraw.challenge?.data?.attributes || withdraw.challenge;
      const user = challenge?.user?.data?.attributes || challenge?.user;

      return {
        id: item.id,
        documentId: withdraw.documentId,
        wallet: withdraw.wallet,
        amount: withdraw.amount,
        estado: withdraw.estado,
        createdAt: withdraw.createdAt,
        // Extraer datos de usuario y reto a una estructura plana
        username: user?.username || "N/A",
        email: user?.email || "N/A",
        challengeId: challenge?.id || "N/A",
        challengeDocumentId: challenge?.documentId || "N/A"
      };
    });
  }, [data]);

  const filteredData = useMemo(() => {
    if (!processedData.length) return [];

    return processedData.filter((item) => {
      const matchesEstado = estadoFilter ? item.estado === estadoFilter : true;

      // Solo aplicar filtros de fecha si son fechas válidas
      const validStartDate = item.startDate !== "N/A";
      const validEndDate = item.endDate !== "N/A";

      const matchesDateRange =
        (!startDateFilter || !validStartDate || new Date(item.startDate) >= new Date(startDateFilter)) &&
        (!endDateFilter || !validEndDate || new Date(item.endDate) <= new Date(endDateFilter));

      return matchesEstado && matchesDateRange;
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
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border-t-4 border-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-6 text-zinc-800 dark:text-white">
          <span className=" pb-1">Retiros</span>
        </h1>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 bg-[var(--app-primary)]/10 dark:bg-zinc-800 p-4 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Estado:</span>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-[var(--app-primary)]/30 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
            >
              <option value="">Todos los estados</option>
              <option value="proceso">En Proceso</option>
              <option value="pagado">Pagado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Fecha desde:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Fecha hasta:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="h-9 px-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
            />
          </label>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-[var(--app-primary)]/30 dark:border-zinc-700 shadow-sm">
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Table>
              <TableHeader className="bg-[var(--app-primary)] dark:bg-zinc-800 p-2">
                <TableRow>
                  {withdrawColumns.map((column) => (
                    <TableHead
                      key={column.accessorKey}
                      className="text-zinc-700 dark:text-zinc-300 border-b border-[var(--app-primary)]/30 dark:border-zinc-700 py-3 px-4 font-medium"
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center text-zinc-500 py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--app-secondary)] mb-2"></div>
                        <span>Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center text-red-500 py-6 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>Error al cargar los datos: {error.message}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={`border-b border-[var(--app-primary)]/20 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/40'
                        } hover:bg-[var(--app-primary)]/10 dark:hover:bg-zinc-800 transition-colors`}
                    >
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{item.id}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{item.documentId}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{item.wallet}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">{item.amount}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.estado === "pagado"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : item.estado === "rechazado"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
                          {item.estado}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{item.username}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{item.challengeId}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={item.estado !== "proceso" || isSubmitting}
                            onClick={() => handleAccept(item.documentId)}
                            className={`px-3 py-1 text-xs font-medium rounded-md ${item.estado !== "proceso" || isSubmitting
                              ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                              : "bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white shadow-sm"
                              } transition-colors`}
                          >
                            Completar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={item.estado !== "proceso" || isSubmitting}
                            onClick={() => openRejectModal(item)}
                            className={`px-3 py-1 text-xs font-medium rounded-md ${item.estado !== "proceso" || isSubmitting
                              ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              } transition-colors`}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={withdrawColumns.length} className="text-center text-zinc-500 py-12">
                      <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/40 p-6 rounded-lg border border-[var(--app-primary)]/10 dark:border-zinc-700">
                        <InboxIcon className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-400 mb-3" />
                        <span>No se encontraron resultados.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal de rechazo */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-[var(--app-primary)]/30 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
            <DialogHeader>
              <DialogTitle className="text-zinc-800 dark:text-zinc-200">Rechazar Solicitud de Retiro</DialogTitle>
              <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                Por favor, proporcione una razón para rechazar esta solicitud. Esta información será compartida con el usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Escriba la razón del rechazo"
                className="min-h-24 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-[var(--app-primary)]/30 dark:border-zinc-700 focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isSubmitting}
                className="bg-white dark:bg-zinc-800 border-[var(--app-primary)]/30 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-[var(--app-primary)]/10 dark:hover:bg-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isSubmitting}
                className={`${!rejectionReason.trim() || isSubmitting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white shadow-sm`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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