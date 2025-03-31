"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { CheckCircleIcon } from "@heroicons/react/24/outline"; 
import { useStrapiData } from "@/services/strapiServiceJWT";

// Carga Veriff dinámicamente para evitar errores en SSR
const Veriff = dynamic(() => import("@veriff/js-sdk"), { ssr: false });

const VeriffComponent = ({ isVerified }) => {
  const [veriffInstance, setVeriffInstance] = useState(null);
  const { data: session } = useSession();
  const token = session?.jwt;
  const { data, error: fetchError, isLoading } = useStrapiData("users/me", token);

  // ✅ Solo ejecutar Veriff si la cuenta NO está verificada
  useEffect(() => {
    if (isLoading || !data || typeof window === "undefined" || isVerified) return; 

    import("@veriff/js-sdk").then(({ Veriff }) => {
      import("@veriff/incontext-sdk").then(({ createVeriffFrame }) => {
        const veriff = Veriff({
          host: "https://stationapi.veriff.com",
          apiKey: "1d5f457e-72b2-460a-b013-c42617aa9886",
          parentId: "veriff-root",
          onSession: (err, response) => {
            if (err) {
              console.error("Error en Veriff:", err);
            } else {
              // console.log("Sesión iniciada:", response);
              createVeriffFrame({ url: response.verification.url });
            }
          },
        });

        veriff.setParams({
          person: {
            givenName: data.firstName,
            lastName: data.lastName,
          },
          vendorData: String(data.id),
        });

        setVeriffInstance(veriff);
      });
    });
  }, [isLoading, data, isVerified]);

  useEffect(() => {
    if (veriffInstance) {
      setTimeout(() => {
        const veriffRoot = document.getElementById("veriff-root");
        if (veriffRoot) {
          veriffInstance.mount({
            submitBtnText: "Obtener verificación",
            loadingText: "Por favor espera...",
          });
        } else {
          console.error("❌ No se encontró el elemento 'veriff-root'. Veriff no pudo montarse.");
        }
      }, 500);
    }
  }, [veriffInstance]);

  return (
    <div className="mt-6">
      <p className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
        1. Verificación de identidad
      </p>

      {isVerified ? (
        // ✅ Mostrar mensaje de cuenta verificada si el usuario está verificado
        <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
          <h2 className="text-xl font-semibold mb-0 flex items-center">
            <CheckCircleIcon className="h-6 w-6 mr-2 text-green-500" />
            Cuenta Verificada
          </h2>
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
            Tu cuenta ha sido verificada correctamente. Ahora puedes continuar con las operaciones sin restricciones y
            acceder a todas las funcionalidades disponibles en la plataforma.
          </p>
        </div>
      ) : (
        // ❌ Si NO está verificado, mostrar Veriff
        <div className="flex flex-col p-6 dark:bg-black bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
          <p className="text-sm text-zinc-900 dark:text-white">
            Confirme su identidad. Para continuar, necesitará una identificación con foto válida y un dispositivo con cámara.
          </p>
          <div id="veriff-root" className="mt-4"></div>
        </div>
      )}
    </div>
  );
};

export default VeriffComponent;
