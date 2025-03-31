import Link from 'next/link';
import { useRouter } from 'next/router';
import { navigation } from './links'; // Importar desde links.js
import { principalButton } from './links';
import { useEffect, useState, useRef } from 'react';

export default function Sidebar() {
    const router = useRouter();
    const [windowHeight, setWindowHeight] = useState(null);
    const scrollableRef = useRef(null);

    // Effect to handle window resize and set initial height
    useEffect(() => {
        // Set initial height
        setWindowHeight(window.innerHeight);
        
        // Handle window resize
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup event listener
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Prevenir la propagación del scroll cuando se alcanza el límite
    useEffect(() => {
        const scrollableElement = scrollableRef.current;
        
        if (!scrollableElement) return;
        
        const handleWheel = (e) => {
            const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
            
            // Si estamos en el tope y se intenta hacer scroll hacia arriba
            if (scrollTop === 0 && e.deltaY < 0) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Si estamos al final y se intenta hacer scroll hacia abajo
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
        <div
            className="relative dark:bg-zinc-800 rounded-xl border-2 dark:border-0 dark:border-zinc-700 dark:shadow-black border-gray-200 dark:text-white"
            style={{ 
                minWidth: '16rem',
                height: 'auto', // Se ajusta automáticamente al contenido
                maxHeight: windowHeight ? `${windowHeight - 40}px` : '100vh' // Límite máximo para pantallas grandes
            }}
        >
            <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
                <Link href={principalButton[0].href} passHref>
                    <button className="bg-[var(--app-primary)] rounded-md text-white font-semibold px-4 py-3 w-full hover:bg-[var(--app-secondary)] transition duration-200">
                        {principalButton[0].name}
                    </button>
                </Link>

                <p className="text-black dark:text-white font-semibold text-lg mt-8">
                    Menú principal
                </p>
            </div>

            <div 
                ref={scrollableRef}
                className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-amber-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-600"
                style={{ 
                    maxHeight: windowHeight ? `${windowHeight - 240}px` : 'none', // Altura reducida según feedback visual
                    overscrollBehavior: 'contain' // Previene el scroll-chaining
                }}
            >
                {navigation.map(({ icon: Icon, name, id, href }) => (
                    <Link
                        href={href}
                        key={id}
                        className={`w-full flex items-center py-4 px-6 font-semibold transition duration-200 last:rounded-b-md relative h-16 text-sm
                        ${router.pathname === href
                            ? 'bg-gradient-to-r from-amber-50 via-white to-transparent border-l-4 border-[var(--app-primary)] dark:bg-gradient-to-r dark:from-amber-800 dark:via-zinc-800 dark:to-transparent dark:border-l-4 dark:border-[var(--app-primary)]'
                            : 'hover:bg-zinc-300 dark:hover:bg-zinc-700'
                        }`}
                    >
                        <div
                            className={`absolute inset-0 ${router.pathname === href
                                ? 'opacity-100'
                                : 'opacity-0 hover:opacity-50'
                            } transition-opacity duration-200`}
                            style={{
                                clipPath: 'polygon(0 0, 90% 0, 10% 100%, 0 100%)',
                            }}
                        ></div>
                        <Icon
                            className={`h-6 w-6 mr-4 z-10 ${router.pathname === href
                                ? 'text-[var(--app-primary)] dark:text-[var(--app-primary)]'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                        />
                        <p
                            className={`text-md z-10 font-medium ${router.pathname === href
                                ? 'text-[var(--app-primary)] dark:text-[var(--app-primary)]'
                                : 'text-gray-700 dark:text-white'
                            }`}
                        >
                            {name}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}