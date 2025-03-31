// src/services/strapiServiceJWT.js
import useSWR from 'swr';

// Función fetcher para obtener los datos
const fetcher = async (url, token) => {
  // console.log('Fetching URL:', url); // Log del URL que se está llamando
  // console.log('Using Token:', token); // Log del token que se está enviando

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Token enviado en el header
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Error en la respuesta de Strapi:', res.status, res.statusText);
    throw new Error('Failed to fetch data from Strapi');
  }

  const data = await res.json();
  //console.log('Response Data:', data); // Log de la respuesta obtenida

  // Ajuste para devolver directamente el objeto completo o la propiedad específica
  return data;
};

// Función para obtener datos de Strapi (reutilizable)
export function useStrapiData(endpoint, token) {
  const { data, error, mutate } = useSWR(
    token ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}`, token] : null,
    ([url, token]) => fetcher(url, token) // El token se pasa como argumento adicional al fetcher
  );

  return {
    data,
    error,
    mutate,
    isLoading: !error && !data,
  };
}
