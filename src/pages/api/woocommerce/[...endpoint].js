import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Helper function to create a WooCommerce API instance
const createWooCommerceApi = () => {
  const url = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WP_URL;
  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

  if (!url) throw new Error('URL no proporcionada para WooCommerce API');
  if (!consumerKey || !consumerSecret) {
    throw new Error('Credenciales de WooCommerce no proporcionadas');
  }

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version: 'wc/v3',
    timeout: 10000,
  });
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the endpoint from the URL
    const { endpoint } = req.query;
    console.log('Endpoint:', endpoint);
    // Join parts of the path with '/'
    const apiEndpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    // Initialize WooCommerce API
    const api = createWooCommerceApi();

    let response;

    switch (req.method) {
      case 'GET':
        // Get query parameters
        const params = { ...req.query };
        delete params.endpoint; // Remove the endpoint from the query params

        // Make the GET API request
        response = await api.get(apiEndpoint, params);
        break;

      case 'POST':
        // For POST requests, use the request body as data
        response = await api.post(apiEndpoint, req.body);
        break;

      case 'PUT':
        // For PUT requests, use the request body as data for updates
        response = await api.put(apiEndpoint, req.body);
        break;

      case 'DELETE':
        // For DELETE requests
        const deleteParams = { ...req.query };
        delete deleteParams.endpoint;

        // WooCommerce REST API doesn't support body for DELETE
        // so we need to pass any required parameters in the URL
        response = await api.delete(apiEndpoint, deleteParams);
        break;

      default:
        // Method not supported
        return res.status(405).json({
          error: 'Método no soportado',
          message: `El método ${req.method} no está soportado por este endpoint`
        });
    }

    // Return the data
    res.status(200).json(response.data);
  } catch (error) {
    console.error('WooCommerce API error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        error: `WooCommerce API error: ${error.response.status}`,
        message: error.response.data
      });
    }

    res.status(500).json({
      error: 'Error al procesar la solicitud',
      message: error.message
    });
  }
}