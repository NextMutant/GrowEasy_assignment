import { useState, useRef } from 'react';
import { parseCsvOnClient, ClientParsedData } from '../lib/csvClientParser';
import { uploadCsvFile } from '../lib/api';
import { ImportResult } from '../lib/types';

export type ImportFlowState = 'idle' | 'previewing' | 'processing' | 'done' | 'error';
export type ProcessingProgressStep = 'uploading' | 'parsing' | 'mapping_ai' | 'finishing';

export const useImportFlow = () => {
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
      setErrorMsg('Invalid file format. Only CSV files are accepted.');
      setState('error');
      return;
    }

    try {
      setFile(selectedFile);
      setState('previewing');
      
      const parsed = await parseCsvOnClient(selectedFile);
      setClientData(parsed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file on client side.');
      setState('error');
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setState('processing');
    setProgressStep('uploading');
    setErrorMsg(null);
    clearTimers();

    abortControllerRef.current = new AbortController();

    // Setup visual stepper progress animations to feel responsive and high premium
    const t1 = setTimeout(() => setProgressStep('parsing'), 1500);
    const t2 = setTimeout(() => setProgressStep('mapping_ai'), 3000);
    const t3 = setTimeout(() => setProgressStep('finishing'), 8000);
    
    timerRefs.current = [t1, t2, t3];

    try {
      const result = await uploadCsvFile(file, abortControllerRef.current.signal);
      
      // Let it stay in 'finishing' step briefly for a smooth transition
      const tFinish = setTimeout(() => {
        setImportResult(result);
        setState('done');
      }, 9500); // 1.5s after finishing starts
      
      timerRefs.current.push(tFinish);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        loggerInfo('Import aborted by user.');
        return;
      }
      clearTimers();
      setErrorMsg(err.message || 'An unexpected error occurred during processing.');
      setState('error');
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
  };
};

// Internal debug logger for client hook
const loggerInfo = (msg: string) => {
  console.log(`[useImportFlow]: ${msg}`);
};
