import { Fragment, useEffect, useState } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import LogoGravatar from '../LogoGravatar'
import { navigation, userNavigation } from './links';
import Notifications from './notifications';
import ThemeToggle from './ThemeToggle';

import { PresentationChartBarIcon } from '@heroicons/react/24/outline';



function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState(router.pathname)
  const { data: session } = useSession()
  //console.log(session);
  useEffect(() => {
    const handleRouteChange = (url) => {
      setCurrentPath(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  const handleSignOut = () => {
    signOut({ redirect: false }).then(() => {
      router.push('/login') // Redirige a la página de login o inicio
    })
  }

  return (
    <>
      {/* <Disclosure as='nav' className='bg-white shadow-sm border-b border-gray-100'></Disclosure> */}


      <Disclosure as="nav" className="bg-black dark:bg-zinc-800 shadow-sm border-b border-zinc-700">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 dark:text-white">
              <div className="flex h-16 justify-between items-center">
                {/* Menú móvil y logo */}
                <div className="flex items-center gap-x-4">
                  <div className="lg:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-zinc-900 p-2 text-white hover:bg-zinc-800 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:ring-offset-2">
                      <span className="sr-only">Abrir menú principal</span>
                      {open ? (
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                  <Link href="/" className="flex-shrink-0 min-w-[50px]">
                    <Image
                      className="block h-8 w-auto lg:hidden"
                      src="/images/icon-dark.png"
                      alt="Logo"
                      width={236}
                      height={60}
                    />
                    <Image
                      className="hidden h-8 w-auto lg:block"
                      src="/images/logo-dark.png"
                      alt="Logo"
                      width={236}
                      height={60}
                    />
                  </Link>
                </div>

                {/* Menú de usuario y notificaciones */}
                {session && (
                  <div className="flex items-center gap-x-4">
                    {/* Correo electrónico (visible solo en escritorio) */}
                    <p className="hidden lg:block text-white text-sm font-medium">
                      {session.firstName}
                    </p>

                    {/* Foto de perfil y menú */}
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:ring-offset-2">
                        <span className="sr-only">Abrir menú de usuario</span>
                        <LogoGravatar email={session.user.email} size={40} />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md shadow-lg bg-white dark:bg-black p-1 ring-1 ring-zinc-200 dark:ring-zinc-800 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <Link
                                  href={item.href}
                                  className={`block p-2 rounded-sm text-sm ${item.signOut ? 'text-red-600' : 'text-black dark:text-white'} ${active ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                                    }`}
                                  onClick={item.signOut ? handleSignOut : undefined}
                                  target={item.external ? '_blank' : undefined}
                                >
                                  <div className="flex items-center">
                                    {item.name}
                                    {item.external && (
                                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-2 text-white" />
                                    )}
                                  </div>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notificaciones */}
                    <Notifications />


                    {/* Mostrar el ícono solo si el rol es 'admin' */}
                    {session.roleName === 'Webmaster' && (
                      <Link href="/admin">
                        <PresentationChartBarIcon className="h-6 w-6 text-red-500 cursor-pointer" />
                      </Link>
                    )}


                  </div>
                )}
              </div>
            </div>

            {/* Panel desplegable móvil */}
            {session && (
              <Disclosure.Panel className="lg:hidden bg-zinc-800">
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${currentPath === item.href
                        ? 'border-gray-500 bg-zinc-900 text-white'
                        : 'border-transparent text-gray-300 hover:border-gray-500 hover:bg-zinc-900 hover:text-white'
                        }`}
                      aria-current={currentPath === item.href ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </Disclosure.Panel>
            )}
          </>
        )}
      </Disclosure>


    </>
  )
}
