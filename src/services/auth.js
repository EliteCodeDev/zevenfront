// src/services/auth.js
import strapiService from './server/strapiService';

/**
 * Función para iniciar sesión con credenciales
 * Mantiene exactamente la misma funcionalidad pero usando nuestro servicio seguro
 * 
 * @param {Object} credentials - Credenciales del usuario (email, password)
 * @returns {Promise<Object>} - Usuario y token JWT
 */
export async function signIn({ email, password }) {
  try {
    // Primera solicitud: autenticación del usuario
    const authResponse = await strapiService.request('auth/local', {
      method: 'POST',
      body: JSON.stringify({
        identifier: email,
        password,
      }),
    });

    const { jwt, user } = authResponse;

    if (!jwt) throw new Error('No JWT received');

    // Segunda solicitud: obtener usuario con el rol poblado
    const userResponse = await strapiService.authenticatedRequest(
      'users/me',
      {
        method: 'GET',
        params: { populate: 'role' }
      },
      jwt
    );

    // Devolvemos la data con el role ya incluido
    return {
      user: {
        ...userResponse, // Aquí ya tendrá `role.name`
      },
      jwt,
    };
  } catch (error) {
    console.error('Error en signIn:', error);
    throw error;
  }
}

/**
 * Función para registrar un nuevo usuario
 * 
 * @param {Object} userData - Datos del usuario a registrar
 * @returns {Promise<Object>} - Usuario registrado y token JWT
 */
export async function register(userData) {
  try {
    const response = await strapiService.request('auth/local/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return {
      user: response.user,
      jwt: response.jwt
    };
  } catch (error) {
    console.error('Error durante el registro:', error);
    throw error;
  }
}

/**
 * Función para autenticar con proveedores externos
 * 
 * @param {string} provider - Nombre del proveedor (google, github, etc.)
 * @param {string} accessToken - Token de acceso del proveedor
 * @returns {Promise<Object>} - Usuario y token JWT
 */
export async function providerAuth(provider, accessToken) {
  try {
    const response = await strapiService.request(`auth/${provider}/callback`, {
      method: 'GET',
      params: { access_token: accessToken },
    });

    return {
      user: response.user,
      jwt: response.jwt
    };
  } catch (error) {
    console.error(`Error durante la autenticación con ${provider}:`, error);
    throw error;
  }
}

/**
 * Función para obtener el usuario actual
 * 
 * @param {string} token - Token JWT
 * @returns {Promise<Object>} - Datos del usuario actual
 */
export async function getMe(token) {
  try {
    return await strapiService.authenticatedRequest('users/me', {
      method: 'GET',
      params: { populate: 'role' }
    }, token);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    throw error;
  }
}

// Mantener la función Home1 para evitar errores de exportación
export default function Home1() {
  return <></>;
}