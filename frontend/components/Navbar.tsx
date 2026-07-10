import React from 'react';
import { UploadCloud, History, FileText, Settings, Sparkles, Database } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab = 'import' }) => {
  const menuItems = [
    { id: 'import', label: 'Import Leads', icon: UploadCloud },
    { id: 'history', label: 'Imports History', icon: History },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div className="p-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
            G
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center">
            GrowEasy
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold uppercase tracking-wider">
              AI
            </span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            
            return (
              <button
                key={item.id}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card */}
      <div className="p-4 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 transform scale-150 group-hover:scale-175 transition-transform duration-300">
            <Database className="h-28 w-28 text-white" />
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-100">AI Powered</span>
          </div>
          
          <h4 className="text-sm font-bold mb-1 tracking-tight">Messy to Meaningful</h4>
          <p className="text-xs text-blue-100 leading-relaxed font-normal">
            Clean, validate, and normalize lead data dynamically. Save hours of manual entry in seconds.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
