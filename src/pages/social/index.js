// src/pages/social/index.js
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { useStrapiData } from '../../services/strapiService';
import Image from 'next/image';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';

const SocialsPage = () => {
    // Usamos el hook que creamos para obtener los datos de 'socials'
    const { data: socials, error, isLoading } = useStrapiData('socials');
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
            {/* Cabecera de Redes Sociales */}
            <div className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-all">
                <div className="absolute h-1 top-0 left-0 right-0 bg-[var(--app-primary)]"></div>

                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 rounded-full bg-[var(--app-primary)]/10">
                            <HeartIcon className="w-5 h-5 text-[var(--app-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
                            Redes Sociales
                        </h1>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 ml-10">
                        Síguenos en nuestras redes sociales, donde podrás ver las
                        actualizaciones de nuestra comunidad, eventos y mucho más. Puedes
                        encontrarnos en las principales plataformas, ¡solo elige tu favorita!
                    </p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
                {socials && socials.length > 0 ? (
                    socials.map((plataforma, index) => (
                        <div
                            key={index}
                            className="p-6 bg-white rounded-lg shadow-md dark:bg-zinc-800 dark:border-zinc-800 dark:text-white dark:shadow-black transition flex flex-col items-center"
                        >
                            {/* Contenedor Horizontal para el Icono y el Texto */}
                            <div className="flex items-center mb-4 w-full">
                                {/* Icono */}
                                <div className="flex-shrink-0 dark:bg-zinc-700 bg-gray-100 p-3 rounded-full flex items-center justify-center">
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

export default SocialsPage;