// src/components/challenges/RelatedChallenges.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChartBarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return "En progreso";
  return new Date(dateString).toLocaleDateString();
};

// Definir colores para los estados de challenge
const statusColors = {
  approved: 'text-green-500',
  disapproved: 'text-red-500',
  progress: 'text-yellow-500',
  init: 'text-blue-500',
  withdrawal: 'text-purple-500',
  retry: 'text-orange-500',
};

const RelatedChallenges = ({ currentChallenge }) => {
  const [relatedChallenges, setRelatedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Verificar si tenemos un challenge actual y un parentId
    if (!currentChallenge || (!currentChallenge.parentId && !currentChallenge.documentId)) {
      setLoading(false);
      return;
    }

    const fetchRelatedChallenges = async () => {
      try {
        setLoading(true);
        // Usar el parentId si existe, o el documentId del challenge actual como parentId
        const parentId = currentChallenge.parentId || currentChallenge.documentId;
        
        // Consultar los challenges relacionados por parentId
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenges?filters[parentId][$eq]=${parentId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error al obtener challenges relacionados: ${response.status}`);
        }

        const data = await response.json();
        
        // Si la consulta por parentId no devuelve resultados, intentar buscar por documentId
        if (data.data.length === 0 && currentChallenge.documentId) {
          // Puede que el challenge actual sea el padre, buscar por su documentId
          const childrenResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenges?filters[parentId][$eq]=${currentChallenge.documentId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json();
            if (childrenData.data.length > 0) {
              // Encontramos hijos, incluir el challenge actual y ordenar
              const allChallenges = [...childrenData.data, currentChallenge];
              setRelatedChallenges(
                allChallenges.sort((a, b) => a.phase - b.phase)
              );
              setLoading(false);
              return;
            }
          }
        }

        // Si encontramos challenges relacionados por parentId, ordenarlos por fase
        if (data.data.length > 0) {
          // Asegurarse de incluir el challenge actual si no está en la lista
          let challenges = data.data;
          const currentIncluded = challenges.some(c => c.documentId === currentChallenge.documentId);
          
          if (!currentIncluded) {
            challenges = [...challenges, currentChallenge];
          }
          
          // Ordenar los challenges por fase
          setRelatedChallenges(
            challenges.sort((a, b) => a.phase - b.phase)
          );
        } else {
          // Si no hay challenges relacionados, mostrar solo el actual
          setRelatedChallenges([currentChallenge]);
        }
      } catch (err) {
        console.error("Error obteniendo challenges relacionados:", err);
        setError(err.message);
        // En caso de error, mostrar al menos el challenge actual
        setRelatedChallenges([currentChallenge]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedChallenges();
  }, [currentChallenge]);

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3">Cargando challenges relacionados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
        <div className="text-red-500">
          Error al cargar challenges relacionados: {error}
        </div>
      </div>
    );
  }

  // Si solo tenemos un challenge (el actual), no mostrar la sección
  if (relatedChallenges.length <= 1) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md dark:text-white dark:border-zinc-700 dark:shadow-black">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold">
          Fases anteriores de este Challenge
        </h2>
        {isExpanded ? (
          <ChevronUpIcon className="h-6 w-6" />
        ) : (
          <ChevronDownIcon className="h-6 w-6" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {relatedChallenges.map((challenge) => (
            <div 
              key={challenge.documentId} 
              className={`p-3 rounded-lg border ${
                challenge.documentId === currentChallenge.documentId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-zinc-700"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Fase {challenge.phase} - {" "}
                    <span className={statusColors[challenge.result] || "text-gray-500"}>
                      {challenge.result}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                  </p>
                </div>
                
                <div>
                  {challenge.documentId === currentChallenge.documentId ? (
                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      Actual
                    </span>
                  ) : challenge.result === 'progress' || challenge.result === 'init' ? (
                    <Link href={`/metrix2/${challenge.documentId}`}>
                      <button className="flex items-center justify-center space-x-2 px-3 py-1 border rounded-lg shadow-sm bg-blue-200 hover:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-600 border-blue-300 dark:border-blue-500">
                        <ChartBarIcon className="h-4 w-4 text-blue-600 dark:text-blue-200" />
                        <span className="text-xs dark:text-blue-200">Metrix Live</span>
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/historial/${challenge.documentId}`}>
                      <button className="flex items-center justify-center space-x-2 px-3 py-1 border rounded-lg shadow-sm bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 border-gray-300 dark:border-zinc-500">
                        <ChartBarIcon className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-xs dark:text-gray-200">Historial</span>
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedChallenges;