// src/components/forms/step/CreateStepFormC.js
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepFormSchema } from "../../../lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { useStrapiData } from "../../../services/strapiService";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/loaders/loader";
export function CreateStepFormC() {
  const router = useRouter();

  // 1. Cargar datos desde Strapi
  const {
    data: subcategories,
    error: subError,
    isLoading: subLoading,
  } = useStrapiData(
    "challenge-subcategories?populate=*"
  );
  const {
    data: stages,
    error: stageError,
    isLoading: stageLoading,
  } = useStrapiData("challenge-stages?filters[challenge_steps][$null]=true");
  // console.log("stageData", stages);
  // 2. Mapeo y filtrado de datos
  const subcategoriesData = subcategories
    ? subcategories
      .filter(
        (subcategory) =>
          !subcategory.challenge_steps ||
          subcategory.challenge_steps === "" ||
          subcategory.challenge_steps === null
      )
      .map(({ id, documentId, name }) => ({ id, documentId, name }))
    : [];
  const stageData = stages
    ? stages.map(({ id, documentId, name }) => ({ id, documentId, name }))
    : [];

  // console.log("subcategoriesData", subcategoriesData);
  // 3. Estados locales para la creación
  const [openSubcat, setOpenSubcat] = useState(false);
  const [openStages, setOpenStages] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Carga local al crear

  // Estados para agregar nuevos elementos custom
  const [customSubcategories, setCustomSubcategories] = useState([]);
  const [customSubcatInput, setCustomSubcatInput] = useState("");
  const [customStages, setCustomStages] = useState([]);
  const [customStagesInput, setCustomStagesInput] = useState("");

  // Combinar subcategorías y stages existentes con las custom
  const allSubcategories = [...subcategoriesData, ...customSubcategories];
  const allStages = [...(stageData || []), ...customStages];
  // console.log("allStages", allStages);
  // console.log("allSubcategories", allSubcategories);
  // 4. useForm
  const form = useForm({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      documentId: "",
      name: "",
      subcategories: [],
      stages: [],
    },
  });

  // 5. Función para crear Step con sus relaciones
  const createStepWithRelations = async (stepPayload) => {
    const response = await fetch(
      "http://localhost:1337/api/challenge-steps/create-with-relations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        },
        body: JSON.stringify(stepPayload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al crear el step: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  };

  // 6. Submit (Crear)
  const handleCreateSubmit = form.handleSubmit(async (data) => {
    setLocalLoading(true);
    try {
      // Asegurar que no exista documentId (lo generará Strapi)
      data.documentId = "";
      // console.log("JSON final:", data);

      await createStepWithRelations(data);
      // Limpieza
      form.reset();
      setCustomSubcategories([]);
      setCustomStages([]);

      // Redirección tras crear
      router.push("/admin/steps");
    } catch (error) {
      console.error("Error al crear el step:", error);
      alert("Ocurrió un error al crear el step. Revisa la consola.");
    } finally {
      setLocalLoading(false);
    }
  });

  // 7. Handlers para agregar items custom
  const handleAddCustomSubcat = (field) => {
    if (!customSubcatInput.trim()) return;
    const newSubcat = {
      id: `custom-${Date.now()}`,
      name: customSubcatInput.trim(),
    };
    setCustomSubcategories((prev) => [...prev, newSubcat]);
    field.onChange([...field.value, newSubcat]);
    setCustomSubcatInput("");
  };

  const handleAddCustomStage = (field) => {
    if (!customStagesInput.trim()) return;
    const newStage = {
      id: `custom-${Date.now()}`,
      name: customStagesInput.trim(),
    };
    setCustomStages((prev) => [...prev, newStage]);
    field.onChange([...field.value, newStage]);
    setCustomStagesInput("");
  };

  // 8. Lógica de carga y errores unificados
  const isGlobalLoading = subLoading || stageLoading || localLoading;
  const hasError = subError || stageError;
  if (isGlobalLoading) {
    return <div className="grid place-items-center h-[calc(100vh-100px)]"><Skeleton /></div>;
  }
  if (hasError) {
    return <p className="text-center text-red-400">Error al cargar datos.</p>;
  }
  return (
    <Card className="p-6 max-w-4xl mx-auto grid place-items-center h-[calc(100vh-100px)] border-none">
      <Form {...form}>
        <form className="space-y-8 p-6 max-w-4xl mx-auto bg-black border-2 rounded-xl">
          {/* Campo Nombre */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-yellow-500 text-lg">Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Nombre del Step"
                    className="border-gray-700 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-8">
            {/* Subcategorías Section */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="subcategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-yellow-500 text-lg">
                      Subcategorías
                    </FormLabel>
                    <Card className="p-4 border border-gray-700 bg-black/50">
                      <div className="space-y-4">
                        <Popover open={openSubcat} onOpenChange={setOpenSubcat}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full border-gray-700 bg-transparent text-white hover:bg-yellow-500/10"
                              >
                                {field.value.length > 0
                                  ? `${field.value.length} seleccionadas`
                                  : "Seleccionar"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 bg-black border-yellow-500 w-full">
                            <Command className="bg-black">
                              <CommandInput
                                placeholder="Buscar subcategorías..."
                                className="text-yellow-500"
                              />
                              <CommandList>
                                <CommandEmpty>No se encontraron resultados</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    className="text-yellow-500 hover:bg-yellow-500/10"
                                    onSelect={() => {
                                      if (
                                        field.value.length ===
                                        allSubcategories.length
                                      ) {
                                        field.onChange([]);
                                      } else {
                                        field.onChange(allSubcategories);
                                      }
                                    }}
                                  >
                                    <div
                                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 ${field.value.length ===
                                        allSubcategories.length
                                        ? "bg-yellow-500 text-black"
                                        : "opacity-50"
                                        }`}
                                    >
                                      {field.value.length ===
                                        allSubcategories.length && "✓"}
                                    </div>
                                    Seleccionar Todas
                                  </CommandItem>
                                  {allSubcategories.map((subcat) => {
                                    const isSelected = field.value.some(
                                      (item) => item.id === subcat.id
                                    );
                                    return (
                                      <CommandItem
                                        key={subcat.id}
                                        onSelect={() => {
                                          const current = field.value;
                                          let newValues;
                                          if (isSelected) {
                                            newValues = current.filter(
                                              (v) => v.id !== subcat.id
                                            );
                                          } else {
                                            newValues = [...current, subcat];
                                          }
                                          field.onChange(newValues);
                                        }}
                                        className="text-yellow-500 hover:bg-yellow-500/10"
                                      >
                                        <div
                                          className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 ${isSelected
                                            ? "bg-yellow-500 text-black"
                                            : "opacity-50"
                                            }`}
                                        >
                                          {isSelected && "✓"}
                                        </div>
                                        {subcat.name}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Nueva Subcategoría"
                            value={customSubcatInput}
                            onChange={(e) => setCustomSubcatInput(e.target.value)}
                            className="border-gray-700 bg-transparent text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddCustomSubcat(field)}
                            className="hover:bg-yellow-500/10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {field.value.length > 0 && (
                          <div className="grid gap-2 pt-4">
                            {field.value.map((subcat) => (
                              <Card
                                key={subcat.id}
                                className="p-2 bg-yellow-500/10 border-yellow-500/20 flex justify-between items-center"
                              >
                                <span className="text-white">{subcat.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    field.onChange(
                                      field.value.filter(
                                        (v) => v.id !== subcat.id
                                      )
                                    );
                                  }}
                                  className="h-8 w-8 hover:bg-yellow-500/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stages Section */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="stages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-yellow-500 text-lg">
                      Stages
                    </FormLabel>
                    <Card className="p-4 border border-gray-700 bg-black/50">
                      <div className="space-y-4">
                        <Popover open={openStages} onOpenChange={setOpenStages}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full border-gray-700 bg-transparent text-white hover:bg-yellow-500/10"
                              >
                                {field.value.length > 0
                                  ? `${field.value.length} seleccionados`
                                  : "Seleccionar"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 bg-black border-yellow-500 w-full">
                            <Command className="bg-black">
                              <CommandInput
                                placeholder="Buscar stages..."
                                className="text-yellow-500"
                              />
                              <CommandList>
                                <CommandEmpty>
                                  No se encontraron resultados
                                </CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    className="text-yellow-500 hover:bg-yellow-500/10"
                                    onSelect={() => {
                                      if (
                                        field.value.length === allStages.length
                                      ) {
                                        field.onChange([]);
                                      } else {
                                        field.onChange(allStages);
                                      }
                                    }}
                                  >
                                    <div
                                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 ${field.value.length === allStages.length
                                        ? "bg-yellow-500 text-black"
                                        : "opacity-50"
                                        }`}
                                    >
                                      {field.value.length ===
                                        allStages.length && "✓"}
                                    </div>
                                    Seleccionar Todas
                                  </CommandItem>
                                  {allStages.map((stage) => {
                                    const isSelected = field.value.some(
                                      (item) =>
                                        item.documentId === stage.documentId
                                    );
                                    return (
                                      <CommandItem
                                        key={stage.id}
                                        onSelect={() => {
                                          const current = field.value;
                                          let newValues;
                                          if (isSelected) {
                                            newValues = current.filter(
                                              (v) =>
                                                v.documentId !==
                                                stage.documentId
                                            );
                                          } else {
                                            newValues = [...current, stage];
                                          }
                                          field.onChange(newValues);
                                        }}
                                        className="text-yellow-500 hover:bg-yellow-500/10"
                                      >
                                        <div
                                          className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 ${isSelected
                                            ? "bg-yellow-500 text-black"
                                            : "opacity-50"
                                            }`}
                                        >
                                          {isSelected && "✓"}
                                        </div>
                                        {stage.name}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Nuevo Stage"
                            value={customStagesInput}
                            onChange={(e) => setCustomStagesInput(e.target.value)}
                            className="border-gray-700 bg-transparent text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddCustomStage(field)}
                            className="hover:bg-yellow-500/10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {field.value.length > 0 && (
                          <div className="grid gap-2 pt-4">
                            {field.value.map((stage) => (
                              <Card
                                key={stage.documentId || stage.id}
                                className="p-2 bg-yellow-500/10 border-yellow-500/20 flex justify-between items-center"
                              >
                                <span className="text-white">{stage.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    field.onChange(
                                      field.value.filter(
                                        (v) =>
                                          v.documentId !== stage.documentId
                                      )
                                    );
                                  }}
                                  className="h-8 w-8 hover:bg-yellow-500/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCreateSubmit}
            className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
          >
            Crear
          </Button>
        </form>
      </Form>
    </Card>
  );
}
