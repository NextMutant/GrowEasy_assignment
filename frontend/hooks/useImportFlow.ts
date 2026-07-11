import { useState, useRef } from 'react';
import { parseCsvOnClient, ClientParsedData } from '../lib/csvClientParser';
import { uploadCsvFile, mapCsvBatch } from '../lib/api';
import { ImportResult } from '../lib/types';

export type ImportFlowState = 'idle' | 'previewing' | 'processing' | 'done' | 'error';
export type ProcessingProgressStep = 'uploading' | 'parsing' | 'mapping_ai' | 'finishing';

export const useImportFlow = (options?: {
  onError?: (msg: string) => void;
  onSuccess?: (result: ImportResult) => void;
}) => {
  const [state, setState] = useState<ImportFlowState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [clientData, setClientData] = useState<ClientParsedData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progressStep, setProgressStep] = useState<ProcessingProgressStep>('uploading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };

  const handleSelectFile = async (selectedFile: File) => {
    setErrorMsg(null);
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      const msg = 'Invalid file format. Only CSV files are accepted.';
      setErrorMsg(msg);
      setState('error');
      options?.onError?.(msg);
      return;
    }

    try {
      setFile(selectedFile);
      setState('previewing');
      
      const parsed = await parseCsvOnClient(selectedFile);
      setClientData(parsed);
    } catch (err) {
      const error = err as Error;
      const msg = error.message || 'Failed to parse file on client side.';
      setErrorMsg(msg);
      setState('error');
      options?.onError?.(msg);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !clientData) return;

    setState('processing');
    setProgressStep('uploading');
    setErrorMsg(null);
    clearTimers();

    abortControllerRef.current = new AbortController();

    const t1 = setTimeout(() => setProgressStep('parsing'), 800);
    const t2 = setTimeout(() => setProgressStep('mapping_ai'), 1600);
    timerRefs.current = [t1, t2];

    const BATCH_SIZE = 15; // Process in safe sizes under 6000 TPM
    const rawRows = clientData.rows;
    const batches: Array<Array<Record<string, string>>> = [];
    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
      batches.push(rawRows.slice(i, i + BATCH_SIZE));
    }

    const imported: any[] = [];
    const skipped: any[] = [];

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Allow visual steps to render
      await delay(1700);

      for (let i = 0; i < batches.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const batch = batches[i];
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
          try {
            loggerInfo(`Mapping batch ${i + 1}/${batches.length} (Attempt ${attempts + 1})...`);
            // Update errorMsg with current mapping status to make it feel premium
            setErrorMsg(`Processing batch ${i + 1}/${batches.length}...`);

            const result = await mapCsvBatch(batch, i, abortControllerRef.current?.signal || undefined);
            imported.push(...result.imported);
            skipped.push(...result.skipped);
            success = true;
          } catch (err: any) {
            if (err.name === 'AbortError') {
              throw err;
            }

            attempts++;
            if (err.status === 429 && attempts < maxAttempts) {
              const waitTime = (err.retryAfterSeconds || 28) + 1;
              loggerInfo(`Rate limit hit. Sleeping for ${waitTime}s...`);

              // Display rate limit alert info
              setErrorMsg(`Rate limit hit by Groq API. Pausing for ${waitTime} seconds before retrying batch ${i + 1}/${batches.length}...`);

              for (let w = 0; w < waitTime; w++) {
                if (abortControllerRef.current?.signal.aborted) {
                  throw new DOMException('Aborted', 'AbortError');
                }
                await delay(1000);
              }
              setErrorMsg(null);
            } else {
              if (attempts >= maxAttempts) {
                loggerInfo(`Batch ${i + 1} failed completely. Skipping.`);
                const startRowNumber = i * BATCH_SIZE + 2;
                batch.forEach((rawRow, idx) => {
                  skipped.push({
                    rowNumber: startRowNumber + idx,
                    reason: err.message || 'Batch AI mapping failed',
                    rawRowData: rawRow,
                  });
                });
                success = true;
              } else {
                await delay(2000);
              }
            }
          }
        }
      }

      setErrorMsg(null);
      setProgressStep('finishing');
      await delay(1000);

      const totalImported = imported.length;
      const totalSkipped = skipped.length;
      const totalProcessed = rawRows.length;
      const successRate = totalProcessed > 0 ? Math.round((totalImported / totalProcessed) * 100) : 0;

      skipped.sort((a, b) => a.rowNumber - b.rowNumber);

      const finalResult: ImportResult = {
        imported,
        skipped,
        totalImported,
        totalSkipped,
        totalProcessed,
        successRate,
      };

      setImportResult(finalResult);
      setState('done');
      options?.onSuccess?.(finalResult);

    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        loggerInfo('Import aborted by user.');
        return;
      }
      clearTimers();
      const msg = error.message || 'An unexpected error occurred during processing.';
      setErrorMsg(msg);
      setState('error');
      options?.onError?.(msg);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearTimers();
    setState('previewing');
  };

  const handleRemoveFile = () => {
    clearTimers();
    setFile(null);
    setClientData(null);
    setImportResult(null);
    setErrorMsg(null);
    setState('idle');
  };

  const handleReset = () => {
    handleRemoveFile();
  };

  const handleLoadHistoryResult = (result: any, fileName: string) => {
    clearTimers();
    setFile({ name: fileName } as File);
    setImportResult(result);
    setClientData(null);
    setState('done');
  };

  return {
    state,
    file,
    clientData,
    importResult,
    progressStep,
    errorMsg,
    handleSelectFile,
    handleConfirmImport,
    handleCancel,
    handleRemoveFile,
    handleReset,
    handleLoadHistoryResult,
  };
};

// Internal debug logger for client hook
const loggerInfo = (msg: string) => {
  console.log(`[useImportFlow]: ${msg}`);
};
