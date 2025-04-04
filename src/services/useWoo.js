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

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version,
    // Agregamos un timeout para evitar esperas indefinidas
    timeout: 10000
  });
};

// Función para verificar y obtener las credenciales de WooCommerce
const getWooCredentials = (config) => {
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

  return { url, consumerKey, consumerSecret };
};

// Función fetcher mejorada para WooCommerce con mejor manejo de errores
const wooFetcher = async ([endpoint, config]) => {
  try {
    const { url, consumerKey, consumerSecret } = getWooCredentials(config);

    const api = createWooCommerceApi(
      url,
      consumerKey,
      consumerSecret,
      config.version || 'wc/v3'
    );

    // Asegurarse de que el endpoint no comienza con '/' (la biblioteca lo añade)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    const response = await api.get(cleanEndpoint, config.params || {});

    if (!response || !response.data) {
      console.error('Respuesta vacía de WooCommerce');
      throw new Error('Respuesta vacía de WooCommerce');
    }

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

  // Función para realizar operaciones CRUD
  const wooRequest = async (method, endpointPath, data = null, customParams = {}) => {
    try {
      // Usar el mismo endpoint si no se proporciona uno nuevo
      const targetEndpoint = endpointPath || endpoint;
      if (!targetEndpoint) {
        throw new Error('Endpoint no proporcionado para la solicitud');
      }

      const { url, consumerKey, consumerSecret } = getWooCredentials(options);

      const api = createWooCommerceApi(
        url,
        consumerKey,
        consumerSecret,
        options.version || 'wc/v3'
      );

      // Asegurarse de que el endpoint no comienza con '/'
      const cleanEndpoint = targetEndpoint.startsWith('/') ? targetEndpoint.substring(1) : targetEndpoint;

      let response;

      // Ejecutar el método correspondiente
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(cleanEndpoint, { ...options.params, ...customParams });
          break;
        case 'post':
          response = await api.post(cleanEndpoint, data, customParams);
          break;
        case 'put':
          response = await api.put(cleanEndpoint, data, customParams);
          break;
        case 'delete':
          response = await api.delete(cleanEndpoint, { ...options.params, ...customParams });
          break;
        default:
          throw new Error(`Método ${method} no soportado`);
      }

      // Revalidar los datos después de mutaciones
      if (method.toLowerCase() !== 'get') {
        mutate();
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`Error de WooCommerce API (${error.response.status}):`, error.response.data);
        throw new Error(`Error de WooCommerce API: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
        throw new Error('Timeout o error de conexión con la API de WooCommerce');
      } else {
        console.error(`Error en la solicitud ${method} a WooCommerce:`, error.message);
        throw error;
      }
    }
  };

  return {
    data,
    error,
    mutate,
    isLoading: shouldFetch && !error && !data,
    // Métodos CRUD
    get: (endpointPath, params) => wooRequest('get', endpointPath, null, params),
    post: (endpointPath, data, params) => wooRequest('post', endpointPath, data, params),
    put: (endpointPath, data, params) => wooRequest('put', endpointPath, data, params),
    delete: (endpointPath, params) => wooRequest('delete', endpointPath, null, params),
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
    return data;
  } catch (error) {
    console.error('Error fetching from WordPress:', error);
    throw error;
  }
};

/**
 * Hook mejorado para obtener datos de WordPress REST API
 * con soporte para métodos POST, PUT y DELETE
 * 
 * @param {string} endpoint - El endpoint de WordPress (sin el prefijo wp-json)
 * @param {object} params - Parámetros de consulta (opcional)
 * @param {object} options - Opciones adicionales
 * @param {string} options.baseUrl - URL base (opcional)
 * @param {object} options.headers - Headers adicionales (opcional)
 * @param {object} options.swrOptions - Opciones para SWR (opcional)
 * @returns {object} - { data, error, isLoading, mutate, post, put, delete }
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

  const { data, error, mutate } = useSWR(
    baseUrl ? [apiUrl, params, options.headers] : null,
    wpFetcher,
    {
      revalidateOnFocus: false,
      ...options.swrOptions
    }
  );

  // Función para realizar solicitudes HTTP a WordPress
  const wpRequest = async (method, endpointPath = null, body = null, customParams = {}, customHeaders = {}) => {
    try {
      // Usar el endpoint proporcionado o el original
      let targetEndpoint = endpointPath || cleanEndpoint;

      // Asegurarse de que el endpoint no comienza con '/' para evitar doble barra
      targetEndpoint = targetEndpoint.startsWith('/') ? targetEndpoint.substring(1) : targetEndpoint;

      // Asegurarse de que el endpoint incluye 'wp-json' al principio
      const finalApiEndpoint = targetEndpoint.startsWith('wp-json/')
        ? targetEndpoint
        : `wp-json/${targetEndpoint}`;

      const finalApiUrl = `${baseUrl}/${finalApiEndpoint}`;

      // Construir la URL con parámetros para métodos GET y DELETE
      let url = finalApiUrl;
      if ((method === 'GET' || method === 'DELETE') && Object.keys(customParams).length > 0) {
        const queryString = new URLSearchParams({ ...params, ...customParams }).toString();
        url = `${finalApiUrl}?${queryString}`;
      }

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...customHeaders
        }
      };

      // Añadir body para métodos POST y PUT
      if ((method === 'POST' || method === 'PUT') && body !== null) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        console.error(`WordPress API error: ${response.status} ${response.statusText}`);
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }

      // Revalidar los datos después de mutaciones
      if (method !== 'GET') {
        mutate();
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en solicitud ${method} a WordPress:`, error);
      throw error;
    }
  };

  return {
    data,
    error,
    mutate,
    isLoading: baseUrl && !error && !data,
    // Métodos CRUD
    get: (endpointPath, customParams, customHeaders) =>
      wpRequest('GET', endpointPath, null, customParams, customHeaders),
    post: (endpointPath, body, customParams, customHeaders) =>
      wpRequest('POST', endpointPath, body, customParams, customHeaders),
    put: (endpointPath, body, customParams, customHeaders) =>
      wpRequest('PUT', endpointPath, body, customParams, customHeaders),
    delete: (endpointPath, customParams, customHeaders) =>
      wpRequest('DELETE', endpointPath, null, customParams, customHeaders),
    // Agregar información para depuración
    debug: {
      fullUrl: apiUrl,
      baseUrl,
      params
    }
  };
}