import Papa from 'papaparse';

export interface ClientParsedData {
  headers: string[];
  rows: Array<Record<string, string>>;
}

/**
 * Parses a local CSV file client-side for fast preview table representation.
 */
export const parseCsvOnClient = (file: File): Promise<ClientParsedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          rows: results.data as Array<Record<string, string>>,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export default parseCsvOnClient;
