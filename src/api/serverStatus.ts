import axios from 'axios';
import { ServerStatus } from '../types/schedule';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export async function checkServerStatus(): Promise<ServerStatus> {
  try {
    const response = await axios.get<ServerStatus>(`${API_BASE_URL}/status`);
    return response.data;
  } catch (error) {
    console.error('Błąd podczas sprawdzania statusu serwera:', error);
    throw error;
  }
}

export function isMaintenanceMode(status: ServerStatus): boolean {
  return status.maintenance_mode === true;
}
