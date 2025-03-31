// Create this file at: src/pages/api/woocommerce/[...endpoint].js

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the endpoint from the URL
    const { endpoint } = req.query;

    // Join parts of the path with '/'
    const apiEndpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    // Get query parameters
    const params = req.query;
    delete params.endpoint; // Remove the endpoint from the query params

    // Initialize WooCommerce API
    const api = createWooCommerceApi();

    // Make the API request
    const response = await api.get(apiEndpoint, params);

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