import React from "react";
import { useRouter } from "next/router";
import { HomeIcon } from "@heroicons/react/24/outline";

const Breadcrumb = () => {
    const router = useRouter();

    // Limpia la ruta eliminando fragmentos (cualquier cosa después de #)
    const cleanPath = router.asPath.split("#")[0]; 
    const pathSegments = cleanPath.split("/").filter(Boolean); // Obtiene los segmentos reales de la URL
    const query = router.query; // Obtiene las consultas dinámicas, como idcuenta

    const isHomePage = pathSegments.length === 0; // Detecta si estamos en la página principal

    return (
        <nav className="text-sm flex items-center space-x-2 text-gray-500 mb-3 dark:text-white">
            {/* Icono de inicio con texto */}
            <a href="/" className="flex items-center text-gray-400 hover:text-gray-600 transition">
                <HomeIcon className="w-4 h-4" />
                {isHomePage && <span className="ml-2 text-gray-700 dark:text-white font-medium">Inicio</span>}
            </a>

            {/* Generación de rutas dinámicas */}
            {!isHomePage &&
                pathSegments.map((segment, index) => {
                    const isLast = index === pathSegments.length - 1; // Verifica si es el último segmento

                    // Maneja los segmentos dinámicos, como el ID de cuenta
                    let displaySegment = segment;

                    if (segment === "[idcuenta]" && query.idcuenta) {
                        displaySegment = `Cuenta ${query.idcuenta}`; // Muestra "Cuenta [idcuenta]"
                    } else if (segment === "metrix") {
                        displaySegment = "Metrix"; // Muestra "Metrix" para este segmento
                    } else {
                        // Capitaliza otros segmentos
                        displaySegment = segment.charAt(0).toUpperCase() + segment.slice(1);
                    }

                    return (
                        <React.Fragment key={index}>
                            <span className="text-gray-400 dark:text-white">/</span>
                            <span className={`text-gray-700 dark:text-white font-medium ${isLast ? "" : "capitalize"}`}>
                                {displaySegment}
                            </span>
                        </React.Fragment>
                    );
                })}
        </nav>
    );
};

export default Breadcrumb;
