// src/pages/admin/challenges/index.js
"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "..";
import { useRouter } from "next/router";
import { useStrapiData } from "@/services/strapiService";

// Columnas de la tabla en español
const tableColumns = [
  { accessorKey: "traderAccount", header: "Cuenta Trader" },
  { accessorKey: "traderEmail", header: "Email Trader" },
  { accessorKey: "state", header: "Estado" },
  { accessorKey: "step", header: "Fase" },
  { accessorKey: "equity", header: "Capital" },
  { accessorKey: "brokerGroup", header: "Server" },
  { accessorKey: "actions", header: "Acciones" },
];

// Definir colores para los estados
const statusColors = {
  approved: 'text-green-600 dark:text-green-300',
  disapproved: 'text-red-600 dark:text-red-300',
  progress: 'text-yellow-600 dark:text-yellow-300',
  init: 'text-blue-600 dark:text-blue-300',
  withdrawal: 'text-purple-600 dark:text-purple-300',
  retry: 'text-orange-600 dark:text-orange-300',
};

const statusBgColors = {
  approved: 'bg-green-100 dark:bg-green-900/40',
  disapproved: 'bg-red-100 dark:bg-red-900/40',
  progress: 'bg-yellow-100 dark:bg-yellow-900/40',
  init: 'bg-blue-100 dark:bg-blue-900/40',
  withdrawal: 'bg-purple-100 dark:bg-purple-900/40',
  retry: 'bg-orange-100 dark:bg-orange-900/40',
};

export default function ChallengesTable() {
  const { data: session } = useSession();

  // const route = session?.jwt ? "challenges?populate=*" : null;
  const { data, error, isLoading } = useStrapiData("challenges?populate=*");
  // console.log("data", data);

  const formatCurrency = (amount) =>
    amount ? `$${parseFloat(amount).toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "N/A";

  const translateResult = (result) => {
    switch (result) {
      case "init":
        return "Por Iniciar";
      case "approved":
        return "Aprobado";
      case "disapproved":
        return "Rechazado";
      case "progress":
        return "En Progreso";
      case "withdrawal":
        return "Retirado";
      case "retry":
        return "Reintento";
      default:
        return "Desconocido";
    }
  };

  const getStatusElement = (result) => {
    const text = translateResult(result);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${statusColors[result] || 'text-gray-600 dark:text-gray-300'} ${statusBgColors[result] || 'bg-gray-100 dark:bg-gray-800'}`}>
        <span className={`w-2 h-2 mr-2 rounded-full ${result === 'approved' ? 'bg-green-600' :
          result === 'progress' ? 'bg-yellow-500' :
            result === 'disapproved' ? 'bg-red-600' :
              result === 'init' ? 'bg-blue-500' :
                result === 'withdrawal' ? 'bg-purple-500' :
                  'bg-orange-500'
          }`}></span>
        {text}
      </span>
    );
  };

  const router = useRouter();

  const handleButtonClick = (documentId) => {
    router.push(`/admin/challenges/${documentId}`);
  };

  const filteredData = useMemo(() => {
    // console.log(data);
    if (!data) return [];

    return data.map((challenge) => ({
      traderAccount: challenge.broker_account?.login ?? "N/A",
      traderEmail: challenge.user?.email ?? "N/A",
      state: getStatusElement(challenge.result),
      step: `Fase ${challenge.phase ?? "N/A"}`,
      equity: formatCurrency(challenge.broker_account?.balance),
      brokerGroup: challenge.broker_account?.server ?? "N/A",
      actions: (
        <Button
          // variant="outline"
          size="sm"
          className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black dark:text-white shadow-sm"
          onClick={() => handleButtonClick(challenge.documentId)}
        >
          Ver Detalles
        </Button>
      ),
    }));
  }, [data]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DashboardLayout>
      <div className="p-6 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-lg shadow-lg border-t-4 border-[var(--app-secondary)]">
        <h1 className="text-4xl font-bold mb-6 text-zinc-800 dark:text-white">Challenges</h1>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4 rounded-lg mt-4 shadow-sm">
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Table>
              <TableHeader className="bg-zinc-100 dark:bg-zinc-800">
                <TableRow>
                  {tableColumns.map((column) => (
                    <TableHead
                      key={column.accessorKey}
                      className="border-b border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium py-3 px-4"
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
                      className={`border-b border-zinc-200 dark:border-zinc-700 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/50'
                        } hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
                    >
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.traderAccount}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.traderEmail}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.state === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          challenge.state === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            challenge.state === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {challenge.state}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.step}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.equity}</TableCell>
                      <TableCell className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{challenge.brokerGroup}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex space-x-2">

                          {challenge.actions}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <TableCell colSpan={tableColumns.length} className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                      No se encontraron datos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center mt-6 px-2">
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