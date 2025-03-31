import React, { useState } from 'react';
import Link from 'next/link';
import {
  TicketIcon,
  ClockIcon,
  XCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Gift } from 'lucide-react';
import RuletaSorteo from './RoulleteWo';
import { useStrapiData } from '@/services/strapiService';
import { useSession } from "next-auth/react";

// Variables de estilo
const styleVars = {
  "--app-primary": "#FFD700", // Color amarillo dorado
  "--app-secondary": "#FFFFFF", // Color secundario (blanco)
};

// Componente TicketCard minimalista
const TicketCard = ({ ticket, onOpenRoulette }) => {
  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="group border border-gray-200 hover:border-[var(--app-primary)] rounded-lg bg-black p-3 mb-2 transition-all">
      <div className="flex justify-between items-center">
        {/* Identificador del ticket */}
        <div className="flex items-center gap-2">
          <span className="bg-[var(--app-primary)] text-black text-xs font-bold px-2 py-1 rounded">
            #{ticket.id}
          </span>
          <span className="text-[var(--app-primary)] font-medium text-sm">
            {ticket.codigo || 'Sin código'}
          </span>
        </div>

        {/* Estado del ticket */}
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${ticket.habilitado ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {ticket.habilitado ? 'Disponible' : 'Usado'}
          </span>
        </div>
      </div>

      {/* Información y acciones */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex flex-col">
          {/* Descuento o premio */}
          {ticket.porcentaje && (
            <span className="text-green-500 text-xs">
              {ticket.porcentaje}% descuento
            </span>
          )}
          {ticket.premio && (
            <span className="text-[var(--app-primary)] text-xs">
              Premio: {ticket.premio}
            </span>
          )}
          {/* Fecha de expiración */}
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Exp: {formatDate(ticket.fechaExpiracionTicket)}
          </span>
        </div>

        {/* Botón de acción */}
        <div>
          {ticket.habilitado && !ticket.premio ? (
            <button
              onClick={() => onOpenRoulette(ticket)}
              className="bg-[var(--app-primary)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors"
            >
              Girar
            </button>
          ) : (
            <button
              className="bg-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded opacity-70"
              disabled
            >
              {ticket.premio ? 'Reclamado' : 'Usado'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main TicketCards component
export default function TicketCards() {
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { data: session } = useSession();
  

  // This is a placeholder - you would use your actual data fetching method
  const { data: tickets, error, isLoading } = useStrapiData(`tickets?populate=users_permissions_user&filters[users_permissions_user][email][$eq]=${session?.user?.email || ''}`);

  // Function to open roulette modal
  const handleOpenRoulette = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  // Modal component
  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50">
                <GiftIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Ruleta de Premios</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mb-6 text-center">Gira la ruleta y descubre tu premio. ¡Buena suerte!</p>
          {children}
        </div>
      </div>
    );
  };

  // Render loading state or error
  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
      <span className="text-gray-700">Cargando tickets...</span>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-8 text-red-600 bg-red-50 rounded-lg border border-red-100 text-center">
      <XCircleIcon className="h-10 w-10 mx-auto mb-2 text-red-500" />
      <p className="text-lg font-medium">Error al cargar los tickets</p>
      <p className="text-gray-600 mt-1">Por favor, intenta nuevamente</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <TicketIcon className="h-7 w-7 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Mis Tickets</h1>
        </div>

        <p className="text-gray-600">Gestiona tus tickets y obtén premios especiales</p>
      </div>

      {/* Show message if no tickets */}
      {(!tickets || tickets.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="bg-gray-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <TicketIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">No tienes tickets disponibles</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Los tickets que adquieras aparecerán en esta sección
          </p>
        </div>
      )}

      {/* Tickets list */}
      <div className="space-y-6">
        {tickets && tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onOpenRoulette={handleOpenRoulette}
          />
        ))}
      </div>

      {/* Modal with Roulette */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedTicket && (
          <RuletaSorteo documentId={selectedTicket.id} onClose={() => setIsModalOpen(false)} />
        )}
      </Modal>
    </div>
  );
}