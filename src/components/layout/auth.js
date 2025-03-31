import React from "react";
import Link from "next/link";
import Image from "next/image";

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Imagen de fondo ocupando todo el ancho */}
      <Image
        className="absolute inset-0 w-full h-full object-cover z-[-1]"
        src="/images/bg-auth.webp"
        alt="Fondo de pantalla"
        layout="fill"
        objectFit="cover"
        priority={true} // Carga prioritaria para mejorar la experiencia
      />
      {/* Capa de opacidad con degradado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/80 to-black z-0"></div>
      <div className="flex flex-1 min-h-full relative z-10">
        {/* Contenedor para la imagen de monedas */}
        <div className="relative hidden w-1/2 lg:block">
          {/* Imagen de monedas superpuesta */}
          <Image
            className="absolute inset-0 m-auto w-[70%] h-auto object-contain"
            src="/images/moneda.webp"
            alt="Moneda"
            width={960}
            height={1080}
            unoptimized={true}
          />
        </div>
        {/* Contenedor del formulario con altura dinámica y centrado */}
        <div className="flex flex-1 w-full lg:w-1/2 flex-col items-center justify-center px-8 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 min-h-full bg-black lg:bg-transparent">
          <div className="mx-auto w-full max-w-sm lg:w-96 flex flex-col items-center">
            <Link href="/" className="flex justify-center">
              <Image
                className="h-10 w-auto dark:hidden"
                src="/images/logo-light.png"
                alt="Logo"
                width={236}
                height={60}
              />
              <Image
                className="h-10 w-auto hidden dark:block"
                src="/images/logo-dark.png"
                alt="Logo"
                width={236}
                height={60}
              />
            </Link>
            <main className="mt-6 w-full">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
