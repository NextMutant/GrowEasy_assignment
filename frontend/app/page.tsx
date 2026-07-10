'use intelligence'; // just normal code
'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Sparkles, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useImportFlow } from '../hooks/useImportFlow';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import PreviewTable from '../components/PreviewTable';
import ConfirmModal from '../components/ConfirmModal';
import Loader from '../components/Loader';
import StatsCards from '../components/StatsCards';
import ResultsTable from '../components/ResultsTable';
import Toast from '../components/Toast';

export default function Home() {
  const {
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
  } = useImportFlow();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Synchronize toast messages with errors from flow hook
  useEffect(() => {
    if (errorMsg) {
      setToast({ message: errorMsg, type: 'error' });
    }
  }, [errorMsg]);

  // Synchronize toast success message when done
  useEffect(() => {
    if (state === 'done' && importResult) {
      setToast({
        message: `Successfully imported ${importResult.totalImported} leads. ${importResult.totalSkipped} skipped.`,
        type: 'success',
      });
    }
  }, [state, importResult]);

  const getStepNumber = (): number => {
    switch (state) {
      case 'idle':
        return 1;
      case 'previewing':
        return 2;
      case 'processing':
        return 3;
      case 'done':
        return 4;
      case 'error':
        return file ? 2 : 1; // Return to current active pane on error
      default:
        return 1;
    }
  };

  const currentStep = getStepNumber();

  const stepperItems = [
    { num: 1, label: 'Upload', desc: 'Add CSV File' },
    { num: 2, label: 'Preview', desc: 'Review raw data' },
    { num: 3, label: 'Processing', desc: 'AI mapping' },
    { num: 4, label: 'Results', desc: 'Review output' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* Sidebar Navigation */}
      <Navbar activeTab="import" />

      {/* Main Layout Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header Row */}
        <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900 flex items-center">
            AI CSV Importer
            {state === 'processing' && (
              <span className="ml-2.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold animate-pulse uppercase tracking-wider">
                In Progress
              </span>
            )}
          </h1>
          
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <HelpCircle className="h-5.5 w-5.5" />
            </button>
            
            {/* User Profile Avatar Card */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm tracking-wide shadow-sm">
                SS
              </div>
              <div className="text-left hidden md:block">
                <h4 className="text-xs font-bold text-gray-800 leading-tight">Saurabh Shah</h4>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content Padding */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Stepper Progress Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
              {stepperItems.map((item, idx) => {
                const isActive = item.num === currentStep;
                const isCompleted = item.num < currentStep;
                
                return (
                  <React.Fragment key={item.num}>
                    {/* Step Card */}
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-100'
                            : isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {item.num}
                      </div>
                      <div className="text-left">
                        <h4 className={`text-xs font-bold ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                          {item.label}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    
                    {/* Connector Line */}
                    {idx < stepperItems.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 border-t border-dashed mx-6 ${
                          isCompleted ? 'border-green-500' : 'border-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step 1: Upload Card Panel */}
          {state === 'idle' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <div className="md:col-span-1 border-r border-gray-100 pr-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </span>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Upload CSV</h2>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Import lists exported from Facebook Leads, Google Ads, spreadsheets, or other CRMs. Preview data before committing resources.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center pl-0 md:pl-4">
                <UploadBox file={file} onFileSelected={handleSelectFile} onRemoveFile={handleRemoveFile} />
              </div>
            </div>
          )}

          {/* Step 2: Preview Panel */}
          {(state === 'previewing' || (state === 'error' && file)) && clientData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              {/* File details column */}
              <div className="md:col-span-1 border-r border-gray-100 pr-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      2
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Preview CSV</h2>
                  </div>
                  
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                    NOT MAPPED
                  </span>
                  
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Data parsed on the client side. Verify rows and structure before executing AI mapper calculations.
                  </p>
                  
                  {/* File Stats Badge */}
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 flex flex-col space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <FileSpreadsheet className="h-5.5 w-5.5" />
                      </div>
                      <div className="truncate max-w-[120px]">
                        <h4 className="text-xs font-bold text-gray-800 truncate">{file?.name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Uploaded just now</p>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Rows</span>
                        <h5 className="text-sm font-bold text-gray-700 mt-0.5">{clientData.rows.length}</h5>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Columns</span>
                        <h5 className="text-sm font-bold text-gray-700 mt-0.5">{clientData.headers.length}</h5>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="mt-6 md:mt-0 text-left text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                >
                  Choose Different File
                </button>
              </div>

              {/* Data Grid Preview Column */}
              <div className="md:col-span-3 pl-0 md:pl-4">
                <PreviewTable
                  headers={clientData.headers}
                  rows={clientData.rows}
                  onConfirm={() => setIsConfirmOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Loading Progressive Stepper Panel */}
          {state === 'processing' && file && clientData && (
            <Loader
              currentStep={progressStep}
              fileName={file.name}
              totalRows={clientData.rows.length}
              totalCols={clientData.headers.length}
              onCancel={handleCancel}
            />
          )}

          {/* Step 4: Import Complete Results Panel */}
          {state === 'done' && importResult && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column Controls */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      4
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Import Complete</h2>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-4 text-emerald-800 flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">AI Mapping Completed</p>
                      <p className="leading-relaxed">
                        Processed {importResult.totalProcessed} records. {importResult.totalImported} leads added. {importResult.totalSkipped} skipped.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    View successfully normalized items below, and check the skipped tab to inspect rows failing validation checks.
                  </p>
                </div>
                
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Import Another File</span>
                </button>
              </div>

              {/* Right Column Stats & Table Grid */}
              <div className="lg:col-span-3 space-y-6">
                <StatsCards result={importResult} />
                <ResultsTable result={importResult} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {file && clientData && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false);
            handleConfirmImport();
          }}
          fileName={file.name}
          rowCount={clientData.rows.length}
        />
      )}

      {/* Toast Notification Message Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
