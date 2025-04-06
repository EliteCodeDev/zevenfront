// src/pages/admin/manager/index.js
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
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg">
        {/* Título principal */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            Gestión de Registros
          </h1>
          
          {/* Control de filas por página */}
          <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-800/60 px-4 py-2 rounded-lg shadow-sm backdrop-blur-sm">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm whitespace-nowrap">
              Filas por página:
            </span>
            <RowsPerPage pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        </div>

        {/* Grid con las 3 tarjetas (Subcategorías, Balances, Fases) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {/* Subcategorías */}
          <Card 
            icon={<Settings className="w-5 h-5 text-blue-400" />}
            title="Subcategorías"
          >
            <SubcategoriesManager pageSize={pageSize} />
          </Card>

          {/* Balances (Productos) */}
          <Card 
            icon={<PackageIcon className="w-5 h-5 text-blue-400" />}
            title="Balances"
          >
            <ProductsManager pageSize={pageSize} />
          </Card>

          {/* Fases */}
          <Card 
            icon={<Layers className="w-5 h-5 text-blue-400" />}
            title="Fases"
          >
            <StagesManager pageSize={pageSize} />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Componente Card reutilizable para las secciones
function Card({ icon, title, children }) {
  return (
    <div className="bg-white/40 dark:bg-zinc-800/40 rounded-xl shadow-md backdrop-blur-sm overflow-hidden">
      <div className="flex items-center bg-[var(--app-primary)]/80 dark:bg-zinc-700/80 px-5 py-3">
        {icon}
        <h2 className="text-lg font-semibold text-white ml-2">
          {title}
        </h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}