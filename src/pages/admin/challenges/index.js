// src/pages/admin/challenges/index.js
"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye } from "lucide-react";
import DashboardLayout from "..";
import { useRouter } from "next/router";
import { useStrapiData } from "@/services/strapiService";

// Configuración de estados
const STATUS_CONFIG = {
  init: { 
    label: "Por Iniciar", 
    textColor: "text-blue-500", 
    dotColor: "bg-blue-500" 
  },
  approved: { 
    label: "Aprobado", 
    textColor: "text-green-500", 
    dotColor: "bg-green-500" 
  },
  disapproved: { 
    label: "Rechazado", 
    textColor: "text-red-500", 
    dotColor: "bg-red-500" 
  },
  progress: { 
    label: "En Progreso", 
    textColor: "text-yellow-500", 
    dotColor: "bg-yellow-500" 
  },
  withdrawal: { 
    label: "Retirado", 
    textColor: "text-purple-500", 
    dotColor: "bg-purple-500" 
  },
  retry: { 
    label: "Reintento", 
    textColor: "text-orange-500", 
    dotColor: "bg-orange-500" 
  }
};

// Columnas de la tabla
const columns = [
  { accessorKey: "traderAccount", header: "Cuenta Trader" },
  { accessorKey: "traderEmail", header: "Email Trader" },
  { accessorKey: "state", header: "Estado" },
  { accessorKey: "step", header: "Fase" },
  { accessorKey: "equity", header: "Capital" },
  { accessorKey: "brokerGroup", header: "Server" },
  { accessorKey: "actions", header: "Acciones" }
];

export default function ChallengesTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");

  // Obtener datos
  const { data, error, isLoading } = useStrapiData("challenges?populate=*");

  // Formatear moneda
  const formatCurrency = (amount) =>
    amount ? `$${parseFloat(amount).toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "N/A";

  // Obtener elemento de estado
  const getStatusElement = (result) => {
    const config = STATUS_CONFIG[result] || { 
      label: "Desconocido", 
      textColor: "text-gray-500", 
      dotColor: "bg-gray-500" 
    };
    
    return (
      <span className={`inline-flex items-center text-sm font-medium ${config.textColor}`}>
        <span className={`w-2 h-2 mr-2 rounded-full ${config.dotColor}`}></span>
        {config.label}
      </span>
    );
  };

  // Transformar datos
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data
      .filter((challenge) => 
        globalFilter === "" || 
        challenge.broker_account?.login?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        challenge.user?.email?.toLowerCase().includes(globalFilter.toLowerCase())
      )
      .map((challenge) => ({
        traderAccount: challenge.broker_account?.login ?? "N/A",
        traderEmail: challenge.user?.email ?? "N/A",
        state: getStatusElement(challenge.result),
        step: `Fase ${challenge.phase ?? "N/A"}`,
        equity: formatCurrency(challenge.broker_account?.balance),
        brokerGroup: challenge.broker_account?.server ?? "N/A",
        actions: (
          <Button
            size="sm"
            className="px-3 py-1 text-xs font-medium rounded bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white"
          >
            Ver Detalles
          </Button>
        ),
        documentId: challenge.documentId,
      }));
  }, [data, globalFilter]);

  // Instancia de tabla
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DashboardLayout>
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800 text-zinc-800 dark:text-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--app-secondary)]">
            Challenges
          </h1>
          <div className="relative flex items-center space-x-2">
            <div className="relative">
              <Input
                placeholder="Buscar trader"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 h-9 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--app-secondary)] transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--app-primary)] dark:bg-zinc-800">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.accessorKey}
                      className="text-sm font-semibold text-zinc-100 py-3 px-4"
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[var(--app-secondary)] mb-4"></div>
                        <span className="text-zinc-600 dark:text-zinc-400">Cargando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-red-500 w-6 h-6" />
                        <span className="text-red-600 dark:text-red-400">Error al cargar los datos</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((challenge, index) => (
                    <TableRow
                      key={index}
                      className={`border-b border-gray-200 dark:border-zinc-700 ${
                        index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[var(--app-primary)]/5 dark:bg-zinc-800/30'
                      }`}
                      onClick={() => router.push(`/admin/challenges/${challenge.documentId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column.accessorKey} 
                          className="py-3 px-4 text-sm text-zinc-700 dark:text-zinc-300"
                        >
                          {challenge[column.accessorKey]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10">
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
                Mostrando {filteredData.length} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}