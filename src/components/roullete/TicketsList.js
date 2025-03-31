import React, { useState } from 'react';
import {
  TicketIcon,
  ClockIcon,
  XCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import RuletaSorteo from './RoulleteWo';
import { useStrapiData } from '@/services/strapiService';
import { useSession } from "next-auth/react";
import { createPortal } from 'react-dom';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
// Minimalistic TicketCard component
const TicketCard = ({ ticket, onOpenRoulette }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  const copiarCodigo = () => {
    if (ticket.codigo) {
      navigator.clipboard.writeText(ticket.codigo)
        .then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        })
        .catch(err => {
          console.error('Error al copiar el código: ', err);
        });
    }
  };
  const [copiado, setCopiado] = useState(false);
  console.log(ticket)
  return (
    <div className="mb-3 hover:transform hover:scale-[1.01] transition-all duration-300">
      <div className="bg-black/70 border border-[var(--app-primary)]/30 rounded-lg p-4 hover:border-[var(--app-primary)]/70 transition-colors">
        <div className="flex items-center gap-3">
          {/* Left: Icon and ticket number */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-black rounded-full border border-[var(--app-primary)]/50">
              <TicketIcon className="h-6 w-6 text-[var(--app-primary)]" />
            </div>
          </div>

          {/* Center: Ticket info */}
          <div className="flex-1 min-w-0 p-3  rounded-lg shadow-md ">
  <div className="flex flex-col">
    {/* Encabezado con ID, porcentaje y estado */}
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-600">#{ticket.id}</span>
      <div className="flex items-center text-xs">
        <div className={`w-3 h-3 rounded-full mr-2 ${ticket.habilitado ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`font-medium ${ticket.habilitado ? 'text-green-600' : 'text-red-500'}`}>
          {ticket.habilitado ? 'Disponible' : 'Utilizado'}
        </span>
      </div>
    </div>



    {/* Código y botón de copiar */}
    <div className="flex items-center justify-between mt-2">

  <span className="text-2xl font-semibold text-amber-500">{ticket.porcentaje}%</span>

 <div className='flex'>
 <h3 className="font-bold text-xl text-gray-400 truncate">
    {ticket.codigo || 'No definido'}
  </h3>
      
      <div className="relative flex-shrink-0 flex items-center">
        <button
          onClick={copiarCodigo}
          className="p-2 rounded-full transition-all"
          title="Copiar código"
        >
          {copiado ? (
            <CheckIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
        {copiado && (
          <div className="ml-2 text-xs text-green-600 bg-gray-800/80 py-1 px-2 rounded-md whitespace-nowrap">
            ¡Copiado!
          </div>
        )}
      </div>

 </div>


    </div>

    {/* Fecha de expiración */}
    <div className="flex items-center text-xs text-gray-500 mt-2">
      <ClockIcon className="h-4 w-4 mr-1" />
      <span>Válido hasta: {formatDate(ticket.fechaExpiracionTicket)}</span>
    </div>
  </div>
</div>

        </div>

        {/* Bottom action section */}
        <div className="mt-3 pt-3 border-t border-[var(--app-primary)]/20">
          {ticket.premio ? (
            <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded border border-[var(--app-primary)]/20">
              <GiftIcon className="h-5 w-5 text-[var(--app-primary)]" />
              <div className="flex-1 truncate">
                <span className="text-xs text-gray-400">Premio:</span>
                <p className="font-medium text-[var(--app-primary)] truncate">{ticket.premio}</p>
                
              </div>
            </div>
          ) : (
            ticket.habilitado ? (
              <button
                onClick={() => onOpenRoulette(ticket)}
                className="w-full bg-[var(--app-primary)] hover:brightness-110 text-black font-medium py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-25" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Girar Ruleta</span>
              </button>
            ) : (
              <div className="w-full bg-red-700/50 border border-red-500/50 text-white text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2">
                <XCircleIcon className="h-4 w-4" />
                <span>Ticket Utilizado</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Independent RouletteModal Component
const RouletteModal = ({ isOpen, onClose, ticket, onTicketUsed }) => { // Añadido onTicketUsed
  if (!isOpen || typeof document === 'undefined') return null;

  // Using portal to render the modal outside of the parent DOM hierarchy
  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        // Close when clicking outside the modal content
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenido del modal con dimensiones responsivas */}
      <div
        className="relative z-10 bg-black rounded-lg w-full max-w-md mx-auto flex flex-col items-center overflow-hidden"
        style={{
          border: '2px solid #FFD700',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          height: '520px',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
      >
        {/* Botón de cerrar */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="text-yellow-500 hover:text-white bg-black/80 rounded-full p-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header text - Mejor centrado */}
        <div className="relative z-10 text-center pt-4 pb-2">
          <h3 className="text-2xl font-bold text-yellow-400">¡Gira la Ruleta!</h3>
        </div>

        {/* Sección para la ruleta - Centrada verticalmente */}
        <div className="flex-grow flex flex-col justify-center items-center w-full px-2 py-4">
          <RuletaSorteo
            documentId={ticket?.documentId}
            onClose={onClose}
            // Añadido: callback para cuando se recibe un premio
            onPrizeReceived={() => {
              // Llamar a onTicketUsed con el ID del ticket cuando se recibe un premio
              if (ticket && ticket.id) {
                onTicketUsed(ticket.id);
              }
            }}
            width={240}
            height={240}
            customStyle={{
              background: 'transparent',
              boxShadow: 'none',
              margin: '0 auto',
              padding: 0
            }}
          />
        </div>

        {/* Espacio para que el botón de "Girar" del componente RuletaSorteo tenga suficiente espacio */}
        <div className="h-4 md:h-6 w-full"></div>
      </div>
    </div>,
    document.body // Mount the portal directly to the body element
  );
};

// Main TicketsList component
export default function TicketsList() {
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { data: session } = useSession();

  // Nuevo: estado para rastrear tickets utilizados mediante la ruleta
  const [usedTickets, setUsedTickets] = useState(new Set());

  // Fetch tickets data
  const { data: tickets, error, isLoading } = useStrapiData(
    `tickets?populate=users_permissions_user&filters[users_permissions_user][email][$eq]=${session?.user?.email || ''}`
  );

  // Function to open roulette modal
  const handleOpenRoulette = (ticket) => {
    setSelectedTicket(ticket);
    setIsRouletteOpen(true);
  };

  // Nuevo: función para marcar un ticket como utilizado después de un giro exitoso
  const handleTicketUsed = (ticketId) => {
    // Actualiza el estado local para marcar este ticket como utilizado
    setUsedTickets(prev => {
      const newSet = new Set(prev);
      newSet.add(ticketId);
      return newSet;
    });
  };

  // Nuevo: función auxiliar para verificar si un ticket está utilizado (ya sea desde API o estado local)
  const isTicketUsed = (ticket) => {
    return !ticket.habilitado || usedTickets.has(ticket.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--app-primary)] border-t-transparent rounded-full"></div>
        <span className="ml-3 text-[var(--app-primary)]/80">Cargando tickets...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-2" />
        <p>Error al cargar los tickets</p>
      </div>
    );
  }

  // No tickets state
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-black/50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-[var(--app-primary)]/30">
          <TicketIcon className="h-8 w-8 text-[var(--app-primary)]/70" />
        </div>
        <p className="text-[var(--app-primary)] mb-2">No tienes tickets disponibles</p>
        <p className="text-gray-400 text-sm">Los tickets que adquieras aparecerán aquí</p>
      </div>
    );
  }

  // Render tickets list
  return (
    <div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            // Modificado: Sobreescribe la propiedad habilitado basado en estado local
            ticket={{ ...ticket, habilitado: !isTicketUsed(ticket) }}
            onOpenRoulette={handleOpenRoulette}
          />
        ))}
      </div>

      {/* Roulette modal - Modificado para pasar onTicketUsed */}
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        ticket={selectedTicket}
        onTicketUsed={handleTicketUsed} // Nuevo: pasa el callback para marcar tickets como usados
      />
    </div>
  );
}