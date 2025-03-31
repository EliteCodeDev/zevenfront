"use client";

import React, { useState } from "react";
import { SubcategoriesManager } from "@/components/manager/SubcategoriesManager";
import { ProductsManager } from "@/components/manager/ProductsManager";
import { StagesManager } from "@/components/manager/StagesManager";
import { RowsPerPage } from "@/components/table/RowsPerPage";
import DashboardLayout from "..";
import { Settings, PackageIcon, Layers } from "lucide-react";

export default function IndexPage() {
  // Estado para el tamaño de página, compartido entre las tres tablas
  const [pageSize, setPageSize] = useState(5);

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 border-t-4 border-t-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-8 text-zinc-800 dark:text-white">
          <span className="border-b-2 border-[var(--app-secondary)] pb-1">Gestión de Registros</span>
        </h1>

        {/* Control de filas por página */}
        <div className="mb-6 bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-4 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 flex items-center">
          <div className="mr-3 text-zinc-700 dark:text-zinc-300 font-medium">Filas por página:</div>
          <RowsPerPage pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>

        {/* Grid con las 3 tablas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Subcategorías */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-3 border-b border-[var(--app-primary)]/20 dark:border-zinc-700 flex items-center">
              <Settings className="w-5 h-5 text-[var(--app-secondary)] mr-2" />
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Subcategorías</h2>
            </div>
            <div className="p-4 flex-grow bg-white dark:bg-zinc-900">
              <SubcategoriesManager pageSize={pageSize} />
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-3 border-b border-[var(--app-primary)]/20 dark:border-zinc-700 flex items-center">
              <PackageIcon className="w-5 h-5 text-[var(--app-secondary)] mr-2" />
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Productos</h2>
            </div>
            <div className="p-4 flex-grow bg-white dark:bg-zinc-900">
              <ProductsManager pageSize={pageSize} />
            </div>
          </div>

          {/* Fases */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-[var(--app-primary)]/20 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[var(--app-primary)]/5 dark:bg-zinc-800 p-3 border-b border-[var(--app-primary)]/20 dark:border-zinc-700 flex items-center">
              <Layers className="w-5 h-5 text-[var(--app-secondary)] mr-2" />
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Fases</h2>
            </div>
            <div className="p-4 flex-grow bg-white dark:bg-zinc-900">
              <StagesManager pageSize={pageSize} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}