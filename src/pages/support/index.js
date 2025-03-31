// pages/socials.js
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { useStrapiData } from '../../services/strapiService';
import Image from 'next/image';
import { ArrowTopRightOnSquareIcon, } from '@heroicons/react/24/solid';
import { LifebuoyIcon } from '@heroicons/react/24/solid';

const SupportPage = () => {
    // Usamos el hook que creamos para obtener los datos de 'socials'
    const { data: socials, error, isLoading } = useStrapiData('supports');
    //console.log(socials);
    // Si está cargando, mostramos un mensaje de carga
    if (isLoading) {
        return <Layout><Loader /></Layout>;
    }

    // Si hay un error, mostramos el mensaje de error
    if (error) {
        return <Layout>Error al cargar los datos: {error.message}</Layout>;
    }

    // Si los datos se cargaron correctamente, los mostramos
    return (
        <Layout>
            <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <LifebuoyIcon className="h-6 w-6 mr-2" />
                    Soporte al cliente
                </h2>
                <p className="text-gray-600 dark:text-white ">
                    Si necesitas ayuda, no dudes en contactarnos a través de nuestras principales plataformas. Estamos aquí para responder tus preguntas y brindarte el soporte que necesitas. ¡Conéctate con nosotros ahora!
                </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {socials && socials.length > 0 ? (
                    socials.map((plataforma, index) => (
                        <div
                            key={index}
                            className="p-6 bg-white rounded-lg shadow-md dark:bg-zinc-800 dark:border-zinc-800 dark:text-white dark:shadow-black transition flex flex-col items-center"
>
                            {/* Contenedor Horizontal para el Icono y el Texto */}
                            <div className="flex items-center mb-4 w-full">
                                {/* Icono */}
                                <div className="flex-shrink-0  dark:bg-zinc-700 bg-gray-100 p-3 rounded-full flex items-center justify-center">
                                    {typeof plataforma.icono === 'string' ? (
                                        <Image
                                            src={`${plataforma.icono}`} // Asegúrate de que la imagen se encuentre en la ruta correcta
                                            alt={plataforma.nombre}
                                            width={60}
                                            height={60}
                                            className="w-[60px] h-[60px] rounded-full"
                                        />
                                    ) : (
                                        plataforma.icono
                                    )}
                                </div>
                                <div className="ml-4">
                                    <span className="block dark:text-white text-gray-700 font-medium">Plataforma</span>
                                    <p className="text-gray-900 dark:text-white font-bold text-lg">{plataforma.nombre}</p>
                                </div>
                            </div>

                            {/* Botón de Acción */}
                            <a
                                href={plataforma.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-[var(--app-primary)] text-black font-medium py-2 px-4 rounded-lg hover:bg-[var(--app-secondary)] transition w-full"
                            >
                                {plataforma.accion}
                                {/* Icono de redirección usando ArrowTopRightOnSquareIcon */}
                                <ArrowTopRightOnSquareIcon className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                    ))
                ) : (
                    <div>No hay datos para mostrar.</div>
                )}
            </div>
        </Layout>
    );
};

export default SupportPage;