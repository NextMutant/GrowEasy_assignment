import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ProcessingProgressStep } from '../hooks/useImportFlow';

interface LoaderProps {
  currentStep: ProcessingProgressStep;
  fileName: string;
  totalRows: number;
  totalCols: number;
  onCancel: () => void;
}

export const Loader: React.FC<LoaderProps> = ({
  currentStep,
  fileName,
  totalRows,
  totalCols,
  onCancel,
}) => {
  const steps = [
    {
      id: 'uploading' as const,
      title: 'Uploading',
      description: 'Uploading file securely to server',
      duration: '00:02',
    },
    {
      id: 'parsing' as const,
      title: 'Parsing',
      description: `${totalRows} rows • ${totalCols} columns detected`,
      duration: '00:03',
    },
    {
      id: 'mapping_ai' as const,
      title: 'Mapping with AI',
      description: 'Matching fields and extracting lead data',
      duration: '00:15',
    },
    {
      id: 'finishing' as const,
      title: 'Finishing',
      description: 'Preparing CRM records and validation',
      duration: '00:01',
    },
  ];

  const getStepState = (stepId: ProcessingProgressStep) => {
    const stepOrder: ProcessingProgressStep[] = ['uploading', 'parsing', 'mapping_ai', 'finishing'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      {/* Left Metadata Panel */}
      <div className="md:col-span-1 border-r border-gray-100 pr-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Processing</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {"Please don't close this window. Our AI is analyzing and mapping the fields. We'll notify you when it's done."}
          </p>
          <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
            <span className="font-semibold text-gray-700">File:</span> {fileName}
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="mt-6 md:mt-0 text-left text-xs font-semibold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
        >
          Cancel Processing
        </button>
      </div>

      {/* Right Progress steps list & Grid Visualization */}
      <div className="md:col-span-2 space-y-8 flex flex-col justify-between pl-0 md:pl-4">
        {/* Stepper details */}
        <div className="space-y-4">
          {steps.map((step) => {
            const state = getStepState(step.id);
            
            return (
              <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  {/* Circle Indicator */}
                  {state === 'completed' && (
                    <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center border border-green-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {state === 'active' && (
                    <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                  )}
                  {state === 'pending' && (
                    <div className="h-6 w-6 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center border border-gray-200" />
                  )}

                  {/* Title & Desc */}
                  <div>
                    <h4 className={`text-sm font-semibold ${state === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs mt-0.5 ${state === 'pending' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {state === 'active' && step.id === 'mapping_ai' ? 'AI is mapping fields...' : step.description}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <span className={`text-xs font-mono ${state === 'pending' ? 'text-gray-300' : 'text-gray-400'}`}>
                  {state === 'completed' ? step.duration : state === 'active' ? 'processing' : '--'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Visual Matrix animation */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center">
          {/* Animated blocks grid */}
          <div className="grid grid-cols-12 gap-1.5 w-full max-w-sm mb-4">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="h-3.5 w-full rounded-sm bg-blue-100/50 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 transform -translate-x-full animate-progress-blocks"
                  style={{
                    animationDelay: `${(i % 12) * 150}ms`,
                    animationDuration: '1.8s',
                  }}
                />
              </div>
            ))}
          </div>

          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider animate-pulse flex items-center">
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-blue-500" />
            AI is reading and understanding your data...
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
