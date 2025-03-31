import React, { useState, useEffect } from 'react';
import { useStrapiData } from 'src/services/strapiService';
import { useWooCommerce } from 'src/services/useWoo';

export default function Index() {
  // Estado para almacenar los datos
  const [todayOrders, setTodayOrders] = useState([]);
  const [todayChallenges, setTodayChallenges] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // Función para obtener las fechas del día actual
  const getTodayDateRange = () => {
    const today = new Date();
    // Inicio del día (00:00:00)
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const startOfDay = startDate.toISOString();

    // Final del día (23:59:59)
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    const endOfDay = endDate.toISOString();

    return { startOfDay, endOfDay };
  };

  // 1. Obtener órdenes del día
  const { startOfDay, endOfDay } = getTodayDateRange();
  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading
  } = useWooCommerce(`orders?after=${startOfDay}&before=${endOfDay}&per_page=100`);

  // 2. Obtener todos los productos
  const {
    data: productsData,
    error: productsError,
    isLoading: productsLoading
  } = useWooCommerce('products?per_page=100');

  // 3. Obtener retos del día
  const {
    data: challengesData,
    error: challengesError,
    isLoading: challengesLoading
  } = useStrapiData(`challenges?filters[createdAt][$gte]=${startOfDay}&filters[createdAt][$lte]=${endOfDay}`);


  

  // Actualizar el estado cuando los datos estén disponibles
  useEffect(() => {
    if (ordersData) {
      setTodayOrders(ordersData);
      // console.log("Órdenes del día:", ordersData);
    }

    if (productsData) {
      setAllProducts(productsData);
      // console.log("Productos disponibles:", productsData);
    }

    if (challengesData) {
      setTodayChallenges(challengesData);
      // console.log("Retos del día:", challengesData);
    }
  }, [ordersData, productsData, challengesData]);

  // Para obtener todas las órdenes con paginación, necesitaríamos un enfoque diferente
  // Esta función puede implementarse en un hook personalizado si es necesario
  const fetchAllOrders = () => {
    // Esta implementación requeriría gestionar correctamente estados y efectos
    // Fuera del alcance de esta corrección pero sería algo como:
    // useEffect con un estado para la página actual y otro para todas las órdenes
    // console.log("Esta función debe implementarse correctamente con paginación");
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {ordersLoading && <p>Cargando órdenes...</p>}
      {ordersError && <p>Error al cargar órdenes: {ordersError.message}</p>}
      {todayOrders && (
        <div>
          <h2>Órdenes del día ({todayOrders.length})</h2>
          {/* Lista de órdenes */}
        </div>
      )}

      {productsLoading && <p>Cargando productos...</p>}
      {productsError && <p>Error al cargar productos: {productsError.message}</p>}
      {allProducts && (
        <div>
          <h2>Productos ({allProducts.length})</h2>
          {/* Lista de productos */}
        </div>
      )}

      {challengesLoading && <p>Cargando retos...</p>}
      {challengesError && <p>Error al cargar retos: {challengesError.message}</p>}
      {todayChallenges && (
        <div>
          <h2>Retos del día ({todayChallenges.length})</h2>
          {/* Lista de retos */}
        </div>
      )}
    </div>
  );
}