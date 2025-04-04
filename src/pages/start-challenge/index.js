// src/pages/start-challenge/index.js
import { useStrapiData } from '../../services/strapiService';
import { useState, useEffect, useMemo } from 'react';
import { CheckIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useStrapiData as strapiJWT } from 'src/services/strapiServiceJWT';
import Loader from '../../components/loaders/loader';
import { useSession, signIn } from "next-auth/react";
import Layout from '../../components/layout/dashboard';

// Definimos las constantes de colores
const appPrimary = 'text-blue-500'; // Para texto
const appPrimaryBg = 'bg-blue-500'; // Para fondos
const appSecondaryBg = 'bg-blue-600'; // Para fondos
const appSecondaryBorder = 'border-blue-600'; // Para bordes

const ChallengeRelations = () => {
  // Fetch all necessary data
  const {
    data: relations,
    error: relationsError,
    isLoading: isLoadingRelations
  } = useStrapiData('challenge-relations?populate=*');

  const {
    data: allproducts,
    error: allproductsError,
    isLoading: isLoadingProducts
  } = useStrapiData('challenge-products');

  const {
    data: productConfigs,
    error: productConfigsError,
    isLoading: isLoadingProductConfigs
  } = useStrapiData('product-configs?populate=*');

  const { data: session } = useSession();
  const { data: user } = strapiJWT('users/me', session?.jwt || '');

  // State variables
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  // Memoized steps data with error handling
  const stepsData = useMemo(() => {
    if (!relations || relations.length === 0) return [];

    return [...new Set(relations.map(relation => relation.challenge_step.name))]
      .map(stepName => {
        const stepRelations = relations.filter(relation => relation.challenge_step.name === stepName);
        const allStages = stepRelations.flatMap(relation => relation.challenge_stages || []);
        const uniqueStages = [...new Set(allStages.map(stage => stage.id))];

        return {
          step: stepName,
          relations: stepRelations,
          numberOfStages: uniqueStages.length,
        };
      })
      .sort((a, b) => a.numberOfStages - b.numberOfStages);
  }, [relations]);

  // Find matching product configuration
  const matchingVariation = useMemo(() => {
    if (!selectedProduct || !selectedRelation || !productConfigs) return null;

    return productConfigs.find(
      config =>
        config.challenge_product?.id === selectedProduct.id &&
        config.challenge_relation?.id === selectedRelation.id
    );
  }, [selectedProduct, selectedRelation, productConfigs]);

  // Initial data setup effect
  useEffect(() => {
    // Only set initial data if we have steps and haven't already selected a step
    if (stepsData.length > 0 && selectedStep === null) {
      const firstStep = stepsData[0].step;
      setSelectedStep(firstStep);

      const firstStepRelations = stepsData[0].relations;
      if (firstStepRelations.length > 0) {
        const firstRelation = firstStepRelations[0];
        setSelectedRelationId(firstRelation.id);
        setSelectedRelation(firstRelation);

        const firstRelationProducts = firstRelation.challenge_products;
        if (firstRelationProducts.length > 0) {
          setSelectedProduct(firstRelationProducts[0]);
        }

        // Set first stage by default
        const stages = getRelationStages(firstRelation);
        if (stages.length > 0) {
          setSelectedStage(stages[0]);
        }
      }
    }
  }, [stepsData]);

  // Loading and error states
  if (isLoadingRelations || isLoadingProducts || isLoadingProductConfigs) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  // Error handling
  const errorMessages = [
    relationsError && `Relations Error: ${relationsError.message}`,
    allproductsError && `Products Error: ${allproductsError.message}`,
    productConfigsError && `Product Configs Error: ${productConfigsError.message}`
  ].filter(Boolean);

  if (errorMessages.length > 0) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 rounded-lg">
          <h2 className="text-red-800 font-bold mb-4">Errors Occurred:</h2>
          {errorMessages.map((message, index) => (
            <p key={index} className="text-red-600 mb-2">{message}</p>
          ))}
        </div>
      </Layout>
    );
  }

  // Verify we have minimum required data
  if (!stepsData.length || !allproducts || allproducts.length === 0) {
    return (
      <Layout>
        <div className="p-6 bg-yellow-50 rounded-lg">
          <h2 className="text-yellow-800 font-bold mb-4">No Data Available</h2>
          <p className="text-yellow-600">
            Unable to load challenge data. Please check your configuration or contact support.
          </p>
        </div>
      </Layout>
    );
  }

  // Handle step click
  const handleStepClick = (step) => {
    const stepRelations = stepsData.find(item => item.step === step).relations;
    if (stepRelations.length === 0) return;

    setSelectedStep(step);
    const firstRelation = stepRelations[0];
    setSelectedRelationId(firstRelation.id);
    setSelectedRelation(firstRelation);

    // Find a suitable product
    const firstRelationProducts = firstRelation.challenge_products;
    if (firstRelationProducts.length > 0) {
      const productToSelect =
        // Try to keep current product if it exists in this relation
        (selectedProduct && firstRelationProducts.some(p => p.id === selectedProduct.id))
          ? selectedProduct
          : firstRelationProducts[0];

      setSelectedProduct(productToSelect);
    } else {
      setSelectedProduct(null);
    }

    // Reset stage
    const stages = getRelationStages(firstRelation);
    setSelectedStage(stages.length > 0 ? stages[0] : null);
  };

  // Handle product click
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  // Get relation stages
  const getRelationStages = (relation = selectedRelation) => {
    if (!relation || !relations) return [];

    // Check for direct stages
    if (relation.challenge_stages && Array.isArray(relation.challenge_stages)) {
      return relation.challenge_stages;
    }

    // Find stages through other relations
    const stagesForThisRelation = relations.filter(r =>
      r.challenge_subcategory.id === relation.challenge_subcategory.id &&
      r.documentId === relation.documentId
    );

    return stagesForThisRelation.map(r => r.challenge_stage).filter(Boolean);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProduct) {
    }
  };
  // Continue to checkout
  const handleContinue = () => {
    if (!session) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (selectedProduct && matchingVariation) {
      const woocommerceId = matchingVariation.wooId;
      window.location.href = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || ""}/checkout/?add-to-cart=${woocommerceId}&quantity=1&document_id=${selectedRelation.documentId}&user_id=${user.documentId}`;
    }
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
                <h3 className={appPrimary + " font-medium"}>Challenge</h3>
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
                          ? appPrimaryBg + " " + appSecondaryBorder + " text-black font-semibold"
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
            {selectedRelationId && (
              <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center mb-3">
                  <h3 className={appPrimary + " font-medium"}>Saldo de la Cuenta</h3>
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
                                  ? appPrimaryBg + " " + appSecondaryBorder + " text-black font-semibold"
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
                                <span className={"inline-block " + appSecondaryBg + " text-white text-xs px-2 py-1 rounded mt-2 font-semibold"}>
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
                  <h3 className={appPrimary + " font-medium text-xl flex gap-4 items-center"}>
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
                {selectedProduct && selectedStage && (
                  <>
                    {selectedRelation && (
                      <div className="p-5">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-6">
                            <section>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-700 dark:text-zinc-300">Total</span>
                                <p className={"text-2xl font-semibold " + appPrimary}>${matchingVariation?.precio || "N/A"}</p>
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
                          ? appPrimaryBg + " hover:" + appSecondaryBg + " text-black font-bold"
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