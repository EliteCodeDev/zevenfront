// src/services/useWooSync.js
import { useWooCommerce } from "./useWoo";

/**
 * Hook para sincronizar productos entre Strapi y WooCommerce
 * Especializado en manejar productos variables con atributos step y subcategory
 */
export function useWooSync() {
  // Inicializar el hook de WooCommerce
  const wooCommerce = useWooCommerce("products");

  /**
   * Sincroniza un producto y sus configuraciones con WooCommerce
   * @param {Object} product - Producto de Strapi
   * @param {Array} configs - Configuraciones de precio por relación
   * @param {Object} relationData - Datos de la relación (step, subcategory)
   * @returns {Promise} - Resultado de la operación
   */
  const syncProductWithWoo = async (product, configs, relationData) => {
    try {
      if (!product || !product.id) {
        console.error("No se proporcionó un producto válido para sincronizar");
        return { success: false, error: "Producto inválido" };
      }

      const wooProductId = product.WoocomerceId;

      // Si no tiene ID de WooCommerce, creamos un nuevo producto
      if (!wooProductId) {
        return await createWooProduct(product, configs, relationData);
      }

      // Si ya tiene ID, actualizamos el producto existente
      return await updateWooProduct(wooProductId, product, configs, relationData);
    } catch (error) {
      console.error("Error al sincronizar producto con WooCommerce:", error);
      return {
        success: false,
        error: error.message || "Error desconocido en sincronización"
      };
    }
  };

  /**
   * Crea un nuevo producto variable en WooCommerce
   */
  const createWooProduct = async (product, configs, relationData) => {
    try {
      // Definir atributos para el producto variable
      const attributes = [
        {
          name: "step",
          visible: true,
          variation: true,
          options: [relationData.step?.name].filter(Boolean)
        },
        {
          name: "subcategory",
          visible: true,
          variation: true,
          options: [relationData.subcategory?.name].filter(Boolean)
        }
      ];

      // Crear producto variable en WooCommerce
      const wooProductData = {
        name: product.name,
        type: "variable",
        regular_price: String(product.precio || "0"),
        attributes: attributes
      };

      const wooResponse = await wooCommerce.post("products", wooProductData);

      if (!wooResponse || !wooResponse.id) {
        throw new Error("No se pudo crear el producto en WooCommerce");
      }

      // Actualizar el product.WoocomerceId en Strapi
      await updateStrapiProductWooId(product.id, wooResponse.id);

      // Crear variación inicial si tenemos configuración de precio
      if (configs && configs.length > 0 && relationData.step && relationData.subcategory) {
        await createProductVariation(
          wooResponse.id,
          configs[0].precio || product.precio || 0,
          relationData.step.name,
          relationData.subcategory.name
        );
      }

      return {
        success: true,
        productId: wooResponse.id,
        message: "Producto creado exitosamente en WooCommerce"
      };
    } catch (error) {
      console.error("Error al crear producto en WooCommerce:", error);
      return {
        success: false,
        error: error.message || "Error al crear producto"
      };
    }
  };

  /**
   * Actualiza un producto existente en WooCommerce
   */
  const updateWooProduct = async (wooProductId, product, configs, relationData) => {
    try {
      // 1. Obtener el producto actual de WooCommerce
      const wooProduct = await wooCommerce.get(`products/${wooProductId}`);

      if (!wooProduct) {
        throw new Error(`No se encontró el producto #${wooProductId} en WooCommerce`);
      }

      // 2. Actualizar datos básicos del producto
      const updateData = {
        name: product.name,
      };

      // 3. Verificar y actualizar atributos
      const updatedAttributes = await syncProductAttributes(
        wooProductId,
        wooProduct.attributes || [],
        relationData
      );

      if (updatedAttributes) {
        updateData.attributes = updatedAttributes;
      }

      // 4. Actualizar el producto principal
      await wooCommerce.put(`products/${wooProductId}`, updateData);

      // 5. Sincronizar variaciones
      await syncProductVariations(wooProductId, configs, relationData);

      return {
        success: true,
        productId: wooProductId,
        message: "Producto actualizado exitosamente en WooCommerce"
      };
    } catch (error) {
      console.error(`Error al actualizar producto #${wooProductId} en WooCommerce:`, error);
      return {
        success: false,
        error: error.message || "Error al actualizar producto"
      };
    }
  };

  /**
   * Sincroniza los atributos del producto en WooCommerce
   */
  const syncProductAttributes = async (wooProductId, currentAttributes, relationData) => {
    // Buscar atributos existentes
    let stepAttr = currentAttributes.find(attr => attr.name.toLowerCase() === "step");
    let subcatAttr = currentAttributes.find(attr => attr.name.toLowerCase() === "subcategory");

    // Preparar nuevos atributos o actualizar los existentes
    const updatedAttributes = [...currentAttributes];

    // Actualizar atributo step
    if (relationData.step?.name) {
      if (stepAttr) {
        // Si existe el atributo, añadimos el valor si no está ya
        if (!stepAttr.options.includes(relationData.step.name)) {
          stepAttr.options = [...stepAttr.options, relationData.step.name];
        }
      } else {
        // Si no existe, lo creamos
        updatedAttributes.push({
          name: "step",
          visible: true,
          variation: true,
          options: [relationData.step.name]
        });
      }
    }

    // Actualizar atributo subcategory
    if (relationData.subcategory?.name) {
      if (subcatAttr) {
        // Si existe el atributo, añadimos el valor si no está ya
        if (!subcatAttr.options.includes(relationData.subcategory.name)) {
          subcatAttr.options = [...subcatAttr.options, relationData.subcategory.name];
        }
      } else {
        // Si no existe, lo creamos
        updatedAttributes.push({
          name: "subcategory",
          visible: true,
          variation: true,
          options: [relationData.subcategory.name]
        });
      }
    }

    return updatedAttributes;
  };

  /**
   * Sincroniza las variaciones del producto en WooCommerce
   */
  const syncProductVariations = async (wooProductId, configs, relationData) => {
    try {
      if (!relationData.step?.name || !relationData.subcategory?.name) {
        console.warn("Faltan datos de step o subcategory para sincronizar variaciones");
        return;
      }

      // 1. Obtener todas las variaciones actuales
      const currentVariations = await wooCommerce.get(`products/${wooProductId}/variations`, {
        per_page: 100
      });

      // 2. Buscar si ya existe una variación para esta combinación de atributos
      const existingVariation = currentVariations?.find(variation => {
        const stepAttr = variation.attributes.find(attr => attr.name.toLowerCase() === "step");
        const subcatAttr = variation.attributes.find(attr => attr.name.toLowerCase() === "subcategory");
        
        return stepAttr && subcatAttr &&
               stepAttr.option === relationData.step.name &&
               subcatAttr.option === relationData.subcategory.name;
      });

      // 3. Determinar el precio a usar
      const precio = configs && configs.length > 0 
        ? configs[0].precio 
        : null;

      // 4. Actualizar o crear la variación
      if (existingVariation) {
        // Actualizar solo si tenemos un precio válido
        if (precio !== null && precio !== undefined) {
          await wooCommerce.put(
            `products/${wooProductId}/variations/${existingVariation.id}`,
            { regular_price: String(precio) }
          );
        }
      } else {
        // Crear nueva variación
        await createProductVariation(
          wooProductId,
          precio,
          relationData.step.name,
          relationData.subcategory.name
        );
      }

      return true;
    } catch (error) {
      console.error(`Error al sincronizar variaciones para producto #${wooProductId}:`, error);
      throw error;
    }
  };

  /**
   * Crea una nueva variación de producto en WooCommerce
   */
  const createProductVariation = async (wooProductId, price, stepValue, subcategoryValue) => {
    try {
      const variationData = {
        regular_price: String(price || 0),
        attributes: [
          {
            name: "step",
            option: stepValue
          },
          {
            name: "subcategory",
            option: subcategoryValue
          }
        ]
      };

      const response = await wooCommerce.post(
        `products/${wooProductId}/variations`,
        variationData
      );

      return response;
    } catch (error) {
      console.error("Error al crear variación de producto:", error);
      throw error;
    }
  };

  /**
   * Actualiza el WoocomerceId en Strapi
   */
  const updateStrapiProductWooId = async (productId, wooProductId) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/challenge-products/${productId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            WoocomerceId: wooProductId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar WoocomerceId en Strapi");
      }

      return await response.json();
    } catch (error) {
      console.error("Error al actualizar WoocomerceId en Strapi:", error);
      throw error;
    }
  };

  return {
    syncProductWithWoo,
    createWooProduct,
    updateWooProduct,
    syncProductVariations,
  };
}