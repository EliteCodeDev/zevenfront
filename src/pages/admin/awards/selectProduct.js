import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ShoppingBag, Search, X, ChevronDown, ChevronUp, Check } from "lucide-react";
import useSWR from "swr";
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

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

const variationCache = {};

const ProductSelector = ({
    selectedProductIds = [],
    onChange,
    error = null
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { data: session } = useSession();
    const [selectedVariations, setSelectedVariations] = useState(new Map());
    const [expandedProducts, setExpandedProducts] = useState(new Set());
    const [productData, setProductData] = useState(new Map());
    const [variationData, setVariationData] = useState(new Map());

    const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const url = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WP_URL;
    const hasCredentials = !!consumerKey && !!url;

    const {
        data: products,
        error: productsError,
        isLoading: productsLoading,
    } = useSWR(
        hasCredentials ? [`products?per_page=100`, {}] : null,
        wooFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000,
        }
    );

    useEffect(() => {
        if (products && products.length) {
            const newProductData = new Map();
            products.forEach(product => {
                newProductData.set(parseInt(product.id), product);
            });
            setProductData(newProductData);
        }
    }, [products]);

    const fetchVariations = useCallback(async (productId) => {
        if (!hasCredentials) return null;

        try {
            const numericProductId = parseInt(productId);
            if (variationCache[numericProductId]) {
                return variationCache[numericProductId];
            }
            const data = await wooFetcher([`products/${numericProductId}/variations?per_page=100`, {}]);
            variationCache[numericProductId] = data;

            const newVariationData = new Map(variationData);
            data.forEach(variation => {
                const varId = parseInt(variation.id);
                if (!newVariationData.has(varId)) {
                    newVariationData.set(varId, {
                        ...variation,
                        productId: numericProductId,
                        name: getVariationName(variation),
                        productName: productData.get(numericProductId)?.name || `Producto ${numericProductId}`
                    });
                }
            });

            setVariationData(newVariationData);
            return data;
        } catch (error) {
            console.error(`Error al obtener variaciones para el producto ${productId}:`, error);
            return null;
        }
    }, [hasCredentials, productData, variationData]);

    useEffect(() => {
        expandedProducts.forEach(async (productId) => {
            if (!variationCache[productId]) {
                await fetchVariations(productId);
            }
        });
    }, [expandedProducts, fetchVariations]);

    // Efecto para sincronizar las variaciones seleccionadas a partir de los IDs
    useEffect(() => {
        if (!products) return;

        const newSelectedVariations = new Map();
        selectedProductIds.forEach(async (id) => {
            const variationId = parseInt(id);
            if (variationData.has(variationId)) {
                newSelectedVariations.set(variationId, variationData.get(variationId));
            } else {
                for (const [productId, variations] of Object.entries(variationCache)) {
                    const variation = variations.find(v => parseInt(v.id) === variationId);
                    if (variation) {
                        const numericProductId = parseInt(productId);
                        // Se elimina la línea que forzaba la expansión para permitir que el usuario controle el desplegable
                        newSelectedVariations.set(variationId, {
                            ...variation,
                            productId: numericProductId,
                            name: getVariationName(variation),
                            productName: productData.get(numericProductId)?.name || `Producto ${numericProductId}`
                        });
                        break;
                    }
                }
            }
        });
        setSelectedVariations(newSelectedVariations);
    }, [products, selectedProductIds, variationData, productData]); // Se elimina expandedProducts de las dependencias

    const filteredProducts = products
        ? products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            product.variations && product.variations.length > 0
        )
        : [];

    const toggleProductExpand = (productId) => {
        const numericProductId = parseInt(productId);
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(numericProductId)) {
                newSet.delete(numericProductId);
            } else {
                newSet.add(numericProductId);
                if (!variationCache[numericProductId]) {
                    fetchVariations(numericProductId);
                }
            }
            return newSet;
        });
    };

    const toggleVariation = (productId, variation) => {
        const numericProductId = parseInt(productId);
        const numericVariationId = parseInt(variation.id);

        setSelectedVariations(prev => {
            const newSelectedVariations = new Map(prev);
            if (newSelectedVariations.has(numericVariationId)) {
                newSelectedVariations.delete(numericVariationId);
            } else {
                newSelectedVariations.set(numericVariationId, {
                    ...variation,
                    productId: numericProductId,
                    name: getVariationName(variation),
                    productName: productData.get(numericProductId)?.name || `Producto ${numericProductId}`
                });
            }
            notifyChange(newSelectedVariations);
            return newSelectedVariations;
        });
    };

    const removeVariation = (variationId) => {
        const numericVariationId = parseInt(variationId);
        setSelectedVariations(prev => {
            const newSelectedVariations = new Map(prev);
            newSelectedVariations.delete(numericVariationId);
            notifyChange(newSelectedVariations);
            return newSelectedVariations;
        });
    };

    const notifyChange = (variations) => {
        const variationIds = Array.from(variations.keys()).map(id => Number(id));
        onChange(variationIds);
    };

    const getVariationName = (variation) => {
        if (!variation || !variation.attributes || variation.attributes.length === 0) {
            return `Variación ${variation?.id || 'desconocida'}`;
        }
        const stepAttr = variation.attributes.find(attr => attr.name.toLowerCase() === 'step');
        const subcategoryAttr = variation.attributes.find(attr => attr.name.toLowerCase() === 'subcategory');
        if (stepAttr && subcategoryAttr) {
            return `step: ${stepAttr.option} - subcategory: ${subcategoryAttr.option}`;
        }
        return variation.attributes
            .map(attr => `${attr.name}: ${attr.option}`)
            .join(' - ');
    };

    const getGroupedVariations = () => {
        const grouped = {};
        selectedVariations.forEach((variation) => {
            const productId = variation.productId;
            if (!grouped[productId]) {
                grouped[productId] = [];
            }
            grouped[productId].push(variation);
        });
        return grouped;
    };

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Productos Aplicables
                </div>
            </label>

            <div
                className={`w-full flex items-center justify-between p-2 border rounded cursor-pointer dark:bg-zinc-900 dark:border-zinc-700 ${error ? "border-red-500" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 flex flex-wrap gap-1">
                    {selectedVariations.size > 0 ? (
                        Object.entries(getGroupedVariations()).map(([productId, variations]) => (
                            variations.map(variation => (
                                <div
                                    key={variation.id}
                                    className="bg-gray-900 text-white px-2 py-1 rounded-md flex items-center text-sm"
                                >
                                    <span className="mr-1">
                                        {variation.productName} ({variation.name})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeVariation(variation.id);
                                        }}
                                        className="text-gray-300 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ))
                    ) : (
                        <span className="text-gray-400">Selecciona variaciones de productos...</span>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {isOpen && (
                <div className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border dark:border-zinc-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 border-b dark:border-zinc-700">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pr-8 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                            />
                            <Search className="absolute right-2 top-2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {productsLoading ? (
                        <div className="p-3 text-center text-gray-500">Cargando productos...</div>
                    ) : productsError ? (
                        <div className="p-3 text-center text-red-500">Error al cargar productos: {productsError.message}</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">No se encontraron productos con variaciones</div>
                    ) : (
                        <ul className="py-1">
                            {filteredProducts.map(product => {
                                const productId = parseInt(product.id);
                                const isExpanded = expandedProducts.has(productId);
                                const variations = variationCache[productId];
                                const variationsLoading = isExpanded && !variations;
                                let selectedCount = 0;
                                selectedVariations.forEach(v => {
                                    if (v.productId === productId) {
                                        selectedCount++;
                                    }
                                });
                                return (
                                    <li key={productId} className="border-b border-gray-100 dark:border-zinc-700 last:border-b-0">
                                        <div
                                            className={`px-3 py-3 bg-gray-100 dark:bg-zinc-800 flex items-center justify-between cursor-pointer ${selectedCount > 0 ? 'border-l-4 border-amber-500' : ''}`}
                                            onClick={() => toggleProductExpand(productId)}
                                        >
                                            <div className="flex items-center flex-grow">
                                                <span className="font-medium">{product.name}</span>
                                                {selectedCount > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                                                        {selectedCount}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="ml-2 p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-white dark:bg-zinc-900">
                                                {variationsLoading ? (
                                                    <div className="p-3 pl-6 text-sm text-gray-500">Cargando variaciones...</div>
                                                ) : !variations || variations.length === 0 ? (
                                                    <div className="p-3 pl-6 text-sm text-gray-500">No hay variaciones disponibles</div>
                                                ) : (
                                                    <ul className="py-1">
                                                        {variations.map(variation => {
                                                            const variationId = parseInt(variation.id);
                                                            const isVariationSelected = selectedVariations.has(variationId);
                                                            const variationName = getVariationName(variation);
                                                            return (
                                                                <li
                                                                    key={variationId}
                                                                    className={`px-3 py-2 pl-6 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer ${isVariationSelected ? 'bg-amber-100 dark:bg-amber-900/20 border-l-2 border-amber-500' : ''}`}
                                                                    onClick={() => toggleVariation(productId, variation)}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm">{variationName}</span>
                                                                        {isVariationSelected && (
                                                                            <Check className="w-4 h-4 text-amber-500" />
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

export default ProductSelector;
