import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Gift } from 'lucide-react';
import TicketsList from './TicketsList';
import Image from 'next/image'; // Importamos el componente Image de Next.js

export default function ModalRoullete() {
  return (
    <Dialog>
      <DialogTrigger className="p-1 bg-black text-[var(--app-primary)] rounded-full hover:bg-[var(--app-primary)] hover:text-black transition-colors duration-300">
        <img 
          src="/images/sorteo.svg" 
          alt="Sorteo" 
          width={30} 
          height={30}
          className="w-24 h-24"
        />
      </DialogTrigger>
      <DialogContent className="bg-black text-[var(--app-primary)] p-0 rounded-lg border-2 border-[var(--app-primary)] shadow-[0_0_20px_rgba(255,215,0,0.3)] max-w-md w-full max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 border-b border-[var(--app-primary)]/20 bg-gradient-to-b from-black ">
          <DialogTitle className="text-2xl font-bold text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-black border-2 border-[var(--app-primary)] flex items-center justify-center shadow-[0_0_10px_rgba(255,215,0,0.3)]">
              <Gift className="h-8 w-8 text-[var(--app-primary)]" />
            </div>
            <span>Mis Tickets</span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content area with improved styling */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] py-4 px-4 bg-black">
          <TicketsList />
          {/* Hidden gradient at bottom to fade out scrollable content */}
          <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t to-transparent pointer-events-none -mt-4"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}