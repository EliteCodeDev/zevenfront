"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InboxIcon, Pencil, PlusCircle } from "lucide-react";

// 1. Definimos la interfaz de los items (con precio opcional)
export interface ChallengeItem {
  id: number;
  documentId?: string;
  name: string;
  precio?: number; // <-- se hace opcional
}

// 2. Definimos las props del componente
interface ChallengeTableProps {
  title: string;
  data: ChallengeItem[];
  pageSize: number;
  onCreate: () => void;
  onEdit: (item: ChallengeItem) => void;
  // 3. Nueva prop para indicar si mostramos el precio
  showPrice?: boolean;
}

export const ChallengeTable: React.FC<ChallengeTableProps> = ({
  title,
  data,
  pageSize,
  onCreate,
  onEdit,
  showPrice = false,
}) => {
  // Paginación local
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    if (pageSize < 1) return 1;
    return Math.ceil(data.length / pageSize) || 1;
  }, [data, pageSize]);

  // Ajustar currentPage si supera totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calcular el slice de datos a mostrar
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedData = data.slice(startIndex, endIndex);

  // Funciones de paginación
  function goFirstPage() {
    setCurrentPage(1);
  }
  function goPrevPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }
  function goNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }
  function goLastPage() {
    setCurrentPage(totalPages);
  }

  return (
    <div className="h-[450px] flex flex-col space-y-2 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
      {/* Barra superior con Título y botón "Crear" */}
      <div className="flex justify-end px-2 mb-3">
        {/* <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center">
          <span className="border-b-2 border-[var(--app-secondary)] pb-1">
            {title}
          </span>
        </h2> */}
        <Button
          variant="secondary"
          className="bg-[var(--app-secondary)] text-black dark:text-white hover:bg-[var(--app-secondary)]/90 px-4 py-1.5 text-sm rounded-md shadow-sm font-medium flex items-center gap-1"
          onClick={onCreate}
        >
          <PlusCircle className="h-4 w-4" /> Crear
        </Button>
      </div>

      {/* Contenedor de la tabla con scroll interno */}
      <div className="flex-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
        <Table className="w-full table-fixed rounded-lg">
          {/* Encabezado fijo */}
          <TableHeader className="sticky top-0 z-10 bg-[var(--app-primary)]/5 dark:bg-zinc-800">
            <TableRow className="text-center">
              <TableHead className="p-3 text-zinc-700 dark:text-zinc-300 font-medium border-b border-zinc-200 dark:border-zinc-700">
                ID
              </TableHead>
              <TableHead className="p-3 text-zinc-700 dark:text-zinc-300 font-medium border-b border-zinc-200 dark:border-zinc-700">
                Nombre
              </TableHead>

              {/* Mostrar la cabecera de "Precio" solo si showPrice es true */}
              {showPrice && (
                <TableHead className="p-3 text-zinc-700 dark:text-zinc-300 font-medium border-b border-zinc-200 dark:border-zinc-700">
                  Precio
                </TableHead>
              )}
              <TableHead className="p-3 text-zinc-700 dark:text-zinc-300 font-medium border-b border-zinc-200 dark:border-zinc-700">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="p-2 text-center">
            {displayedData.length > 0 ? (
              displayedData.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={`${
                    index % 2 === 0
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-[var(--app-primary)]/5 dark:bg-zinc-800/40"
                  } hover:bg-[var(--app-primary)]/10 dark:hover:bg-zinc-800 transition-colors`}
                >
                  <TableCell className="p-3 text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800">
                    {item.id}
                  </TableCell>
                  <TableCell className="p-3 text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800 font-medium">
                    {item.name}
                  </TableCell>
                  {showPrice && (
                    <TableCell className="p-3 text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800">
                      {item.precio}
                    </TableCell>
                  )}
                  <TableCell className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        className="px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showPrice ? 4 : 3}
                  className="h-48 text-center text-zinc-500 dark:text-zinc-400"
                >
                  <div className="flex flex-col items-center justify-center bg-[var(--app-primary)]/5 dark:bg-zinc-800/40 p-6 rounded-lg border border-[var(--app-primary)]/10 dark:border-zinc-700 mx-8">
                    <InboxIcon className="w-10 h-10 text-[var(--app-primary)]/40 dark:text-zinc-400 mb-3" />
                    <span>Sin Resultados</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación al fondo del contenedor */}
      <div className="flex items-center justify-between px-2 py-1 mt-2">
        <span className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm"
            onClick={goFirstPage}
            disabled={currentPage === 1}
          >
            «
          </Button>
          <Button
            variant="outline"
            className="px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm"
            onClick={goPrevPage}
            disabled={currentPage === 1}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            className="px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm"
            onClick={goNextPage}
            disabled={currentPage === totalPages}
          >
            ›
          </Button>
          <Button
            variant="outline"
            className="px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md shadow-sm"
            onClick={goLastPage}
            disabled={currentPage === totalPages}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};
