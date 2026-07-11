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
      return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-250 dark:border-slate-700';
    }

    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-450 border-green-200 dark:border-green-900/50';
      case 'SALE_DONE':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-455 border-emerald-200 dark:border-emerald-900/50';
      case 'DID_NOT_CONNECT':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border-amber-200 dark:border-amber-900/50';
      case 'BAD_LEAD':
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-450 border-red-200 dark:border-red-900/50';
      default:
        return 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700';
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
    <div className="w-full flex flex-col bg-card-bg border border-border rounded-xl shadow-none overflow-hidden transition-colors duration-200 relative z-10">
      {/* Header Tabs */}
      <div className="px-6 py-3.5 border-b border-border flex items-center justify-between flex-wrap gap-4 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-border/80">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-450 dark:hover:text-zinc-200'
            }`}
          >
            All Records ({allItems.length})
          </button>
          <button
            onClick={() => { setActiveTab('imported'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center space-x-1 cursor-pointer ${
              activeTab === 'imported'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-green-600 dark:text-zinc-450 dark:hover:text-green-450'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            <span>Imported ({importedItems.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('skipped'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all flex items-center space-x-1 cursor-pointer ${
              activeTab === 'skipped'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-amber-600 dark:text-zinc-450 dark:hover:text-amber-450'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Skipped ({skippedItems.length})</span>
          </button>
        </div>

        {/* Right Tab controls */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="text-xs border border-border rounded-lg p-1.5 bg-card-bg text-zinc-650 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium cursor-pointer"
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
        <table className="min-w-full divide-y divide-border text-left text-xs text-zinc-700 dark:text-zinc-350">
          <thead className="bg-zinc-50/50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]">
            <tr>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60 w-16">Row</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Name</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Email</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Mobile</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Status</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Company</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">City/State/Country</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Source</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Owner</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Possession</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">Note / Reason</th>
              <th className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card-bg">
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const isSkipped = item.type === 'skipped';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isSkipped
                        ? 'bg-red-50/5 dark:bg-red-950/5 hover:bg-red-50/10 dark:hover:bg-red-950/10 text-zinc-400 dark:text-zinc-500'
                        : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-400 dark:text-zinc-500">#{item.rowNumber}</td>
                    <td className={`px-4 py-3 font-bold ${isSkipped ? 'text-zinc-400/80 line-through dark:text-zinc-550/80' : 'text-zinc-900 dark:text-white'}`}>
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
                        <span className="text-red-500 dark:text-red-400 font-semibold flex items-center space-x-1">
                          <ShieldAlert className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-red-500 dark:text-red-450" />
                          <span className="truncate" title={item.reason}>{item.reason}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-450 truncate block">{item.crm_note}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 focus:outline-none p-1 transition-colors cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                  No records matching active tab filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="px-6 py-3.5 bg-zinc-50/30 dark:bg-zinc-900/20 border-t border-border flex items-center justify-between flex-wrap gap-4 transition-colors duration-200">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Showing <span className="font-semibold text-zinc-850 dark:text-zinc-200">{totalItems > 0 ? startIndex + 1 : 0}</span>–
          <span className="font-semibold text-zinc-850 dark:text-zinc-200">{endIndex}</span> of{' '}
          <span className="font-semibold text-zinc-850 dark:text-zinc-200">{totalItems}</span> records
        </span>

        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(validCurrentPage - 1)}
              disabled={validCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-8 w-8 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    validCurrentPage === pageNum
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-card-bg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(validCurrentPage + 1)}
              disabled={validCurrentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card-bg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
