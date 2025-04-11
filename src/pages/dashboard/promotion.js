// src/pages/dashboard/promotion.js
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const fetcher = async (url, token) => {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return { data: [] }; // Retorna un objeto con estructura correcta pero vacío
  }
};

export default function PromotionBanner() {
  const { data: session } = useSession();
  const [api, setApi] = useState(null);
  const autoplayRef = useRef(null);

  // Se consulta la promoción solo si existe un token
  const { data, error, isLoading } = useSWR(
    session?.jwt ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions`, session.jwt] : null,
    ([url, token]) => fetcher(url, token),
    { 
      revalidateOnFocus: false, // Evita refetch al cambiar pestañas
      errorRetryCount: 2 // Limita los reintentos en caso de error
    }
  );

  // Configurar el autoplay para el carrusel
  useEffect(() => {
    if (!api) return;

    // Limpiar cualquier intervalo existente
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }

    // Iniciar autoplay cada 3 segundos
    autoplayRef.current = setInterval(() => {
      api.scrollNext();
    }, 3000);

    // Limpiar cuando el componente se desmonte
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [api]);

  // Si está cargando, no hay sesión o hay error, no mostrar nada
  if (isLoading || !session?.jwt) {
    return null;
  }

  // Asegurar que tenemos una estructura de datos válida
  const promotionData = data || { data: [] };
  const promotions = Array.isArray(promotionData.data) ? promotionData.data : [];

  // Filtrar promociones activas y con URL válida
  const activePromotions = promotions.filter(promo => 
    promo && promo.isActive !== false && promo.url
  );

  // Si no hay promociones activas
  if (!activePromotions.length) {
    return null;
  }

  // Si solo hay una promoción, renderizarla directamente
  if (activePromotions.length === 1) {
    const promotion = activePromotions[0];
    const imageUrl = promotion.url;

    return (
      <div className="my-4">
        <img
          src={imageUrl}
          alt={promotion.name || "Promoción"}
          className="w-full h-40 object-cover rounded-md"
          onError={(e) => {
            e.target.style.display = 'none'; // Oculta imagen si hay error
          }}
        />
      </div>
    );
  }

  // Para múltiples promociones, usar el carrusel
  return (
    <div className="my-4">
      <Carousel
        className="w-full"
        opts={{
          loop: true,
          align: "center",
          skipSnaps: false,
          duration: 40
        }}
        setApi={setApi}
      >
        <CarouselContent>
          {activePromotions.map((promotion, index) => (
            <CarouselItem key={`promo-${index}`} className="basis-full">
              <img
                src={promotion.url}
                alt={promotion.name || `Promoción ${index + 1}`}
                className="w-full h-40 object-cover rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none'; // Oculta imagen si hay error
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Indicadores simplificados */}
        {activePromotions.length > 1 && (
          <div className="absolute z-10 bottom-2 left-0 right-0 flex justify-center gap-1">
            {activePromotions.map((_, index) => (
              <button
                key={`dot-${index}`}
                className="w-2 h-2 rounded-full bg-white/60 hover:bg-white"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ir a promoción ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
}