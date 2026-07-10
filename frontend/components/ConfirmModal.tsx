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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-gray-100 rounded-xl shadow-2xl max-w-md w-full overflow-hidden p-6 animate-scale-up">
        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">Run AI Data Mapping?</h3>
        </div>

        {/* Description Body */}
        <div className="text-sm text-gray-600 leading-relaxed mb-6 space-y-2">
          <p>
            You are about to import <span className="font-semibold text-gray-900">{fileName}</span> containing{' '}
            <span className="font-semibold text-gray-900">{rowCount} rows</span> of lead data.
          </p>
          <p>
            Our AI engine will parse, clean, and map these records into the GrowEasy CRM 15-field schema.
            Duplicate headers will be suffix-named, and incomplete leads will be skipped.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 flex items-start space-x-2 mt-4">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
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
