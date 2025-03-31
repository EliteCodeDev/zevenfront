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

  // Obtener la página actual de órdenes
  const {
    data: pageOrders,
    error: pageError,
    isLoading: pageLoading
  } = useWooCommerce(`orders?per_page=${perPage}&page=${currentPage}`);

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

  return { allOrders, isLoading, isComplete, error };
}