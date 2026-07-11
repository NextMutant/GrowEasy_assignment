import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { ImportResult, CrmStatus } from '../lib/types';

interface ResultsTableProps {
  result: ImportResult;
}

type TabType = 'all' | 'imported' | 'skipped';

export const ResultsTable: React.FC<ResultsTableProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // default to 10 rows for clean scroll

  // Normalize all records into a single sortable layout
  // We represent each item as either { type: 'imported', data: CrmRecord, rowNumber: number }
  // or { type: 'skipped', data: SkippedRecord, rowNumber: number }
  const importedItems = result.imported.map((record, index) => ({
    type: 'imported' as const,
    id: `imported-${index}`,
    rowNumber: index + 2, // Approximate spreadsheet row number
    name: record.name,
    email: record.email,
    mobile: `${record.country_code ? record.country_code + ' ' : ''}${record.mobile_without_country_code}`,
    company: record.company,
    city: record.city,
    state: record.state,
    country: record.country,
    lead_owner: record.lead_owner,
    crm_status: record.crm_status,
    data_source: record.data_source || '—',
    possession_time: record.possession_time || '—',
    crm_note: record.crm_note || '—',
    reason: '',
  }));

  const skippedItems = result.skipped.map((record) => ({
    type: 'skipped' as const,
    id: `skipped-${record.rowNumber}`,
    rowNumber: record.rowNumber,
    name: record.rawRowData.name || record.rawRowData.Name || '—',
    email: record.rawRowData.email || record.rawRowData.Email || '—',
    mobile: record.rawRowData.mobile || record.rawRowData.Mobile || record.rawRowData.phone || record.rawRowData.Phone || '—',
    company: record.rawRowData.company || record.rawRowData.Company || '—',
    city: record.rawRowData.city || record.rawRowData.City || '—',
    state: record.rawRowData.state || record.rawRowData.State || '—',
    country: record.rawRowData.country || record.rawRowData.Country || '—',
    lead_owner: record.rawRowData.lead_owner || record.rawRowData.Owner || '—',
    crm_status: 'BAD_LEAD' as CrmStatus, // Skipped rows act as bad/invalid lead mapping
    data_source: '—',
    possession_time: '—',
    crm_note: '—',
    reason: record.reason,
  }));

  // Combine and sort by row number to match spreadsheet order
  const allItems = [...importedItems, ...skippedItems].sort((a, b) => a.rowNumber - b.rowNumber);

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'imported':
        return importedItems;
      case 'skipped':
        return skippedItems;
      default:
        return allItems;
    }
  };

  const filteredItems = getFilteredItems();
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Adjust page boundary
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const getStatusBadgeClass = (status: CrmStatus, isSkipped: boolean) => {
    if (isSkipped) {
      return 'bg-gray-100 text-gray-500 border-gray-200';
    }

    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'SALE_DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DID_NOT_CONNECT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BAD_LEAD':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: CrmStatus, isSkipped: boolean) => {
    if (isSkipped) return 'SKIPPED';
    return status.replace(/_/g, ' ');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header Tabs */}
      <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between flex-wrap gap-4 bg-gray-50/50">
        <div className="flex space-x-1.5 bg-gray-100/80 p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
              activeTab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Records ({allItems.length})
          </button>
          <button
            onClick={() => { setActiveTab('imported'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors flex items-center space-x-1 ${
              activeTab === 'imported' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-green-700'
            }`}
          >
            <Check className="h-3.5 w-3.5 mr-0.5" />
            <span>Imported ({importedItems.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('skipped'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors flex items-center space-x-1 ${
              activeTab === 'skipped' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-amber-700'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-0.5" />
            <span>Skipped ({skippedItems.length})</span>
          </button>
        </div>

        {/* Right Tab controls */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Main Results Table Grid */}
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
          <thead className="bg-gray-50 text-gray-600 font-semibold tracking-wide sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
            <tr>
              <th className="px-4 py-3 bg-gray-50 w-16">Row</th>
              <th className="px-4 py-3 bg-gray-50">Name</th>
              <th className="px-4 py-3 bg-gray-50">Email</th>
              <th className="px-4 py-3 bg-gray-50">Mobile</th>
              <th className="px-4 py-3 bg-gray-50">Status</th>
              <th className="px-4 py-3 bg-gray-50">Company</th>
              <th className="px-4 py-3 bg-gray-50">City/State/Country</th>
              <th className="px-4 py-3 bg-gray-50">Source</th>
              <th className="px-4 py-3 bg-gray-50">Owner</th>
              <th className="px-4 py-3 bg-gray-50">Possession</th>
              <th className="px-4 py-3 bg-gray-50">Note / Reason</th>
              <th className="px-4 py-3 bg-gray-50 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const isSkipped = item.type === 'skipped';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isSkipped
                        ? 'bg-red-50/10 hover:bg-red-50/20 text-gray-400'
                        : 'hover:bg-gray-50/40 text-gray-700'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-400">#{item.rowNumber}</td>
                    <td className={`px-4 py-3 font-bold ${isSkipped ? 'text-gray-400line-through' : 'text-gray-900'}`}>
                      {item.name}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[150px]">{item.email}</td>
                    <td className="px-4 py-3 font-mono">{item.mobile}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(item.crm_status, isSkipped)}`}>
                        {getStatusText(item.crm_status, isSkipped)}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-[120px]">{item.company}</td>
                    <td className="px-4 py-3 truncate max-w-[180px]">
                      {item.city || item.state || item.country
                        ? [item.city, item.state, item.country].filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[120px] font-medium">{item.data_source}</td>
                    <td className="px-4 py-3 font-medium">{item.lead_owner}</td>
                    <td className="px-4 py-3 truncate max-w-[100px]">{item.possession_time}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {isSkipped ? (
                        <span className="text-red-500 font-semibold flex items-center space-x-1">
                          <ShieldAlert className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-red-500" />
                          <span className="truncate">{item.reason}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 truncate block">{item.crm_note}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-blue-600 focus:outline-none p-1 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No records matching active tab filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <span className="text-xs text-gray-500 font-medium">
          Showing <span className="font-semibold text-gray-700">{totalItems > 0 ? startIndex + 1 : 0}</span>–
          <span className="font-semibold text-gray-700">{endIndex}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalItems}</span> records
        </span>

        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(validCurrentPage - 1)}
              disabled={validCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-8 w-8 text-xs font-semibold rounded-lg border transition-colors ${
                    validCurrentPage === pageNum
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(validCurrentPage + 1)}
              disabled={validCurrentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsTable;
