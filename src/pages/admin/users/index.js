"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import {
  PencilSquareIcon,
  DocumentTextIcon,
  EyeIcon
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import EditUserModal from "./editUserModal";
import { Switch } from "@/components/ui/switch";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_PDF_MANAGE || "https://n8n.zevenglobalfunding.com/webhook-test/7072a687-cb6f-48e4-aed3-dca35255a1a9";

const STORAGE_KEY = "usersOriginalOrder";

export default function UsersTable() {
  const { data: session } = useSession();
  const router = useRouter();

  // Estado para almacenar el orden original de los usuarios
  const [originalUserOrder, setOriginalUserOrder] = useState([]);

  const [nameSearch, setNameSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("Todos");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // New state for edit modal
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  // State para rastrear operaciones en progreso
  const [updatingUsers, setUpdatingUsers] = useState({});

  // Cargar el orden guardado de localStorage al iniciar
  useEffect(() => {
    // Solo ejecutar en el lado del cliente
    if (typeof window !== 'undefined') {
      try {
        const savedOrder = localStorage.getItem(STORAGE_KEY);
        if (savedOrder) {
          setOriginalUserOrder(JSON.parse(savedOrder));
        }
      } catch (error) {
        console.error("Error al cargar orden desde localStorage:", error);
      }
    }
  }, []);

  // Prevenir que el fetcher ordene los datos al obtenerlos del servidor
  const fetcher = (url, token) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return data;

        // Intentar obtener el orden desde localStorage o estado
        let orderToUse = [];

        if (typeof window !== 'undefined') {
          try {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            orderToUse = savedOrder ? JSON.parse(savedOrder) : [];
          } catch (error) {
            console.error("Error al leer del localStorage:", error);
          }
        }

        // Si no hay orden en localStorage pero hay en el estado, usar el estado
        if (orderToUse.length === 0 && originalUserOrder.length > 0) {
          orderToUse = originalUserOrder;
        }

        // Si tenemos un orden para usar, ordenar los datos
        if (orderToUse.length > 0) {
          const orderedData = [...data];
          orderedData.sort((a, b) => {
            const indexA = orderToUse.indexOf(a.id);
            const indexB = orderToUse.indexOf(b.id);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          return orderedData;
        }

        return data;
      });

  const { data, error, isLoading, mutate } = useSWR(
    session?.jwt
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?populate=*`, session.jwt]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  // Capturar el orden original cuando los datos se cargan inicialmente
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Si no hay orden guardado en el estado ni en localStorage, guardar el orden actual
      if (originalUserOrder.length === 0) {
        const currentOrder = data.map(user => user.id);
        setOriginalUserOrder(currentOrder);

        // Guardar en localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder));
          } catch (error) {
            console.error("Error al guardar en localStorage:", error);
          }
        }
      }
    }
  }, [data, originalUserOrder]);

  // Reset page only when filter criteria changes, not when data updates
  useEffect(() => {
    setCurrentPage(0);
  }, [nameSearch, emailSearch, verificationFilter]);

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

  // Cuando se actualice el usuario, mantener el mismo array de datos pero con el valor actualizado
  const updateUserLocallyWithoutChangingOrder = (userId, updates) => {
    if (!Array.isArray(data)) return;

    // Crear una copia exacta del array original
    const updatedData = [...data];

    // Encontrar y actualizar el usuario específico sin alterar su posición
    const userIndex = updatedData.findIndex(item => item.id === userId);
    if (userIndex !== -1) {
      updatedData[userIndex] = { ...updatedData[userIndex], ...updates };

      // Actualizar la caché de SWR sin revalidar para mantener posiciones
      mutate(updatedData, false);
    }
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

      // console.log("Webhook enviado exitosamente:", payload);
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

      // Usar la función unificada para actualizar localmente sin cambiar orden
      updateUserLocallyWithoutChangingOrder(selectedUser.id, { statusSign: true });

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

      // Usar la función unificada para actualizar localmente sin cambiar orden
      updateUserLocallyWithoutChangingOrder(selectedUser.id, { statusSign: false });

      closePdfModal();
    } catch (error) {
      console.error("Error al desaprobar la firma:", error);
      toast.error("Hubo un problema al desaprobar la firma: " + error.message);
    }
  };

  const handleVerfifiedChange = async (user, checked) => {
    try {
      // Marcar operación en progreso para este usuario
      setUpdatingUsers(prev => ({ ...prev, [user.id]: true }));

      // console.log(`Actualizando usuario ID: ${user.id}, Nombre: ${user.firstName} ${user.lastName}`);
      // console.log(`Cambio de verificación a: ${checked ? "Verificado" : "No Verificado"}`);

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

      // Obtenemos la respuesta para confirmar que se actualizó correctamente
      const updatedUser = await response.json();
      // console.log("Usuario actualizado:", updatedUser);

      toast.success(`Usuario ${user.firstName} ${user.lastName} ${checked ? "verificado" : "desverificado"} correctamente`);

      // Usar la función unificada para actualizar localmente sin cambiar orden
      updateUserLocallyWithoutChangingOrder(user.id, { isVerified: checked });
    } catch (error) {
      console.error(`Error al actualizar usuario ID ${user.id}:`, error);
      toast.error(`Error al actualizar: ${error.message}`);
    } finally {
      // Finalizar operación en progreso para este usuario
      setUpdatingUsers(prev => {
        const newState = { ...prev };
        delete newState[user.id];
        return newState;
      });
    }
  };

  // Filter and paginate data - mantiene el orden original
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = data
      .filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(nameSearch.toLowerCase());
      })
      .filter((user) => user.email.toLowerCase().includes(emailSearch.toLowerCase()))
      .filter((user) => {
        if (verificationFilter === "Todos") return true;
        if (verificationFilter === "FirmaAprobada") return user.statusSign;
        if (verificationFilter === "FirmaNoAprobada") return !user.statusSign;
        return true;
      });

    // Intentar obtener el orden del localStorage si el estado está vacío
    let orderToUse = originalUserOrder;

    if (orderToUse.length === 0 && typeof window !== 'undefined') {
      try {
        const savedOrder = localStorage.getItem(STORAGE_KEY);
        if (savedOrder) {
          orderToUse = JSON.parse(savedOrder);
        }
      } catch (error) {
        console.error("Error al leer orden del localStorage:", error);
      }
    }

    // Si tenemos un orden guardado, ordenamos según ese orden
    if (orderToUse.length > 0) {
      filtered.sort((a, b) => {
        const indexA = orderToUse.indexOf(a.id);
        const indexB = orderToUse.indexOf(b.id);
        // Si no se encuentra en la lista original, ponerlo al final
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return filtered;
  }, [data, nameSearch, emailSearch, verificationFilter, originalUserOrder]);

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
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            Usuarios
          </h1>
        </div>

        {/* Filtros - Versión más compacta */}
        <div className="mb-6 bg-[var(--app-primary)]/10 dark:bg-zinc-800/60 p-2 sm:p-4 rounded-lg border border-[var(--app-primary)]/30 dark:border-zinc-700">
          <div className="flex items-center justify-between gap-1 -mx-0.5">
            <div className="flex flex-1 items-center gap-1">
              <Input
                placeholder="Nombre"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-[30%] h-9 px-2 text-xs sm:text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--app-secondary)] transition-all truncate"
              />
              <Input
                placeholder="Email"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="w-[35%] h-9 px-2 text-xs sm:text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--app-secondary)] transition-all truncate"
              />
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-[24%] h-9 px-1 text-xs sm:text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--app-secondary)] transition-all"
              >
                <option value="Todos">Todos</option>
                <option value="FirmaAprobada">Aprobada</option>
                <option value="FirmaNoAprobada">No</option>
              </select>
            </div>
            <Button
              onClick={() => {
                setNameSearch("");
                setEmailSearch("");
                setVerificationFilter("Todos");
              }}
              variant="outline"
              size="sm"
              className="text-xs h-9 px-2 ml-1 whitespace-nowrap"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--app-primary)] dark:bg-zinc-800">
                <TableRow>
                  <TableHead className="text-sm font-semibold text-zinc-100 py-3 px-4">
                    Nombre Completo
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-zinc-100 py-3 px-4">
                    Email
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-zinc-100 py-3 px-4">
                    Firma Aprobada
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-zinc-100 py-3 px-4">
                    Verificación
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-zinc-100 py-3 px-4">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((user, index) => (
                    <TableRow
                      key={index}
                      className={`border-b border-gray-200 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/30'
                        }`}
                    >
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{user.firstName + " " + user.lastName}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300">{user.email}</TableCell>
                      <TableCell className="py-3 px-4">
                        {user.statusSign ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                            Aprobado
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300">
                            Desaprobado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`user-verified-${user.id}`}
                            checked={user.isVerified || false}
                            disabled={updatingUsers[user.id]}
                            onCheckedChange={(checked) => handleVerfifiedChange(user, checked)}
                            className={`
                              data-[state=checked]:bg-[var(--app-secondary)] 
                              data-[state=unchecked]:bg-zinc-300 
                              dark:data-[state=unchecked]:bg-zinc-600
                              ${updatingUsers[user.id] ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          />
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {user.isVerified ? "Verificado" : "No verificado"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/admin/users/${user.documentId}`)}
                            className="px-3 py-1 text-xs font-medium rounded bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            Detalles
                          </Button>
                          <Button
                            onClick={() => openPdfModal(user)}
                            className="px-3 py-1 text-xs font-medium rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/30 p-6 rounded-lg">
                        <Eye className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-500 mb-3" />
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
                Mostrando {paginatedData.length} de {filteredData.length} resultados
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 w-8 p-0"
                >
                  {"⟪"}
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 w-8 p-0"
                >
                  {"<"}
                </Button>
                <div className="flex items-center px-2 h-8 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 px-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm"
                >
                  {[10, 20, 30, 40, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} por página
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 w-8 p-0"
                >
                  {">"}
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 w-8 p-0"
                >
                  {"⟫"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal para ver el PDF */}
        {selectedUser && (
          <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
            <DialogContent className="max-w-4xl bg-white dark:bg-zinc-900 border border-[var(--app-primary)]/40 dark:border-zinc-700 rounded-lg shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
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
              <DialogFooter className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePdfModal}
                  className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!selectedUser.pdf?.[0]?.url}
                >
                  Aprobar
                </Button>
                <Button
                  onClick={handleDisapprove}
                  className="bg-red-500 hover:bg-red-600 text-white"
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
    </DashboardLayout>
  );
}