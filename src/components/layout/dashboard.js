// src/components/layout/dashboard.js
import Navbar from "../structure/navbar";
import FooterInfo from "../structure/footer";
import Sidebar from '../structure/sidebar';
import Breadcrumb from "../Breadcrumb";
import ModalRoullete from '@/components/roullete/ModalRoullete';
import { useEffect, useState } from 'react';

export default function Layout({ children }) {
    // Estado para almacenar la altura de la navbar
    const [navbarHeight, setNavbarHeight] = useState(64); // Valor inicial aproximado

    // Efecto para medir la altura de la navbar después de que el componente se monte
    useEffect(() => {
        const navbar = document.querySelector('nav'); // Ajusta el selector según la estructura de tu navbar
        if (navbar) {
            setNavbarHeight(navbar.offsetHeight);
        }

        // Actualizar la altura si cambia el tamaño de la ventana
        const handleResize = () => {
            if (navbar) {
                setNavbarHeight(navbar.offsetHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="min-h-full">
            {/* Navbar fijo en la parte superior */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <Navbar />
            </div>

            {/* Espacio en blanco para compensar la altura del navbar fijo */}
            <div style={{ height: navbarHeight }}></div>

            <main className="text-black dark:text-white">
                {/* Estructura central */}
                <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-2">
                        {/* Contenedor para mantener el espacio del sidebar */}
                        <div className="hidden lg:block" style={{ width: '300px', flexShrink: 0 }}>
                            {/* Este div es solo un espacio reservado */}
                        </div>

                        {/* Sidebar fijo */}
                        <div className="hidden lg:block fixed" style={{
                            width: '300px',
                            top: navbarHeight,
                            paddingTop: '1.5rem', // py-12 equivalente
                            paddingLeft: '1rem',  // Ajusta según sea necesario
                            paddingRight: '1rem', // Ajusta según sea necesario
                            zIndex: 40
                        }}>
                            <div className="dark:shadow-black bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                                <Sidebar />
                            </div>
                        </div>

                        {/* Columna de contenido que se desplaza */}
                        <div className="flex-1">
                            <Breadcrumb />
                            {children}
                            <FooterInfo />
                        </div>
                    </div>
                    <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }} className='flex flex-col gap-4'>
                        <ModalRoullete />
                        {/* <ChatwootWidget /> */}
                    </div>
                </div>

            </main>
        </div>
    );
}