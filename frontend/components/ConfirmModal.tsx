import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import Button from './ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  rowCount: number;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  rowCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-[3px] animate-fade-in">
      <div className="bg-card-bg border border-border rounded-xl shadow-xl max-w-md w-full overflow-hidden p-6 animate-scale-up">
        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-800 dark:text-zinc-200 border border-border">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Run AI Data Mapping?</h3>
        </div>

        {/* Description Body */}
        <div className="text-sm text-zinc-655 dark:text-zinc-400 leading-relaxed mb-6 space-y-2">
          <p>
            You are about to import <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fileName}</span> containing{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rowCount} rows</span> of lead data.
          </p>
          <p>
            Our AI engine will parse, clean, and map these records into the GrowEasy CRM 15-field schema.
            Duplicate headers will be suffix-named, and incomplete leads will be skipped.
          </p>
          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start space-x-2 mt-4">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span>
              This operation takes a few seconds depending on batch size and rate limits. Do not refresh the page.
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={onConfirm}>
            Start AI Mapping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
