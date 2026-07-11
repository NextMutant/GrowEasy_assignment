import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2 } from 'lucide-react';
import Button from './ui/Button';

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
  file: File | null;
  onRemoveFile: () => void;
}

export const UploadBox: React.FC<UploadBoxProps> = ({
  onFileSelected,
  file,
  onRemoveFile,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelected(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* File Not Selected State */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-zinc-800 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-900/40'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/20 hover:border-zinc-400 dark:hover:border-zinc-700'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          
          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400 border border-border">
            <UploadCloud className="h-5 w-5" />
          </div>

          <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-1">
            Drag and drop your CSV file here
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">or</p>
          
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="mb-4 shadow-sm active:scale-[0.98] transition-transform duration-100"
          >
            Choose File
          </Button>

          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-normal">
            CSV only • Max 25MB • Local client-side parsing
          </span>
        </div>
      ) : (
        /* File Selected State */
        <div className="border border-border rounded-xl p-4 bg-card-bg shadow-none flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-100/50 dark:border-green-900/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-md">
                {file.name}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-0.5 font-mono">
                {formatSize(file.size)} • Ready to preview
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onRemoveFile}
            className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 p-2 cursor-pointer"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
