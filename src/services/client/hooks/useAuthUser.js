// src/services/client/hooks/use-auth-user.js
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

/**
 * Hook para obtener datos del usuario autenticado de forma segura
 * Compatible con Page Routes
 */
export function useAuthUser() {
  const { data: session, status } = useSession();

  // Solo hacer la petición si hay sesión activa
  const shouldFetch = status === 'authenticated' && !!session;

  // Función fetcher para la API segura
  const fetcher = async () => {
    const response = await fetch('/api/auth/me');

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return response.json();
  };

  // Usar SWR para gestionar los datos con caché
  const { data, error, mutate, isLoading } = useSWR(
    shouldFetch ? '/api/auth/me' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  return {
    user: data,
    error,
    isLoading: status === 'loading' || (shouldFetch && isLoading),
    mutate,
    isAuthenticated: status === 'authenticated'
  };
}