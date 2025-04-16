// src/server/challenge-data.js - Componente Servidor
import strapiService from '../../services/server/strapi-service';

/**
 * Obtiene los datos necesarios para el challenge
 * Esta función se ejecuta SOLO en el servidor
 */
export async function getChallengeData(session) {
  try {
    // Obtener y procesar datos de relaciones
    const relationsResponse = await strapiService.get('challenge-relations', {
      fields: ['id', 'documentId'],
      populate: {
        challenge_step: { fields: ['id', 'name'] },
        challenge_products: { 
          fields: ['id', 'name', 'balance', 'isPremium', 'hasDiscount', 'descuento'] 
        }
      }
    });

    // Transformar los datos para enviar solo lo necesario al cliente
    const processedRelations = relationsResponse.data.map(relation => ({
      id: relation.id,
      documentId: relation.attributes?.documentId,
      step: relation.attributes?.challenge_step?.data ? {
        id: relation.attributes.challenge_step.data.id,
        name: relation.attributes.challenge_step.data.attributes.name
      } : null,
      products: (relation.attributes?.challenge_products?.data || []).map(product => ({
        id: product.id,
        name: product.attributes.name,
        balance: product.attributes.balance,
        isPremium: product.attributes.isPremium,
        hasDiscount: product.attributes.hasDiscount,
        descuento: product.attributes.descuento
      }))
    }));

    // Procesar otros datos...
    
    return {
      relations: processedRelations,
      // otros datos procesados...
    };
  } catch (error) {
    console.error('Error obteniendo datos del challenge:', error);
    throw error;
  }
}

// Este objeto se usará en getServerSideProps, nunca llega al cliente