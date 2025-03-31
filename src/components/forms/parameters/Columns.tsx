// src/components/forms/parameters/Columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DataTableColumnHeader from "./DataTableColumnHeader";
import DetailModal from "@/components/forms/parameters/DetailModal";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { useState } from "react";
import PropDetails from "./PropDetails";

export type ChallengeRelationsStages = {
  id: number;
  documentId: string;

  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  challenge_step: {
    id: number;
    documentId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
  challenge_subcategory: {
    id: number;
    documentId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
  challenge_products: {
    id: number;
    documentId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }[];
  challenge_stages: {
    id: number;
    minimumTradingDays: number | null;
    maximumDailyLoss: number;
    maximumTotalLoss: number; // Cambiado de maximumLoss a maximumTotalLoss
    maximumLossPerTrade: number; // Nuevo campo añadido
    profitTarget: number | null;
    leverage: number;
    documentId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }[];
};

export default function Columns(
  actualizarDatos: () => void
): ColumnDef<ChallengeRelationsStages>[] {
  return [
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
      accessorKey: "challenge_step",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Step" />
      ),
      cell: ({ row }) => {
        const subcategories = row.getValue(
          "challenge_step"
        ) as ChallengeRelationsStages["challenge_step"];
        return (
          <div className="flex flex-wrap gap-1">
            <Badge key={subcategories?.id} variant="secondary">
              {subcategories?.name}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const subcategories = row.getValue(
          "challenge_step"
        ) as ChallengeRelationsStages["challenge_step"];
        return subcategories?.name.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "challenge_subcategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Categoría" />
      ),
      cell: ({ row }) => {
        const subcategories = row.getValue(
          "challenge_subcategory"
        ) as ChallengeRelationsStages["challenge_subcategory"];
        return (
          <div className="flex flex-wrap gap-1">
            <Badge key={subcategories?.id} variant="secondary">
              {subcategories?.name}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const subcategories = row.getValue(
          "challenge_subcategory"
        ) as ChallengeRelationsStages["challenge_subcategory"];
        return subcategories?.name.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "challenge_products",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balances" />
      ),
      cell: ({ row }) => {
        const products = row.getValue(
          "challenge_products"
        ) as ChallengeRelationsStages["challenge_products"];
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product) => (
              <Badge key={product.id} variant="secondary">
                {product.name}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const products = row.getValue(
          "challenge_products"
        ) as ChallengeRelationsStages["challenge_products"];
        return products.some((product) =>
          product.name.toLowerCase().includes(value.toLowerCase())
        );
      },
    },
    {
      accessorKey: "challenge_stages",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fases" />
      ),
      cell: ({ row }) => {
        const products = row.getValue(
          "challenge_stages"
        ) as ChallengeRelationsStages["challenge_stages"];
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product) => (
              <Badge key={product.id} variant="secondary">
                {product.name}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const products = row.getValue(
          "challenge_stages"
        ) as ChallengeRelationsStages["challenge_stages"];
        return products.some((product) =>
          product.name.toLowerCase().includes(value.toLowerCase())
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const data = row.original;
        const prop = {
          documentId: data.documentId,
          challenge_stages: data.challenge_stages,
          challenge_step: data.challenge_step,
          challenge_subcategory: data.challenge_subcategory,
          challenge_products: data.challenge_products,
        };
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [modalType, setModalType] = useState<number | null>(null);

        const openModal = (type: number) => {
          setModalType(type);
          setIsModalOpen(true);
        };

        return (
          <>
            <Button variant="ghost" size="icon" onClick={() => openModal(1)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openModal(2)}>
              <Edit className="h-4 w-4" />
            </Button>
            <DetailModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={`Detalle -  ${prop.challenge_subcategory?.name}`}
              maxWidth="7xl"
            >
              <PropDetails
                prop={prop}
                modalType={modalType}
                actualizarDatos={() => actualizarDatos()}
                onClose={() => setIsModalOpen(false)}
              />
            </DetailModal>
          </>
        );
      },
    },
  ];
}
