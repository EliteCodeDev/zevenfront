// src/services/strapiPublicService.js
import axios from 'axios';

const strapiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchPublicData(endpoint) {
  try {
    const response = await axios.get(`${strapiUrl}/api/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public data from Strapi:', error);
    throw error;
  }
}