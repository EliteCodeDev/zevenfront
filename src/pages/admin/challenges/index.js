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
import { Search, Filter } from "lucide-react";
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
            className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white shadow-sm"
            onClick={() => router.push(`/admin/challenges/${challenge.documentId}`)}
          >
            Ver Detalles
          </Button>
        ),
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
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-zinc-800 dark:text-white">Challenges</h1>
          <div className="relative flex items-center space-x-2">
            <div className="relative">
              <Input
                placeholder="Buscar trader"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-64 dark:bg-zinc-800 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="dark:bg-zinc-800 dark:text-white border-zinc-300 dark:border-zinc-700"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.accessorKey}
                      className="text-zinc-600 dark:text-zinc-300 font-medium py-3 px-4 border-b border-zinc-200 dark:border-zinc-700"
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((challenge, index) => (
                    <TableRow
                      key={index}
                      className={`
                        ${index % 2 === 0 
                          ? 'bg-white dark:bg-zinc-900' 
                          : 'bg-zinc-50 dark:bg-zinc-800/30'
                        } 
                        hover:bg-zinc-100 dark:hover:bg-zinc-800/50 
                        transition-colors
                        border-b border-zinc-100 dark:border-zinc-800
                      `}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column.accessorKey} 
                          className="py-3 px-4 text-zinc-700 dark:text-zinc-300"
                        >
                          {challenge[column.accessorKey]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length} 
                      className="text-center text-zinc-500 dark:text-zinc-400 py-8"
                    >
                      No se encontraron datos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Mostrando {filteredData.length} resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                Anterior
              </Button>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300">
                Página {table.getState().pagination.pageIndex + 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}