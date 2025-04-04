// src/pages/dashboard/neoCard.js
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/solid';
import { TrophyIcon } from '@heroicons/react/24/outline';

export default function NeoChallengeCard() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-all">
            <div className="absolute h-1 top-0 left-0 right-0 bg-[var(--app-primary)]"></div>
            
            <div className="p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 rounded-full bg-[var(--app-primary)]/10">
                            <TrophyIcon className="w-5 h-5 text-[var(--app-primary)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">ZEVEN CHALLENGE</h2>
                    </div>
                    
                    <p className="text-[var(--app-primary)] font-semibold mt-2">
                        Opere hasta $200,000 en la Zeven Account
                    </p>
                    
                    <p className="text-sm mt-4 text-gray-600 dark:text-gray-300 max-w-xl">
                        Demuestre sus habilidades de trading. ¡Apruebe el curso de evaluación y reciba la Zeven Account!
                    </p>
                </div>
                
                {/* Contenedor centrado en desktop, contenido siempre alineado a la izquierda */}
                <div className="flex justify-start md:justify-center mx-auto w-full mt-6">
                    <div className="mx-auto space-y-3 flex flex-col items-start md:w-3/4 bg-white/60 dark:bg-zinc-800/60 p-4 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                        <div className="flex items-center space-x-2">
                            <div className="p-1 rounded-full bg-[var(--app-primary)]/10">
                                <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200">Le facilitaremos una Zeven Account de hasta $200,000 USD</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="p-1 rounded-full bg-[var(--app-primary)]/10">
                                <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200">Demuestre sus habilidades de trading</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="p-1 rounded-full bg-[var(--app-primary)]/10">
                                <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200">Análisis completo de cuenta</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="p-1 rounded-full bg-[var(--app-primary)]/10">
                                <CheckIcon className="h-4 w-4 text-[var(--app-primary)]" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200">Aplicaciones Premium</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <Link href="/start-challenge">
                        <button className="px-6 py-3 w-full md:w-auto md:min-w-[250px] bg-[var(--app-primary)] text-black font-semibold rounded-lg shadow-md hover:bg-[var(--app-secondary)] transition-all">
                            Iniciar Zeven Challenge
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}