// src/pages/admin/parameters/index.js
import React from "react";
import { useRouter } from "next/navigation"; // o "next/router" en Next.js 12
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
    console.log("Datos actualizados");
  }

  const processedData = data?.data || [];
  const router = useRouter();

  // Función para manejar el clic en "Ver Visualizador"
  function handleViewVisualizer() {
    // Ajusta la ruta a donde quieras redirigir
    router.push("/admin/parameters/visualizador");
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white">
          <span className="border-b-2 border-[var(--app-secondary)] pb-1">Condiciones</span>
        </h1>

        {/* Botón "Ver Visualizador" en la parte superior */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleViewVisualizer}
            className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 px-4 py-2 rounded-md text-black dark:text-white font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Ver Visualizador
          </button>
        </div>

        {/* Tabla de datos */}
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