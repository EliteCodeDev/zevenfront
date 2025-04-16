// src/services/server/strapi-service.js

/**
 * Servicio para comunicación con Strapi que permite consultas complejas
 */
class StrapiService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    this.apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
  }

  /**
   * Convierte un objeto de parámetros en una cadena de consulta para Strapi
   * Maneja objetos anidados y arrays para filtros complejos
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) return '';

    // Función recursiva para manejar objetos anidados
    const encodeParam = (key, value) => {
      // Si es un array, codificar cada elemento
      if (Array.isArray(value)) {
        return value.map(item => encodeParam(`${key}[]`, item)).join('&');
      }

      // Si es un objeto, codificar cada propiedad
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([k, v]) => {
          return encodeParam(`${key}[${k}]`, v);
        }).join('&');
      }

      // Si es un valor primitivo
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    };

    // Construir la cadena de consulta
    return Object.entries(params)
      .map(([key, value]) => encodeParam(key, value))
      .join('&');
  }

  /**
   * Método genérico para hacer peticiones a Strapi
   */
  async request(endpoint, options = {}) {
    // Extraer parámetros de consulta
    const { params, ...restOptions } = options;

    // Construir URL con parámetros si existen
    let url = `${this.baseUrl}/api/${endpoint}`;

    if (params) {
      const queryString = this.buildQueryString(params);
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }

    // Opciones por defecto para todas las peticiones
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    // Combinar opciones
    const fetchOptions = {
      ...defaultOptions,
      ...restOptions,
      headers: {
        ...defaultOptions.headers,
        ...(restOptions.headers || {})
      }
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Strapi API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in Strapi request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtener colección o entrada única
   */
  async get(endpoint, params = {}) {
    return this.request(endpoint, {
      method: 'GET',
      params
    });
  }

  /**
   * Obtener por ID
   */
  async getById(endpoint, id, params = {}) {
    return this.get(`${endpoint}/${id}`, params);
  }

  /**
   * Resto de métodos igual que antes...
   */
  async create(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async update(endpoint, id, data) {
    return this.request(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  async delete(endpoint, id) {
    return this.request(`${endpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  async authenticatedRequest(endpoint, options = {}, userToken) {
    const { params, ...restOptions } = options;
    return this.request(endpoint, {
      ...restOptions,
      params,
      headers: {
        ...(restOptions.headers || {}),
        'Authorization': `Bearer ${userToken || this.apiToken}`,
      },
    });
  }
}

// Exportar una instancia lista para usar
const strapiService = new StrapiService();
export default strapiService;