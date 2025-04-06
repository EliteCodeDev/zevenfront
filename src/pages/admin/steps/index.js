"use client";

import React, { useState, useEffect } from "react";
import { useStrapiData } from "../../../services/strapiService";
import { getColumns } from "@/components/table/Columns";
import DashboardLayout from "..";
import { useRouter } from "next/router";
import { X, Plus, AlertCircle, ArrowUpDown, Eye } from "lucide-react";
import Skeleton from "@/components/loaders/loader";
import { Toaster, toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

// Componente DataTable interno
function DataTable({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div>
      <table className="w-full">
        <thead className="bg-[var(--app-primary)] dark:bg-zinc-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-sm font-semibold text-zinc-100 py-3 px-4 text-left"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr 
              key={row.id}
              className={`border-b border-gray-200 dark:border-zinc-700 ${
                index % 2 === 0 
                  ? 'bg-white dark:bg-zinc-900' 
                  : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/30'
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-zinc-700">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Mostrando {table.getRowModel().rows.length} de {data.length} resultados
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <div className="flex items-center px-2 h-8 bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente principal ViewSteps
export default function ViewSteps() {
  const { data, error, isLoading } = useStrapiData(
    "challenge-steps/get-all-data"
  );
  const [selectedRow, setSelectedRow] = useState(null);
  const router = useRouter();

  const handleCreate = () => {
    router.push("/admin/steps/create");
  };

  useEffect(() => {
    // Si existen parámetros de toast en la query, muestra el toast
    if (router.query.toast && router.query.message) {
      if (router.query.toast === "success") {
        toast.success(router.query.message);
      } else {
        toast.error(router.query.message);
      }
      // Limpia los parámetros de la query para que no se vuelva a disparar el toast
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query, router]);

  return (
    <DashboardLayout>
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            Steps
          </h1>
          
          {/* Botón para crear nuevo registro */}
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[var(--app-secondary)] text-black dark:text-white font-medium rounded-md hover:bg-[var(--app-secondary)]/90 transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Registro
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-800 rounded-lg text-center border border-zinc-200 dark:border-zinc-700 shadow-md">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-secondary)] mb-4"></div>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="text-red-600 dark:text-red-400">Error al cargar los datos: {error.message}</span>
            </div>
          </div>
        ) : data && data.length > 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-md">
            <div className="overflow-x-auto">
              <DataTable data={data} columns={getColumns()} />
            </div>
          </div>
        ) : (
          <div className="mt-6 p-8 bg-white dark:bg-zinc-800 rounded-lg text-center border border-zinc-200 dark:border-zinc-700 shadow-md">
            <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/30 p-6 rounded-lg">
              <Eye className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-500 mb-3" />
              <span className="text-zinc-600 dark:text-zinc-400">No hay datos disponibles</span>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" richColors />
    </DashboardLayout>
  );
}

export const StepLoader = () => {
  return (
    <div className="grid place-items-center h-[calc(100vh-300px)]">
      <Skeleton />
    </div>
  );
};