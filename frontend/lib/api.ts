import { ApiResponse } from './types';

const API_URL = 'http://localhost:8000/api';

export const analyzeQuery = async (query: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling backend API:", error);
    throw error;
  }
};