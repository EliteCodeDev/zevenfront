// src/services/strapiService.js
import useSWR from 'swr';

// Función fetcher para obtener los datos
const fetcher = async (url) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch data from Strapi');
  }

  const data = await res.json();

  // if (url.includes('challenges')) {
  //   return data;
  // }
  if (data.data && Array.isArray(data.data)) {
    return data.data;  // Devolver los datos del array 'socials'
  } else {
    throw new Error('No se encontraron datos válidos');
  }
};

// Función para obtener datos de Strapi (reutilizable)
export function useStrapiData(endpoint) {
  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !error && !data,
  };
}
