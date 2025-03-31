import { useRouter } from 'next/router';
import { useState } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getSession } from 'next-auth/react';
import Recaptcha from '../../components/Recaptcha';  // Importar el componente Recaptcha

const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ResetPassword() {
  const router = useRouter();
  const { code } = router.query;
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setpasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Controla el campo de contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Controla el campo de confirmación de contraseña
  const [captchaToken, setCaptchaToken] = useState('');  // Nuevo estado para el token del CAPTCHA

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (!captchaToken) {  // Verificar si el CAPTCHA no está completado
      toast.error('Por favor, completa el CAPTCHA.');
      return;
    }

    try {
      setLoading(true);
      // Enviar la solicitud de restablecimiento de contraseña junto con el token CAPTCHA
      await axios.post(`${strapiUrl}/api/auth/reset-password`, {
        code,
        password,
        passwordConfirmation,
        captchaToken,  // Incluir el token CAPTCHA
      },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setLoading(false);
      toast.success('Contraseña restablecida con éxito.');
      router.replace('/login');
    } catch (error) {
      setLoading(false);
      toast.error('Ha ocurrido un error.');
    }
  };

  const handleCaptcha = (token) => {
    setCaptchaToken(token);  // Guardar el token del CAPTCHA
  };

  return (
    <Layout className=" min-h-screen">
     <div className="max-w-md mx-auto">
      {/* Título */}
      <h2 className="text-xl font-semibold text-left text-white">Restablecer contraseña</h2>

      <div className="mt-6">
        <form className="space-y-6" onSubmit={handleResetPassword}>
          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
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

          {/* Campo de Confirmación de Contraseña */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
              Confirmar contraseña
            </label>
            <div className="mt-2 relative">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setpasswordConfirmation(e.target.value)}
                minLength={6}
                required
                className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-300 transition"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Captcha */}
          <Recaptcha onVerify={handleCaptcha} />

          {/* Botón de Enviar */}
          <div>
            <button
              type="submit"
              disabled={loading || !captchaToken}
              className={`w-full rounded-md p-3 text-sm font-semibold transition ${
                loading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--app-primary)] text-black hover:bg-[var(--app-secondary)] focus:ring-2 focus:ring-[var(--app-primary)]"
              }`}
            >
              {loading ? "Cargando..." : "Restablecer contraseña"}
            </button>
          </div>
        </form>

        {/* Enlace para volver al login */}
        <p className="mt-6 text-sm text-center text-gray-400">
          <Link href="/login" className="font-semibold text-[var(--app-primary)] hover:text-[var(--app-secondary)] transition">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
    </Layout>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
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
