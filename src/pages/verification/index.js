import { useState, useMemo, useCallback } from "react";
import Layout from "../../components/layout/dashboard";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useStrapiData } from "src/services/strapiServiceJWT";
import Loader from "../../components/loaders/loader";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import VeriffComponent from "./verification";

const DEFAULT_CONTRACT_URL = "https://minio.neocapitalfunding.com/strapi/CONTRATO_278b458332.pdf";

const SocialsPage = () => {
    const { data: session } = useSession();
    const token = session?.jwt ?? null;

    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);

    const route = token ? "users/me?populate[challenges][populate]=broker_account&populate[pdf]=*" : null;
    const { data, error, isLoading, mutate } = useStrapiData(route, token);

    const { isVerified, statusSign, challenges = [], pdf } = data || {};
    const isSigned = !!pdf;
    const isUploadDisabled = statusSign === true; // Disable upload if statusSign is true

    const { hasPhase3Challenge, hasPhase1Or2Challenge, newAccount } = useMemo(() => ({
        hasPhase3Challenge: challenges.some(challenge => challenge.phase === 3),
        hasPhase1Or2Challenge: challenges.some(challenge => [1, 2].includes(challenge.phase)),
        newAccount: challenges.length === 0,
    }), [challenges]);

    const handleSign = useCallback(async () => {
        if (!accepted || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${data?.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ statusSign: true, isVerified: true }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData?.error?.message || "Error en la firma del contrato");
                throw new Error(`Error ${response.status}`);
            }

            toast.success("Contrato firmado exitosamente.");
            mutate();
        } catch (error) {
            console.error("Error al firmar el contrato:", error);
            toast.error("Hubo un problema al firmar el contrato.");
        } finally {
            setLoading(false);
        }
    }, [accepted, data?.id, token, loading, mutate]);

    const handlePdf = useCallback(async () => {
        if (isUploadDisabled) {
            toast.error("No puedes subir un PDF porque el documento ya ha sido verificado por un administrador.");
            return;
        }

        if (!pdfFile) {
            toast.error("Por favor selecciona un archivo PDF primero");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('files', pdfFile);

            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData?.error?.message || "Error uploading PDF");
            }

            const uploadData = await uploadResponse.json();
            const fileId = uploadData[0].id;

            const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${data?.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ pdf: fileId }),
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData?.error?.message || "Error updating user with PDF");
            }

            toast.success("PDF subido exitosamente.");
            mutate();
        } catch (error) {
            console.error("Error al subir pdf:", error);
            toast.error("Hubo un problema al subir el PDF: " + error.message);
        } finally {
            setLoading(false);
            setPdfFile(null);
        }
    }, [pdfFile, data?.id, token, mutate, isUploadDisabled]);

    const handleFileChange = (e) => {
        if (isUploadDisabled) {
            toast.error("No puedes subir un PDF porque el documento ya ha sido verificado por un administrador.");
            return;
        }

        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        } else {
            toast.error("Por favor selecciona un archivo PDF válido");
            setPdfFile(null);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(DEFAULT_CONTRACT_URL);
            if (!response.ok) {
                throw new Error("Error al descargar el PDF");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Contrato.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar el PDF:", error);
            toast.error("Hubo un problema al descargar el PDF.");
        }
    };

    return (
        <Layout>
            {isLoading && <Loader />}
            {error && (
                <p className="text-red-500">Error al cargar los datos: {error.message}</p>
            )}
            {!isLoading && !error && (
                <>
                    <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black mb-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <CheckBadgeIcon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                                <h1 className="text-xl font-semibold">Verificación</h1>
                            </div>
                        </div>
                    </div>

                    {((!hasPhase3Challenge && (hasPhase1Or2Challenge || newAccount)) && !isVerified) ? (
                        <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                La sección de verificación se desbloqueará para usted una vez que esté a punto de firmar o cambiar un contrato con nosotros. Se desbloqueará automáticamente una vez que haya llegado a fase NeoTrader.
                            </p>
                        </div>
                    ) : (
                        <>
                            <VeriffComponent isVerified={isVerified} />

                            <div className="mt-6">
                                <p className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
                                    2. Documento PDF
                                </p>
                                {statusSign ? (
                                    <div className="p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                                        <h2 className="text-xl font-semibold mb-0 flex items-center">
                                            <CheckCircleIcon className="h-6 w-6 mr-2 text-green-500" />
                                            Contrato verificado
                                        </h2>
                                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                                            Tu contrato ha sido verificado correctamente. Ahora puedes continuar con las operaciones sin restricciones y
                                            acceder a todas las funcionalidades disponibles en la plataforma.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Contrato:
                                                </p>
                                                <span className={`flex items-center ${isSigned ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isSigned ? (
                                                        <>
                                                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                                                            Enviado
                                                        </>
                                                    ) : (
                                                        "Falta enviar"
                                                    )}
                                                </span>
                                            </div>
                                            <embed
                                                src={`${DEFAULT_CONTRACT_URL}#toolbar=0`}
                                                type="application/pdf"
                                                className="w-full min-h-[calc(120vh)]"
                                            />
                                        </div>

                                        {isUploadDisabled && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                No puedes subir un PDF porque el documento ya ha sido verificado por un administrador.
                                            </p>
                                        )}

<div className="flex flex-col items-center space-y-6">
    {/* Botón de Descargar PDF con ancho completo */}
    <Button
        className="w-full bg-[var(--app-primary)] hover:bg-amber-600 text-white text-lg font-semibold px-6 py-4 rounded-lg shadow-md transition-all"
        onClick={handleDownload}
    >
        Descargar PDF
    </Button>

    {/* Contenedor para el input y el botón de subida */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 w-full">
        <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="file:cursor-pointer file:border-none file:rounded-lg file:bg-[var(--app-primary)] file:text-white file:px-4 file:py-2 file:font-medium hover:file:bg-amber-600 disabled:opacity-50 w-full sm:w-auto"
            disabled={loading || isUploadDisabled}
        />
        <Button
            className={`w-full sm:w-auto bg-[var(--app-secondary)] hover:bg-[var(--app-primary)] text-white text-lg font-semibold px-6 py-4 rounded-lg shadow-md transition-all ${
                (!pdfFile || loading || isUploadDisabled) ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!pdfFile || loading || isUploadDisabled}
            onClick={handlePdf}
        >
            {loading ? "Subiendo..." : isSigned ? "Subir PDF" : "Subir PDF"}
        </Button>
    </div>
</div>

                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </Layout>
    );
};

export default SocialsPage;

    // const { data, error, isLoading, mutate } = useSWR(
    //     token
    //         ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?populate[challenges][populate]=broker_account`, token]
    //         : null,
    //     ([url, token]) => fetcher(url, token)
    // );







// const Verification = dynamic(() => import("../verification/verification"), { ssr: false });

// const fetcher = async (url, token) => {
//     try {
//         const response = await fetch(url, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!response.ok) throw new Error(`Error: ${response.status}`);
//         return response.json();
//     } catch (error) {
//         console.error("Fetcher Error:", error);
//         throw error;
//     }
// };






                            {/* <div className="mt-6">
                                <p className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
                                    2. Firma de contrato
                                </p>
                                <div className="flex flex-col p-6 dark:bg-zinc-800 bg-white shadow-md rounded-lg dark:text-white dark:border-zinc-700 dark:shadow-black">
                                    <div className="h-64 overflow-y-auto border p-4 rounded-lg bg-gray-100 dark:bg-zinc-900">
                                        <p className="text-sm text-zinc-900 dark:text-white whitespace-pre-line">
                                            1. Términos...
                                            2. Licencia de Uso...
                                            3. Descargo de responsabilidad...
                                            4. Limitaciones...
                                            5. Precisión de los materiales...
                                            6. Enlaces...
                                            7. Modificaciones...
                                            8. Ley Aplicable...
                                        </p>
                                    </div>

                                    <label className="flex items-center space-x-2 mt-4">
                                        <input
                                            type="checkbox"
                                            checked={statusSign || accepted}
                                            onChange={() => !statusSign && setAccepted(prev => !prev)}
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-zinc-900 dark:text-white">
                                            Acepto los términos del contrato
                                        </span>
                                    </label>

                                    <Button
                                        className="mt-4 bg-[#1F6263] hover:bg-[#29716c] text-white text-sm font-medium px-6 py-5 rounded-md"
                                        disabled={statusSign || !accepted || loading}
                                        onClick={handleSign}
                                    >
                                        {loading ? "Firmando..." : "Firmar"}
                                    </Button>


               
                                </div>


                            </div> */}