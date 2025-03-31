// src/components/forms/step/UpdateStepFormC.js
"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepFormSchema } from "../../../lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { useStrapiData } from "../../../services/strapiService";
import Skeleton from "@/components/loaders/loader";
import { toast } from "sonner";

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

export function UpdateStepFormC({ step, onStepChange }) {
  // console.log("step recibido:", step);
  // --- Datos desde Strapi ---
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
  } = useStrapiData("challenge-stages?populate=*");
  // 2. Mapeo y filtrado de datos
  const subcategoriesData = subcategories
    ? subcategories.map(({ id, documentId, name }) => ({ id, documentId, name }))
    : [];
  const stageData = stages
    ? stages.map(({ id, documentId, name }) => ({ id, documentId, name }))
    : [];

  // --- Estados locales ---
  const [openSubcat, setOpenSubcat] = useState(false);
  const [openStages, setOpenStages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customSubcategories, setCustomSubcategories] = useState([]);
  const [customSubcatInput, setCustomSubcatInput] = useState("");
  const [customStages, setCustomStages] = useState([]);
  const [customStagesInput, setCustomStagesInput] = useState("");

  const allSubcategories = [...subcategoriesData, ...customSubcategories].filter(
    (item, index, self) => self.findIndex(i => i.documentId === item.documentId) === index
  );
  const allStages = [...(stageData || []), ...customStages].filter(
    (item, index, self) => self.findIndex(i => i.documentId === item.documentId) === index
  );
  // console.log("subcategoriesData", subcategoriesData);
  // console.log("stageData", stageData);
  // console.log("allSubcategories", allSubcategories);
  // console.log("allStages", allStages);

  // --- useForm: se inicializa con los valores del step a actualizar ---
  const form = useForm({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      documentId: step?.documentId || "",
      name: step?.name || "",
      subcategories: step?.challenge_subcategories
        ? step.challenge_subcategories.map(({ id, documentId, name }) => ({
          id,
          documentId,
          name,
        }))
        : [],
      stages: step?.challenge_stages
        ? step.challenge_stages.map(({ id, documentId, name }) => ({
          id,
          documentId,
          name,
        }))
        : [],
    },
  });

  // Actualizar valores cuando "step" cambie
  useEffect(() => {
    if (step) {
      const defaultValues = {
        documentId: step.documentId || "",
        name: step.name || "",
        subcategories: step.challenge_subcategories
          ? step.challenge_subcategories.map(({ id, documentId, name }) => ({
            id,
            documentId,
            name,
          }))
          : [],
        stages: step.challenge_stages
          ? step.challenge_stages.map(({ id, documentId, name }) => ({
            id,
            documentId,
            name,
          }))
          : [],
      };
      form.reset(defaultValues);
      setCustomSubcategories(defaultValues.subcategories);
      setCustomStages(defaultValues.stages);
    }
  }, [step, form]);

  // --- Función para actualizar el Step y sus relaciones ---
  const updateStepWithRelations = async (stepPayload) => {
    // console.log("Payload recibido:", stepPayload);
    try {
      const response = await fetch(
        `http://localhost:1337/api/challenge-steps/${stepPayload.documentId}/update-with-relations`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify(stepPayload),
        }
      );
      const data = await response.json();
      // console.log("Step actualizado:", data);
      return data; // Se asume que el endpoint retorna el objeto actualizado
    } catch (error) {
      console.error("Error al actualizar el step:", error);
      throw error;
    }
  };

  // --- Manejo del submit para actualizar ---
  const handleUpdateSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    // console.log("JSON final:", data);
    try {
      const updatedStep = await updateStepWithRelations(data);
      onStepChange(); // Actualizamos el listado de pasos

      // Actualizamos el formulario con los datos retornados
      // form.reset({
      //   documentId: updatedStep.documentId || data.documentId,
      //   name: updatedStep.name,
      //   subcategories: updatedStep.challenge_subcategories || [],
      //   stages: updatedStep.challenge_stages || [],
      // });
      setCustomSubcategories(updatedStep.challenge_subcategories || []);
      setCustomStages(updatedStep.challenge_stages || []);
      toast.success("Step actualizado correctamente.");
    } catch (error) {
      // Manejo de error: podrías mostrar una notificación al usuario
      console.error("Error en la actualización:", error);
      toast.error("Step actualizado correctamente.");

    } finally {
      setIsLoading(false);
    }
  });

  // --- Handlers para agregar items custom ---
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
  const isGlobalLoading = subLoading || stageLoading || isLoading;
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
                <FormLabel className="text-yellow-500 text-lg">
                  Nombre
                </FormLabel>
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
                      Categorías
                    </FormLabel>
                    <Card className="p-4 border border-gray-700 bg-black/50">
                      {subLoading ? (
                        <p className="text-center text-white">Cargando</p>
                      ) : subError ? (
                        <p>Error: {subError.message}</p>
                      ) : (
                        <div className="space-y-4">
                          <Popover
                            open={openSubcat}
                            onOpenChange={setOpenSubcat}
                          >
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
                                  placeholder="Buscar Categorías..."
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
                                          allSubcategories.length &&
                                          "✓"}
                                      </div>
                                      Seleccionar Todas
                                    </CommandItem>
                                    {allSubcategories.map((subcat, index) => {
                                      const keySubcat =
                                        subcat.documentId ||
                                        subcat.id ||
                                        `custom-${index}`;
                                      const isSelected = field.value.some(
                                        (item) =>
                                          (item.documentId || item.id) ===
                                          (subcat.documentId || subcat.id)
                                      );
                                      return (
                                        <CommandItem
                                          key={keySubcat}
                                          value={subcat.documentId}
                                          onSelect={() => {
                                            const current = field.value;
                                            let newValues;
                                            if (isSelected) {
                                              newValues = current.filter(
                                                (v) =>
                                                  (v.documentId || v.id) !==
                                                  (subcat.documentId ||
                                                    subcat.id)
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
                              placeholder="Nueva Categoría"
                              value={customSubcatInput}
                              onChange={(e) =>
                                setCustomSubcatInput(e.target.value)
                              }
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
                              {field.value.map((subcat, index) => (
                                <Card
                                  key={
                                    subcat.documentId ||
                                    subcat.id ||
                                    `custom-${index}`
                                  }
                                  className="p-2 bg-yellow-500/10 border-yellow-500/20 flex justify-between items-center"
                                >
                                  <span className="text-white">
                                    {subcat.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      field.onChange(
                                        field.value.filter(
                                          (v) =>
                                            (v.documentId || v.id) !==
                                            (subcat.documentId || subcat.id)
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
                      )}
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
                      Fases
                    </FormLabel>
                    <Card className="p-4 border border-gray-700 bg-black/50">
                      {stageLoading ? (
                        <p className="text-center text-white">Cargando</p>
                      ) : stageError ? (
                        <p>Error: {stageError.message}</p>
                      ) : (
                        <div className="space-y-4">
                          <Popover
                            open={openStages}
                            onOpenChange={setOpenStages}
                          >
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
                                  placeholder="Buscar Fases..."
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
                                        {field.value.length === allStages.length &&
                                          "✓"}
                                      </div>
                                      Seleccionar Todas
                                    </CommandItem>
                                    {allStages.map((stage, index) => {
                                      // Creamos una clave única basada en documentId, id o una combinación con el índice
                                      const keyStage =
                                        stage.documentId ||
                                        stage.id ||
                                        `custom-${index}`;
                                      // Comprobamos si el elemento está seleccionado comparando la uniqueKey almacenada
                                      const isSelected = field.value.some(
                                        (item) =>
                                          (item.documentId || item.id) ===
                                          (stage.documentId || stage.id)
                                      );
                                      return (
                                        <CommandItem
                                          key={keyStage}
                                          value={keyStage}
                                          onSelect={() => {
                                            const current = field.value;
                                            let newValues;
                                            if (isSelected) {
                                              // Filtramos eliminando el objeto con esa uniqueKey
                                              newValues = current.filter(
                                                (v) =>
                                                  (v.documentId || v.id) !==
                                                  (stage.documentId ||
                                                    stage.id)
                                              );
                                            } else {
                                              // Al seleccionar, guardamos el stage junto con su uniqueKey para identificarlo luego
                                              newValues = [...current, stage];
                                            }
                                            field.onChange(newValues);
                                          }}
                                          className="text-yellow-500 hover:bg-yellow-500/10"
                                        >
                                          <div
                                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 ${isSelected ? "bg-yellow-500 text-black" : "opacity-50"
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
                              placeholder="Nueva Fase"
                              value={customStagesInput}
                              onChange={(e) =>
                                setCustomStagesInput(e.target.value)
                              }
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
                              {field.value.map((stage, index) => (
                                <Card
                                  key={
                                    stage.documentId ||
                                    stage.id ||
                                    `custom-${index}`
                                  }
                                  className="p-2 bg-yellow-500/10 border-yellow-500/20 flex justify-between items-center"
                                >
                                  <span className="text-white">
                                    {stage.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      field.onChange(
                                        field.value.filter(
                                          (v) =>
                                            (v.documentId || v.id) !==
                                            (stage.documentId || stage.id)
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
                      )}
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleUpdateSubmit}
            className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
          >
            Actualizar
          </Button>
        </form>
      </Form>
    </Card>
  );
}
