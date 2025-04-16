// src/services/client/hooks/use-strapi-mutation.js
import { useState, useCallback } from 'react';
import apiClient from '../apiClient';

/**
 * Hook para crear elementos en Strapi (POST)
 */
export function useStrapiCreate(endpoint) {
  const [status, setStatus] = useState({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null
  });

  const [data, setData] = useState(null);

  const create = useCallback(async (itemData) => {
    setStatus({
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null
    });

    try {
      const result = await apiClient.create(endpoint, itemData);
      setData(result);
      setStatus({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null
      });
      return result;
    } catch (error) {
      setStatus({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: error.message
      });
      throw error;
    }
  }, [endpoint]);

  return {
    create,
    data,
    ...status
  };
}

/**
 * Hook para actualizar elementos en Strapi (PUT)
 */
export function useStrapiUpdate(endpoint) {
  const [status, setStatus] = useState({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null
  });

  const [data, setData] = useState(null);

  const update = useCallback(async (id, itemData) => {
    setStatus({
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null
    });

    try {
      const result = await apiClient.update(endpoint, id, itemData);
      setData(result);
      setStatus({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null
      });
      return result;
    } catch (error) {
      setStatus({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: error.message
      });
      throw error;
    }
  }, [endpoint]);

  return {
    update,
    data,
    ...status
  };
}

/**
 * Hook para eliminar elementos en Strapi (DELETE)
 */
export function useStrapiDelete(endpoint) {
  const [status, setStatus] = useState({
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null
  });

  const remove = useCallback(async (id) => {
    setStatus({
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null
    });

    try {
      await apiClient.delete(endpoint, id);
      setStatus({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null
      });
      return true;
    } catch (error) {
      setStatus({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: error.message
      });
      throw error;
    }
  }, [endpoint]);

  return {
    remove,
    ...status
  };
}

/**
 * Hook combinado para todas las operaciones CRUD
 */
export function useStrapiCrud(endpoint) {
  const { data: items, error, mutate, isLoading } = useStrapiData(endpoint);
  const { create, isLoading: isCreating } = useStrapiCreate(endpoint);
  const { update, isLoading: isUpdating } = useStrapiUpdate(endpoint);
  const { remove, isLoading: isDeleting } = useStrapiDelete(endpoint);

  // Función para refrescar la lista después de una operación
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Crear con refresco automático
  const createItem = useCallback(async (data) => {
    const result = await create(data);
    refresh();
    return result;
  }, [create, refresh]);

  // Actualizar con refresco automático
  const updateItem = useCallback(async (id, data) => {
    const result = await update(id, data);
    refresh();
    return result;
  }, [update, refresh]);

  // Eliminar con refresco automático
  const deleteItem = useCallback(async (id) => {
    const result = await remove(id);
    refresh();
    return result;
  }, [remove, refresh]);

  return {
    items,
    error,
    isLoading: isLoading || isCreating || isUpdating || isDeleting,
    createItem,
    updateItem,
    deleteItem,
    refresh
  };
}

// Añadir importación en la parte superior
import { useStrapiData } from './use-strapi-data';