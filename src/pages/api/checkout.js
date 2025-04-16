// src/pages/api/checkout.js
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  try {
    // Verificar si hay una sesión activa
    const session = await getSession({ req });

    if (!session) {
      // Redirigir a inicio de sesión si no hay sesión
      return res.redirect('/api/auth/signin?callbackUrl=' + encodeURIComponent(req.url));
    }

    // Obtener los parámetros de la URL
    const { product_id, quantity = '1', document_id, user_id } = req.query;

    if (!product_id) {
      return res.status(400).json({ error: "Producto no especificado" });
    }

    // Construir la URL de checkout segura para WooCommerce
    // Las credenciales están seguras en el servidor
    const wooCommerceUrl = process.env.WOOCOMMERCE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;

    if (!wooCommerceUrl) {
      return res.status(500).json({ error: "URL de WooCommerce no configurada" });
    }

    // Construir URL del checkout
    const checkoutUrl = new URL('/checkout/', wooCommerceUrl);
    checkoutUrl.searchParams.append('add-to-cart', product_id);
    checkoutUrl.searchParams.append('quantity', quantity);

    // Añadir parámetros adicionales si existen
    if (document_id) checkoutUrl.searchParams.append('document_id', document_id);
    if (user_id) checkoutUrl.searchParams.append('user_id', user_id);

    // También podrías usar la API de WooCommerce para crear un carrito programáticamente
    // pero eso requeriría implementar el servicio WooCommerce completo

    // Redirigir al usuario a la página de checkout
    return res.redirect(checkoutUrl.toString());
  } catch (error) {
    console.error("Error al procesar checkout:", error);

    return res.status(500).json({
      error: error.message || "Error procesando la solicitud de checkout"
    });
  }
}