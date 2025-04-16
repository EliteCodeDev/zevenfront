// src/lib/api/handler-factory.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import strapiService from "@/services/server/strapiService";

/**
 * Middleware para verificar autenticación
 */
const withAuth = async (req) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    };
  }
  return { authenticated: true, session };
};

/**
 * Crear GET handler para una colección
 */
export function createGetHandler({
  requireAuth = false,
  transform = data => data,
}) {
  return async (req) => {
    try {
      // Comprobar autenticación si es necesario
      if (requireAuth) {
        const auth = await withAuth(req);
        if (!auth.authenticated) {
          return auth.response;
        }
      }

      // Extraer el endpoint de la URL
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const endpoint = paths[paths.length - 1];

      // Extraer parámetros de consulta
      const params = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Obtener datos de Strapi
      const data = await strapiService.get(endpoint, params);

      // Transformar si es necesario
      const transformedData = transform(data);

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 500 }
      );
    }
  };
}

/**
 * Crear GET handler para un elemento por ID
 */
export function createGetByIdHandler({
  requireAuth = false,
  transform = data => data,
}) {
  return async (req, { params }) => {
    try {
      // Comprobar autenticación si es necesario
      if (requireAuth) {
        const auth = await withAuth(req);
        if (!auth.authenticated) {
          return auth.response;
        }
      }

      // Extraer el endpoint e id
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const endpoint = paths[paths.length - 2];
      const { id } = params;

      // Extraer parámetros de consulta
      const queryParams = {};
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      // Obtener datos de Strapi
      const data = await strapiService.getById(endpoint, id, queryParams);

      // Transformar si es necesario
      const transformedData = transform(data);

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 500 }
      );
    }
  };
}

/**
 * Crear POST handler para crear nuevos elementos
 */
export function createPostHandler({
  requireAuth = true,
  transform = data => data,
  validate = () => ({ valid: true }),
}) {
  return async (req) => {
    try {
      // Comprobar autenticación si es necesario
      if (requireAuth) {
        const auth = await withAuth(req);
        if (!auth.authenticated) {
          return auth.response;
        }
      }

      // Extraer el endpoint
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const endpoint = paths[paths.length - 1];

      // Obtener datos del body
      const body = await req.json();

      // Validar datos
      const validation = validate(body);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validation.errors },
          { status: 400 }
        );
      }

      // Enviar a Strapi
      const data = await strapiService.create(endpoint, body);

      // Transformar si es necesario
      const transformedData = transform(data);

      return NextResponse.json(transformedData, { status: 201 });
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 500 }
      );
    }
  };
}

/**
 * Crear PUT handler para actualizar elementos
 */
export function createPutHandler({
  requireAuth = true,
  transform = data => data,
  validate = () => ({ valid: true }),
}) {
  return async (req, { params }) => {
    try {
      // Comprobar autenticación si es necesario
      if (requireAuth) {
        const auth = await withAuth(req);
        if (!auth.authenticated) {
          return auth.response;
        }
      }

      // Extraer el endpoint e id
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const endpoint = paths[paths.length - 2];
      const { id } = params;

      // Obtener datos del body
      const body = await req.json();

      // Validar datos
      const validation = validate(body);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validation.errors },
          { status: 400 }
        );
      }

      // Enviar a Strapi
      const data = await strapiService.update(endpoint, id, body);

      // Transformar si es necesario
      const transformedData = transform(data);

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 500 }
      );
    }
  };
}

/**
 * Crear DELETE handler
 */
export function createDeleteHandler({
  requireAuth = true,
}) {
  return async (req, { params }) => {
    try {
      // Comprobar autenticación si es necesario
      if (requireAuth) {
        const auth = await withAuth(req);
        if (!auth.authenticated) {
          return auth.response;
        }
      }

      // Extraer el endpoint e id
      const url = new URL(req.url);
      const paths = url.pathname.split('/');
      const endpoint = paths[paths.length - 2];
      const { id } = params;

      // Enviar a Strapi
      await strapiService.delete(endpoint, id);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: 500 }
      );
    }
  };
}