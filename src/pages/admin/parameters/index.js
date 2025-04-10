// src/pages/admin/parameters/index.js
import React from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/forms/parameters/DataTable";
import Columns from "@/components/forms/parameters/Columns";
import DashboardLayout from "..";
import useSWR from "swr";
import { AlertCircle, Eye } from "lucide-react";

function IndexPage() {
  const fetcher = (url) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenge-relations?populate=*`,
    fetcher
  );

  // Función para actualizar los datos
  function actualizarDatos() {
    mutate();
    // console.log("Datos actualizados");
  }

  const processedData = data?.data || [];
  const router = useRouter();

  // Función para manejar el clic en "Ver Visualizador"
  function handleViewVisualizer() {
    router.push("/admin/parameters/visualizador");
  }

  return (
    <DashboardLayout>
      {/* Contenedor adaptado al estilo del componente de Retiros */}
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            <span className="border-b-2 border-[var(--app-secondary)] pb-1">
              Condiciones
            </span>
          </h1>
          <button
            onClick={handleViewVisualizer}
            className="bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 px-4 py-2 rounded-md text-white font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Ver Visualizador
          </button>
        </div>

        {/* Contenedor interno para la tabla, manteniendo un fondo neutro */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--app-secondary)] mx-auto"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error al cargar los datos:</p>
                <p>{error.message}</p>
              </div>
            </div>
          ) : (
            <DataTable data={processedData} columns={Columns(actualizarDatos)} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default IndexPage;
