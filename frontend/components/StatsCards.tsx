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
      colorClass: 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/10 border-green-100/50 dark:border-green-900/30',
    },
    {
      title: 'Total Skipped',
      value: result.totalSkipped,
      icon: AlertTriangle,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30',
    },
    {
      title: 'Success Rate',
      value: `${result.successRate}%`,
      icon: Percent,
      colorClass: 'text-zinc-900 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700',
    },
    {
      title: 'Total Processed',
      value: result.totalProcessed,
      icon: FileText,
      colorClass: 'text-zinc-900 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="bg-card-bg border border-border rounded-xl p-5 shadow-none hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                {card.title}
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>
            
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${card.colorClass}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
