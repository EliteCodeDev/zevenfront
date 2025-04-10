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
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Error: ${res.statusText}`);
  }
  return res.json();
};

export default function PromotionBanner() {
  const { data: session } = useSession();
  const [api, setApi] = useState(null);
  const autoplayRef = useRef(null);

  // Se consulta la promoción solo si existe un token
  const { data, error, isLoading } = useSWR(
    session?.jwt ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promotions?populate=*`, session.jwt] : null,
    ([url, token]) => fetcher(url, token)
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
  if (isLoading || error || !session?.jwt) {
    return null;
  }

  // Si no hay datos, no mostrar nada
  if (!data || !data.data || data.data.length === 0) {
    return null;
  }

  // Extraer promociones
  const promotions = data.data || [];

  // Filtrar promociones activas
  const activePromotions = promotions.filter(promo => {
    return promo.isActive !== false; // Si no está marcado como inactivo, lo consideramos activo
  });

  // Si no hay promociones activas, no mostrar nada
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
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Indicadores simplificados */}
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
      </Carousel>
    </div>
  );
}