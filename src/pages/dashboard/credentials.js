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

            {/* Modal */}
            <Transition.Root show={open} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={setOpen}>
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

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="p-6 dark:bg-zinc-900 border-gray-200 border-2 dark:text-white dark:border-zinc-800 dark:shadow-black relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                        <button
                                            type="button"
                                            className="rounded-md bg-red-500 text-zinc-50 hover:text-gray-500 focus:outline-none"
                                            onClick={() => setOpen(false)}
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div className="mt-3 sm:mt-0">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 border-b pb-5 text-gray-900 text-left mb-4 dark:text-white">
                                            Credenciales de inicio de sesión
                                        </Dialog.Title>

                                        {/* Tabla de credenciales */}
                                        <div className="">
                                            {data.map((item, index) => {
                                                const isLast = index === data.length - 1;
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center ${!isLast ? 'justify-between' : ''} ${!isLast && 'border-b'} pb-2`}
                                                    >
                                                        <div className="text-sm dark:text-white font-medium text-gray-900 flex items-center">
                                                            {item.label}:
                                                        </div>

                                                        <div className={`flex items-center py-1 ${!isLast ? 'space-x-20' : 'space-x-2'}`}>
                                                            {/* Contraseña principal con opción de ocultar */}
                                                            {item.label === 'Contraseña' ? (
                                                                <div className="flex items-center space-x-1">
                                                                    <span className="text-sm dark:text-white text-gray-600">
                                                                        {showPassword ? item.value : '********'}
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
                                                                    <span className="text-md font-bold mx-2 dark:text-white text-gray-900">{item.value}</span>
                                                                ) : (
                                                                    <span className="text-sm dark:text-white text-gray-600">{item.value}</span>
                                                                )
                                                            )}

                                                            {!isLast && (
                                                                <div className="flex flex-col space-y-2 w-[120px]">
                                                                    {/* Botón de copiar */}
                                                                    <div className="flex items-center space-x-3">
                                                                        <button
                                                                            className="p-2 bg-zinc-100 rounded border hover:bg-gray-200 dark:bg-zinc-800 w-12 h-12  flex items-center justify-center"
                                                                            onClick={() => handleCopy(item.label, item.value)}
                                                                        >
                                                                            <ClipboardDocumentIcon className="h-5 w-5 text-gray-600 dark:text-white" />
                                                                        </button>
                                                                        <span className="text-sm text-gray-600 dark:text-white truncate">Copiar</span>
                                                                    </div>

                                                                    {/* Mensaje de copiado */}
                                                                    {copied[item.label] && (
                                                                        <div className="text-sm text-green-500 mt-1">¡Copiado!</div>
                                                                    )}

                                                                    {/* Botón de cambio (solo para Contraseña)
                                                                    {item.label === 'Contraseña' && (
                                                                        <div className="flex items-center space-x-3">
                                                                            <button className="p-2 border bg-zinc-100 rounded hover:bg-gray-200 dark:bg-zinc-800 w-12 h-12 flex items-center justify-center">
                                                                                <PencilIcon className="h-5 w-5 text-gray-600 dark:text-white" />
                                                                            </button>
                                                                            <span className="text-sm text-gray-600 dark:text-white truncate">Cambio</span>
                                                                        </div>
                                                                    )} */}
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