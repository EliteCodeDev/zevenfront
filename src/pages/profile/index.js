/* src/pages/profile/index.js */
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout/dashboard';
import Loader from '../../components/loaders/loader';
import { useStrapiData } from '../../services/strapiServiceJWT';
import { UserIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoGravatar from "../../components/LogoGravatar";
import React, { useState, useEffect } from "react";
import { CountryDropdown } from '@/components/ui/country-dropdown';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  AtSymbolIcon,
  PencilIcon
} from "@heroicons/react/24/solid";
import { toast } from 'sonner';

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    city: "",
    street: "",
    zipCode: "",
  });

  const [error, setError] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    city: "",
    street: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const { data: session } = useSession();
  const token = session?.jwt;

  // Obtenemos datos del usuario desde Strapi
  const { data, error: fetchError, isLoading } = useStrapiData(
    'users/me?populate=challenges',
    token
  );

  // Manejo de cambios en inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validación de solo números en teléfono
    if (name === "phone" && !/^\d*$/.test(value)) {
      setError((prev) => ({
        ...prev,
        [name]: "El teléfono solo debe contener números."
      }));
      setTimeout(() => setError((prev) => ({ ...prev, [name]: "" })), 2000);
      return;
    }

    // Validaciones de longitud
    if (
      value.length > 50 &&
      ["firstName", "lastName", "city", "street"].includes(name)
    ) {
      setError((prev) => ({
        ...prev,
        [name]: "El campo no debe exceder los 50 caracteres."
      }));
      setTimeout(() => setError((prev) => ({ ...prev, [name]: "" })), 2000);
      return;
    }

    if (name === "zipCode" && value.length > 10) {
      setError((prev) => ({
        ...prev,
        [name]: "El código postal no debe exceder 10 caracteres."
      }));
      setTimeout(() => setError((prev) => ({ ...prev, [name]: "" })), 2000);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Manejo del cambio de país en el dropdown
  // Ajusta según lo que tu CountryDropdown retorne. En este ejemplo, guardamos alpha2.
  const handleCountryChange = (selectedCountry) => {
    console.log("País seleccionado:", selectedCountry);
    // Si el dropdown retorna un objeto { alpha2, alpha3, ... }, guardamos alpha2:
    setFormData((prev) => ({ ...prev, country: selectedCountry.alpha3 }));
    // Si tu dropdown usa alpha3 o el nombre del país para marcarlo, ajusta aquí:
    // setFormData((prev) => ({ ...prev, country: selectedCountry.alpha3 }));
    // setFormData((prev) => ({ ...prev, country: selectedCountry.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${data.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de Strapi:", errorData);
        toast.error("Error en la respuesta");
        throw new Error(
          `Error ${response.status} - ${errorData?.error?.message || "Error desconocido"
          }`
        );
      }

      setSuccess("Datos actualizados correctamente.");
      toast.success("Datos actualizados correctamente.");
      setTimeout(() => setSuccess(""), 3000);

    } catch (error) {
      console.error("Error en handleSubmit:", error);
      setErrors({ form: error.message });
      setTimeout(() => setErrors({ form: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Cargamos los datos del usuario en el formulario
  useEffect(() => {
    if (data) {
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        country: data.country || "",
        city: data.city || "",
        street: data.street || "",
        zipCode: data.zipCode || "",
      });
    }
  }, [data]);

  // Limpiamos mensajes de error tras 2s
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  if (isLoading) {
    return (
      <Layout>
        <Loader />
      </Layout>
    );
  }

  if (fetchError) {
    return <Layout>Error al cargar los datos: {fetchError.message}</Layout>;
  }

  const isVerified = !!data?.isVerified;
  const hasPhase3Challenge =
    Array.isArray(data?.challenges) &&
    data.challenges.some((challenge) => challenge.phase === 3);

  return (
    <Layout>
      {/* Cabecera de perfil */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-all">
        <div className="absolute h-1 top-0 left-0 right-0 bg-[var(--app-primary)]"></div>

        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-[var(--app-primary)]/10">
              <UserIcon className="w-5 h-5 text-[var(--app-primary)]" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
              Perfil de Usuario
            </h1>
          </div>

          <div className="flex items-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${isVerified
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
            >
              {isVerified ? "Verificado" : "Por verificar"}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor de información del usuario */}
      <div className="mt-6 bg-white dark:bg-zinc-800/90 shadow-md rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden transition-all">
        <div className="p-8 flex flex-col items-center relative">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[var(--app-primary)]/10 to-transparent rounded-t-xl"></div>

          <div className="relative z-10 mb-4">
            <div className="relative">
              <LogoGravatar
                email={session.user.email || "usuario@example.com"}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-700 shadow-md"
              />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-white dark:border-zinc-800">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white mb-1">
            {session.firstName || data.username || "Usuario"}
          </h1>

          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 mb-4">
            <AtSymbolIcon className="w-4 h-4" />
            <p className="text-sm">{data.email || "Correo no disponible"}</p>
          </div>

          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-6">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Miembro desde: </span>
            <span className="ml-1 font-medium">
              {data.createdAt
                ? new Date(data.createdAt).toLocaleDateString()
                : "No disponible"}
            </span>
          </div>

          {/* Información de estado de cuenta */}
          <div className="w-full max-w-lg mt-2 px-6 py-4 bg-gray-50 dark:bg-zinc-700/30 rounded-lg border border-gray-100 dark:border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1 rounded-full ${isVerified
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}
                >
                  {isVerified ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Estado de verificación
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isVerified
                      ? "Tu cuenta está completamente verificada"
                      : "Completa la verificación para desbloquear todas las funciones"}
                  </p>
                </div>
              </div>

              {!isVerified && (
                <button
                  className="text-xs px-3 py-1 rounded-md bg-[var(--app-primary)]/90 hover:bg-[var(--app-primary)] text-white transition-colors duration-200 font-medium"
                // Aquí podrías disparar la lógica de verificación
                >
                  Verificar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de perfil */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white dark:bg-zinc-800/90 shadow-md rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden transition-all"
      >
        <div className="border-b border-gray-100 dark:border-zinc-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-[var(--app-primary)]/10 mr-3">
                <UserCircleIcon className="w-5 h-5 text-[var(--app-primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
                Información Personal
              </h2>
            </div>

            {isVerified && (
              <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                <PencilIcon className="w-4 h-4 mr-1" />
                <span>No se puede editar (verificado)</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Nombre
              </Label>
              <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ingrese su nombre"
                  disabled={isVerified}
                  className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                    }`}
                />
                {isVerified && (
                  <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
                )}
              </div>
              <div className="h-5 text-xs">
                {error.firstName && (
                  <div className="text-red-500">{error.firstName}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Apellido
              </Label>
              <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Ingrese su apellido"
                  disabled={isVerified}
                  className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                    }`}
                />
                {isVerified && (
                  <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
                )}
              </div>
              <div className="h-5 text-xs">
                {error.lastName && (
                  <div className="text-red-500">{error.lastName}</div>
                )}
              </div>
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Teléfono
            </Label>
            <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ingrese su teléfono"
                disabled={isVerified}
                className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                  }`}
              />
              {isVerified && (
                <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
              )}
            </div>
            <div className="h-5 text-xs">
              {error.phone && <div className="text-red-500">{error.phone}</div>}
            </div>
          </div>

          {/* País y ciudad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="country">País</Label>
              <CountryDropdown
                placeholder="Elige un país"
                defaultValue={formData.country}
                onChange={handleCountryChange}
                disabled={isVerified}

              />
              <div className="h-1">
                {error.country && <div className="text-red-500">{error.country}</div>}
                {!formData.country && error.form && (
                  <div className="text-red-500">Campo obligatorio</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="city"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Ciudad
              </Label>
              <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ingrese su ciudad"
                  disabled={isVerified}
                  className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                    }`}
                />
                {isVerified && (
                  <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
                )}
              </div>
              <div className="h-5 text-xs">
                {error.city && <div className="text-red-500">{error.city}</div>}
              </div>
            </div>
          </div>

          {/* Calle y código postal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="street"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Dirección
              </Label>
              <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
                <Input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Ingrese su dirección"
                  disabled={isVerified}
                  className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                    }`}
                />
                {isVerified && (
                  <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
                )}
              </div>
              <div className="h-5 text-xs">
                {error.street && (
                  <div className="text-red-500">{error.street}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="zipCode"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Código Postal
              </Label>
              <div className={`relative ${isVerified ? "opacity-80" : ""}`}>
                <Input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Ingrese su código postal"
                  disabled={isVerified}
                  className={`bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-[var(--app-primary)]/30 focus:border-[var(--app-primary)] transition-all ${isVerified ? "cursor-not-allowed" : ""
                    }`}
                />
                {isVerified && (
                  <div className="absolute inset-0 bg-gray-200/10 dark:bg-zinc-900/10 rounded-md cursor-not-allowed"></div>
                )}
              </div>
              <div className="h-5 text-xs">
                {error.zipCode && (
                  <div className="text-red-500">{error.zipCode}</div>
                )}
              </div>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-700/50">
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
                ${isVerified
                  ? "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-white shadow-sm hover:shadow"
                }`}
              disabled={loading || isVerified}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <span>
                  {isVerified ? "Información verificada" : "Guardar cambios"}
                </span>
              )}
            </button>

            {isVerified && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                No es posible editar la información una vez que la cuenta ha
                sido verificada
              </p>
            )}
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default ProfilePage;
