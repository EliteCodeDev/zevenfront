// src/services/server/auth-service.js
import { getSession } from "next-auth/react";

/**
 * Servicio de autenticación centralizado para el servidor
 * Compatible con Page Routes
 */
class AuthService {
  /**
   * Obtiene la sesión actual del servidor
   */
  async getSession(req, res) {
    // Para Page Routes, usamos getSession de next-auth/react
    return await getSession({ req });
  }

  /**
   * Verifica si un usuario está autenticado
   * @returns {Object} { authenticated: boolean, session: Object|null }
   */
  async isAuthenticated(req, res) {
    const session = await this.getSession(req, res);
    return {
      authenticated: !!session,
      session
    };
  }

  /**
   * Obtiene el token JWT del usuario desde la sesión
   */
  extractJwtFromSession(session) {
    if (!session) return null;
    return session.jwt || null;
  }

  /**
   * Obtiene el ID del usuario desde la sesión
   */
  extractUserIdFromSession(session) {
    if (!session) return null;
    return session.id || null;
  }

  /**
   * Añade token JWT a una solicitud
   */
  addJwtToRequest(req, session) {
    if (!session || !session.jwt) return req;

    // Si req es un objeto con headers
    if (req.headers) {
      if (typeof req.headers.set === 'function') {
        req.headers.set('Authorization', `Bearer ${session.jwt}`);
      } else {
        req.headers['Authorization'] = `Bearer ${session.jwt}`;
      }
    } else {
      // Si req es un objeto de opciones para fetch
      req.headers = { 'Authorization': `Bearer ${session.jwt}` };
    }

    return req;
  }
}

// Exportar una instancia lista para usar
const authService = new AuthService();
export default authService;