/* src/pages/dashboard/credentials.js */
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClipboardDocumentIcon, PencilIcon, KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function CredencialesModal({ login, password, server, platform, inversorPass }) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState({});

    const data = [
        { label: 'Login', value: login },
        { label: 'Contraseña', value: password },
        { label: 'InversorPass', value: inversorPass },
        { label: 'Servidor', value: server },
        { label: 'Plataforma', value: platform },
    ];

    const handleCopy = (label, value) => {
        navigator.clipboard.writeText(value);
        setCopied(prev => ({ ...prev, [label]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [label]: false })), 2000);
    };

    return (
        <>
            {/* Botón adaptado al estilo existente */}
            <button
                className="flex items-center justify-center space-x-1 px-3 py-1 rounded-lg transition-all duration-200 bg-white hover:bg-gray-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600 shadow-sm hover:shadow text-sm"
                onClick={() => setOpen(true)}
            >
                <KeyIcon className="h-7 w-6 text-[var(--app-primary)]" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Credenciales</span>
            </button>

            {/* Modal con z-index aumentado */}
            <Transition.Root show={open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-700 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                        {/* Cambiado para centrar verticalmente en móviles */}
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="p-4 dark:bg-zinc-900 border-gray-200 border-2 dark:text-white dark:border-zinc-800 dark:shadow-black relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-xl mx-auto">
                                    {/* Botón de cerrar reposicionado y mejorado para móvil */}
                                    <div className="absolute right-2 top-2">
                                        <button
                                            type="button"
                                            className="rounded-full bg-red-500 text-zinc-50 p-1 hover:bg-red-600 focus:outline-none"
                                            onClick={() => setOpen(false)}
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div className="mt-2">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 border-b pb-3 text-gray-900 text-center mb-4 dark:text-white">
                                            Credenciales de inicio de sesión
                                        </Dialog.Title>

                                        {/* Tabla de credenciales optimizada para móvil */}
                                        <div className="space-y-3">
                                            {data.map((item, index) => {
                                                const isLast = index === data.length - 1;
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex flex-col sm:flex-row sm:items-center ${!isLast ? 'border-b pb-3' : ''}`}
                                                    >
                                                        <div className="text-sm dark:text-white font-medium text-gray-900 mb-1 sm:mb-0 sm:w-1/4">
                                                            {item.label}:
                                                        </div>

                                                        <div className="flex items-center justify-between w-full sm:w-3/4">
                                                            {/* Valor del campo */}
                                                            <div className="flex items-center space-x-2">
                                                                {item.label === 'Contraseña' ? (
                                                                    <div className="flex items-center space-x-1">
                                                                        <span className="text-sm dark:text-white text-gray-600 font-mono">
                                                                            {showPassword ? item.value : '••••••••'}
                                                                        </span>
                                                                        <button
                                                                            className="flex items-center justify-center"
                                                                            onClick={() => setShowPassword(!showPassword)}
                                                                        >
                                                                            {showPassword ? (
                                                                                <EyeSlashIcon className="h-5 w-5 dark:text-white text-gray-600" />
                                                                            ) : (
                                                                                <EyeIcon className="h-5 w-5 dark:text-white text-gray-600" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    isLast ? (
                                                                        <span className="text-md font-bold dark:text-white text-gray-900">{item.value}</span>
                                                                    ) : (
                                                                        <span className="text-sm dark:text-white text-gray-600 font-mono">{item.value}</span>
                                                                    )
                                                                )}
                                                            </div>

                                                            {/* Botón de copiar */}
                                                            {!isLast && (
                                                                <div className="flex items-center">
                                                                    <button
                                                                        className="p-2 bg-zinc-100 rounded-full hover:bg-gray-200 dark:bg-zinc-800 flex items-center justify-center"
                                                                        onClick={() => handleCopy(item.label, item.value)}
                                                                    >
                                                                        <ClipboardDocumentIcon className="h-5 w-5 text-gray-600 dark:text-white" />
                                                                        {copied[item.label] && (
                                                                            <span className="ml-1 text-xs text-green-500">¡Copiado!</span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
}