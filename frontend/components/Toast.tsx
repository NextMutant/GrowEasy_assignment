import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-green-50/40 dark:bg-green-950/15 border-green-200/40 dark:border-green-900/30 text-zinc-800 dark:text-zinc-200',
    error: 'bg-red-50/40 dark:bg-red-950/15 border-red-200/40 dark:border-red-900/30 text-zinc-800 dark:text-zinc-200',
    info: 'bg-zinc-50/60 dark:bg-zinc-900/50 border-border text-zinc-800 dark:text-zinc-200',
  };

  const Icons = {
    success: <CheckCircle className="h-4.5 w-4.5 text-green-500" />,
    error: <AlertCircle className="h-4.5 w-4.5 text-red-500" />,
    info: <Info className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-450" />,
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center p-3.5 border rounded-lg shadow-md max-w-sm ${bgColors[type]} transition-all transform translate-y-0 opacity-100 animate-slide-in`}>
      <div className="flex-shrink-0 mr-3">{Icons[type]}</div>
      <div className="text-xs font-semibold pr-8">{message}</div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:text-zinc-550 dark:hover:text-zinc-300 focus:outline-none cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default Toast;
