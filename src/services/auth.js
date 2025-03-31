// src/services/auth.js
import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function signIn({ email, password }) {
  try {
    // Primera solicitud: autenticación del usuario
    const authResponse = await axios.post(
      `${strapiUrl}/api/auth/local`,
      {
        identifier: email,
        password,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { jwt, user } = authResponse.data;

    if (!jwt) throw new Error('No JWT received');

    // Segunda solicitud: obtener usuario con el rol poblado
    const userResponse = await axios.get(
      `${strapiUrl}/api/users/me?populate=role`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    // Devolvemos la data con el role ya incluido
    return {
      user: {
        ...userResponse.data, // Aquí ya tendrá `role.name`
      },
      jwt,
    };
  } catch (error) {
    console.error('Error en signIn:', error);
    throw error;
  }
}

export default function Home1() {
  return <></>;
}
