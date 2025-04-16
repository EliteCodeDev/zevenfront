// src/pages/api/strapi/[...path].js
import { getSession } from "next-auth/react";
import strapiService from "../../../services/server/strapiService";

export default async function handler(req, res) {
  try {
    // Extraer la ruta y los parámetros de la petición
    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path;

    // Procesar los parámetros de la URL
    const params = {};

    // Recorrer todos los parámetros de la URL
    Object.entries(req.query).forEach(([key, value]) => {
      // Ignorar el parámetro 'path' ya que lo usamos para el endpoint
      if (key === 'path') return;

      try {
        // Intentar analizar los valores JSON que son parámetros complejos
        if (typeof value === 'string' &&
          (value.startsWith('{') || value.startsWith('[')) &&
          (value.endsWith('}') || value.endsWith(']'))) {
          params[key] = JSON.parse(value);
        } else {
          params[key] = value;
        }
      } catch (e) {
        // Si no se puede analizar como JSON, usar el valor original
        params[key] = value;
      }
    });

    // Determinar si el endpoint requiere autenticación
    const publicEndpoints = [
      'challenge-relations',
      'challenge-products',
      'product-configs',
      'auth/local',
    ];

    const requiresAuth = !publicEndpoints.some(publicPath => endpoint.startsWith(publicPath));

    // Si requiere autenticación, verificar sesión
    if (requiresAuth) {
      const session = await getSession({ req });

      if (!session) {
        return res.status(401).json({ error: "No autorizado" });
      }
    }

    // Para GET, hacer la petición con los parámetros procesados
    if (req.method === 'GET') {
      const response = await strapiService.get(endpoint, params);
      return res.status(200).json(response);
    }

    // Manejar otros métodos HTTP...

  } catch (error) {
    console.error(`Error in Strapi API route:`, error);

    return res.status(500).json({
      error: error.message || "Error procesando la solicitud"
    });
  }
}