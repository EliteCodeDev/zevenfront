// src/pages/register/index.js
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { signIn } from "next-auth/react";

import Layout from '../../components/layout/auth';
import { PhoneInput } from '@/components/phone-input';
import SignSocial from '@/components/SignSocial';
const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SignUp() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [passwordConditions, setPasswordConditions] = useState({
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    length: false
  });
  const [showPasswordConditions, setShowPasswordConditions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      validatePasswordConditions(value);
    }
  };

  const generateUsername = (email) => {
    return email.replace(/[^a-zA-Z0-9]/g, '');
  };

  const validatePasswordConditions = (password) => {
    const conditions = {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*]/.test(password),
      length: password.length >= 6
    };

    setPasswordConditions(conditions);
  };

  const isPasswordValid = () => {
    return Object.values(passwordConditions).every(condition => condition);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      await signIn('google', { callbackUrl: router.query.callbackUrl || '/' });
      // No necesitamos manejar el éxito aquí porque NextAuth redirigirá automáticamente
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const username = generateUsername(formData.email);
      const response = await axios.post(`${strapiUrl}/api/auth/local/register`, {
        username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Registration successful.');
      router.replace('/email-confirmation');
    } catch (error) {
      console.error('Registration failed:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error.message || 'An error occurred.');
      } else {
        toast.error('An error occurred while processing your request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordFocus = () => {
    setShowPasswordConditions(true);
  };

  return (
    <Layout className="bg-zinc-200 min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Título */}
        <h2 className="text-2xl font-semibold text-center text-white mb-6">Create a new account</h2>
        <SignSocial />
        <div className="mt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Separador mejorado */}
            <div className="flex items-center justify-center">
              <div className="flex-grow h-px bg-gray-700 max-w-[200px]"></div>
              <h2 className="text-sm font-semibold text-center text-white px-4">or</h2>
              <div className="flex-grow h-px bg-gray-700 max-w-[200px]"></div>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">First Name</label>
              <div className="mt-2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Your first name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Last Name</label>
              <div className="mt-2">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Your last name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
                />
              </div>
            </div>

            {/* Telefono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone</label>
              <div className="mt-2">
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  defaultCountry="US"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handlePasswordFocus}
                  className="w-full rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-500 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-[var(--app-primary)] transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-300 transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Condiciones de contraseña */}
            {showPasswordConditions && (
              <div className="text-sm text-gray-400">
                <ul>
                  {[
                    { condition: passwordConditions.uppercase, label: "One uppercase letter" },
                    { condition: passwordConditions.lowercase, label: "One lowercase letter" },
                    { condition: passwordConditions.number, label: "One number" },
                    { condition: passwordConditions.specialChar, label: "One special character" },
                    { condition: passwordConditions.length, label: "6 characters or more" },
                  ].map(({ condition, label }, index) => (
                    <li key={index} className={condition ? "text-[var(--app-primary)]" : "text-gray-500"}>
                      <div className="inline-flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                        {label}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón de Registro */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid()}
                className={`w-full rounded-md p-3 text-sm font-semibold transition ${isSubmitting || !isPasswordValid()
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--app-primary)] text-black hover:bg-[var(--app-secondary)] focus:ring-2 focus:ring-[var(--app-primary)]"
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </button>
            </div>
          </form>

          {/* Enlace para iniciar sesión */}
          <p className="mt-6 text-sm text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--app-primary)] hover:text-[var(--app-secondary)] transition">
              Sign In
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