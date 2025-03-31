// src/services/useWoo.js
import useSWR from 'swr';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Crear una instancia de WooCommerce API con mejor manejo de errores
const createWooCommerceApi = (url, consumerKey, consumerSecret, version = 'wc/v3') => {
  if (!url) {
    console.error('Error: URL no proporcionada para WooCommerce API');
  }
  if (!consumerKey || !consumerSecret) {
    console.error('Error: Credenciales de WooCommerce no proporcionadas (consumerKey o consumerSecret)');
  }

  // // console.log(`Creando API con URL: ${url}, Key: ${consumerKey ? '✓ presente' : '❌ falta'}, Secret: ${consumerSecret ? '✓ presente' : '❌ falta'}`);

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version,
    // Agregamos un timeout para evitar esperas indefinidas
    timeout: 10000
  });
};

// Función fetcher mejorada para WooCommerce con mejor manejo de errores
const wooFetcher = async ([endpoint, config]) => {
  try {
    // Verificar y usar variables de entorno como respaldo, con múltiples nombres posibles
    const url = config.url ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_URL ||
      process.env.NEXT_PUBLIC_WP_URL;

    const consumerKey = config.consumerKey ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
      process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;

    const consumerSecret = config.consumerSecret ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET ||
      process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

    // Verificación de parámetros esenciales
    if (!url) {
      throw new Error('URL de WordPress no configurada');
    }

    if (!consumerKey || !consumerSecret) {
      throw new Error('Credenciales de WooCommerce no configuradas (consumer key/secret)');
    }

    // // console.log(`Configuración WooCommerce:
    //   URL: ${url}
    //   Endpoint: ${endpoint}
    //   Consumer Key: ${consumerKey.substring(0, 3)}...${consumerKey.substring(consumerKey.length - 3)}
    //   Params: ${JSON.stringify(config.params || {})}
    // `);

    const api = createWooCommerceApi(
      url,
      consumerKey,
      consumerSecret,
      config.version || 'wc/v3'
    );

    // // console.log(`Fetching WooCommerce endpoint: ${endpoint}`);

    // Asegurarse de que el endpoint no comienza con '/' (la biblioteca lo añade)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    const response = await api.get(cleanEndpoint, config.params || {});

    if (!response || !response.data) {
      console.error('Respuesta vacía de WooCommerce');
      throw new Error('Respuesta vacía de WooCommerce');
    }

    // // console.log(`WooCommerce respuesta recibida:`, typeof response.data, Array.isArray(response.data) ? `Array con ${response.data.length} elementos` : 'Objeto');
    return response.data;
  } catch (error) {
    // Mejor manejo de errores específicos de WooCommerce
    if (error.response) {
      console.error(`Error de WooCommerce API (${error.response.status}):`, error.response.data);
      throw new Error(`Error de WooCommerce API: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor:', error.request);
      throw new Error('Timeout o error de conexión con la API de WooCommerce');
    } else {
      console.error('Error en la solicitud a WooCommerce:', error.message);
      throw error;
    }
  }
};

/**
 * Hook mejorado para obtener datos de WooCommerce
 * 
 * @param {string} endpoint - El endpoint de WooCommerce (sin el prefijo wc/v3)
 * @param {object} options - Opciones adicionales
 * @param {string} options.url - URL de la tienda (opcional)
 * @param {string} options.consumerKey - Consumer key (opcional)
 * @param {string} options.consumerSecret - Consumer secret (opcional)
 * @param {string} options.version - Versión de la API (opcional, por defecto 'wc/v3')
 * @param {object} options.params - Parámetros adicionales para la consulta (opcional)
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useWooCommerce(endpoint, options = {}) {
  // Verificar las variables de entorno si no se proporcionan explícitamente
  const hasCredentials = options.consumerKey ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
    process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;

  // Solo ejecutamos SWR si tenemos un endpoint y potencialmente credenciales
  const shouldFetch = endpoint && hasCredentials;

  const { data, error, mutate } = useSWR(
    shouldFetch ? [endpoint, options] : null,
    wooFetcher,
    {
      revalidateOnFocus: false,
      ...options.swrOptions
    }
  );

  return {
    data,
    error,
    mutate,
    isLoading: shouldFetch && !error && !data,
    // Agregar información para depuración
    debug: {
      hasCredentials: !!hasCredentials,
      endpoint,
      shouldFetch,
    }
  };
}

// Función fetcher mejorada para WordPress REST API
const wpFetcher = async ([url, params = {}, headers = {}]) => {
  try {
    if (!url) {
      throw new Error('URL de WordPress no proporcionada');
    }

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // // console.log(`Fetching WordPress endpoint: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('WordPress response:', typeof data, Array.isArray(data) ? `Array con ${data.length} elementos` : 'Objeto');
    return data;
  } catch (error) {
    console.error('Error fetching from WordPress:', error);
    throw error;
  }
};

/**
 * Hook mejorado para obtener datos de WordPress REST API
 * 
 * @param {string} endpoint - El endpoint de WordPress (sin el prefijo wp-json)
 * @param {object} params - Parámetros de consulta (opcional)
 * @param {object} options - Opciones adicionales
 * @param {string} options.baseUrl - URL base (opcional)
 * @param {object} options.headers - Headers adicionales (opcional)
 * @param {object} options.swrOptions - Opciones para SWR (opcional)
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useWordPress(endpoint, params = {}, options = {}) {
  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_WORDPRESS_URL || '';

  if (!baseUrl) {
    console.error('URL de WordPress no configurada');
  }

  // Asegurarse de que el endpoint no comienza con '/' para evitar doble barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  // Asegurarse de que el endpoint no incluye 'wp-json' al principio
  const apiEndpoint = cleanEndpoint.startsWith('wp-json/')
    ? cleanEndpoint
    : `wp-json/${cleanEndpoint}`;

  const apiUrl = `${baseUrl}/${apiEndpoint}`;

  // console.log(`WordPress URL configurada: ${apiUrl}`);

  const { data, error, mutate } = useSWR(
    baseUrl ? [apiUrl, params, options.headers] : null,
    wpFetcher,
    {
      revalidateOnFocus: false,
      ...options.swrOptions
    }
  );

  return {
    data,
    error,
    mutate,
    isLoading: baseUrl && !error && !data,
    // Agregar información para depuración
    debug: {
      fullUrl: apiUrl,
      baseUrl,
      params
    }
  };
}