import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

interface PreviewTableProps {
  headers: string[];
  rows: Array<Record<string, string>>;
  onConfirm: () => void;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
  headers,
  rows,
  onConfirm,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Page size of 10 for clean look, easily handles thousands of records
  
  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);
  const currentRows = rows.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`h-8 w-8 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
            currentPage === i
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold'
              : 'border-zinc-200 dark:border-zinc-800 bg-card-bg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="h-8 w-8 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 cursor-pointer"
            >
              1
            </button>
            {startPage > 2 && <span className="text-zinc-400 dark:text-zinc-600 text-xs px-1">...</span>}
          </>
        )}

        {buttons}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-zinc-400 dark:text-zinc-600 text-xs px-1">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 w-8 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 cursor-pointer"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-550 dark:text-zinc-450 bg-card-bg border border-border rounded-xl transition-colors duration-200">
        No preview rows available.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-card-bg border border-border rounded-xl shadow-none overflow-hidden transition-colors duration-200">
      {/* Scrollable Table Area */}
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="min-w-full divide-y divide-border text-left text-xs text-zinc-700 dark:text-zinc-300">
          <thead className="bg-zinc-50/50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-4 py-3 text-[10px] whitespace-nowrap bg-zinc-50/50 dark:bg-zinc-900/60">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card-bg font-normal">
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-xs max-w-[200px] truncate whitespace-nowrap">
                    {row[header] !== undefined ? row[header] : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls */}
      <div className="px-6 py-3.5 bg-zinc-50/30 dark:bg-zinc-900/20 border-t border-border flex items-center justify-between flex-wrap gap-4 transition-colors duration-200">
        {/* Left Side: Counts */}
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rows.length > 0 ? startIndex + 1 : 0}</span>–
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{endIndex}</span> of{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rows.length}</span> rows
        </span>

        {/* Center: Pagination */}
        {totalPages > 1 && renderPaginationButtons()}

        {/* Right Side: Action */}
        <Button
          type="button"
          onClick={onConfirm}
          className="shadow-sm shadow-blue-100 dark:shadow-none flex items-center space-x-1.5"
        >
          <span>Confirm Import</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PreviewTable;
