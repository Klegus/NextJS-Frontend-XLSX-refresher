import axios, { AxiosError } from 'axios';
import { rateLimit } from '@/lib/ratelimit';

const backendClient = axios.create({
  baseURL: process.env.BACKEND_URL,
  timeout: 10000,
});

export async function fetchFromBackend<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    body?: any;
  } = {}
): Promise<T> {
  const { method = 'GET', params, body } = options;

  try {
    // Apply rate limiting
    await rateLimit();

    const response = await backendClient.request({
      method,
      url: path,
      params,
      data: body,
      headers: {
        'X-Api-Key': process.env.API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      throw {
        status: axiosError.response?.status,
        response: axiosError.response?.data,
        message: axiosError.message,
      };
    }
    throw error;
  }
}