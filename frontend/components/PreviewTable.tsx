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
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`h-8 w-8 text-xs font-semibold rounded-lg border transition-colors ${
            currentPage === i
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
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
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="h-8 w-8 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400 text-xs px-1">...</span>}
          </>
        )}

        {buttons}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400 text-xs px-1">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="h-8 w-8 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white border border-gray-100 rounded-xl">
        No preview rows available.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Scrollable Table Area */}
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
          <thead className="bg-gray-50 text-gray-600 font-semibold tracking-wide sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap bg-gray-50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white font-normal">
            {currentRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-4 py-2.5 max-w-[200px] truncate whitespace-nowrap">
                    {row[header] !== undefined ? row[header] : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
        {/* Left Side: Counts */}
        <span className="text-xs text-gray-500 font-medium">
          Showing <span className="font-semibold text-gray-700">{rows.length > 0 ? startIndex + 1 : 0}</span>–
          <span className="font-semibold text-gray-700">{endIndex}</span> of{' '}
          <span className="font-semibold text-gray-700">{rows.length}</span> rows
        </span>

        {/* Center: Pagination */}
        {totalPages > 1 && renderPaginationButtons()}

        {/* Right Side: Action */}
        <Button
          type="button"
          onClick={onConfirm}
          className="shadow-sm shadow-blue-100 flex items-center space-x-1.5"
        >
          <span>Confirm Import</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PreviewTable;
