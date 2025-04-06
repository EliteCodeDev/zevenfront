// src/components/forms/parameters/PropDetails.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStrapiData } from "../../../services/strapiService";

// Interfaces
export interface Challenge_products {
  id: string | number;
  name: string;
}

export interface Challenge_subcategory {
  id: string | number;
  name: string;
}

export interface Challenge_step {
  id: string | number;
  name: string;
}

export interface ChallengeStage {
  id: string | number;
  name: string;
}

export interface StageParameter {
  id: string | number;
  challenge_stage: { id: string | number; documentId: string };
  challenge_relation: { id: string | number; documentId: string };
  minimumTradingDays: number | null;
  maximumDailyLoss: number | null;
  maximumTotalLoss: number | null;
  maximumLossPerTrade: number | null;
  profitTarget: number | null;
  leverage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductConfig {
  id?: string | number;
  challenge_product: { id: string | number; documentId: string };
  challenge_relation?: { id: string | number; documentId: string };
  precio: number | null;
  // Compatibilidad con la antigua estructura
  product_id?: string | number;
  price?: number | null;
  relation_id?: string | number;
}

export interface ChallengeRelationsStages {
  challenge_subcategory: Challenge_subcategory;
  challenge_products: Challenge_products[];
  challenge_step: Challenge_step;
  challenge_stages: ChallengeStage[];
  product_configs?: ProductConfig[];
  documentId: string;
}

interface DetailsProps {
  prop: ChallengeRelationsStages;
  modalType: number; // 0 for view, 1 for edit, 2 for create
  onClose?: () => void;
  actualizarDatos?: () => void;
}

export default function PropDetails({
  prop,
  modalType,
  onClose,
  actualizarDatos,
}: DetailsProps) {
  const { data: productsData = [] } = useStrapiData("challenge-products");
  const { data: subcategoriesData = [] } = useStrapiData("challenge-subcategories");
  const { data: stagesdata = [] } = useStrapiData("challenge-stages");
  const { data: stepsdata = [] } = useStrapiData("challenge-steps");
  
  // Nuevas peticiones para obtener parámetros y configuraciones
  const { data: stageParameters = [] } = useStrapiData("stage-parameters?populate=*");
  const { data: productConfigs = [] } = useStrapiData("product-configs?populate=*");
  
  const [selectedStageId, setSelectedStageId] = useState<string | number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | number | null>(null);
  
  // Estado para almacenar los parámetros de los stages y las configuraciones de productos
  const [stageParamsMap, setStageParamsMap] = useState<Record<string, StageParameter>>({});
  const [productConfigMap, setProductConfigMap] = useState<Record<string, ProductConfig>>({});
  
  // Procesar parámetros de stages y configuraciones de productos cuando se carguen
  useEffect(() => {
    if (stageParameters && stageParameters.length > 0 && prop.documentId) {
      const paramsMap: Record<string, StageParameter> = {};
      
      stageParameters.forEach((param: StageParameter) => {
        if (
          param.challenge_relation && 
          param.challenge_relation.documentId === prop.documentId &&
          param.challenge_stage
        ) {
          // Usamos el stage ID como clave
          paramsMap[param.challenge_stage.id.toString()] = param;
        }
      });
      
      setStageParamsMap(paramsMap);
    }
  }, [stageParameters, prop.documentId]);
  
  useEffect(() => {
    if (productConfigs && productConfigs.length > 0 && prop.documentId) {
      const configMap: Record<string, ProductConfig> = {};
      
      productConfigs.forEach((config: ProductConfig) => {
        if (
          config.challenge_relation && 
          config.challenge_relation.documentId === prop.documentId &&
          config.challenge_product
        ) {
          // Usamos el product ID como clave
          configMap[config.challenge_product.id.toString()] = config;
        }
      });
      
      setProductConfigMap(configMap);
    }
  }, [productConfigs, prop.documentId]);

  const [editableProp, setEditableProp] = useState({
    ...prop,
    product_configs:
      prop.product_configs ||
      prop.challenge_products.map((product) => ({
        product_id: product.id,
        challenge_product: { id: product.id, documentId: "" },
        relation_id: prop.documentId,
        challenge_relation: { id: 0, documentId: prop.documentId },
        precio: null,
        price: null,
      })),
  });

  // Stage seleccionado para visualización o edición
  const selectedStage = selectedStageId ? 
    editableProp.challenge_stages.find(stage => stage.id === selectedStageId) : 
    null;
  
  // Parámetros del stage seleccionado
  const selectedStageParams = selectedStageId && stageParamsMap[selectedStageId.toString()];

  // Product seleccionado para configuración
  const selectedProduct = selectedProductId ? 
    editableProp.challenge_products.find(product => product.id === selectedProductId) : 
    null;

  // Configuración del producto seleccionado
  const selectedProductConfigFromMap = selectedProductId && productConfigMap[selectedProductId.toString()];
  
  // Filtrado de ítems disponibles
  const productavailable = productsData?.filter(
    (product) =>
      !editableProp.challenge_products.some((p) => p.id === product.id)
  );
  const stagesavailable = stagesdata?.filter(
    (stage) => !editableProp.challenge_stages.some((p) => p.id === stage.id)
  );
  const stepavailable =
    stepsdata?.filter((step) => step.id !== (editableProp.challenge_step?.id || null)) ||
    [];
  const subcategoriesavailable =
    subcategoriesData?.filter(
      (subcategory) => subcategory.id !== (editableProp.challenge_subcategory?.id || null)
    ) || [];

  // Handlers para agregar/quitar/actualizar
  const addProduct = (product: Challenge_products) => {
    const newProductConfig = {
      product_id: product.id,
      challenge_product: { id: product.id, documentId: "" },
      relation_id: editableProp.documentId,
      challenge_relation: { id: 0, documentId: editableProp.documentId },
      precio: null,
      price: null,
    };

    setEditableProp((prev) => ({
      ...prev,
      challenge_products: [...prev.challenge_products, product],
      product_configs: [...(prev.product_configs || []), newProductConfig],
    }));
  };

  const removeProduct = (productId: string | number) => {
    setEditableProp((prev) => ({
      ...prev,
      challenge_products: prev.challenge_products.filter(
        (p) => p.id !== productId
      ),
      product_configs: (prev.product_configs || []).filter(
        (config) => (config.product_id !== productId && config.challenge_product?.id !== productId)
      ),
    }));

    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  const changeSubcategory = (subcategory: Challenge_subcategory | null) => {
    setEditableProp((prev) => ({
      ...prev,
      challenge_subcategory: subcategory,
    }));
  };

  const addStage = (stage: ChallengeStage) => {
    setEditableProp((prev) => ({
      ...prev,
      challenge_stages: [...prev.challenge_stages, stage],
    }));
  };

  const removeStage = (stageId: string | number) => {
    setEditableProp((prev) => ({
      ...prev,
      challenge_stages: prev.challenge_stages.filter((p) => p.id !== stageId),
    }));

    if (selectedStageId === stageId) {
      setSelectedStageId(null);
    }
  };

  const changeCategory = (category: Challenge_step | null) => {
    setEditableProp((prev) => ({
      ...prev,
      challenge_step: category,
    }));
  };

  const handleStageMetricChange = (
    stageId: string | number,
    field: keyof StageParameter,
    value: string | null
  ) => {
    // Actualizamos los parámetros en stageParamsMap
    setStageParamsMap(prev => {
      const updatedMap = { ...prev };
      const stageIdStr = stageId.toString();
      
      if (updatedMap[stageIdStr]) {
        updatedMap[stageIdStr] = {
          ...updatedMap[stageIdStr],
          [field]: field === "leverage" 
            ? value 
            : value === "" || value === null ? null : parseFloat(value as string),
        };
      } else {
        // Si no existe, creamos un nuevo objeto de parámetros
        updatedMap[stageIdStr] = {
          id: 0, // Temporal, se asignará en el backend
          challenge_stage: { id: stageId, documentId: "" },
          challenge_relation: { id: 0, documentId: prop.documentId },
          minimumTradingDays: null,
          maximumDailyLoss: null,
          maximumTotalLoss: null,
          maximumLossPerTrade: null,
          profitTarget: null,
          leverage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          [field]: field === "leverage" 
            ? value 
            : value === "" || value === null ? null : parseFloat(value as string),
        } as StageParameter;
      }
      return updatedMap;
    });
  };

  const handleProductPriceChange = (
    productId: string | number,
    value: string | null
  ) => {
    // Actualizamos la configuración en productConfigMap
    setProductConfigMap(prev => {
      const updatedMap = { ...prev };
      const productIdStr = productId.toString();
      const numericValue = value === "" || value === null ? null : parseFloat(value as string);
      
      if (updatedMap[productIdStr]) {
        updatedMap[productIdStr] = {
          ...updatedMap[productIdStr],
          precio: numericValue,
          price: numericValue, // Actualizamos ambos campos para compatibilidad
        };
      } else {
        // Si no existe, creamos un nuevo objeto de configuración
        updatedMap[productIdStr] = {
          id: 0, // Temporal, se asignará en el backend
          challenge_product: { id: productId, documentId: "" },
          challenge_relation: { id: 0, documentId: prop.documentId },
          precio: numericValue,
          price: numericValue,
          product_id: productId,
          relation_id: prop.documentId,
        };
      }
      return updatedMap;
    });

    // También actualizamos el estado editable para mantener la compatibilidad
    setEditableProp((prev) => {
      const numericValue = value === "" || value === null ? null : parseFloat(value as string);
      return {
        ...prev,
        product_configs: (prev.product_configs || []).map((config) => {
          if (config.product_id === productId || config.challenge_product?.id === productId) {
            return {
              ...config,
              price: numericValue,
              precio: numericValue,
            };
          }
          return config;
        }),
      };
    });
  };

  // Preparar datos para guardar
  const prepareDataForSave = () => {
    // Convertimos los mapas a arrays para enviar al backend
    const stageParamsArray = Object.values(stageParamsMap);
    const productConfigsArray = Object.values(productConfigMap);
    
    return {
      challenge_subcategory: editableProp.challenge_subcategory,
      challenge_step: editableProp.challenge_step,
      challenge_stages: editableProp.challenge_stages,
      challenge_products: editableProp.challenge_products,
      stage_parameters: stageParamsArray,
      product_configs: productConfigsArray,
    };
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!editableProp.documentId) {
      toast.error("ID de documento no válido");
      return;
    }
    
    const toastId = toast.loading("Guardando...");
    const sendData = prepareDataForSave();
    
    console.log("Datos a enviar:", sendData);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenge-relations/${editableProp.documentId}/update-with-relations`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: sendData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error en la actualización: ${response.statusText}`);
      }

      await response.json();
      toast.success("Se guardó correctamente.", { id: toastId });
      onClose?.();
      actualizarDatos?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Hubo un error al guardar: ${errorMessage}`, { id: toastId });
      console.error("Error al guardar:", error);
    }
  };

  // Formatear porcentajes
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "—";
    }
    return `${value}%`;
  };

  // Clases para inputs
  const inputClasses =
    "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-yellow-100 border border-zinc-300 dark:border-zinc-700 focus:border-[var(--app-secondary)] focus:ring-1 focus:ring-[var(--app-secondary)] p-2 rounded w-full transition-colors";

  // Render principal
  return (
    <div className="bg-gradient-to-b from-white via-zinc-50 to-white dark:from-black dark:via-zinc-900 dark:to-black h-max p-6 text-zinc-800 dark:text-yellow-100">
      {modalType !== 2 ? (
        <div className="space-y-6">
          <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
            <CardContent className="space-y-6 w-full p-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-[2] min-w-[280px]">
                  <h3 className="text-sm text-zinc-600 dark:text-muted-foreground mb-3">
                    <Badge className="bg-[var(--app-secondary)] text-black">
                      Categoría
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {prop.challenge_step?.name && (
                      <Card className="border border-zinc-200 dark:border-transparent">
                        <CardContent className="p-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800">
                          <span className="text-xs">
                            {prop.challenge_step.name}
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <h3 className="text-sm text-zinc-600 dark:text-muted-foreground mb-3">
                    <Badge className="bg-[var(--app-secondary)] text-black">
                      Subcategoría
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {prop.challenge_subcategory?.name && (
                      <Card className="border border-zinc-200 dark:border-transparent">
                        <CardContent className="p-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800">
                          <span className="text-xs">
                            {prop.challenge_subcategory.name}
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {selectedStage && selectedStageId && stageParamsMap[selectedStageId.toString()] && (
                    <CardHeader className="px-0">
                      <CardTitle className="text-[var(--app-secondary)] dark:text-amber-400">
                        Parámetros para {selectedStage.name}
                      </CardTitle>
                      <div className="space-y-1 mt-2 text-sm">
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Días mínimos de trading:{" "}
                          {stageParamsMap[selectedStageId.toString()].minimumTradingDays ?? "N/A"}
                        </CardDescription>
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Pérdida diaria máxima:{" "}
                          {formatPercentage(stageParamsMap[selectedStageId.toString()].maximumDailyLoss)}
                        </CardDescription>
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Pérdida máxima total:{" "}
                          {formatPercentage(stageParamsMap[selectedStageId.toString()].maximumTotalLoss)}
                        </CardDescription>
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Pérdida máxima por operación:{" "}
                          {formatPercentage(stageParamsMap[selectedStageId.toString()].maximumLossPerTrade)}
                        </CardDescription>
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Objetivo de ganancia:{" "}
                          {formatPercentage(stageParamsMap[selectedStageId.toString()].profitTarget)}
                        </CardDescription>
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Apalancamiento: {stageParamsMap[selectedStageId.toString()].leverage ?? "N/A"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  )}

                  {selectedProduct && selectedProductId && productConfigMap[selectedProductId.toString()] && (
                    <CardHeader className="px-0 mt-4">
                      <CardTitle className="text-[var(--app-secondary)] dark:text-amber-400">
                        Configuración para {selectedProduct.name}
                      </CardTitle>
                      <div className="space-y-1 mt-2 text-sm">
                        <CardDescription className="text-zinc-700 dark:text-zinc-300">
                          Precio:{" "}
                          {productConfigMap[selectedProductId.toString()].precio ?? "No configurado"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  )}
                </div>

                <div className="flex-1 min-w-[200px]">
                  <h3 className="text-sm text-zinc-600 dark:text-muted-foreground mb-3">
                    <Badge className="bg-[var(--app-secondary)] text-black">
                      Fases
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {prop.challenge_stages.map((stage) => (
                      <Card
                        key={stage.id}
                        className="border border-zinc-200 dark:border-transparent"
                      >
                        <CardContent className="p-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800">
                          <Button
                            variant="link"
                            className="text-xs text-zinc-800 dark:text-yellow-100 p-0"
                            onClick={() => setSelectedStageId(stage.id)}
                          >
                            {stage.name}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <h3 className="text-sm text-zinc-600 dark:text-muted-foreground mb-3">
                    <Badge className="bg-[var(--app-secondary)] text-black">
                      Productos
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {prop.challenge_products.map((product) => (
                      <Card
                        key={product.id}
                        className="border border-zinc-200 dark:border-transparent"
                      >
                        <CardContent className="p-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800">
                          <Button
                            variant="link"
                            className="text-xs text-zinc-800 dark:text-yellow-100 p-0"
                            onClick={() => setSelectedProductId(product.id)}
                          >
                            {product.name}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
            <CardContent className="space-y-6 w-full p-6">
              <div className="mb-4">
                <h3 className="text-sm mb-2">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Categoría
                  </Badge>
                </h3>
                {editableProp.challenge_step?.name && (
                  <Card className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent">
                    <CardContent className="p-2 flex items-center justify-between">
                      <span className="text-xs">
                        {editableProp.challenge_step.name}
                      </span>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => changeCategory(null)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        -
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-sm mb-2">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Subcategoría
                  </Badge>
                </h3>
                {editableProp.challenge_subcategory?.name && (
                  <Card className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent">
                    <CardContent className="p-2 flex items-center justify-between">
                      <span className="text-xs">
                        {editableProp.challenge_subcategory.name}
                      </span>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => changeSubcategory(null)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        -
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-sm mb-2">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Fases
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {editableProp.challenge_stages.map((stage) => (
                    <Card
                      key={stage.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{stage.name}</span>
                        <div>
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => setSelectedStageId(stage.id)}
                            className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black mr-2"
                          >
                            Editar Métricas
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => removeStage(stage.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            -
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm mb-2">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Productos
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {editableProp.challenge_products.map((product) => (
                    <Card
                      key={product.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{product.name}</span>
                        <div>
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => setSelectedProductId(product.id)}
                            className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black mr-2"
                          >
                            Configurar Precio
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => removeProduct(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            -
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedStage && selectedStageId && (
                <CardHeader className="px-0">
                  <CardTitle className="text-[var(--app-secondary)] dark:text-amber-400">
                    Editar Parámetros para {selectedStage.name}
                  </CardTitle>
                  <div className="space-y-2 mt-2 text-sm">
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Días mínimos de trading:
                      <input
                        type="number"
                        name="minimumTradingDays"
                        value={stageParamsMap[selectedStageId.toString()]?.minimumTradingDays ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "minimumTradingDays",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Pérdida diaria máxima:
                      <input
                        type="number"
                        name="maximumDailyLoss"
                        value={stageParamsMap[selectedStageId.toString()]?.maximumDailyLoss ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "maximumDailyLoss",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Pérdida máxima total:
                      <input
                        type="number"
                        name="maximumTotalLoss"
                        value={stageParamsMap[selectedStageId.toString()]?.maximumTotalLoss ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "maximumTotalLoss",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Pérdida máxima por operación:
                      <input
                        type="number"
                        name="maximumLossPerTrade"
                        value={stageParamsMap[selectedStageId.toString()]?.maximumLossPerTrade ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "maximumLossPerTrade",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Objetivo de ganancia:
                      <input
                        type="number"
                        name="profitTarget"
                        value={stageParamsMap[selectedStageId.toString()]?.profitTarget ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "profitTarget",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Apalancamiento:
                      <input
                        type="text"
                        name="leverage"
                        value={stageParamsMap[selectedStageId.toString()]?.leverage ?? ""}
                        onChange={(e) =>
                          handleStageMetricChange(
                            selectedStageId,
                            "leverage",
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                        placeholder="Ej: 1:100"
                      />
                    </CardDescription>
                  </div>
                </CardHeader>
              )}

              {selectedProduct && selectedProductId && (
                <CardHeader className="px-0">
                  <CardTitle className="text-[var(--app-secondary)] dark:text-amber-400">
                    Configurar Precio para {selectedProduct.name}
                  </CardTitle>
                  <div className="space-y-2 mt-2 text-sm">
                    <CardDescription className="text-zinc-700 dark:text-zinc-300">
                      Precio:
                      <input
                        type="number"
                        name="price"
                        value={productConfigMap[selectedProductId.toString()]?.precio ?? ""}
                        onChange={(e) =>
                          handleProductPriceChange(
                            selectedProductId,
                            e.target.value
                          )
                        }
                        className={inputClasses + " mt-1"}
                      />
                    </CardDescription>
                  </div>
                </CardHeader>
              )}

              <Button
                onClick={handleSave}
                className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black rounded-lg shadow-sm"
              >
                Guardar
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Productos disponibles
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {productavailable?.map((product) => (
                    <Card
                      key={product.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{product.name}</span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => addProduct(product)}
                          className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black"
                        >
                          +
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Fases disponibles
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {stagesavailable?.map((stage) => (
                    <Card
                      key={stage.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{stage.name}</span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => addStage(stage)}
                          className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black"
                        >
                          +
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Subcategorías disponibles
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {subcategoriesavailable?.map((subcategory) => (
                    <Card
                      key={subcategory.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{subcategory.name}</span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => changeSubcategory(subcategory)}
                          className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black"
                        >
                          +
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900 shadow-md rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-yellow-100">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm">
                  <Badge className="bg-[var(--app-secondary)] text-black">
                    Categorías disponibles
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {stepavailable?.map((step) => (
                    <Card
                      key={step.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-transparent"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <span className="text-xs">{step.name}</span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => changeCategory(step)}
                          className="bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-black"
                        >
                          +
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}