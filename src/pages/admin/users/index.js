"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import DashboardLayout from "..";
import { useRouter } from "next/router";
import Flag from "react-world-flags";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import EditUserModal from "./editUserModal";
import { Switch } from "@/components/ui/switch";

const fetcher = (url, token) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_PDF_MANAGE || "https://n8n.neocapitalfunding.com/webhook-test/7072a687-cb6f-48e4-aed3-dca35255a1a9";

export default function UsersTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR(
    session?.jwt
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?populate=*`, session.jwt]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  const [nameSearch, setNameSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("Todos");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // New state for edit modal
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  const openPdfModal = (user) => {
    setSelectedUser(user);
    setIsPdfModalOpen(true);
  };

  const closePdfModal = () => {
    setSelectedUser(null);
    setIsPdfModalOpen(false);
  };

  // Close edit modal
  const closeEditModal = () => {
    setSelectedUserForEdit(null);
  };

  const sendWebhook = async (user, statusSign) => {
    try {
      const payload = {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          pdfUrl: user.pdf?.[0]?.url || null,
        },
        statusSign: statusSign,
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al enviar el webhook");
      }

      console.log("Webhook enviado exitosamente:", payload);
    } catch (error) {
      console.error("Error al enviar el webhook:", error);
      toast.error("Error al enviar la notificación al webhook: " + error.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    try {
      // Actualizar statusSign en Strapi
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`,
        },
        body: JSON.stringify({ statusSign: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || "Error al aprobar la firma");
      }

      // Enviar webhook
      await sendWebhook(selectedUser, true);

      toast.success("Firma aprobada exitosamente.");
      mutate(); // Refresh the table data
      closePdfModal();
    } catch (error) {
      console.error("Error al aprobar la firma:", error);
      toast.error("Hubo un problema al aprobar la firma: " + error.message);
    }
  };

  const handleDisapprove = async () => {
    if (!selectedUser) return;

    try {
      // Actualizar statusSign en Strapi
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`,
        },
        body: JSON.stringify({ statusSign: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || "Error al desaprobar la firma");
      }

      // Enviar webhook
      await sendWebhook(selectedUser, false);

      toast.success("Firma desaprobada exitosamente.");
      mutate(); // Refresh the table data
      closePdfModal();
    } catch (error) {
      console.error("Error al desaprobar la firma:", error);
      toast.error("Hubo un problema al desaprobar la firma: " + error.message);
    }
  };


  const handleVerfifiedChange = async (user, checked) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.jwt}`,
          },
          body: JSON.stringify({ isVerified: checked }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar verificación del usuario");
      }

      toast.success(`Usuario ${checked ? "verificado" : "desverificado"} correctamente`);
      mutate(); // Refresh data
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      console.error(error);
    }
  }
  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(nameSearch.toLowerCase());
      })
      .filter((user) => user.email.toLowerCase().includes(emailSearch.toLowerCase()))
      .filter((user) => {
        if (verificationFilter === "Todos") return true;
        return verificationFilter === "Verificado"
          ? user.isVerified
          : !user.isVerified;
      });
  }, [data, nameSearch, emailSearch, verificationFilter]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / pageSize);
  }, [filteredData, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [nameSearch, emailSearch, verificationFilter]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-secondary)] mb-4 mx-auto"></div>
            <p className="text-zinc-600">Cargando datos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-6 border border-red-200 dark:border-red-900">
            <div className="flex items-center text-red-500 mb-2">
              <XCircle className="w-6 h-6 mr-2" />
              <p className="font-medium">Error al cargar los datos.</p>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">Por favor, intenta nuevamente o contacta al administrador.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border-t-4 border-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">Usuarios</h1>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 rounded-xl shadow-sm mt-4 space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
            <div className="flex w-full md:w-auto gap-2 flex-col md:flex-row">
              <Input
                placeholder="Buscar por nombre..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 shadow-sm"
              />
              <Input
                placeholder="Buscar por email..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 shadow-sm"
              />
            </div>

            <div className="relative w-full md:w-48">
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
              >
                <option value="Todos">Estado de cuenta</option>
                <option value="Verificado">Verificado</option>
                <option value="No Verificado">No Verificado</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                <TableRow>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Nombre Completo</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Email</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Teléfono</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">País</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Verificado</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Firma Aprobada</TableHead>
                  <TableHead className="text-zinc-800 dark:text-zinc-200 font-medium py-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((user, index) => (
                    <TableRow
                      key={index}
                      className={`border-b border-zinc-200 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-50 dark:bg-zinc-700/30'} hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors`}
                    >
                      <TableCell className="py-3 text-zinc-700 dark:text-zinc-300">{user.firstName + " " + user.lastName}</TableCell>
                      <TableCell className="py-3 text-zinc-700 dark:text-zinc-300">{user.email}</TableCell>
                      <TableCell className="py-3 text-zinc-700 dark:text-zinc-300">{user.phone}</TableCell>
                      <TableCell className="py-3 text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center space-x-2">
                          {user.countryCode && <Flag country={user.countryCode.toLowerCase()} className="w-6 h-4 shadow-sm" />}
                          <span>{user.country}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {user.isVerified ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-600 w-5 h-5" />
                            <span className="text-green-600 font-medium">Verificado</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-red-500 font-medium">No Verificado</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {user.statusSign ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-600 w-5 h-5" />
                            <span className="text-green-600 font-medium">Aprobado</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-red-500 font-medium">No Aprobado</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => router.push(`/admin/users/${user.documentId}`)}
                            className="px-3 py-1 h-9 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                          >
                            Detalles
                          </Button>
                          <Button
                            onClick={() => setSelectedUserForEdit(user)}
                            className="px-3 py-1 h-9 bg-[var(--app-secondary)] text-black rounded-md hover:opacity-90 flex items-center space-x-1 shadow-sm"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            onClick={() => openPdfModal(user)}
                            className="px-3 py-1 h-9 bg-zinc-200 dark:bg-zinc-600 text-zinc-800 dark:text-white rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-500 flex items-center space-x-1 shadow-sm"
                          >
                            <Eye className="w-5 h-5" />
                            <span>PDF</span>
                          </Button>
                          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {user.isVerified ? "Verificado" : "No verificado"}
                            </span>
                            <Switch
                              id={`user-verified-${user.id}`}
                              checked={user.isVerified || false}
                              onCheckedChange={(checked) => handleVerfifiedChange(user, checked)}
                              className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <TableCell colSpan={7} className="h-24 text-center text-zinc-500 dark:text-zinc-400">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {filteredData.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-2 mt-6 gap-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 py-2 px-4 rounded-md border border-zinc-200 dark:border-zinc-700">
                Mostrando {paginatedData.length} de {filteredData.length} registros
              </div>
              <div className="flex items-center flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 py-2 px-4 rounded-md border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filas por página</p>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 w-16 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 text-zinc-800 dark:text-zinc-200 focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                  >
                    {[10, 20, 30, 40, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center bg-white dark:bg-zinc-800 py-2 px-4 rounded-md border border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Página {currentPage + 1} de {totalPages || 1}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                  >
                    <span className="sr-only">Ir a la primera página</span>
                    <span className="h-4 w-4">{"⟪"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <span className="sr-only">Ir a la página anterior</span>
                    <span className="h-4 w-4">{"<"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <span className="sr-only">Ir a la página siguiente</span>
                    <span className="h-4 w-4">{">"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <span className="sr-only">Ir a la última página</span>
                    <span className="h-4 w-4">{"⟫"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para ver el PDF */}
          {selectedUser && (
            <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
              <DialogContent className="max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <DialogHeader>
                  <DialogTitle className="text-zinc-800 dark:text-zinc-200">
                    Ver PDF de {selectedUser.firstName} {selectedUser.lastName}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {selectedUser.pdf?.[0]?.url ? (
                    <embed
                      src={`${selectedUser.pdf[0].url}#toolbar=0`}
                      type="application/pdf"
                      className="w-full min-h-[calc(80vh)] border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    />
                  ) : (
                    <div className="text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-900">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500">No se ha subido un PDF para este usuario.</p>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2 mt-4">
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    disabled={!selectedUser.pdf?.[0]?.url}
                  >
                    Aprobar
                  </Button>
                  <Button
                    onClick={handleDisapprove}
                    className="bg-red-500 hover:bg-red-600 text-white shadow-sm"
                    disabled={!selectedUser.pdf?.[0]?.url}
                  >
                    Desaprobar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit User Modal */}
          {selectedUserForEdit && (
            <EditUserModal
              user={selectedUserForEdit}
              isOpen={!!selectedUserForEdit}
              onClose={closeEditModal}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}