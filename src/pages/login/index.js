import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { getSession } from 'next-auth/react';
import Layout from '../../components/layout/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Recaptcha from '@/components/Recaptcha';

export default function SignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: e.target.email.value,
      password: e.target.password.value,
    });

    if (result.ok) {
      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      if (callbackUrl) {
        router.replace(callbackUrl);
      } else {
        router.replace('/');
      }
      toast.success('Sesión iniciada correctamente.');
    } else {
      // Verificar si el usuario existe y no está confirmado
      const userCheck = await checkUserConfirmation(e.target.email.value);
      if (userCheck.exists && !userCheck.confirmed) {
        router.push('/email-confirmation');
      } else {
        toast.error('Credenciales incorrectas');
      }
      setIsSubmitting(false);
    }
  };

  // Función para verificar el estado del usuario en Strapi
  const checkUserConfirmation = async (email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?filters[email][$eq]=${email}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      if (data.length > 0) {
        return { exists: true, confirmed: data[0].confirmed };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error('Error al verificar el usuario:', error);
      return { exists: false };
    }
  };

  return (
    <Layout className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-md mx-auto px-4 sm:px-0">
        
        {/* Título */}
        <h2 className="text-2xl font-semibold text-center text-white mb-6">Iniciar sesión</h2>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Botón de Google */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: router.query.callbackUrl || '/' })}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-4 py-2.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
                className="h-5 w-5"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Google</span>
            </button>
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-black px-3 text-sm text-gray-400">o</span>
            </div>
          </div>

          {/* Campo de Correo Electrónico */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tu@ejemplo.com"
                required
                className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <Link href="/forgot-password" className="text-sm text-[var(--app-primary)] hover:text-[var(--app-secondary)] transition">
                ¿Has olvidado tu contraseña?
              </Link>
            </div>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-300 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Captcha */}
          <div className="">
            <Recaptcha onVerify={setCaptchaToken} />
          </div>

          {/* Botón de Enviar */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-md p-3 text-sm font-semibold transition ${
                isSubmitting
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--app-primary)] text-black hover:bg-[var(--app-secondary)] focus:ring-2 focus:ring-[var(--app-primary)]"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ingresando...</span>
                </div>
              ) : (
                "Ingresar"
              )}
            </button>
          </div>
        </form>

        {/* Enlace de Registro */}
        <p className="mt-6 text-sm text-center text-gray-400">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="font-semibold text-[var(--app-primary)] hover:text-[var(--app-secondary)] transition">
            Regístrate ahora
          </Link>
        </p>
      </div>
    </Layout>
  );
}

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  // Check if session exists or not, if not, redirect
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};