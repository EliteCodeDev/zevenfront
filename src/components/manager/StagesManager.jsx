"use client";

import React, { useEffect, useState } from "react";
import { ChallengeTable } from "@/components/table/ChallengeTable";
import { RowsPerPage } from "@/components/table/RowsPerPage";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Importar toast desde sonner
import { toast } from "sonner";

// Validación
const nameSchema = z.object({
  name: z.string().nonempty("El nombre es requerido"),
});

export function StagesManager({ pageSize }) {
  // Estado
  const [stages, setStages] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  // const [pageSize, setPageSize] = useState(10);

  // Form
  const form = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  // --------------------------------------------------
  // 1. Helpers para consumir Strapi
  // --------------------------------------------------
  async function fetchStrapiData(endpoint) {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(
        `Error al obtener datos de ${endpoint}: ${res.status} ${res.statusText}`
      );
    }
    const json = await res.json();
    return json.data;
  }

  async function createStrapiItem(endpoint, payload) {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: payload }),
    });
    if (!res.ok) {
      throw new Error(
        `Error al crear en ${endpoint}: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  }

  async function updateStrapiItem(endpoint, idOrDoc, payload) {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}/${idOrDoc}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: payload }),
    });
    if (!res.ok) {
      throw new Error(
        `Error al actualizar en ${endpoint}/${idOrDoc}: ${res.status} ${res.statusText}`
      );
    }
    return res.json();
  }

  // --------------------------------------------------
  // 2. Cargar datos al montar
  // --------------------------------------------------
  useEffect(() => {
    const loadStages = async () => {
      try {
        const data = await fetchStrapiData("challenge-stages");
        setStages(
          data.map((item) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
          }))
        );
      } catch (error) {
        console.error("Error al cargar stages:", error);
      }
    };
    loadStages();
  }, []);

  // --------------------------------------------------
  // 3. Crear / Editar
  // --------------------------------------------------
  function handleOpenCreate() {
    setEditItem(null);
    form.reset({ name: "" });
    setOpenModal(true);
  }

  function handleOpenEdit(item) {
    setEditItem({
      docId: item.documentId,
      name: item.name,
    });
    form.reset({ name: item.name });
    setOpenModal(true);
  }

  async function onSubmit(formValues) {
    const payload = { name: formValues.name };
    const endpoint = "challenge-stages";

    try {
      if (editItem) {
        // Editar
        await updateStrapiItem(endpoint, editItem.docId, payload);
        toast.success("Stage editado exitosamente");
      } else {
        // Crear
        await createStrapiItem(endpoint, payload);
        toast.success("Stage creado exitosamente");
      }
      setOpenModal(false);

      // Refrescar datos
      const newData = await fetchStrapiData(endpoint);
      setStages(
        newData.map((item) => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
        }))
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar. Revisa la consola.");
    }
  }

  // --------------------------------------------------
  // 4. Procesar datos para la tabla:
  //    - Eliminar nombres duplicados.
  //    - Enumerar secuencialmente (1,2,3,...) en lugar de usar el id real.
  // --------------------------------------------------
  const uniqueStages = stages.filter(
    (item, index, self) => index === self.findIndex((t) => t.name === item.name)
  );
  const tableData = uniqueStages.map((item, index) => ({
    ...item,
    id: index + 1, // Se reemplaza el id real por el número de fila
  }));

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------
  return (
    <div>
      <ChallengeTable
        title="Fases"
        data={tableData}
        pageSize={pageSize}
        onCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white dark:bg-black text-zinc-800 dark:text-white border border-[var(--app-secondary)]/70 dark:border-yellow-500 max-w-md mx-auto shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--app-secondary)] dark:text-yellow-400 text-sm sm:text-base md:text-lg font-semibold">
              {editItem ? "Editar" : "Crear"} Stage
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-gray-300 text-xs sm:text-sm md:text-base">
              {editItem
                ? "Modifica el nombre y confirma para guardar cambios."
                : "Ingresa el nombre para crear un nuevo registro."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-3"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--app-secondary)] dark:text-yellow-500 text-sm">
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nombre"
                        className="bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white text-sm focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)]"
                      />
                    </FormControl>
                    <FormMessage className="text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenModal(false)}
                  className="px-3 py-1 text-sm bg-white dark:bg-transparent border border-zinc-300 dark:border-gray-700 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[var(--app-secondary)] dark:bg-yellow-500 text-black hover:bg-[var(--app-secondary)]/90 dark:hover:bg-yellow-400 px-3 py-1 text-sm shadow-sm"
                >
                  {editItem ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
