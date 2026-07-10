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
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-blue-200 bg-blue-50/20 hover:bg-blue-50/40 hover:border-blue-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-600 border border-blue-100">
            <UploadCloud className="h-6 w-6" />
          </div>

          <h3 className="text-base font-semibold text-gray-800 mb-1">
            Drag and drop your CSV file here
          </h3>
          <p className="text-sm text-gray-500 mb-4">or</p>
          
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="mb-4"
          >
            Choose File
          </Button>

          <span className="text-xs text-gray-400 text-center leading-normal">
            CSV only • Max 25MB • Nothing is imported until you confirm
          </span>
        </div>
      ) : (
        /* File Selected State */
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 truncate max-w-md">
                {file.name}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatSize(file.size)} • Ready to preview
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onRemoveFile}
            className="text-red-500 hover:bg-red-50 hover:text-red-700 p-2"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
