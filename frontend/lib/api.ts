import { ImportResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    status: number;
    details?: any;
  };
}

/**
 * Uploads a CSV file to the backend for full AI processing.
 * Accepts an AbortSignal to cancel requests in flight.
 */
export const uploadCsvFile = async (
  file: File,
  signal?: AbortSignal
): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
    signal,
  });

  const json: ApiResponse<ImportResult> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Upload failed with status: ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!json.data) {
    throw new Error('Server returned empty data response.');
  }

  return json.data;
};

/**
 * Checks backend health status.
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const json = await response.json();
    return response.ok && json.success;
  } catch (error) {
    return false;
  }
};
