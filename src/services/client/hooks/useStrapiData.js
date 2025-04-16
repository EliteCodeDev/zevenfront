// src/services/client/hooks/use-strapi-data.js
import useSWR from 'swr';

/**
 * Hook optimizado para obtener solo datos específicos de Strapi
 * 
 * @param {string} endpoint - El endpoint de Strapi (ej. 'products')
 * @param {object} options - Opciones de filtrado y configuración
 * @param {string[]} options.fields - Campos a obtener del modelo principal
 * @param {object} options.populate - Configuración específica de relaciones a poblar
 * @param {object} options.filters - Filtros a aplicar
 * @param {object} options.sort - Ordenamiento
 * @param {object} options.pagination - Configuración de paginación
 * @param {object} swrOptions - Opciones adicionales para SWR
 */
export function useStrapiData(endpoint, options = {}, swrOptions = {}) {
  const {
    fields,
    populate,
    filters,
    sort,
    pagination,
    ...restOptions
  } = options;

  // Construir los parámetros para la consulta
  const params = {};

  // Agregar campos específicos si se proporcionan
  if (fields && Array.isArray(fields) && fields.length > 0) {
    params.fields = fields;
  }

  // Agregar poblaciones específicas
  if (populate) {
    if (populate === '*') {
      params.populate = '*';
    } else if (typeof populate === 'object') {
      params.populate = populate;
    }
  }

  // Agregar filtros
  if (filters) {
    params.filters = filters;
  }

  // Agregar ordenamiento
  if (sort) {
    params.sort = sort;
  }

  // Agregar paginación
  if (pagination) {
    params.pagination = pagination;
  }

  // Agregar otros parámetros
  Object.assign(params, restOptions);

  // Construir la clave para SWR
  const key = endpoint ? `/api/strapi/${endpoint}` : null;

  // Función fetcher que envía los parámetros
  const fetcher = async () => {
    // Construir los parámetros en formato URL para la petición GET
    const queryParams = new URLSearchParams();

    // Codificar parámetros complejos como JSON
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        queryParams.append(key, JSON.stringify(value));
      } else {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${key}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return await response.json();
  };

  // Opciones por defecto de SWR
  const defaultOptions = {
    revalidateOnFocus: false,
    ...swrOptions
  };

  // Usar SWR para gestionar los datos con caché
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    key ? [key, JSON.stringify(params)] : null,
    () => fetcher(),
    defaultOptions
  );

  return {
    data,
    error,
    mutate,
    isLoading,
    isValidating
  };
}