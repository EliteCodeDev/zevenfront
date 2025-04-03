"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import DashboardLayout from "..";
import { Settings, ChevronLeft, ChevronRight, Trash2, Plus, Clock, Percent, Tag, PieChart, ShoppingBag, RefreshCw } from "lucide-react";
import { toast } from 'sonner';
import ProductSelector from "./selectProduct";

// Función para normalizar probabilidades
function normalizarProbabilidades(productos) {
  const sumaTotal = productos.reduce((suma, producto) =>
    suma + (parseFloat(producto.probabilidad) || 0), 0);

  if (sumaTotal === 0) {
    const probabilidadIgual = 100 / productos.length;
    return productos.map(producto => ({
      ...producto,
      probabilidadOriginal: parseFloat(producto.probabilidad) || 0,
      probabilidadNormalizada: probabilidadIgual.toFixed(2)
    }));
  }

  return productos.map(producto => ({
    ...producto,
    probabilidadOriginal: parseFloat(producto.probabilidad) || 0,
    probabilidadNormalizada: (((parseFloat(producto.probabilidad) || 0) / sumaTotal) * 100).toFixed(2)
  }));
}

const fetcher = async (url, token) => {
  try {
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', response.status, errorText);
      throw new Error(`Error en la petición: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.data && Array.isArray(data.data)) {
      data.data = data.data.map(reward => {
        if (typeof reward.productos === 'string' && reward.productos.trim() !== '') {
          try {
            reward.productos = JSON.parse(reward.productos);
          } catch (e) {
            console.warn(`No se pudo parsear productos para ${reward.documentId}:`, e);
            reward.productosDisplay = reward.productos;
          }
        }
        return reward;
      });
    }

    return data;
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

const timeUnitOptions = [
  { value: "horas", label: "Horas" },
  { value: "dias", label: "Dias" },
  { value: "semanas", label: "Semanas" },
  { value: "meses", label: "Meses" },
  { value: "años", label: "Años" },
];

const typeOptions = [
  { value: "descuento", label: "Descuento" },
  { value: "regalo", label: "Regalo" },
  { value: "envio_gratis", label: "Envío gratis" },
];

export default function IndexPage() {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [newReward, setNewReward] = useState({
    nombre: "",
    porcentaje: "",
    type: "descuento",
    probabilidad: "",
    productos: [],
    duracionNumero: "2",
    duracionUnidad: "dias",
    usos: "1"
  });
  const [editingId, setEditingId] = useState(null);
  const [editingReward, setEditingReward] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [normalizedRewards, setNormalizedRewards] = useState([]);
  const { data: session } = useSession();
  const [isDurationUnlimited, setIsDurationUnlimited] = useState(false);
  const [isEditDurationUnlimited, setIsEditDurationUnlimited] = useState(false);

  // Referencias para los modales
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  const { data: rewardsData, error, mutate } = useSWR(
    session?.jwt
      ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards`, session.jwt]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      onError: (err) => {
        console.error('SWR Error:', err);
        toast.error('Error al cargar los premios: ' + err.message);
      }
    }
  );

  useEffect(() => {
    if (rewardsData?.data) {
      const normalized = normalizarProbabilidades(rewardsData.data);
      setNormalizedRewards(normalized);
    }
  }, [rewardsData]);

  // Funciones para manejar clics fuera de los modales
  const handleOutsideClickCreate = (e) => {
    if (createModalRef.current && !createModalRef.current.contains(e.target)) {
      setIsCreateModalOpen(false);
      setFormErrors({});
      setIsDurationUnlimited(false);
    }
  };

  const handleOutsideClickEdit = (e) => {
    if (editModalRef.current && !editModalRef.current.contains(e.target)) {
      setEditingId(null);
      setEditingReward({});
      setFormErrors({});
      setIsEditDurationUnlimited(false);
    }
  };

  const handleOutsideClickDelete = (e) => {
    if (deleteModalRef.current && !deleteModalRef.current.contains(e.target)) {
      setIsDeleteModalOpen(null);
    }
  };

  const formatProductDisplay = (productos) => {
    if (!productos) return "-";

    if (Array.isArray(productos)) {
      if (productos.length === 0) return "-";
      if (productos.length > 3) {
        return `${productos.length} variaciones`;
      }
      return productos.map(id => `#${id}`).join(", ");
    }

    if (typeof productos === 'string') {
      if (!productos.trim()) return "-";
      try {
        const parsed = JSON.parse(productos);
        if (Array.isArray(parsed)) {
          if (parsed.length > 3) {
            return `${parsed.length} variaciones`;
          }
          return parsed.map(id => `#${id}`).join(", ");
        }
        return `#${productos}`;
      } catch (e) {
        return `#${productos}`;
      }
    }
    return String(productos);
  };

  const validateForm = (reward, isDurationUnlimited = false) => {
    const errors = {};

    if (!reward.nombre) {
      errors.nombre = "El nombre es requerido";
    }

    if (!reward.porcentaje || parseFloat(reward.porcentaje) < 0 || parseFloat(reward.porcentaje) > 100) {
      errors.porcentaje = "El porcentaje debe estar entre 0 y 100";
    }

    if (!reward.type) {
      errors.type = "El tipo es requerido";
    }

    if (!reward.probabilidad || parseFloat(reward.probabilidad) < 0 || parseFloat(reward.probabilidad) > 100) {
      errors.probabilidad = "La probabilidad debe estar entre 0 y 100";
    }

    if (!isDurationUnlimited) {
      if (!reward.duracionNumero || parseInt(reward.duracionNumero) < 1) {
        errors.duracionNumero = "El número de la duración debe ser al menos 1";
      }

      if (!reward.duracionUnidad) {
        errors.duracionUnidad = "La unidad de tiempo es requerida";
      }
    }

    if (!reward.usos || parseInt(reward.usos) < 1) {
      errors.usos = "El número de usos debe ser al menos 1";
    }

    return errors;
  };

  const handleInputChange = (e, setter, obj) => {
    const { name, value } = e.target;
    setter({ ...obj, [name]: value });
  };

  const handleProductsChange = (selectedProductIds) => {
    setNewReward({
      ...newReward,
      productos: selectedProductIds
    });
  };

  const handleEditProductsChange = (selectedProductIds) => {
    setEditingReward({
      ...editingReward,
      productos: selectedProductIds
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateForm(newReward, isDurationUnlimited);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formattedReward = {
      ...newReward,
      duracion: isDurationUnlimited ? "ilimitada" : `${newReward.duracionNumero}-${newReward.duracionUnidad}`,
      productos: newReward.productos
    };

    delete formattedReward.duracionNumero;
    delete formattedReward.duracionUnidad;

    const toastId = toast.loading('Creando premio...');

    try {
      console.log('Datos a enviar:', JSON.stringify({ data: formattedReward }, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: formattedReward }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Error en la creación: ${response.status}`);
      }

      const result = await response.json();
      console.log('Creación exitosa:', result);

      setNewReward({
        nombre: "",
        porcentaje: "",
        type: "descuento",
        probabilidad: "",
        productos: [],
        duracionNumero: "2",
        duracionUnidad: "dias",
        usos: "1"
      });
      setIsDurationUnlimited(false);
      setIsCreateModalOpen(false);
      setFormErrors({});
      await mutate();

      toast.success('Premio creado exitosamente', { id: toastId });
    } catch (error) {
      console.error("Error creating reward:", error);
      toast.error(`Error al crear el premio: ${error.message}`, { id: toastId });
    }
  };

  const handleUpdate = async (documentId) => {
    const errors = validateForm(editingReward, isEditDurationUnlimited);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formattedReward = {
      ...editingReward,
      duracion: isEditDurationUnlimited ? "ilimitada" : `${editingReward.duracionNumero}-${editingReward.duracionUnidad}`,
      productos: editingReward.productos
    };

    delete formattedReward.duracionNumero;
    delete formattedReward.duracionUnidad;
    delete formattedReward.probabilidadNormalizada;
    delete formattedReward.probabilidadOriginal;

    const toastId = toast.loading('Actualizando premio...');

    try {
      console.log('Datos a enviar:', JSON.stringify({ data: formattedReward }, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards/${documentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: formattedReward }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Error en la actualización: ${response.status}`);
      }

      const result = await response.json();
      console.log('Actualización exitosa:', result);

      setEditingId(null);
      setEditingReward({});
      setIsEditDurationUnlimited(false);
      setFormErrors({});
      await mutate();

      toast.success('Premio actualizado exitosamente', { id: toastId });
    } catch (error) {
      console.error("Error updating reward:", error);
      toast.error(`Error al actualizar el premio: ${error.message}`, { id: toastId });
    }
  };

  const handleDelete = async (documentId) => {
    const toastId = toast.loading('Eliminando premio...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rewards/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Error en la eliminación: ${response.status}`);
      }

      setIsDeleteModalOpen(null);
      await mutate();

      toast.success('Premio eliminado exitosamente', { id: toastId });
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast.error(`Error al eliminar el premio: ${error.message}`, { id: toastId });
    }
  };

  const startEditing = (reward) => {
    setEditingId(reward.documentId);
    const isUnlimited = reward.duracion === "ilimitada";
    setIsEditDurationUnlimited(isUnlimited);
    let duracionNumero = "2";
    let duracionUnidad = "dias";

    if (reward.duracion && !isUnlimited) {
      const parts = reward.duracion.split("-");
      if (parts.length === 2) {
        duracionNumero = parts[0];
        duracionUnidad = parts[1];
      }
    }

    let productosArray = [];
    if (reward.productos) {
      if (Array.isArray(reward.productos)) {
        productosArray = reward.productos.map(id => id.toString());
      } else if (typeof reward.productos === 'string' && reward.productos.trim() !== '') {
        try {
          productosArray = JSON.parse(reward.productos);
          if (!Array.isArray(productosArray)) {
            productosArray = [reward.productos.toString()];
          }
        } catch (e) {
          productosArray = reward.productos
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== "");
        }
      }
    }

    setEditingReward({
      nombre: reward.nombre || "",
      porcentaje: reward.porcentaje,
      type: reward.type || "descuento",
      probabilidad: reward.probabilidad || "",
      productos: productosArray,
      duracionNumero: duracionNumero,
      duracionUnidad: duracionUnidad,
      usos: reward.usos || "1"
    });
    setFormErrors({});
  };

  const rewards = normalizedRewards || [];
  const totalItems = rewards.length;
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

  const getTypeLabel = (value) => {
    const option = typeOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)] flex justify-center">
        <div className="w-full max-w-7xl">
          <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white text-center">
            <span className="border-b-2 border-[var(--app-secondary)] pb-1">Gestión de premios</span>
          </h1>

          <div className="bg-white  dark:bg-zinc-900 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg">
                      <thead className="bg-gray-100 dark:bg-zinc-800">
                        <tr>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Nombre</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Porcentaje</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Tipo</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Probabilidad</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Productos</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">%Real</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Duración</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-left">Usos</th>
                          <th className="py-2 px-4 border-b dark:border-zinc-700 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRewards.map((reward) => (
                          <tr key={reward.documentId} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.nombre}</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.porcentaje}%</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{getTypeLabel(reward.type)}</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.probabilidad}%</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">
                              <div className="max-w-xs truncate" title={formatProductDisplay(reward.productos)}>
                                {formatProductDisplay(reward.productos)}
                              </div>
                            </td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.probabilidadNormalizada}%</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.duracion}</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700">{reward.usos}</td>
                            <td className="py-2 px-4 border-b dark:border-zinc-700 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => startEditing(reward)}
                                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  title="Editar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setIsDeleteModalOpen(reward.documentId)}
                                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                          className={`px-3 py-1 rounded-md transition-colors ${currentPage === page
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleOutsideClickCreate}
          >
            {/* Se agrega max-h-[80vh] y overflow-y-auto para que el contenido sea scrollable */}
            <div 
              ref={createModalRef}
              className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()} // Esto evita que el clic en el contenido cierre el modal
            >
              <h3 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-white">Crear Nuevo Premio</h3>
              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nombre
                      </div>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre del premio"
                      value={newReward.nombre}
                      onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                      className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.nombre ? "border-red-500" : ""}`}
                    />
                    {formErrors.nombre && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                    )}
                  </div>

                  {/* Porcentaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Percent className="w-4 h-4 mr-1" />
                        Porcentaje
                      </div>
                    </label>
                    <input
                      type="number"
                      name="porcentaje"
                      placeholder="Porcentaje"
                      value={newReward.porcentaje}
                      onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                      className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.porcentaje ? "border-red-500" : ""}`}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    {formErrors.porcentaje && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.porcentaje}</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Tipo
                      </div>
                    </label>
                    <select
                      name="type"
                      value={newReward.type}
                      onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                      className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.type ? "border-red-500" : ""}`}
                    >
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.type && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
                    )}
                  </div>

                  {/* Probabilidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <PieChart className="w-4 h-4 mr-1" />
                        Probabilidad
                      </div>
                    </label>
                    <input
                      type="number"
                      name="probabilidad"
                      placeholder="Probabilidad"
                      value={newReward.probabilidad}
                      onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                      className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.probabilidad ? "border-red-500" : ""}`}
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    {formErrors.probabilidad && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.probabilidad}</p>
                    )}
                  </div>

                  {/* Productos */}
                  <div>
                    <ProductSelector
                      selectedProductIds={newReward.productos}
                      onChange={handleProductsChange}
                      error={formErrors.productos}
                    />
                  </div>

                  {/* Duración con opción de ilimitada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Duración
                      </div>
                    </label>

                    <div className="mb-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDurationUnlimited}
                          onChange={(e) => setIsDurationUnlimited(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="
                            relative w-7 h-4 bg-gray-200 rounded-full transition-colors
                            peer-focus:outline-none dark:bg-gray-700
                            peer-checked:bg-gray-500
                            peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                            peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                            after:bg-white after:border-gray-300 after:border after:rounded-full
                            after:h-3 after:w-3 after:transition-all dark:border-gray-600
                            hover:bg-gray-300 peer-checked:hover:bg-gray-600
                          "
                        ></div>

                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ilimitado
                        </span>
                      </label>
                    </div>

                    {!isDurationUnlimited && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            name="duracionNumero"
                            placeholder="Número"
                            value={newReward.duracionNumero}
                            onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                            className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.duracionNumero ? "border-red-500" : ""}`}
                            min="1"
                          />
                          {formErrors.duracionNumero && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.duracionNumero}</p>
                          )}
                        </div>
                        <div className="flex-1">
                          <select
                            name="duracionUnidad"
                            value={newReward.duracionUnidad}
                            onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                            className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.duracionUnidad ? "border-red-500" : ""}`}
                          >
                            {timeUnitOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {formErrors.duracionUnidad && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.duracionUnidad}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {isDurationUnlimited
                        ? "El premio tendrá una duración ilimitada"
                        : "Formato: número-unidad (ej: 2-dia, 1-semana, 3-mes)"}
                    </p>
                  </div>

                  {/* Usos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Usos permitidos
                      </div>
                    </label>
                    <input
                      type="number"
                      name="usos"
                      placeholder="Número de usos"
                      value={newReward.usos}
                      onChange={(e) => handleInputChange(e, setNewReward, newReward)}
                      className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.usos ? "border-red-500" : ""}`}
                      min="1"
                    />
                    {formErrors.usos && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.usos}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormErrors({});
                      setIsDurationUnlimited(false);
                    }}
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleOutsideClickEdit}
          >
            <div 
              ref={editModalRef}
              className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-white">Editar Premio</h3>
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Nombre
                    </div>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre del premio"
                    value={editingReward.nombre}
                    onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                    className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.nombre ? "border-red-500" : ""}`}
                  />
                  {formErrors.nombre && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Porcentaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <Percent className="w-4 h-4 mr-1" />
                      Porcentaje
                    </div>
                  </label>
                  <input
                    type="number"
                    name="porcentaje"
                    value={editingReward.porcentaje}
                    onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                    className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.porcentaje ? "border-red-500" : ""}`}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  {formErrors.porcentaje && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.porcentaje}</p>
                  )}
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      Tipo
                    </div>
                  </label>
                  <select
                    name="type"
                    value={editingReward.type}
                    onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                    className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.type ? "border-red-500" : ""}`}
                  >
                    {typeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
                  )}
                </div>

                {/* Probabilidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <PieChart className="w-4 h-4 mr-1" />
                      Probabilidad
                    </div>
                  </label>
                  <input
                    type="number"
                    name="probabilidad"
                    value={editingReward.probabilidad}
                    onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                    className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.probabilidad ? "border-red-500" : ""}`}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  {formErrors.probabilidad && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.probabilidad}</p>
                  )}
                </div>

                {/* Productos */}
                <div>
                  <ProductSelector
                    selectedProductIds={editingReward.productos || []}
                    onChange={handleEditProductsChange}
                    error={formErrors.productos}
                  />
                </div>

                {/* Duración con opción de ilimitada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Duración
                    </div>
                  </label>

                  <div className="mb-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEditDurationUnlimited}
                        onChange={(e) => setIsEditDurationUnlimited(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div
                        className="
                          relative w-7 h-4 bg-gray-200 rounded-full transition-colors
                          peer-focus:outline-none dark:bg-gray-700
                          peer-checked:bg-gray-500
                          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                          peer-checked:after:border-white
                          after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                          after:bg-white after:border-gray-300 after:border after:rounded-full
                          after:h-3 after:w-3 after:transition-all dark:border-gray-600
                          hover:bg-gray-300 peer-checked:hover:bg-gray-600
                        "
                      ></div>

                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ilimitado
                      </span>
                    </label>
                  </div>

                  {!isEditDurationUnlimited && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          name="duracionNumero"
                          placeholder="Número"
                          value={editingReward.duracionNumero}
                          onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                          className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.duracionNumero ? "border-red-500" : ""}`}
                          min="1"
                        />
                        {formErrors.duracionNumero && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.duracionNumero}</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <select
                          name="duracionUnidad"
                          value={editingReward.duracionUnidad}
                          onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                          className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.duracionUnidad ? "border-red-500" : ""}`}
                        >
                          {timeUnitOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {formErrors.duracionUnidad && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.duracionUnidad}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {isEditDurationUnlimited
                      ? "El premio tendrá una duración ilimitada"
                      : "Formato: número-unidad (ej: 2-dia, 1-semana, 3-mes)"}
                  </p>
                </div>

                {/* Usos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Usos permitidos
                    </div>
                  </label>
                  <input
                    type="number"
                    name="usos"
                    value={editingReward.usos}
                    onChange={(e) => handleInputChange(e, setEditingReward, editingReward)}
                    className={`w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700 ${formErrors.usos ? "border-red-500" : ""}`}
                    min="1"
                  />
                  {formErrors.usos && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.usos}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditingReward({});
                    setFormErrors({});
                    setIsEditDurationUnlimited(false);
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleOutsideClickDelete}
          >
            <div 
              ref={deleteModalRef}
              className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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