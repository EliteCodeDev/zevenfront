// src/pages/billing/index.js
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import Image from 'next/image';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { LifebuoyIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import strapiService from '../../services/server/strapiService';

// Obtener datos desde el servidor
export async function getServerSideProps() {
    try {
        // Obtener solo los campos necesarios para la vista
        const supportsResponse = await strapiService.get('supports', {
            fields: ['id', 'nombre', 'url', 'icono', 'accion'],
        });

        // Extraer el array de datos de la respuesta
        const supports = Array.isArray(supportsResponse)
            ? supportsResponse
            : supportsResponse.data || [];

        // Devolver datos como props
        return {
            props: {
                initialSupports: supports,
            },
        };
    } catch (error) {
        console.error('Error fetching support data:', error);

        // Devolver array vacío en caso de error
        return {
            props: {
                initialSupports: [],
                error: true,
            },
        };
    }
}

// Componente que recibe los datos pre-cargados desde el servidor
const SupportPage = ({ initialSupports = [], error = false }) => {
    // Usar estado con los datos iniciales
    const [socials] = useState(initialSupports);
    const [isLoading] = useState(false);

    // Si está cargando (estado inicial), mostramos un cargador
    if (isLoading) {
        return <Layout><Loader /></Layout>;
    }

    // Si hay un error, mostramos el mensaje de error
    if (error) {
        return <Layout>Error al cargar los datos. Por favor intenta más tarde.</Layout>;
    }

    // Si los datos se cargaron correctamente, los mostramos
    return (
        <Layout>
            {/* Cabecera de Soporte al cliente */}
            <div className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-all">
                <div className="absolute h-1 top-0 left-0 right-0 bg-[var(--app-primary)]"></div>

                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 rounded-full bg-[var(--app-primary)]/10">
                            <LifebuoyIcon className="w-5 h-5 text-[var(--app-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
                            Customer support
                        </h1>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 ml-10">
                        If you need help, do not hesitate to contact us through our main platforms.
                        We are here to answer your questions and give you the support you need.
                        Connect with us now!
                    </p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {socials && socials.length > 0 ? (
                    socials.map((plataforma, index) => {
                        // Acceder a los campos de manera segura
                        const nombre = plataforma.nombre || plataforma.attributes?.nombre;
                        const url = plataforma.url || plataforma.attributes?.url;
                        const icono = plataforma.icono || plataforma.attributes?.icono;
                        const accion = plataforma.accion || plataforma.attributes?.accion;

                        return (
                            <div
                                key={plataforma.id || index}
                                className="p-6 bg-white rounded-lg shadow-md dark:bg-zinc-800 dark:border-zinc-800 dark:text-white dark:shadow-black transition flex flex-col items-center"
                            >
                                {/* Contenedor Horizontal para el Icono y el Texto */}
                                <div className="flex items-center mb-4 w-full">
                                    {/* Icono */}
                                    <div className="flex-shrink-0 dark:bg-zinc-700 bg-gray-100 p-3 rounded-full flex items-center justify-center">
                                        {typeof icono === 'string' ? (
                                            <Image
                                                src={`${icono}`}
                                                alt={nombre}
                                                width={60}
                                                height={60}
                                                className="w-[60px] h-[60px] rounded-full"
                                            />
                                        ) : (
                                            icono
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <span className="block dark:text-white text-gray-700 font-medium">Platform</span>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg">{nombre}</p>
                                    </div>
                                </div>

                                {/* Botón de Acción */}
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-[var(--app-primary)] text-black font-medium py-2 px-4 rounded-lg hover:bg-[var(--app-secondary)] transition w-full"
                                >
                                    {accion === 'Contactar' ? 'Contact Us' : accion === 'Unirse' ? 'Join' : accion}
                                    {/* Icono de redirección usando ArrowTopRightOnSquareIcon */}
                                    <ArrowTopRightOnSquareIcon className="ml-2 w-4 h-4" />
                                </a>
                            </div>
                        );
                    })
                ) : (
                    <div>There is no data to show.</div>
                )}
            </div>
        </Layout>
    );
};

export default SupportPage;