// /src/pages/certificates/verify/[documentId].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Importamos el componente Certificates existente - ajusta la ruta según tu estructura de archivos
import Certificates from "../../metrix2/certificates";

export default function CertificateVerify() {
  const router = useRouter();
  const { documentId } = router.query;
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener los datos del certificado desde la API
  useEffect(() => {
    if (!documentId) return;
  
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/${documentId}`);
        if (!response.ok) {
          throw new Error('Certificado no encontrado');
        }
        const data = await response.json();
        setCertificate(data); // Acceder a los atributos del certificado
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCertificate();
  }, [documentId]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black-light flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
      </div>
    );
  }

  // Mostrar error si ocurre
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black-light flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // URL actual para compartir
  const shareUrl = `https://web.neocapitalfunding.com/certificates/verify/${documentId}`;

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl rounded-lg bg-zinc-800 shadow dark:border dark:border-gray-600 dark:bg-dark-light">
        {/* Encabezado con logo */}
        <div className="flex justify-center p-6">
          <Link href="/">
            <Image
              src="/images/logo-dark.png"
              alt="NeoCapital Logo"
              width={236}
              height={60}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Mensaje de verificación */}
        <div className="p-4">
          <div className="rounded-xl bg-green-100 p-4 text-sm text-green-700 dark:bg-green-200 dark:text-green-800 flex items-center">
            <svg
              className="mr-2 h-12 w-12 stroke-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <span className="text-sm md:text-lg">
              La autenticidad de este certificado ha sido verificada exitosamente.
            </span>
          </div>
        </div>

        {/* Sección para compartir */}
        <div className="p-4">
        <div className="mb-10 mt-6 w-full rounded-xl border-2 px-2 py-6 text-center dark:border-gray-500">
            <div className="mt-2 flex items-center justify-center">
            <svg
                className="mr-2 h-6 w-6 dark:fill-slate-200 dark:stroke-slate-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
            </svg>
            <h2 className="text-xl font-medium dark:text-slate-200">
                Comparte esta página con otros
            </h2>
            </div>
            <div className="mt-4 text-yellow-500 break-all">{shareUrl}</div>
            <div className="mt-2 flex justify-center">
            <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="flex w-28 justify-center rounded-xl bg-yellow-100 p-2 hover:bg-yellow-200 focus:outline-none focus:ring-4 focus:ring-yellow-200 dark:bg-yellow-500"
            >
                <svg
                className="h-6 w-6 text-black"
                viewBox="0 0 29 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.97059 1.58824H14.2941C15.6099 1.58824 16.6765 2.65485 16.6765 3.97059V6.35294H18.2647V3.97059C18.2647 1.7777 16.487 0 14.2941 0H3.97059C1.7777 0 0 1.7777 0 3.97059V14.2941C0 16.487 1.7777 18.2647 3.97059 18.2647H6.35294V16.6765H3.97059C2.65485 16.6765 1.58824 15.6099 1.58824 14.2941V3.97059C1.58824 2.65485 2.65485 1.58824 3.97059 1.58824ZM12.7059 8.73529H16.6765H18.2647H23.0294C25.2223 8.73529 27 10.513 27 12.7059V23.0294C27 25.2223 25.2223 27 23.0294 27H12.7059C10.513 27 8.73529 25.2223 8.73529 23.0294V18.2647V16.6765V12.7059C8.73529 10.513 10.513 8.73529 12.7059 8.73529ZM12.7059 10.3235C11.3901 10.3235 10.3235 11.3901 10.3235 12.7059V23.0294C10.3235 24.3452 11.3901 25.4118 12.7059 25.4118H23.0294C24.3452 25.4118 25.4118 24.3452 25.4118 23.0294V12.7059C25.4118 11.3901 24.3452 10.3235 23.0294 10.3235H12.7059Z"
                    fill="currentColor"
                />
                </svg>
                <span className="ml-2 text-black">Copiar</span>
            </button>
            </div>
        </div>
        </div>


        {/* Botones de descarga e imagen del certificado */}
        <div className="p-4">
          {/* <div className="flex justify-center space-x-4">
            {/* <a
              href={certificate?.pngUrl || '#'} // Ajusta según tu API
              download="certificate.png"
              className="flex items-center rounded-xl bg-yellow-500 px-4 py-3 text-black hover:bg-yellow-600 focus:ring-4 focus:ring-yellow-400"
            >
              <svg
                className="mr-2 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <h3 className="text-sm font-medium">Descargar PNG</h3>
            </a>
            <a
              href={certificate?.pdfUrl || '#'} // Ajusta según tu API
              download="certificate.pdf"
              className="flex items-center rounded-xl bg-yellow-500 px-4 py-3 text-black hover:bg-yellow-600 focus:ring-4 focus:ring-yellow-400"
            >
              <svg
                className="mr-2 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <h3 className="text-sm font-medium">Descargar PDF</h3>
            </a> }
          </div> */}

          {/* AQUÍ USAMOS EL COMPONENTE CERTIFICATES DIRECTAMENTE */}
          <div className=" w-full rounded-lg ">
            <Certificates certificates={certificate} />
          </div>

          {/* Imagen del certificado si es necesario */}
          {certificate?.imageUrl && (
            <img
              className="mt-10 rounded-xl w-full"
              src={certificate.imageUrl}
              alt="Certificate"
            />
          )}
        </div>


        {/* Llamada a la acción */}
        <div className="p-4">
          <div className="m-4 mb-10 mt-10 flex flex-col rounded-xl border-2 border-transparent bg-yellow-100 px-6 py-10 text-yellow-600 hover:border-yellow-600 dark:bg-yellow-600 dark:text-slate-200">
            <div className="mt-6 text-center text-3xl font-bold">
              ¡Obtén el tuyo hoy!
            </div>
            <div className="text-md mt-1 text-center font-light">
              Te recomendamos revisar nuestro{' '}
              <span className="font-medium">FAQ</span> antes de
              comenzar un challenge.
            </div>
            <div className="mt-10 flex flex-row justify-center gap-4">
              <Link href="https://neocapitalfunding.com/faq"> 
                <button className="rounded-lg bg-yellow-600 px-6 py-2 text-center text-black hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:bg-slate-200 dark:text-black dark:hover:bg-yellow-900 dark:hover:text-slate-200">
                  FAQ
                </button>
              </Link>
              <Link href="/register">
                <button className="rounded-lg bg-yellow-600 px-6 py-2 text-center text-black hover:bg-yellow-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:bg-slate-200 dark:text-black dark:hover:bg-yellow-900 dark:hover:text-slate-200">
                  Crear Cuenta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}