"use client";

import React, { useState, useEffect } from "react";
import { useStrapiData } from "../../../services/strapiService";
import { DataTable } from "@/components/table/DataTable";
import { getColumns } from "@/components/table/Columns";
import DashboardLayout from "..";
import { useRouter } from "next/router";
import { X, Plus, AlertCircle, ArrowUpDown } from "lucide-react";
import Skeleton from "@/components/loaders/loader";
import { Toaster, toast } from 'sonner';

export default function ViewSteps() {
  const { data, error, isLoading } = useStrapiData("challenge-steps/get-all-data");
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
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white">
          <span className="border-b-2 border-[var(--app-secondary)] pb-1">Steps</span>
        </h1>

        {isLoading ? (
          <StepLoader />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg border border-red-200 dark:border-red-900/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Ha ocurrido un error</p>
              <p>{error.message}</p>
            </div>
          </div>
        ) : data && (
          <div className="w-full">
            {/* Botón para crear nuevo registro */}
            <div className="w-full flex justify-end mb-5">
              <button
                onClick={handleCreate}
                className="px-4 py-2.5 bg-[var(--app-secondary)] text-black dark:text-white font-semibold rounded-md hover:bg-[var(--app-secondary)]/90 transition-colors shadow-sm flex items-center gap-2"
              >
                Nuevo Registro
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tabla de datos */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm">
              <div className="overflow-hidden rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700">
                <DataTable data={data} columns={getColumns()} />
              </div>
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
    <div className='grid place-items-center h-[calc(100vh-300px)]'>
      <Skeleton />
    </div>
  );
}