// src/pages/dashboard/neoCard.js
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/solid';

export default function NeoChallengeCard() {
    return (
        <div className="p-6 bg-zinc-800 text-white rounded-lg shadow-md w-full mx-auto">
            <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold">NEO CHALLENGE</h2>
                <p className="text-[var(--app-primary)] mt-2">Opere hasta $200,000 en la NEO Account</p>
                <p className="text-sm mt-4">Demuestre sus habilidades de trading. ¡Apruebe el curso de evaluación y reciba la NEO Account!</p>
            </div>
            
            {/* Contenedor centrado para la lista de características */}
            <div className="flex justify-center w-full">
                <div className="mt-6 space-y-3 flex flex-col items-center md:items-start md:w-3/4">
                    <div className="flex items-center space-x-2">
                        <CheckIcon className="h-5 w-5 text-[var(--app-primary)]" />
                        <span>Le facilitaremos una NEO Account de hasta $200,000 USD</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckIcon className="h-5 w-5 text-[var(--app-primary)]" />
                        <span>Demuestre sus habilidades de trading</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckIcon className="h-5 w-5 text-[var(--app-primary)]" />
                        <span>Análisis completo de cuenta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckIcon className="h-5 w-5 text-[var(--app-primary)]" />
                        <span>Aplicaciones Premium</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 text-center">
                <Link href="/start-challenge">
                    <button className="px-6 py-3 w-full bg-[var(--app-primary)] text-black font-semibold rounded-lg shadow-md hover:bg-[var(--app-secondary)] transition">
                        Iniciar NEO Challenge
                    </button>
                </Link>
            </div>
        </div>
    );
}