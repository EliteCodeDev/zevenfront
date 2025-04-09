// src/pages/start-challenge/index.js
import { useStrapiData } from '../../services/strapiService';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/20/solid';
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
  // Consultas a Strapi
  const { data: relations, error, isLoading } = useStrapiData('challenge-relations?populate=*');
  const { data: allproducts, error: allproductserror, isLoading: allproductsisLoading } = useStrapiData('challenge-products');

  const { data: session, status } = useSession();
  const { data: user, status: statusUser } = strapiJWT('users/me', session?.jwt || '');

  // Estados
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [couponCode, setCouponCode] = useState('');

  // Generar steps a partir de las relaciones
  const stepsData = relations
    ? [...new Set(relations.map(relation => relation.challenge_step.name))].map(stepName => {
        const stepRelations = relations.filter(relation => relation.challenge_step.name === stepName);
        const allStages = stepRelations.flatMap(relation => relation.challenge_stages || []);
        const uniqueStages = [...new Set(allStages.map(stage => stage.id))];
        const numberOfStages = uniqueStages.length;
        return {
          step: stepName,
          relations: stepRelations,
          numberOfStages,
        };
      }).sort((a, b) => a.numberOfStages - b.numberOfStages)
    : [];

  // Seleccionar valores por defecto al cargar los datos
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
        const stages = getRelationStages(firstStepRelations[0]);
        if (stages.length > 0) {
          setSelectedStage(stages[0]);
        }
      }
    }
  }, [stepsData]);

  const endpoint = selectedProduct && selectedProduct.WoocomerceId
    ? `products/${selectedProduct.WoocomerceId}/variations?per_page=100`
    : null;

  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
    process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const hasCredentials = !!consumerKey;
  const shouldFetch = endpoint && hasCredentials;

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

  // Encontrar la variación que coincide con el step y subcategoría
  const matchingVariation = productsvariations?.find(variation =>
    variation.attributes.some(attr => attr.name === "step" && attr.option.toLowerCase() === selectedStep?.toLowerCase()) &&
    variation.attributes.some(attr => attr.name === "subcategory" && attr.option.toLowerCase() === selectedRelation?.challenge_subcategory.name.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-500">Error: {error.message}</p>
      </Layout>
    );
  }

  if (allproductserror) {
    return (
      <Layout>
        <p className="text-red-500">Error: {allproductserror.message}</p>
      </Layout>
    );
  }

  // Manejo de clicks en steps, relaciones, productos y stages
  const handleStepClick = (step) => {
    setSelectedStep(step);
    const stepRelations = stepsData.find(item => item.step === step).relations;
    if (stepRelations.length > 0) {
      setSelectedRelationId(stepRelations[0].id);
      setSelectedRelation(stepRelations[0]);
      const currentProductName = selectedProduct?.name;
      const firstRelationProducts = stepRelations[0].challenge_products;
      if (currentProductName && firstRelationProducts.some(product => product.name === currentProductName)) {
        const existingProduct = firstRelationProducts.find(product => product.name === currentProductName);
        setSelectedProduct(existingProduct);
      } else if (firstRelationProducts.length > 0) {
        setSelectedProduct(firstRelationProducts[0]);
      }
      const stages = getRelationStages(stepRelations[0]);
      if (stages.length > 0) {
        setSelectedStage(stages[0]);
      } else {
        setSelectedStage(null);
      }
    }
  };

  const handleRelationClick = (relationId) => {
    setSelectedRelationId(relationId);
    const stepRelations = stepsData.find(item => item.step === selectedStep).relations;
    const relation = stepRelations.find(r => r.id === relationId);
    setSelectedRelation(relation);
    const currentProductName = selectedProduct?.name;
    if (relation && relation.challenge_products.length > 0) {
      if (currentProductName && relation.challenge_products.some(product => product.name === currentProductName)) {
        const existingProduct = relation.challenge_products.find(product => product.name === currentProductName);
        setSelectedProduct(existingProduct);
      } else {
        setSelectedProduct(relation.challenge_products[0]);
      }
    } else {
      setSelectedProduct(null);
    }
    const stages = getRelationStages(relation);
    if (stages.length > 0) {
      setSelectedStage(stages[0]);
    } else {
      setSelectedStage(null);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes manejar el envío si es necesario
  };

  const applyCoupon = () => {
    if (couponCode) {
      // Lógica para aplicar cupón si aplica
    }
  };

  const handleContinue = () => {
    if (!session) {
      signIn(undefined, {
        callbackUrl: window.location.href
      });
      return;
    }
    if (selectedProduct) {
      const woocommerceId = matchingVariation?.id || selectedProduct.woocommerceId;
      window.location.href = `https://neocapitalfunding.com/checkout/?add-to-cart=${woocommerceId}&quantity=1&document_id=${selectedRelation.documentId}&user_id=${user.documentId}`;
    }
  };

  // Función para obtener los stages de la relación
  const getRelationStages = (relation = selectedRelation) => {
    if (!relation || !relations) return [];
    if (relation.challenge_stages && Array.isArray(relation.challenge_stages)) {
      return relation.challenge_stages;
    }
    const stagesForThisRelation = relations.filter(r =>
      r.challenge_subcategory.id === relation.challenge_subcategory.id &&
      r.documentId === relation.documentId
    );
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

      <form onSubmit={handleSubmit} className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Columna de Configuración */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sección de Steps */}
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
              <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                Selecciona el Challenge que deseas Adquirir.
              </p>
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
                          ? "bg-blue-500 border-blue-600 text-white font-semibold"
                          : "bg-white border-zinc-300 text-white hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="product-info">
                        <span className="block font-medium">{item.step}</span>
                        {item.relations.length > 1 && (
                          <span className={`block text-xs mt-1 text-white`}>
                            {item.relations.length} opciones
                          </span>
                        )}
                      </div>
                      {selectedStep === item.step && (
                        <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-white" />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Sección de "Saldo de la Cuenta" */}
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
                  Elige el Saldo de la cuenta para el challenge {selectedStep}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const stepRelations = stepsData.find(item => item.step === selectedStep).relations;
                    const selectedRelation = stepRelations.find(r => r.id === selectedRelationId);
                    const relationProductNames = selectedRelation?.challenge_products.map(p => p.name) || [];
                    if (allproducts && allproducts.length > 0) {
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
                                "block p-4 rounded-lg border cursor-pointer transition-all relative",
                                selectedProduct && selectedProduct.name === product.name
                                  ? "bg-blue-500 border-blue-600 text-white font-semibold"
                                  : isInRelation
                                    ? "bg-white border-zinc-300 text-white hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                                    : "bg-gray-100 border-gray-200 text-white opacity-50 dark:bg-gray-900/20 dark:border-gray-700"
                              )}
                            >
                              {/* Insignia de descuento */}
                              {product.hasDiscount && (
                                <div className="absolute -top-2 -left-2 bg-blue-500 text-white w-8 h-8 rounded-tl-md rounded-br-xl flex items-center justify-center shadow-md">
                                  <span className="text-lg font-bold">%</span>
                                </div>
                              )}
                              
                              <span className="block font-medium text-white">{product.name}</span>
                              {product.balance && (
                                <span className="block text-xs mt-1 text-white">
                                  {product.balance}
                                </span>
                              )}
                              {product.isPremium && (
                                <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mt-2 font-semibold">
                                  Premium
                                </span>
                              )}
                              {selectedProduct && selectedProduct.name === product.name && (
                                <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-white" />
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

          {/* Sección de Oferta Especial - VERSIÓN MEJORADA */}
          {selectedProduct && selectedProduct.hasDiscount && selectedProduct.descuento && (
            <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center mb-3">
                <h3 className="text-[var(--app-primary)] font-medium">Oferta Especial</h3>
                <div className="relative ml-2 group">
                  <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                  <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                    Promoción por tiempo limitado
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800/40">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm7 8a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L13 13.414l-2.293 2.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0112 10z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-blue-800 text-sm dark:text-blue-300">
                    {selectedProduct.descuento}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Columna de Resumen del Producto */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
                <header className="p-5 border-b border-gray-200 dark:border-zinc-800">
                  <h3 className="text-[var(--app-primary)] font-medium text-xl flex gap-4 items-center">
                    <span>Saldo de Cuenta Seleccionado:</span>
                    {selectedProduct ? (
                      <span className="text-xl font-bold dark:text-white">{selectedProduct.name}</span>
                    ) : (
                      <p className="text-zinc-500">Ningún Saldo seleccionado</p>
                    )}
                  </h3>
                </header>

                {selectedProduct && selectedStage && (
                  <>
                    {selectedRelation && (
                      <div className="p-5">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-6">
                            <section>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700 dark:text-zinc-300">Total</span>
                                <p className="text-2xl font-semibold text-[var(--app-primary)]">
                                  ${matchingVariation?.price || "N/A"}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-500 text-right">
                                *Precio no incluye tarifa de servicio de pago.
                              </p>
                            </section>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <button
                        onClick={handleContinue}
                        type="submit"
                        disabled={productsLoadingvariations}
                        className={`w-full flex items-center justify-center transition-colors py-3 px-4 rounded ${
                          !productsLoadingvariations
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