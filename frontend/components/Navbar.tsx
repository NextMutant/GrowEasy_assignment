import React from 'react';
import { UploadCloud, History, FileText, Settings, Sparkles, Database } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab = 'import', onTabChange }) => {
  const menuItems = [
    { id: 'import', label: 'Import Leads', icon: UploadCloud },
    { id: 'history', label: 'Imports History', icon: History },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar-bg border-r border-border flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div className="p-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <img
            src="/logo.png"
            alt="GrowEasy"
            className="h-7 w-auto object-contain rounded-md"
          />
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center">
            GrowEasy
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700 font-semibold uppercase tracking-wider">
              AI
            </span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-550'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card */}
      <div className="p-4 mb-4">
        <div className="border border-border bg-card-bg dark:bg-zinc-900/30 rounded-xl p-4.5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 transform scale-150 group-hover:scale-175 transition-transform duration-300">
            <Database className="h-24 w-24 text-zinc-400 dark:text-zinc-600" />
          </div>
          
          <div className="flex items-center space-x-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">AI Engine active</span>
          </div>
          
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 tracking-tight">Messy to Meaningful</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-normal">
            Clean, validate, and normalize lead data dynamically. Save hours of manual entry in seconds.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
