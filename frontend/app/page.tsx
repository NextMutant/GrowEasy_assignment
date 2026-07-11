'use intelligence'; // just normal code
'use client';

import React, { useState } from 'react';
import { HelpCircle, Sparkles, FileSpreadsheet, RefreshCw, Sun, Moon, History, Eye, Trash2 } from 'lucide-react';
import { useImportFlow } from '../hooks/useImportFlow';
import Navbar from '../components/Navbar';
import UploadBox from '../components/UploadBox';
import PreviewTable from '../components/PreviewTable';
import ConfirmModal from '../components/ConfirmModal';
import Loader from '../components/Loader';
import StatsCards from '../components/StatsCards';
import ResultsTable from '../components/ResultsTable';
import Toast from '../components/Toast';
import { useTheme } from '../components/ThemeProvider';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [initialLoading, setInitialLoading] = useState(true);
  const [navbarTab, setNavbarTab] = useState<string>('import');
  const [importHistory, setImportHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('groweasy_import_history');
      if (saved) {
        setImportHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  const {
    state,
    file,
    clientData,
    importResult,
    progressStep,
    handleSelectFile,
    handleConfirmImport,
    handleCancel,
    handleRemoveFile,
    handleReset,
    handleLoadHistoryResult,
  } = useImportFlow({
    onError: (msg) => setToast({ message: msg, type: 'error' }),
    onSuccess: (result) => {
      setToast({
        message: `Successfully imported ${result.totalImported} leads. ${result.totalSkipped} skipped.`,
        type: 'success',
      });
      // Track and add page history
      try {
        const historyRecord = {
          id: Date.now().toString(),
          fileName: file?.name || 'leads_import.csv',
          timestamp: new Date().toLocaleString(),
          totalProcessed: result.totalProcessed,
          totalImported: result.totalImported,
          totalSkipped: result.totalSkipped,
          successRate: result.successRate,
          result: result,
        };
        setImportHistory(prev => {
          const updated = [historyRecord, ...prev];
          localStorage.setItem('groweasy_import_history', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.error(err);
      }
    }
  });

  const handleLoadHistory = (item: any) => {
    if (!item.result) {
      setToast({
        message: 'Detailed data is not available for this legacy import.',
        type: 'error',
      });
      return;
    }
    handleLoadHistoryResult(item.result, item.fileName);
    setNavbarTab('import');
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-colors duration-200">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-500/5 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center animate-fade-in">
          {/* Logo */}
          <div className="relative group">
            <img
              src="/logo.png"
              alt="GrowEasy Logo"
              className="h-10 w-auto object-contain rounded-lg animate-pulse"
            />
            <div className="absolute -inset-0.5 bg-zinc-900/5 dark:bg-white/5 blur-md rounded-lg -z-10 opacity-60" />
          </div>
          
          {/* Brand Name */}
          <h2 className="text-zinc-900 dark:text-white font-bold text-sm tracking-tight mt-5">
            GrowEasy
          </h2>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-1.5">
            AI Engine Loading
          </p>

          {/* Sleek Progress Line */}
          <div className="w-24 h-[2px] bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-6 relative">
            <div className="absolute top-0 left-0 h-full bg-zinc-900 dark:bg-zinc-100 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-64 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <Navbar activeTab={navbarTab} onTabChange={(tabId) => setNavbarTab(tabId)} />

      {/* Main Layout Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen relative z-10">
        {/* Top Header Row */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-200">
          <h1 className="text-base font-bold text-zinc-900 dark:text-white flex items-center tracking-tight">
            AI CSV Importer
            {state === 'processing' && (
              <span className="ml-2.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700 text-[10px] font-bold animate-pulse uppercase tracking-wider">
                In Progress
              </span>
            )}
          </h1>
          
          <div className="flex items-center space-x-5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-yellow-400" />
              )}
            </button>

            <button className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors cursor-pointer">
              <HelpCircle className="h-5 w-5" />
            </button>
            
            {/* User Profile Avatar Card */}
            <div className="flex items-center space-x-3 pl-4 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-300 flex items-center justify-center font-semibold text-xs tracking-wide border border-border">
                UB
              </div>
              <div className="text-left hidden md:block">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">Uttaran Bose</h4>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content Padding */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {navbarTab === 'import' ? (
            <>
              {/* Stepper Progress Bar */}
              <div className="w-full max-w-4xl mx-auto mb-2">
                <div className="grid grid-cols-4 gap-4">
                  {stepperItems.map((item) => {
                    const isActive = item.num === currentStep;
                    const isCompleted = item.num < currentStep;
                    
                    return (
                      <div key={item.num} className="space-y-2">
                        {/* Segmented Line */}
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-zinc-900 dark:bg-zinc-100'
                              : isActive
                              ? 'bg-zinc-900 dark:bg-zinc-100 ring-2 ring-zinc-500/10'
                              : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        />
                        <div className="flex justify-between items-center px-0.5">
                          <span
                            className={`text-[10px] font-bold tracking-tight uppercase ${
                              isActive || isCompleted
                                ? 'text-zinc-850 dark:text-zinc-200'
                                : 'text-zinc-400 dark:text-zinc-655'
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-605 font-medium font-mono">
                            0{item.num}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Upload Card Panel */}
              {state === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-card-bg border border-border rounded-xl p-8 shadow-none transition-colors duration-200">
                  <div className="md:col-span-1 border-r border-border pr-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Upload CSV</h2>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-card-bg border border-border rounded-xl p-8 shadow-none transition-colors duration-200 relative z-10">
                  {/* File details column */}
                  <div className="md:col-span-1 border-r border-border pr-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Preview CSV</h2>
                      </div>
                      
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-border text-zinc-650 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-widest mb-4">
                        NOT MAPPED
                      </span>
                      
                      <p className="text-sm text-zinc-500 dark:text-zinc-405 leading-relaxed mb-6">
                        Data parsed on the client side. Verify rows and structure before executing AI mapper calculations.
                      </p>
                      
                      {/* File Stats Badge */}
                      <div className="bg-background border border-border rounded-xl p-4 flex flex-col space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 flex items-center justify-center border border-border">
                            <FileSpreadsheet className="h-4.5 w-4.5" />
                          </div>
                          <div className="truncate max-w-[120px]">
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{file?.name}</h4>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-505 font-medium mt-0.5">Uploaded just now</p>
                          </div>
                        </div>
                        <div className="h-px bg-border w-full" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-zinc-455 dark:text-zinc-505 uppercase font-semibold tracking-wider">Rows</span>
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 mt-0.5">{clientData.rows.length}</h5>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-455 dark:text-zinc-505 uppercase font-semibold tracking-wider">Columns</span>
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 mt-0.5">{clientData.headers.length}</h5>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRemoveFile}
                      className="mt-6 md:mt-0 text-left text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors uppercase tracking-wider cursor-pointer"
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
                  <div className="lg:col-span-1 bg-card-bg border border-border rounded-xl p-6 shadow-none h-fit space-y-6 flex flex-col justify-between transition-colors duration-200 relative z-10">
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                          4
                        </span>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Import Complete</h2>
                      </div>
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl mb-4 text-emerald-800 dark:text-emerald-400 flex items-start space-x-3">
                        <Sparkles className="h-4.5 w-4.5 text-emerald-600 mt-0.5 flex-shrink-0 animate-pulse" />
                        <div className="text-[11px] space-y-1">
                          <p className="font-bold">AI Mapping Completed</p>
                          <p className="leading-relaxed">
                            Processed {importResult.totalProcessed} records. {importResult.totalImported} leads added. {importResult.totalSkipped} skipped.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                        View successfully normalized items below, and check the skipped tab to inspect rows failing validation checks.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-border text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
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
            </>
          ) : navbarTab === 'history' ? (
            /* Tab 2: Imports History Logs Dashboard */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                    <History className="h-5 w-5 mr-2 text-zinc-500 dark:text-zinc-400" />
                    Imports History
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-405 mt-1">Review past CSV imports and mapping details.</p>
                </div>
                {importHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear your import history?")) {
                        setImportHistory([]);
                        localStorage.removeItem('groweasy_import_history');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-red-200 dark:border-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {importHistory.length === 0 ? (
                <div className="bg-card-bg border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center relative z-10">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500 border border-border">
                    <History className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-1">No past imports found</h3>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 mb-6 max-w-xs leading-normal">
                    Successfully processed file summaries will automatically be recorded here.
                  </p>
                  <button
                    onClick={() => setNavbarTab('import')}
                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Import Leads Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {importHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistory(item)}
                      className="bg-card-bg border border-border rounded-xl p-5 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-start space-x-3.5">
                          <div className="h-9 w-9 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-border flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                            <FileSpreadsheet className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 tracking-tight flex items-center gap-2">
                              {item.fileName}
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-normal text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                <Eye className="h-3 w-3" /> view results
                              </span>
                            </h4>
                            <p className="text-[11px] text-zinc-450 dark:text-zinc-500 mt-1 font-medium font-mono">
                              Imported on {item.timestamp}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 md:space-x-8">
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold tracking-wider">Processed</span>
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 mt-0.5">{item.totalProcessed}</h5>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold tracking-wider">Imported</span>
                            <h5 className="text-xs font-bold text-green-600 dark:text-green-450 mt-0.5">+{item.totalImported}</h5>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold tracking-wider">Skipped</span>
                            <h5 className="text-xs font-bold text-amber-600 dark:text-amber-450 mt-0.5">{item.totalSkipped}</h5>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold tracking-wider">Success</span>
                            <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 mt-0.5">{item.successRate}%</h5>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded bg-green-50/50 dark:bg-green-950/20 text-green-600 border border-green-200/50 dark:border-green-900/30">
                              Completed
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${item.fileName}" from history?`)) {
                                  const updated = importHistory.filter(h => h.id !== item.id);
                                  setImportHistory(updated);
                                  localStorage.setItem('groweasy_import_history', JSON.stringify(updated));
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-red-500 dark:text-zinc-550 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
                              title="Delete from history"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Templates / Settings Fallback Panel */
            <div className="bg-card-bg border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center relative z-10">
              <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-1">
                {navbarTab.charAt(0).toUpperCase() + navbarTab.slice(1)} Dashboard
              </h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 mb-4">
                This section is currently read-only. Access settings or template customization soon.
              </p>
              <button
                onClick={() => setNavbarTab('import')}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Go Back to Import
              </button>
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
