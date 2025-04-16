// src/pages/api/auth/me.js
import { getSession } from "next-auth/react";
import strapiService from "../../../services/server/strapiService";

export default async function handler(req, res) {
  // Solo permitir peticiones GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar si hay una sesión activa
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Obtener datos del usuario de Strapi usando el token JWT
    const userData = await strapiService.authenticatedRequest(
      'users/me',
      {
        method: 'GET',
      },
      session.jwt
    );

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);

    return res.status(500).json({ error: error.message || "Error procesando la solicitud" });
  }
}