"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import DashboardLayout from "..";
import { Settings, ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const fetcher = (url, token) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

export default function IndexPage() {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [newReward, setNewReward] = useState({ procentaje: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null);
  const { data: session } = useSession();

  const { data: rewardsData, error, mutate } = useSWR(
    session?.jwt
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards`, session.jwt]
      : null,
    ([url, token]) => fetcher(url, token)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creando premio...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: newReward }),
      });
      if (response.ok) {
        setNewReward({ procentaje: "" });
        setIsCreateModalOpen(false);
        mutate();
        toast.success("Premio creado exitosamente", { id: toastId });
      } else {
        toast.error("Error al crear el premio", { id: toastId });
      }
    } catch (error) {
      console.error("Error creating reward:", error);
      toast.error("Error al crear el premio", { id: toastId });
    }
  };

  const handleUpdate = async (documentId) => {
    const toastId = toast.loading("Actualizando premio...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards/${documentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { procentaje: editingValue } }),
      });
      if (response.ok) {
        setEditingId(null);
        setEditingValue("");
        mutate();
        toast.success("Premio actualizado exitosamente", { id: toastId });
      } else {
        toast.error("Error al actualizar el premio", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating reward:", error);
      toast.error("Error al actualizar el premio", { id: toastId });
    }
  };

  const handleDelete = async (documentId) => {
    const toastId = toast.loading("Eliminando premio...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
        },
      });
      if (response.ok) {
        setIsDeleteModalOpen(null);
        mutate();
        toast.success("Premio eliminado exitosamente", { id: toastId });
      } else {
        toast.error("Error al eliminar el premio", { id: toastId });
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast.error("Error al eliminar el premio", { id: toastId });
    }
  };

  const startEditing = (reward) => {
    setEditingId(reward.documentId);
    setEditingValue(reward.procentaje);
  };

  const rewards = rewardsData?.data || [];
  const totalItems = rewardsData?.meta?.pagination?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRewards = rewards.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPage = (page) => setCurrentPage(page);

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

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)] flex justify-center">
        <Toaster position="top-right" />
        <div className="w-full max-w-3xl">
          <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white text-center">
            <span className="border-b-2 border-[var(--app-secondary)] pb-1">Gestión de premios</span>
          </h1>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-3 border-b border-[var(--app-primary)]/20 dark:border-zinc-700 flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-[var(--app-secondary)] mr-2" />
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Premios</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1 bg-[var(--app-secondary)] text-white rounded hover:bg-[var(--app-secondary)]/80 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            </div>
            <div className="p-4 flex-grow bg-white dark:bg-zinc-900">
              {error && <p className="text-red-500">Error al cargar los premios: {error.message}</p>}
              {!rewardsData && !error && <p>Cargando...</p>}
              {rewards.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedRewards.map((reward) => (
                      <div key={reward.documentId} className="flex items-center gap-4 p-2 border-b dark:border-zinc-700">
                        <span className="flex-1">{reward.procentaje}%</span>
                        <button
                          onClick={() => startEditing(reward)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setIsDeleteModalOpen(reward.documentId)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full bg-[var(--app-primary)]/10 text-[var(--app-secondary)] disabled:opacity-50 hover:bg-[var(--app-primary)]/20 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {startPage > 1 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className="px-3 py-1 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-[var(--app-primary)]/10 transition-colors"
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
                              ? "bg-[var(--app-secondary)] text-white"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-[var(--app-primary)]/10"
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
                            className="px-3 py-1 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-[var(--app-primary)]/10 transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full bg-[var(--app-primary)]/10 text-[var(--app-secondary)] disabled:opacity-50 hover:bg-[var(--app-primary)]/20 transition-colors"
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
                        className="p-1 border rounded bg-white dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)]"
                      >
                        <option value={5}>5 por página</option>
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                rewardsData && <p>No hay premios disponibles</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal para Crear */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-white">Crear Nuevo Premio</h3>
              <form onSubmit={handleCreate}>
                <input
                  type="number"
                  placeholder="Porcentaje"
                  value={newReward.procentaje}
                  onChange={(e) => setNewReward({ procentaje: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 mb-4"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[var(--app-secondary)] text-white rounded hover:bg-[var(--app-secondary)]/80">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Editar */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-white">Editar Premio</h3>
              <input
                type="number"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 mb-4"
                step="0.01"
                min="0"
                max="100"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditingValue("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleUpdate(editingId)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Eliminar */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-white">¿Eliminar Premio?</h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-300">¿Estás seguro de que quieres eliminar este premio? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(isDeleteModalOpen)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}