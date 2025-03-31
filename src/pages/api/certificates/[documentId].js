// pages/api/certificates/[documentId].js
import { fetchPublicData } from 'src/services/strapiPublicService';

export default async function handler(req, res) {
  const { documentId } = req.query;

  try {
    const data = await fetchPublicData(`certificates?filters[documentId][$eq]=${documentId}`);
    if (data.data && data.data.length > 0) {
      res.status(200).json(data.data[0]);
    } else {
      res.status(404).json({ error: 'Certificado no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el certificado' });
  }
}