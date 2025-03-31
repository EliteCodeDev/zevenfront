import { useState, Fragment } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import NotificationsList from '../structure/notificationsList';

const BellIconButton = ({ onClick }) => {
  return (
    <button
      className="p-2 rounded-full hover:bg-zinc-700 transition duration-200"
      onClick={onClick} // Se pasa la función para cambiar el estado
    >
      <BellIcon
        className="h-6 w-6 text-white hover:text-zinc-300 transition duration-200"
        aria-hidden="true"
      />
    </button>
  );
};

export default function Example() {
  const [open, setOpen] = useState(false); // Inicializa en false

  return (
    <>
      <BellIconButton onClick={() => setOpen(true)} /> {/* Se abre el dialog al hacer clic */}

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    {/* Contenedor con borde y sombra */}
                    <div className="flex h-full flex-col overflow-y-scroll dark:bg-zinc-800 bg-white py-6 shadow-xl border dark:border-gray-600 dark:shadow-black dark:border-0 border-gray-300 ">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                            <h2 className="text-md font-semibold dark:text-white text-gray-900">Notificaciones</h2>
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center pl-3 dark:bg-zinc-800">
                            <button
                              type="button"
                              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--app-secondary)] border-0 dark:border-0 dark:text-gray-400"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5 " />
                              <span className="sr-only">Cerrar panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>


                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1">
                        <NotificationsList />
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
