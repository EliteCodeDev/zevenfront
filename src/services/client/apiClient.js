// src/services/client/api-client.js

/**
 * Cliente API para comunicarse con los Route Handlers
 * Este código se ejecuta en el cliente (navegador)
 */
class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''; // URL de nuestra app
  }

  /**
   * Método genérico para peticiones
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;

    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, fetchOptions);

      // Si la respuesta no es exitosa, manejar el error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.statusText
        }));

        throw new Error(
          errorData.error ||
          `Error ${response.status}: ${response.statusText}`
        );
      }

      // Si la respuesta es exitosa pero no es JSON (ej. 204 No Content)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error:`, error);
      throw error;
    }
  }

  /**
   * Obtener datos (GET)
   */
  async get(endpoint, params = {}) {
    // Construir query string a partir de params
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const path = `/api/strapi/${endpoint}${queryString ? `?${queryString}` : ''}`;

    return this.request(path, { method: 'GET' });
  }

  /**
   * Obtener por ID (GET)
   */
  async getById(endpoint, id, params = {}) {
    // Construir query string a partir de params
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const path = `/api/strapi/${endpoint}/${id}${queryString ? `?${queryString}` : ''}`;

    return this.request(path, { method: 'GET' });
  }

  /**
   * Crear nuevo (POST)
   */
  async create(endpoint, data) {
    const path = `/api/strapi/${endpoint}`;

    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualizar (PUT)
   */
  async update(endpoint, id, data) {
    const path = `/api/strapi/${endpoint}/${id}`;

    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Eliminar (DELETE)
   */
  async delete(endpoint, id) {
    const path = `/api/strapi/${endpoint}/${id}`;

    return this.request(path, {
      method: 'DELETE'
    });
  }
}

// Exportar una instancia lista para usar
const apiClient = new ApiClient();
export default apiClient;