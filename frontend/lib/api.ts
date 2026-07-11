import { ImportResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    status: number;
    details?: unknown;
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
 * Maps a single batch of records via the /map-batch endpoint.
 */
export const mapCsvBatch = async (
  batch: Array<Record<string, string>>,
  batchIndex: number,
  signal?: AbortSignal
): Promise<{ imported: any[]; skipped: any[] }> => {
  const response = await fetch(`${API_URL}/map-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ batch, batchIndex }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Batch mapping failed with status: ${response.status}`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch (_) {}

    const error = new Error(errMsg);
    if (response.status === 429) {
      (error as any).status = 429;
      const resetHeader = response.headers.get('retry-after') || response.headers.get('x-ratelimit-reset-tokens');
      if (resetHeader) {
        const match = resetHeader.match(/([\d.]+)/);
        if (match) {
          (error as any).retryAfterSeconds = Math.ceil(parseFloat(match[1]));
        }
      }
    }
    throw error;
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Server returned invalid response structure.');
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
  } catch {
    return false;
  }
};
