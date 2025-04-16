// src/pages/start-challenge/index.js
import { useState, useEffect, useMemo } from 'react';
import { CheckIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useSession, signIn, getSession } from "next-auth/react";
// import Loader from '../../components/loaders/loader';
import Layout from '../../components/layout/dashboard';
import strapiService from '../../services/server/strapiService';

// Definimos las constantes de colores
const appPrimary = 'text-blue-500';
const appPrimaryBg = 'bg-blue-500';
const appSecondaryBg = 'bg-blue-600';
const appSecondaryBorder = 'border-blue-600';

// Obtener datos desde el servidor - ¡No se exponen en el cliente!
export async function getServerSideProps(context) {
  try {
    // Obtener la sesión del usuario desde el servidor
    const session = await getSession(context);

    // Hacer peticiones solo con los campos necesarios
    const relations = await strapiService.get('challenge-relations', {
      fields: ['id', 'documentId'],
      populate: {
        challenge_step: { fields: ['id', 'name'] },
        challenge_subcategory: { fields: ['id', 'name'] },
        challenge_products: {
          fields: ['id', 'name', 'hasDiscount']
        },
        challenge_stages: { fields: ['id', 'name'] }
      }
    });

    const products = await strapiService.get('challenge-products', {
      fields: ['id', 'name', 'precio', 'hasDiscount']
    });

    const configs = await strapiService.get('product-configs', {
      fields: ['id', 'wooId', 'precio'],
      populate: {
        challenge_product: { fields: ['id'] },
        challenge_relation: { fields: ['id'] }
      }
    });

    // Si hay sesión, obtener datos del usuario
    let userData = null;
    if (session) {
      console.log("sesion del usuario", session)
      try {
        userData = await strapiService.authenticatedRequest('users/me', {
          method: 'GET'
        }, session.jwt);
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    }
    console.log("userData", userData)
    console.log("relations", relations)
    console.log("products", products)

    // Devolver datos procesados al cliente
    return {
      props: {
        initialRelations: relations.data,
        initialProducts: products.data,
        initialConfigs: configs.data,
        initialUser: userData || null,
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);

    // Devolver props vacíos en caso de error
    return {
      props: {
        initialRelations: [],
        initialProducts: [],
        initialConfigs: [],
        initialUser: null,
        error: true
      }
    };
  }
}

// Componente cliente que recibe datos ya procesados
const ChallengeRelations = ({
  initialRelations,
  initialProducts,
  initialConfigs,
  initialUser,
  error
}) => {
  const { data: session } = useSession();
  const [relations] = useState(initialRelations || []);
  const [allproducts] = useState(initialProducts || []);
  const [productConfigs] = useState(initialConfigs || []);
  const [user] = useState(initialUser);
  // State variables - igual que antes
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  // Memoized steps data with error handling
  const stepsData = useMemo(() => {
    if (!relations || relations === null) return [];

    // Acceder de forma segura a la estructura de datos
    return [...new Set(relations.map(relation => {
      // Acceder a challenge_step de manera segura
      const step = relation.challenge_step?.name ||
        relation.attributes?.challenge_step?.data?.attributes?.name;
      return step;
    }))]
      .filter(Boolean) // Eliminar valores undefined
      .map(stepName => {
        // Filtrar relaciones por nombre de paso
        const stepRelations = relations.filter(relation => {
          const step = relation.challenge_step?.name ||
            relation.attributes?.challenge_step?.data?.attributes?.name;
          return step === stepName;
        });

        // Extraer etapas de forma segura
        const allStages = stepRelations.flatMap(relation => {
          // Manejar ambas estructuras posibles
          const stages = relation.challenge_stages ||
            (relation.attributes?.challenge_stages?.data || [])
              .map(stage => ({
                id: stage.id,
                name: stage.attributes?.name
              }));
          return stages || [];
        });

        const uniqueStages = [...new Set(allStages.map(stage => stage?.id))].filter(Boolean);

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

    // Buscar configuración de producto que coincida
    return productConfigs.find(config => {
      // Acceder de forma segura a IDs
      const configProductId = config.challenge_product?.id ||
        config.attributes?.challenge_product?.data?.id;
      const configRelationId = config.challenge_relation?.id ||
        config.attributes?.challenge_relation?.data?.id;

      const selectedProductId = selectedProduct.id;
      const selectedRelationId = selectedRelation.id;

      return configProductId === selectedProductId &&
        configRelationId === selectedRelationId;
    });
  }, [selectedProduct, selectedRelation, productConfigs]);

  // Initial data setup effect
  useEffect(() => {
    // Solo configurar datos iniciales si tenemos steps y no hemos seleccionado ningún paso
    if (stepsData.length > 0 && selectedStep === null) {
      try {
        const firstStep = stepsData[0].step;
        setSelectedStep(firstStep);

        const firstStepRelations = stepsData[0].relations || [];
        if (firstStepRelations.length > 0) {
          const firstRelation = firstStepRelations[0];
          if (firstRelation) {
            setSelectedRelationId(firstRelation.id);
            setSelectedRelation(firstRelation);

            // Acceder a productos de forma segura
            const firstRelationProducts =
              firstRelation.challenge_products ||
              firstRelation.attributes?.challenge_products?.data?.map(p => ({
                id: p.id,
                ...p.attributes
              })) || [];

            if (firstRelationProducts.length > 0) {
              setSelectedProduct(firstRelationProducts[0]);
            }

            // Establecer la primera etapa por defecto
            const stages = getRelationStages(firstRelation);
            if (stages.length > 0) {
              setSelectedStage(stages[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error al configurar datos iniciales:", error);
      }
    }
  }, [stepsData]);


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
    const stepData = stepsData.find(item => item.step === step);
    if (!stepData || !stepData.relations || stepData.relations.length === 0) return;

    const stepRelations = stepData.relations;

    setSelectedStep(step);
    const firstRelation = stepRelations[0];

    if (!firstRelation) return;

    setSelectedRelationId(firstRelation.id);
    setSelectedRelation(firstRelation);

    // Find a suitable product - acceder de forma segura
    const firstRelationProducts =
      firstRelation.challenge_products ||
      firstRelation.attributes?.challenge_products?.data?.map(p => ({
        id: p.id,
        ...p.attributes
      })) || [];

    if (firstRelationProducts.length > 0) {
      const productToSelect =
        (selectedProduct && firstRelationProducts.some(p => p?.id === selectedProduct?.id))
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

  // Get relation stages - acceder de forma segura
  const getRelationStages = (relation) => {
    if (!relation || !relations) return [];

    // Check for direct stages - acceder de forma segura
    const directStages = relation.challenge_stages ||
      relation.attributes?.challenge_stages?.data?.map(stage => ({
        id: stage.id,
        name: stage.attributes?.name
      }));

    if (directStages && Array.isArray(directStages) && directStages.length > 0) {
      return directStages;
    }

    // Verificación de seguridad antes de acceder a propiedades
    const relationSubcategory = relation.challenge_subcategory ||
      relation.attributes?.challenge_subcategory?.data;

    const relationDocumentId = relation.documentId ||
      relation.attributes?.documentId;

    if (!relationSubcategory || !relationDocumentId) return [];

    // Find stages through other relations
    const stagesForThisRelation = relations.filter(r => {
      const rSubcategory = r.challenge_subcategory ||
        r.attributes?.challenge_subcategory?.data;

      const rDocumentId = r.documentId ||
        r.attributes?.documentId;

      return rSubcategory &&
        relationSubcategory &&
        (rSubcategory.id === relationSubcategory.id ||
          (rSubcategory.id === undefined && rSubcategory === relationSubcategory)) &&
        rDocumentId === relationDocumentId;
    });

    return stagesForThisRelation
      .map(r => {
        const stage = r.challenge_stage ||
          r.attributes?.challenge_stage?.data;
        return stage;
      })
      .filter(Boolean);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implementación si es necesaria
  };

  // Continue to checkout - Versión segura
  const handleContinue = () => {
    if (!session) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (selectedProduct && matchingVariation) {
      // Obtener el ID de WooCommerce de forma segura
      const woocommerceId = matchingVariation.wooId ||
        matchingVariation.attributes?.wooId;

      // Obtener documentId de forma segura
      const documentId = selectedRelation.documentId ||
        selectedRelation.attributes?.documentId;

      // Obtener userId de forma segura
      const userId = user?.documentId;

      // Usar nuestra ruta segura en lugar de acceder directamente a WooCommerce
      window.location.href = `/api/checkout?product_id=${woocommerceId}&quantity=1&document_id=${documentId}&user_id=${userId}`;
    }
  };

  // Error handling
  if (error) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 rounded-lg">
          <h2 className="text-red-800 font-bold mb-4">Error Loading Data</h2>
          <p className="text-red-600 mb-2">Unable to load challenge data. Please try again later.</p>
        </div>
      </Layout>
    );
  }

  // JSX igual que antes pero usando los datos proporcionados desde el servidor...

  return (
    <Layout>
      {/* Título de la sección */}
      <div className="bg-white p-4 rounded-lg shadow-md dark:bg-zinc-800 dark:border-zinc-700 dark:shadow-black dark:text-white mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Get your Challenge</h1>
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
                    Select the Challenge you want to purchase
                  </div>
                </div>
              </div>
              <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                Select the Challenge you want to purchase.
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
                          ? appPrimaryBg + " " + appSecondaryBorder + " text-white font-semibold"
                          : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="product-info">
                        <span className="block font-medium">{item.step}</span>
                        {item.relations.length > 1 && (
                          <span className={`block text-xs mt-1 ${selectedStep === item.step ? 'text-white/70' : 'text-zinc-500'}`}>
                            {item.relations.length} options
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
            {selectedRelationId && (
              <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center mb-3">
                  <h3 className={appPrimary + " font-medium"}>Account Balance</h3>
                  <div className="relative ml-2 group">
                    <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                    <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                      Select the account balance you want to purchase
                    </div>
                  </div>
                </div>
                <p className="text-zinc-600 mb-4 text-sm dark:text-zinc-400">
                  Choose the account balance for the challenge {selectedStep}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const stepRelations = stepsData.find(item => item.step === selectedStep)?.relations || [];
                    const selectedRelation = stepRelations.find(r => r.id === selectedRelationId);

                    // Acceder a los nombres de productos de forma segura
                    const relationProductNames = (selectedRelation?.challenge_products ||
                      selectedRelation?.attributes?.challenge_products?.data || [])
                      .map(p => p.name || p.attributes?.name)
                      .filter(Boolean);

                    if (allproducts && allproducts.length > 0) {
                      // Ordenar productos por el campo "precio" de menor a mayor
                      const sortedProducts = [...allproducts].sort((a, b) => {
                        const precioA = a.precio || a.attributes?.precio || 0;
                        const precioB = b.precio || b.attributes?.precio || 0;
                        return precioA - precioB;
                      });

                      return sortedProducts.map((product, productIndex) => {
                        // Acceder al nombre de forma segura
                        const productName = product.name || product.attributes?.name;
                        const isInRelation = relationProductNames.includes(productName);

                        return (
                          <div key={`allproduct-${productIndex}`} className="relative">
                            <input
                              type="radio"
                              id={`allproduct-${productIndex}`}
                              name="product"
                              checked={selectedProduct && (selectedProduct.name === productName || selectedProduct.attributes?.name === productName)}
                              onChange={() => handleProductClick(product)}
                              className="sr-only"
                              disabled={!isInRelation}
                            />
                            <label
                              htmlFor={`allproduct-${productIndex}`}
                              className={classNames(
                                "block p-4 rounded-lg border cursor-pointer transition-all relative",
                                selectedProduct && (selectedProduct.name === productName || selectedProduct.attributes?.name === productName)
                                  ? appPrimaryBg + " " + appSecondaryBorder + " text-white font-semibold"
                                  : isInRelation
                                    ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    : "bg-gray-100 border-gray-200 text-gray-500 opacity-50 dark:bg-gray-900/20 dark:border-gray-700"
                              )}
                            >
                              {/* Insignia de descuento */}
                              {(product.hasDiscount || product.attributes?.hasDiscount) && (
                                <div className="absolute -top-2 -left-2 bg-blue-500 text-white w-8 h-8 rounded-tl-md rounded-br-xl flex items-center justify-center shadow-md">
                                  <span className="text-lg font-bold">%</span>
                                </div>
                              )}

                              <span className="block font-medium">{productName}</span>
                              {(product.balance || product.attributes?.balance) && (
                                <span className={`block text-xs mt-1 ${selectedProduct && (selectedProduct.name === productName || selectedProduct.attributes?.name === productName) ? 'text-white/70' : 'text-zinc-500'}`}>
                                  {product.balance || product.attributes?.balance}
                                </span>
                              )}
                              {(product.isPremium || product.attributes?.isPremium) && (
                                <span className={"inline-block " + appSecondaryBg + " text-white text-xs px-2 py-1 rounded mt-2 font-semibold"}>
                                  Premium
                                </span>
                              )}
                              {selectedProduct && (selectedProduct.name === productName || selectedProduct.attributes?.name === productName) && (
                                <CheckIcon className="absolute top-4 right-4 h-5 w-5 text-white" />
                              )}
                            </label>
                          </div>
                        );
                      });
                    } else {
                      return (
                        <p className="text-zinc-500 col-span-3">
                          No products available
                        </p>
                      );
                    }
                  })()}
                </div>
              </section>
            )}

            {/* Sección de Oferta Especial */}
            {selectedProduct && (selectedProduct.hasDiscount || selectedProduct.attributes?.hasDiscount) &&
              (selectedProduct.descuento || selectedProduct.attributes?.descuento) && (
                <section className="bg-white rounded-lg p-5 shadow-md border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                  <div className="flex items-center mb-3">
                    <h3 className={appPrimary + " font-medium"}>Special Offer</h3>
                    <div className="relative ml-2 group">
                      <InformationCircleIcon className="h-5 w-5 text-zinc-500 hover:text-zinc-300" />
                      <div className="absolute z-10 invisible group-hover:visible bg-zinc-800 text-xs text-zinc-200 p-2 rounded-md w-48 top-full left-0 mt-1">
                        Limited time promotion
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
                        {selectedProduct.descuento || selectedProduct.attributes?.descuento}
                      </p>
                    </div>
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
                    <span>Selected Account Balance:</span>
                    {selectedProduct ? (
                      <>
                        <span className="text-xl font-bold dark:text-white">
                          {selectedProduct.name || selectedProduct.attributes?.name}
                        </span>
                      </>
                    ) : (
                      <p className="text-zinc-500">No balance selected</p>
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
                                <p className={"text-2xl font-semibold " + appPrimary}>
                                  ${matchingVariation?.precio || matchingVariation?.attributes?.precio || "N/A"}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-500 text-right">
                                *Price does not include payment service fee.
                              </p>
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
                          ? appPrimaryBg + " hover:" + appSecondaryBg + " text-white font-bold"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500"
                          }`}
                      >
                        <span className="uppercase">CONTINUE</span>
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