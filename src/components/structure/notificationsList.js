import { useStrapiData } from '../../services/strapiService';
import Image from 'next/image';
import SkeletonLoader from '../loaders/skeleton';
const NotificationsPage = () => {
    // Usamos el hook que creamos para obtener los datos de 'notifications'
    const { data: notifications, error, isLoading } = useStrapiData('notifications?sort=createdAt:desc&pagination[limit]=3');

    // Si está cargando, mostramos un mensaje de carga
    if (isLoading) {
        return (
            <div className='px-4 sm:px-6'><SkeletonLoader /></div>
        );
    }

    // Si hay un error, mostramos el mensaje de error
    if (error) {
        return <p>Error al cargar las notificaciones: {error.message}</p>;
    }

    // Renderizamos las notificaciones si los datos están disponibles
    // Renderizamos las notificaciones
    return (
        <div className="p-6 bg-white dark:text-white shadow-md rounded-lg dark:bg-zinc-800">
            <div className="space-y-4 dark:text-white">
                {notifications && notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="border rounded-lg p-4 shadow-sm bg-white dark:bg-zinc-700 dark:border-gray-600 dark:shadow-black space-y-2"
                        >
                            <div className="flex items-start">
                                <div>
                                    <h3 className="font-bold text-[var(--app-primary)] mb-4">
                                        {notification.title}
                                    </h3>
                                    <p className="text-black dark:text-white">{notification.description}</p>
                                    <p className="text-sm text-gray-400">24 febrero</p>
                                </div>
                            </div>
                            {notification.image && (
                                <div className="flex justify-center mt-2">
                                    <Image
                                        src={notification.image}
                                        alt={notification.title}
                                        width={96}
                                        height={96}
                                        className="w-full h-32 rounded-lg my-4"
                                    />
                                </div>
                            )}

                            {notification.url && (
                                <div>
                                    <a
                                        href={notification.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center bg-[var(--app-primary)] text-black font-medium py-2 px-4 rounded-lg hover:bg-[var(--app-secondary)] transition w-full"
                                    >
                                        Ver más
                                    </a>
                                </div>
                            )}

                        </div>
                    ))
                ) : (
                    <div className="dark:text-white">No hay notificaciones para mostrar.</div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;