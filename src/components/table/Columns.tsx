"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/router";

export type Challenge = {
  id: number;
  name: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  challenge_subcategories: {
    id: number;
    name: string;
    documentId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }[];
  challenge_stages: {
    id: number;
    name: string;
    documentId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }[];
};

// Función que recibe el callback para edición y retorna el arreglo de columnas
export const getColumns = (): // onEdit: (row: Challenge) => void
ColumnDef<Challenge>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate") ||
          false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-medium">
          {row.getValue("name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "challenge_subcategories",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categorías" />
    ),
    cell: ({ row }) => {
      const subcategories = row.getValue(
        "challenge_subcategories"
      ) as Challenge["challenge_subcategories"];
      return (
        <div className="flex flex-wrap gap-1">
          {subcategories.map((subcategory) => (
            <Badge key={subcategory.id} variant="secondary">
              {subcategory.name}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const subcategories = row.getValue(
        "challenge_subcategories"
      ) as Challenge["challenge_subcategories"];
      return subcategories.some((stage) =>
        String(stage.name).toLowerCase().includes(String(value).toLowerCase())
      );
    },
  },
  {
    accessorKey: "challenge_stages",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fases" />
    ),
    cell: ({ row }) => {
      const stages = row.getValue(
        "challenge_stages"
      ) as Challenge["challenge_stages"];
      return (
        <div className="flex flex-wrap gap-1">
          {stages.map((stage) => (
            <Badge key={stage.id} variant="secondary">
              {stage.name}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const stages = row.getValue(
        "challenge_stages"
      ) as Challenge["challenge_stages"];
      return stages.some((stage) =>
        stage.name.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const data = row.original;
      // console.log("Data", data);
      const step = {
        name: data.name,
        subcategories: data.challenge_subcategories,
        stages: data.challenge_stages,
      };
      // console.log("Step", step);
      const [isModalOpen, setIsModalOpen] = useState(false);
      const router = useRouter();

      const handleRedirect = () => {
        // console.log("Redirecting to", `/admin/steps/${data.documentId}`);
        router.push(`/admin/steps/${data.documentId}`);
      };
      return (
        <>
          <Button variant="ghost" size="icon" onClick={handleRedirect}>
            <Pencil className="h-4 w-4" />
          </Button>
        </>
      );
    },
  },
];
