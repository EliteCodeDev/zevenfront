import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import Recaptcha from '../../components/Recaptcha';  // Importar el componente de Recaptcha

import Layout from '../../components/layout/auth';

import { getSession } from 'next-auth/react';

const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ForgotPassword() {
  const [captchaToken, setCaptchaToken] = useState('');

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar el envío del formulario
  const router = useRouter();
  const handleCaptcha = (token) => {
    // console.log("Token del CAPTCHA:", token);  // Verificar el token
    setCaptchaToken(token);  // Guardar el token del CAPTCHA
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      toast.error('Por favor, completa el CAPTCHA.');
      return;
    }
    try {
      // Habilitar el estado de envío
      setIsSubmitting(true);

      const response = await fetch(`${strapiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Se ha enviado un enlace de restablecimiento de contraseña a tu correo electrónico.');
        toast.success('Se envió un correo electrónico para restablecer la contraseña.');

        // Redirigir al usuario a la página de inicio después de un envío exitoso
        router.replace('/login');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message);
      }
    } catch (error) {
      setMessage('Hubo un error al procesar tu solicitud.');
      toast.error('Ha ocurrido un error.');
      console.error(error);
    } finally {
      // Deshabilitar el estado de envío después de que se complete la solicitud (exitosa o fallida)
      setIsSubmitting(false);
    }
  };

  return (
    <Layout className=" min-h-screen">
    <div className="max-w-md mx-auto">
      {/* Título */}
      <h2 className="text-xl font-semibold text-left text-white">Recuperar contraseña</h2>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        Escribe tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <div className="mt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                required
                className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
              />
            </div>
          </div>

          {/* Captcha */}
          <Recaptcha onVerify={handleCaptcha} />

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
              {isSubmitting ? "Enviando..." : "Enviar correo de reinicio"}
            </button>
          </div>
        </form>

        {/* Enlace para volver al login */}
        <p className="mt-6 text-sm text-center text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="font-semibold text-[var(--app-primary)] hover:text-[var(--app-secondary)] transition">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
    </Layout>

  );
};

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
