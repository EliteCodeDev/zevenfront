/* src/pages/profile/profile.js */
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import Skeleton from '../../components/loaders/loader';

import LogoGravatar from '../../components/LogoGravatar'

const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // URL del backend desde las variables de entorno

export default function User() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (status === 'authenticated' && session?.jwt) {
          const response = await fetch(`${strapiUrl}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${session.jwt}`, // JWT de la sesión
            },
          });

          if (!response.ok) {
            throw new Error('Error al obtener datos');
          }

          const result = await response.json();
          setData(result); // Guarda los datos en el estado
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, session]);

  if (status === 'loading' || loading) return <Skeleton />;
  if (error) return <div>Error: {error}</div>;

  // Asegúrate de que `data` no sea nulo antes de renderizar
  if (!data) {
    return <Skeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-800 dark:shadow-black">

      <div className="flex flex-col items-center p-8">

        <LogoGravatar
          email={session.user.email || 'usuario@example.com'}
          className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4"
        />

        <h1 className="text-3xl font-bold dark:text-white text-slate-700 mb-2">{data.name || 'Nombre no disponible'}</h1>
        <p className="dark:text-white text-gray-400 text-sm mb-8">
          Fecha de creación: {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'No disponible'}
        </p>
        
        <div className="w-full space-y-6 bg-gray-100 p-6 rounded-lg dark:bg-zinc-600">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/4 mb-2 md:mb-0">
              <label className="text-base font-semibold dark:text-white  text-black">Username</label>
            </div>
            <div className="w-full md:w-3/4">
              <p className="text-gray-700 dark:text-white">{data.username || 'Username no disponible'}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/4 mb-2 md:mb-0">
              <label className="text-base font-semibold text-black dark:text-white">Email</label>
            </div>
            <div className="w-full md:w-3/4">
              <p className="text-gray-700 dark:text-white">{data.email || 'Correo no disponible'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}