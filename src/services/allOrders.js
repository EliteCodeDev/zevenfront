// src/services/allOrders.js
import { useState, useEffect } from 'react';
import { useWooCommerce } from 'src/services/useWoo';

// Hook personalizado para obtener todas las órdenes con paginación
export function useAllOrders(perPage = 100) {
  const [allOrders, setAllOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener la página actual de órdenes usando la nueva estructura
  const {
    data: pageOrders,
    error: pageError,
    isLoading: pageLoading
  } = useWooCommerce('orders', {
    params: {
      per_page: perPage,
      page: currentPage
    },
    useApiEndpoint: true // Usar el nuevo endpoint personalizado
  });

  // Efecto para manejar la paginación
  useEffect(() => {
    if (pageError) {
      setError(pageError);
      setIsLoading(false);
      return;
    }

    // Si hay órdenes en esta página, añadirlas al total
    if (pageOrders && pageOrders.length > 0) {
      setAllOrders(prev => [...prev, ...pageOrders]);
      setCurrentPage(prev => prev + 1); // Avanzar a la siguiente página
    }
    // Si no hay órdenes o la lista está vacía, hemos terminado
    else if (pageOrders && pageOrders.length === 0) {
      setIsComplete(true);
      setIsLoading(false);
    }
  }, [pageOrders, pageError]);

  // Método para crear órdenes de forma masiva
  const createBulkOrders = async (ordersData) => {
    try {
      // Suponiendo que el endpoint soporta creación masiva
      const { post } = useWooCommerce('orders/batch', { useApiEndpoint: true });
      const result = await post({ create: ordersData });

      // Actualizar el estado local si es necesario
      if (result && result.create) {
        setAllOrders(prev => [...prev, ...result.create]);
      }

      return result;
    } catch (error) {
      console.error('Error al crear órdenes masivas:', error);
      throw error;
    }
  };

  // Método para actualizar órdenes de forma masiva
  const updateBulkOrders = async (ordersData) => {
    try {
      const { post } = useWooCommerce('orders/batch', { useApiEndpoint: true });
      const result = await post({ update: ordersData });

      // Actualizar órdenes localmente si es necesario
      return result;
    } catch (error) {
      console.error('Error al actualizar órdenes masivas:', error);
      throw error;
    }
  };

  // Método para reiniciar y cargar desde la primera página
  const refresh = () => {
    setAllOrders([]);
    setCurrentPage(1);
    setIsComplete(false);
    setIsLoading(true);
    setError(null);
  };

  return {
    allOrders,
    isLoading,
    isComplete,
    error,
    // Agregar métodos útiles
    refresh,
    createBulkOrders,
    updateBulkOrders
  };
}