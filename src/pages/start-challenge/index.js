// src/pages/start-challenge/index.js
import { useStrapiData } from '../../services/strapiService';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronRightIcon, InformationCircleIcon, TicketIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useStrapiData as strapiJWT } from 'src/services/strapiServiceJWT';
import useSWR from 'swr';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import Loader from '../../components/loaders/loader';
import { useSession, signIn } from "next-auth/react";
import Layout from '../../components/layout/dashboard';

// Helper function to create a WooCommerce API instance
const createWooCommerceApi = (url, consumerKey, consumerSecret, version = 'wc/v3') => {
  if (!url) throw new Error('URL no proporcionada para WooCommerce API');
  if (!consumerKey || !consumerSecret) {
    throw new Error('Credenciales de WooCommerce no proporcionadas (consumerKey o consumerSecret)');
  }

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version,
    timeout: 10000,
  });
};

// Fetcher function for WooCommerce API
const wooFetcher = async ([endpoint, config]) => {
  try {
    const url = config.url || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WP_URL;
    const consumerKey = config.consumerKey ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
      process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const consumerSecret = config.consumerSecret ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET ||
      process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

    if (!url) throw new Error('URL de WordPress no configurada');
    if (!consumerKey || !consumerSecret) {
      throw new Error('Credenciales de WooCommerce no configuradas (consumer key/secret)');
    }

    const api = createWooCommerceApi(url, consumerKey, consumerSecret, config.version || 'wc/v3');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    const response = await api.get(cleanEndpoint, config.params || {});
    if (!response || !response.data) {
      throw new Error('Respuesta vacía de WooCommerce');
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Error de WooCommerce API: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Timeout o error de conexión con la API de WooCommerce');
    } else {
      throw new Error(`Error en la solicitud a WooCommerce: ${error.message}`);
    }
  }
};

const ChallengeRelations = () => {
  // console.log('ChallengeRelations');
  const { data: relations, error, isLoading } = useStrapiData('challenge-relations?populate=*');
  // console.log('relations', relations);
  const { data: allproducts, error: allproductserror, isLoading: allproductsisLoading } = useStrapiData('challenge-products');

  const { data: session, status } = useSession();
  // console.log('session', session);
  const { data: user, status: statusUser } = strapiJWT('users/me', session?.jwt || '');
  // console.log('user', user);
  // Estados para manejar las selecciones, cupón y términos
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null); // New state for selected stage
  const [couponCode, setCouponCode] = useState('');

  const stepsData = relations
    ? [...new Set(relations.map(relation => relation.challenge_step.name))].map(stepName => {
      const stepRelations = relations.filter(relation => relation.challenge_step.name === stepName);
      // Obtener todas las etapas de todas las relaciones del step y eliminar duplicados
      const allStages = stepRelations.flatMap(relation => relation.challenge_stages || []);
      const uniqueStages = [...new Set(allStages.map(stage => stage.id))];
      const numberOfStages = uniqueStages.length;
      return {
        step: stepName,
        relations: stepRelations,
        numberOfStages,
      };
    }).sort((a, b) => a.numberOfStages - b.numberOfStages) // Ordenar de menor a mayor
    : [];

  // Seleccionar el primer step, relación y producto por defecto al cargar los datos
  useEffect(() => {
    if (stepsData.length > 0 && selectedStep === null) {
      const firstStep = stepsData[0].step;
      setSelectedStep(firstStep);

      const firstStepRelations = stepsData[0].relations;
      if (firstStepRelations.length > 0) {
        setSelectedRelationId(firstStepRelations[0].id);
        setSelectedRelation(firstStepRelations[0]);

        const firstRelationProducts = firstStepRelations[0].challenge_products;
        if (firstRelationProducts.length > 0) {
          setSelectedProduct(firstRelationProducts[0]);
        }

        // Set first stage by default
        const stages = getRelationStages(firstStepRelations[0]);
        if (stages.length > 0) {
          setSelectedStage(stages[0]);
        }
      }
    }
  }, [stepsData]);

  // WooCommerce variations fetching logic
  // console.log("Selected Product:", selectedProduct);

  // Set the endpoint only if selectedProduct and WoocomerceId are valid (fixed typo)
  const endpoint = selectedProduct && selectedProduct.WoocomerceId
    ? `products/${selectedProduct.WoocomerceId}/variations?per_page=100`
    : null;

  // Check for credentials
  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
    process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const hasCredentials = !!consumerKey;
  const shouldFetch = endpoint && hasCredentials;

  // console.log("consumerKey", consumerKey)
  // console.log("hasCredentials", hasCredentials)
  // console.log("shouldFetch", shouldFetch)

  // Use useSWR unconditionally to fetch variations
  const {
    data: productsvariations,
    error: productsErrorvariations,
    isLoading: productsLoadingvariations,
  } = useSWR(
    shouldFetch ? [endpoint, {}] : null,
    wooFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // console.log("Productos variaciones:", productsvariations);

  // Find the matching variation based on selectedStep and selectedRelation.challenge_subcategory.name
  const matchingVariation = productsvariations?.find(variation =>
    variation.attributes.some(attr => attr.name === "step" && attr.option.toLowerCase() === selectedStep?.toLowerCase()) &&
    variation.attributes.some(attr => attr.name === "subcategory" && attr.option.toLowerCase() === selectedRelation?.challenge_subcategory.name.toLowerCase())
  );

  // console.log("Matching Variation:", matchingVariation);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (error) return (
    <Layout>
      <p className="text-red-500">Error: {error.message}</p>
    </Layout>
  );

  if (allproductserror) return (
    <Layout>
      <p className="text-red-500">Error: {allproductserror.message}</p>
    </Layout>
  );

  // Función para manejar el clic en un step
  const handleStepClick = (step) => {
    setSelectedStep(step);

    const stepRelations = stepsData.find(item => item.step === step).relations;
    if (stepRelations.length > 0) {
      setSelectedRelationId(stepRelations[0].id);
      setSelectedRelation(stepRelations[0]);

      // Check if the current product exists in the new relation
      const currentProductName = selectedProduct?.name;
      const firstRelationProducts = stepRelations[0].challenge_products;

      if (currentProductName && firstRelationProducts.some(product => product.name === currentProductName)) {
        // If the current product exists in the new relation, keep it selected
        const existingProduct = firstRelationProducts.find(product => product.name === currentProductName);
        setSelectedProduct(existingProduct);
      } else if (firstRelationProducts.length > 0) {
        // Otherwise, select the first product
        setSelectedProduct(firstRelationProducts[0]);
      }

      // Reset stage selection
      const stages = getRelationStages(stepRelations[0]);
      if (stages.length > 0) {
        setSelectedStage(stages[0]);
      } else {
        setSelectedStage(null);
      }
    }
  };

  // Función para manejar el clic en una relación (subcategoría)
  const handleRelationClick = (relationId) => {
    setSelectedRelationId(relationId);
    const stepRelations = stepsData.find(item => item.step === selectedStep).relations;
    const relation = stepRelations.find(r => r.id === relationId);
    // console.log('Relación seleccionada:', relation);
    setSelectedRelation(relation);

    // Check if the current product exists in the new relation
    const currentProductName = selectedProduct?.name;

    if (relation && relation.challenge_products.length > 0) {
      if (currentProductName && relation.challenge_products.some(product => product.name === currentProductName)) {
        // If the current product exists in the new relation, keep it selected
        const existingProduct = relation.challenge_products.find(product => product.name === currentProductName);
        setSelectedProduct(existingProduct);
      } else {
        // Otherwise, select the first product
        setSelectedProduct(relation.challenge_products[0]);
      }
    } else {
      setSelectedProduct(null);
    }

    // Reset stage selection for the new relation
    const stages = getRelationStages(relation);
    if (stages.length > 0) {
      setSelectedStage(stages[0]);
    } else {
      setSelectedStage(null);
    }
  };

  // Función para manejar el clic en un producto
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  // Función para manejar el clic en un stage
  const handleStageClick = (stage) => {
    // console.log('Stage seleccionado:', stage);
    setSelectedStage(stage);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProduct) {
      // console.log('Producto seleccionado:', selectedProduct);
      // console.log('Variación seleccionada:', matchingVariation);
      // console.log('Stage seleccionado:', selectedStage);
    }
  };

  // Función para aplicar el cupón
  const applyCoupon = () => {
    if (couponCode) {
      // console.log('Cupón aplicado:', couponCode);
    }
  };

  // Use the matching variation's ID for checkout
  const handleContinue = () => {
    if (!session) {
      // Redireccionar al login con la URL actual como callback
      signIn(undefined, {
        callbackUrl: window.location.href
      });
      return; // Detener la ejecución aquí
    }

    if (selectedProduct) {
      const woocommerceId = matchingVariation?.id || selectedProduct.woocommerceId;
      window.location.href = `https://neocapitalfunding.com/checkout/?add-to-cart=${woocommerceId}&quantity=1&document_id=${selectedRelation.documentId}&user_id=${user.documentId}`;
    }
  };

  // Función modificada para obtener los challenge stages completos, no solo sus nombres
  const getRelationStages = (relation = selectedRelation) => {
    if (!relation || !relations) return [];

    // Verificar si la relación tiene challenge_stages directamente
    if (relation.challenge_stages && Array.isArray(relation.challenge_stages)) {
      return relation.challenge_stages;
    }

    // Si no tiene challenge_stages directamente, intentar buscar los stages relacionados
    // basados en el documentId o algún otro identificador que relacione los stages con esta relación
    const stagesForThisRelation = relations.filter(r =>
      r.challenge_subcategory.id === relation.challenge_subcategory.id &&
      r.documentId === relation.documentId
    );

    // Extraer los objetos stage completos
    return stagesForThisRelation.map(r => r.challenge_stage).filter(Boolean);
  };

  return (
    <Layout>
      {/* Título de la sección */}
      <div className="bg-white p-4 rounded-lg shadow-md dark:bg-zinc-800 dark:border-zinc-700 dark:shadow-black dark:text-white mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Compra tu producto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='w-full mx-auto'>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Columna izquierda - Configuración */}
          <div className="lg:col-span-1 space-y-6">
            {/* Steps Section */}
            <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center mb-3">
                <h3 className="text-[var(--app-primary)] font-medium">Challenge</h3>
                <div className="relative ml-2 group">
                  <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                  <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                    Selecciona el Challenge que deseas Adquirir
                  </div>
                </div>
              </div>
              <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">Selecciona el Challenge que deseas Adquirir.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {stepsData.map((item, index) => (
                  <div key={index} className="relative">
                    <input
                      type="radio"
                      id={`step-${index}`}
                      name="step"
                      checked={selectedStep === item.step}
                      onChange={() => handleStepClick(item.step)}
                      className="sr-only"
                    />
                    <label
                      htmlFor={`step-${index}`}
                      className={classNames(
                        "block p-4 rounded-lg border cursor-pointer transition-all",
                        selectedStep === item.step
                          ? "bg-amber-500 border-amber-600 text-black font-semibold"
                          : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="product-info">
                        <span className="block font-medium">{item.step}</span>
                        {item.relations.length > 1 && (<span className={`block text-xs mt-1 ${selectedStep === item.step ? 'text-black/70' : 'text-zinc-500'}`}>
                          {item.relations.length} opciones
                        </span>)}
                      </div>
                      {selectedStep === item.step && (
                        <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-black" />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Subcategorías Section */}
            {/* {selectedStep && stepsData.length > 0 && (
              <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center mb-3">
                  <h3 className="text-[var(--app-primary)] font-medium">Tipo</h3>
                  <div className="relative ml-2 group">
                    <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                    <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                      Elige el tipo de challenge
                    </div>
                  </div>
                </div>
                <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                  Selecciona el tipo para el challenge {selectedStep}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stepsData
                    .find(item => item.step === selectedStep)
                    .relations.map((relation, index) => (
                      <div key={relation.id} className="relative">
                        <input
                          type="radio"
                          id={`subcategory-${relation.id}`}
                          name="subcategory"
                          checked={selectedRelationId === relation.id}
                          onChange={() => handleRelationClick(relation.id)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={`subcategory-${relation.id}`}
                          className={classNames(
                            "block p-4 rounded-lg border cursor-pointer transition-all",
                            selectedRelationId === relation.id
                              ? "bg-amber-500 border-amber-600 text-black font-semibold"
                              : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          )}
                        >
                          <span className="block font-medium">{relation.challenge_subcategory?.name}</span>
                          {selectedRelationId === relation.id && (
                            <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-black" />
                          )}
                        </label>
                      </div>
                    ))}
                </div>
              </section>
            )} */}

            {selectedRelationId && (
              <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center mb-3">
                  <h3 className="text-[var(--app-primary)] font-medium">Saldo de la Cuenta</h3>
                  <div className="relative ml-2 group">
                    <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                    <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                      Selecciona el Saldo de la cuenta que deseas adquirir
                    </div>
                  </div>
                </div>
                <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                  Elige el Saldo de la cuenta para el challenge {" "}
                  {selectedStep}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const stepRelations = stepsData.find(item => item.step === selectedStep).relations;
                    const selectedRelation = stepRelations.find(r => r.id === selectedRelationId);
                    const relationProductNames = selectedRelation?.challenge_products.map(p => p.name) || [];
                    if (allproducts && allproducts.length > 0) {
                      // Ordenar productos por el campo "precio" de menor a mayor
                      const sortedProducts = [...allproducts].sort((a, b) => a.precio - b.precio);
                      return sortedProducts.map((product, productIndex) => {
                        const isInRelation = relationProductNames.includes(product.name);
                        return (
                          <div key={`allproduct-${productIndex}`} className="relative">
                            <input
                              type="radio"
                              id={`allproduct-${productIndex}`}
                              name="product"
                              checked={selectedProduct && selectedProduct.name === product.name}
                              onChange={() => handleProductClick(product)}
                              className="sr-only"
                              disabled={!isInRelation}
                            />
                            <label
                              htmlFor={`allproduct-${productIndex}`}
                              className={classNames(
                                "block p-4 rounded-lg border cursor-pointer transition-all",
                                selectedProduct && selectedProduct.name === product.name
                                  ? "bg-amber-500 border-amber-600 text-black font-semibold"
                                  : isInRelation
                                    ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    : "bg-gray-100 border-gray-200 text-gray-500 opacity-50 dark:bg-gray-900/20 dark:border-gray-700"
                              )}
                            >
                              <span className="block font-medium">{product.name}</span>
                              {product.balance && (
                                <span className={`block text-xs mt-1 ${selectedProduct && selectedProduct.name === product.name ? 'text-black/70' : 'text-zinc-500'}`}>
                                  {product.balance}
                                </span>
                              )}
                              {product.isPremium && (
                                <span className="inline-block bg-amber-600 text-white text-xs px-2 py-1 rounded mt-2 font-semibold">
                                  Premium
                                </span>
                              )}
                              {selectedProduct && selectedProduct.name === product.name && (
                                <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-black" />
                              )}
                            </label>
                          </div>
                        );
                      });
                    } else {
                      return (
                        <p className="text-zinc-500 col-span-3">
                          No hay productos disponibles
                        </p>
                      );
                    }
                  })()}
                </div>
              </section>
            )}
          </div>

          {/* Columna derecha - Resumen del producto */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
                <header className="p-5 border-b border-gray-200 dark:border-zinc-800">
                  <h3 className="text-[var(--app-primary)] font-medium text-xl flex gap-4 items-center">
                    <span>Saldo de Cuenta Seleccionado:</span>
                    {selectedProduct ? (
                      <>
                        <span className="text-xl font-bold dark:text-white">{selectedProduct.name}</span>
                      </>
                    ) : (
                      <p className="text-zinc-500">Ningún Saldo seleccionado</p>
                    )}
                  </h3>
                </header>

                {/* {selectedRelation && (
                  <div className="bg-gray-50 p-4 border-b border-gray-200 dark:bg-zinc-800 dark:border-zinc-700">
                    <h4 className="text-[var(--app-primary)] font-medium mb-2">Información Adicional</h4>
                    <div className="text-gray-700 dark:text-zinc-300">
                      <p className="flex justify-between mb-2">
                        <span>Subcategoría:</span>
                        <span className="font-medium">{selectedRelation.challenge_subcategory?.name}</span>
                      </p>
                      <div className="mb-2">
                        <p className="mb-2">Etapas:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(() => {
                            const stages = getRelationStages();
                            return stages.length > 0 ? (
                              stages.map((stage, index) => (
                                <div key={index} className="relative">
                                  <input
                                    type="radio"
                                    id={`stage-${index}`}
                                    name="stage"
                                    checked={selectedStage && selectedStage.id === stage.id}
                                    onChange={() => handleStageClick(stage)}
                                    className="sr-only"
                                  />
                                  <label
                                    htmlFor={`stage-${index}`}
                                    className={classNames(
                                      "block text-center py-1 px-2 rounded-md border cursor-pointer transition-all text-sm",
                                      selectedStage && selectedStage.id === stage.id
                                        ? "bg-amber-500 border-amber-600 text-black font-medium"
                                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-600"
                                    )}
                                  >
                                    {stage.name}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <span className="text-zinc-500 col-span-3">No hay etapas disponibles</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {selectedProduct && selectedStage && (
                  <>
                    {selectedRelation && (
                      <div className="p-5">
                        <div className="grid grid-cols-1 gap-6">
                          {/*  <div>
                            <section>
                              <h3 className="text-lg font-medium text-[var(--app-primary)] mb-4">Características:</h3>
                              <ul className="space-y-3">
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Leverage:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.leverage ? (selectedStage.leverage + " %") : "-"}
                                  </strong>
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Maximum Daily Loss:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.maximumDailyLoss ? (selectedStage.maximumDailyLoss + " %") : "-"}
                                  </strong>
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Minimum Trading Days:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.minimumTradingDays ? (selectedStage.minimumTradingDays + " %") : "-"}
                                  </strong>
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Profit Target:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.profitTarget ? (selectedStage.profitTarget + " %") : "-"}
                                  </strong>
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Maximum Total Loss:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.maximumTotalLoss ? (selectedStage.maximumTotalLoss + " %") : "-"}
                                  </strong>
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-zinc-300">
                                  <CheckIcon className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                                  <span>Maximum Loss Per Trade:</span>
                                  <strong className="ml-auto">
                                    {selectedStage.maximumLossPerTrade ? (selectedStage.maximumLossPerTrade + " %") : "-"}
                                  </strong>
                                </li>
                              </ul>
                            </section>
                          </div> */}

                          <div className="space-y-6">
                            {/* <div className="h-px bg-gray-200 dark:bg-zinc-800"></div> */}

                            <section>
                              {/* <h4 className="text-gray-700 dark:text-zinc-300 font-medium mb-4">Subtotal</h4>
                              <div className="flex justify-between mb-2 text-gray-700 dark:text-zinc-300">
                                <span>{selectedProduct.name}</span>
                                <span>${matchingVariation?.price || "N/A"}</span>
                              </div> */}
                              {/* <div className="h-px bg-gray-200 dark:bg-zinc-800 my-4"></div> */}
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700 dark:text-zinc-300">Total</span>
                                <p className="text-2xl font-semibold text-[var(--app-primary)]">${matchingVariation?.price || "N/A"}</p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-500 text-right">*Precio no incluye tarifa de servicio de pago.</p>
                            </section>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Terms section removed */}

                    <div className="p-5">
                      <button
                        onClick={handleContinue}
                        type="submit"
                        disabled={!selectedProduct}
                        className={`w-full flex items-center justify-center transition-colors py-3 px-4 rounded ${selectedProduct
                          ? "bg-[var(--app-primary)] hover:bg-[var(--app-secondary)] text-black font-bold"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500"
                          }`}
                      >
                        <span className="uppercase">Continuar</span>
                        <ChevronRightIcon className="h-5 w-5 ml-2" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default ChallengeRelations;