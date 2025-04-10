import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Gift } from 'lucide-react';
import TicketsList from './TicketsList';
import { useSession } from "next-auth/react";
import { useStrapiData as strapiJWT } from 'src/services/strapiServiceJWT';

export default function ModalRoulette() {
  const TICKET_ID = process.env.NEXT_PUBLIC_TICKET_ID || 0;
  const { data: session } = useSession();
  const { data: user } = strapiJWT('users/me', session?.jwt || '');

  const scrollableRef = useRef(null);

  const handleBuyTicket = () => {
    // Lógica para comprar ticket
    console.log("Comprar ticket");
    window.location.href = `https://neocapitalfunding.com/checkout/?add-to-cart=${TICKET_ID}&quantity=1&user_id=${user.documentId}`;
  };

  // Prevenir el scroll-chaining cuando se alcanza el tope o el final del contenedor scrollable
  useEffect(() => {
    const scrollableElement = scrollableRef.current;
    if (!scrollableElement) return;

    const handleWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = scrollableElement;

      // Si se intenta hacer scroll hacia arriba estando en el tope
      if (scrollTop === 0 && e.deltaY < 0) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Si se intenta hacer scroll hacia abajo estando al final
      if (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    scrollableElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollableElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger className="z-10 p-1 bg-zinc-700 text-blue-400 rounded-full hover:bg-blue-500 hover:text-black transition-colors duration-300">
        <img
          src="/images/ruletaZeven.svg"
          alt="Sorteo"
          width={30}
          height={30}
          className="w-24 h-24 rounded-full"
        />
      </DialogTrigger>

      {/* Forzamos que el contenido del modal se muestre por encima */}
      <DialogContent
        className="
          z-[9999] 
          bg-zinc-900 
          text-white 
          p-0 
          rounded-lg 
          border-2 
          border-blue-400 
          shadow-[0_0_20px_rgba(59,130,246,0.25)] 
          max-w-sm 
          w 
          max-h-[90vh] 
          overflow-hidden
        "
      >
        <DialogHeader className="p-6 border-b border-[var(--app-primary800)] bg-gradient-to-b from-zinc-900 to-zinc-800">
          <DialogTitle className="text-2xl font-bold text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-[var(--app-primary)] flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Gift className="h-8 w-8 text-[var(--app-primary)]" />
            </div>
            <span className="text-[var(--app-primary)]">Mis Tickets</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center p-4">
          <button
            onClick={handleBuyTicket}
            className="px-6 py-3 bg-[var(--app-primary)] text-white font-bold rounded-lg hover:brightness-110 transition-all duration-300 shadow-md w-full"
          >
            Comprar Ticket
          </button>
        </div>

        {/* Área scrollable con el comportamiento de scroll personalizado */}
        <div
          ref={scrollableRef}
          className="overflow-y-auto max-h-[calc(80vh-140px)] py-4 pb-20 px-4 bg-zinc-900 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-blue-600"
          style={{ overscrollBehavior: 'contain' }}
        >
          <TicketsList />
          <div className="sticky bottom-0 left-0 right-0 h-4 pointer-events-none -mt-4"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}