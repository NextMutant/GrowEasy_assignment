import React from 'react';
import { CheckCircle2, AlertTriangle, Percent, FileText } from 'lucide-react';
import { ImportResult } from '../lib/types';

interface StatsCardsProps {
  result: ImportResult;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ result }) => {
  const cards = [
    {
      title: 'Total Imported',
      value: result.totalImported,
      icon: CheckCircle2,
      colorClass: 'text-green-600 bg-green-50 border-green-100',
      shadowClass: 'shadow-green-50',
    },
    {
      title: 'Total Skipped',
      value: result.totalSkipped,
      icon: AlertTriangle,
      colorClass: 'text-amber-600 bg-amber-50 border-amber-100',
      shadowClass: 'shadow-amber-50',
    },
    {
      title: 'Success Rate',
      value: `${result.successRate}%`,
      icon: Percent,
      colorClass: 'text-blue-600 bg-blue-50 border-blue-100',
      shadowClass: 'shadow-blue-50',
    },
    {
      title: 'Total Processed',
      value: result.totalProcessed,
      icon: FileText,
      colorClass: 'text-purple-600 bg-purple-50 border-purple-100',
      shadowClass: 'shadow-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between ${card.shadowClass}`}
          >
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                {card.title}
              </span>
              <span className="text-2xl font-black text-gray-800 tracking-tight">
                {card.value}
              </span>
            </div>
            
            <div className={`h-11 w-11 rounded-lg flex items-center justify-center border ${card.colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
