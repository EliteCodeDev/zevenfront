import React, { useState } from 'react';
import {
  TicketIcon,
  ClockIcon,
  XCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import RuletaSorteo from './RoulleteWo';
import { useStrapiData } from '@/services/strapiServiceJWT';
import { useSession } from "next-auth/react";
import { createPortal } from 'react-dom';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

// Minimalistic TicketCard component
const TicketCard = ({ ticket, onOpenRoulette }) => {
  const [copiado, setCopiado] = useState(false);

  // Función para formatear fechas (si no hay fecha, muestra 'sin limite')
  const formatDate = (dateString) => {
    if (!dateString) return 'sin limite';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Copiar el código al portapapeles
  const copiarCodigo = () => {
    if (ticket.codigo) {
      navigator.clipboard
        .writeText(ticket.codigo)
        .then(() => {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        })
        .catch((err) => {
          console.error('Error al copiar el código: ', err);
        });
    }
  };

  return (
    <div className="mb-3 transform transition-all duration-300 hover:scale-[1.01]">
      <div className="bg-zinc-800/90 border border-blue-700 rounded-lg p-3 hover:border-blue-500 transition-colors shadow-md hover:shadow-blue-900/30">
        {/* Fila superior (icono, ID, estado y porcentaje) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Sección: icono, ID y estado */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-900 rounded-full flex items-center justify-center shadow-inner">
              <TicketIcon className="h-5 w-5 text-blue-400" />
            </div>

            <span className="text-sm font-medium text-gray-300">#{ticket.id}</span>

            <div className="flex items-center text-xs">
              <div
                className={`w-2.5 h-2.5 rounded-full mr-1 ${ticket.habilitado ? 'bg-emerald-500' : 'bg-rose-500'}`}
              ></div>
              <span
                className={`font-medium ${ticket.habilitado ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {ticket.habilitado ? 'Disponible' : 'Utilizado'}
              </span>
            </div>
          </div>

          {/* Porcentaje de descuento o recompensa */}
          <span className="text-xl font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-md">
            {ticket.reward?.porcentaje}%
          </span>
        </div>

        {/* Contenedor del código y la fecha */}
        <div className="bg-zinc-900/80 rounded-lg shadow-md p-3 mt-3 border-l-2 border-blue-600">
          {/* Código y botón de copiar */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-100 truncate">
              {ticket.codigo || 'No definido'}
            </h3>

            <div className="relative flex-shrink-0 flex items-center">
              <button
                onClick={copiarCodigo}
                className="p-1.5 rounded-full hover:bg-blue-800/30 transition-all"
                title="Copiar código"
              >
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-300 hover:text-blue-300" />
              </button>
              {copiado && (
                <div className="ml-1.5 text-xs text-emerald-400 bg-zinc-800/90 py-0.5 px-1.5 rounded-md whitespace-nowrap shadow-md">
                  ¡Copiado!
                </div>
              )}
            </div>
          </div>

          {/* Fecha de expiración o nombre de la recompensa */}
          <div className="flex items-center text-xs text-gray-400 mt-2 bg-zinc-800/50 p-1.5 rounded">
            <ClockIcon className="h-3.5 w-3.5 mr-1.5 text-blue-300" />
            {ticket.habilitado ? (
              <span>Válido hasta: {formatDate(ticket.fechaExpiracionTicket)}</span>
            ) : (
              <div className="flex justify-between w-full">
                <span>Válido hasta: {formatDate(ticket.fechaExpiracionPremio)}</span>
                <span className="text-blue-300">Recompensa: {ticket.reward?.nombre || '-'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sección inferior: premio o botón para girar la ruleta */}
        <div className="mt-3 pt-2 border-t border-blue-800/50">
          {ticket.premio ? (
            <div className="flex items-center gap-2 bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-700/40 shadow-md">
              <div className="p-1.5 bg-blue-800/40 rounded-full">
                <GiftIcon className="h-4 w-4 text-blue-300" />
              </div>
              <div className="flex-1 truncate">
                <span className="text-xs text-gray-400 block">Premio:</span>
                <p className="font-medium text-blue-300 truncate">
                  {ticket.premio}
                </p>
              </div>
            </div>
          ) : ticket.habilitado ? (
            <button
              onClick={() => onOpenRoulette(ticket)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-blue-900/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 animate-spin-slow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-25" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Girar Ruleta</span>
            </button>
          ) : (
            <div className="w-full bg-rose-900/50 border border-rose-700/50 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-md">
              <XCircleIcon className="h-4 w-4" />
              <span>Ticket Utilizado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Independent RouletteModal Component
const RouletteModal = ({ isOpen, onClose, ticket, onTicketUsed }) => {
  if (!isOpen || typeof document === 'undefined') return null;

  // Using portal to render the modal outside of the parent DOM hierarchy
  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
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
        className="relative z-10 bg-gradient-to-b from-zinc-900 to-zinc-800 rounded-xl w-full max-w-md mx-auto flex flex-col items-center overflow-hidden"
        style={{
          border: '2px solid #3B82F6',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          height: '580px',
          maxHeight: '85vh'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the backdrop
      >
        {/* Botón de cerrar */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-white bg-zinc-800/90 hover:bg-blue-800/50 rounded-full p-1.5 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header text - Mejorado */}
        <div className="relative z-10 text-center py-4 w-full bg-gradient-to-r from-blue-900/50 via-blue-800/30 to-blue-900/50 border-b border-blue-700/50 mb-3 shadow-md">
          <h3 className="text-2xl font-bold text-blue-300">¡Gira la Ruleta!</h3>
          <p className="text-gray-300 text-sm mt-0.5">Consigue premios increíbles</p>
        </div>

        {/* Sección para la ruleta - Centrada verticalmente con efectos */}
        <div className="flex-grow flex flex-col justify-center items-center w-full relative">
          {/* Efecto de resplandor detrás de la ruleta */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 rounded-full bg-blue-500/10 blur-xl"></div>
          </div>
          
          <RuletaSorteo
            documentId={ticket?.documentId}
            onClose={onClose}
            // Callback para cuando se recibe un premio
            onPrizeReceived={() => {
              // Llamar a onTicketUsed con el ID del ticket cuando se recibe un premio
              if (ticket && ticket.id) {
                onTicketUsed(ticket.id);
              }
            }}
            width={280}
            height={280}
            customStyle={{
              background: 'transparent',
              boxShadow: 'none',
              margin: '0 auto',
              padding: 0
            }}
          />
        </div>

        {/* Espacio para que el botón de "Girar" del componente RuletaSorteo tenga suficiente espacio */}
        <div className="h-6 md:h-8 w-full bg-gradient-to-t from-zinc-900 to-transparent"></div>
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

  // Estado para rastrear tickets utilizados mediante la ruleta
  const [usedTickets, setUsedTickets] = useState(new Set());

  // Fetch tickets data (se asume que el hook retorna también un método refetch)
  const { data, error, isLoading, mutate: refetch } = useStrapiData(
    `users/me?populate[tickets][populate]=reward`,
    session?.jwt || ''
  );
  const tickets = data?.tickets || [];

  // Función para abrir el modal de la ruleta
  const handleOpenRoulette = (ticket) => {
    setSelectedTicket(ticket);
    setIsRouletteOpen(true);
  };

  // Función para cerrar la ruleta y forzar una nueva consulta de tickets
  const handleCloseRoulette = () => {
    setIsRouletteOpen(false);
    refetch();
  };

  // Función para marcar un ticket como utilizado después de un giro exitoso
  const handleTicketUsed = (ticketId) => {
    setUsedTickets((prev) => {
      const newSet = new Set(prev);
      newSet.add(ticketId);
      return newSet;
    });
  };

  // Función auxiliar para verificar si un ticket está utilizado (ya sea desde API o estado local)
  const isTicketUsed = (ticket) => {
    return !ticket.habilitado || usedTickets.has(ticket.id);
  };

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-5 bg-zinc-900/50 rounded-lg">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2 text-blue-400 text-sm">Cargando tickets...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="text-center p-6 text-red-500 bg-red-900/20 rounded-lg border border-red-700/30">
        <XCircleIcon className="h-12 w-12 mx-auto mb-2" />
        <p className="font-medium">Error al cargar los tickets</p>
        <p className="text-sm text-gray-300 mt-2">Por favor, intenta nuevamente más tarde</p>
      </div>
    );
  }

  // Estado cuando no hay tickets
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-zinc-900/50 rounded-lg border border-blue-900/30">
        <div className="bg-blue-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center border border-blue-700">
          <TicketIcon className="h-8 w-8 text-blue-400" />
        </div>
        <p className="text-blue-400 font-medium mb-1.5">No tienes tickets disponibles</p>
        <p className="text-gray-400 text-sm">Los tickets que adquieras aparecerán aquí</p>
        <button className="mt-4 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors">
          Comprar Tickets
        </button>
      </div>
    );
  }

  // Render de la lista de tickets
  return (
    <div>
      <div className="space-y-4">
        {tickets
          .sort((a, b) => {
            // Sort by habilitado: true first, then false
            const aEnabled = !isTicketUsed(a);
            const bEnabled = !isTicketUsed(b);
            if (aEnabled && !bEnabled) return -1;
            if (!aEnabled && bEnabled) return 1;
            return 0; // Keep original order for items with same status
          })
          .map((ticket) => (
            <TicketCard
              key={ticket.id}
              // Se sobreescribe la propiedad habilitado basado en el estado local
              ticket={{ ...ticket, habilitado: !isTicketUsed(ticket) }}
              onOpenRoulette={handleOpenRoulette}
            />
          ))}
      </div>

      {/* Roulette modal con onClose modificado para forzar refetch */}
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={handleCloseRoulette}
        ticket={selectedTicket}
        onTicketUsed={handleTicketUsed}
      />
    </div>
  );
}