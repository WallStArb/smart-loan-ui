import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
  const menuItems = [
    { id: 'collateral', label: 'Collateral', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'needs', label: 'Needs', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'parameters', label: 'Parameters', icon: Settings, color: 'text-amber-400' },
  ];

  const NavLink: React.FC<{ item: any; isActive: boolean }> = ({ item, isActive }) => (
    <Button
      variant="ghost"
      onClick={() => setActivePage(item.id)}
      className={cn(
        "w-full justify-start h-auto p-0 relative group",
        isOpen ? "px-3 py-3" : "px-3 py-3 justify-center",
        isActive 
          ? "bg-slate-800/80 text-white hover:bg-slate-800/90 border border-slate-700/50" 
          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
      )}
    >
      <div className="flex items-center w-full">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          isActive ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg" : "text-slate-400 group-hover:text-white"
        )}>
          <item.icon size={20} className="flex-shrink-0" />
        </div>
        
        {isOpen && (
          <div className="flex items-center justify-between flex-1 ml-3">
            <span className="text-sm font-medium transition-opacity duration-200">
              {item.label}
            </span>
            {isActive && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                Active
              </Badge>
            )}
          </div>
        )}
        
        {!isOpen && isActive && (
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
        )}
      </div>
      
      {isActive && isOpen && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
      )}
    </Button>
  );

  return (
    <div className={cn(
      "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col border-r border-slate-800/50 shadow-2xl",
      "transition-all duration-300 ease-in-out z-30",
      isOpen ? "w-64" : "w-20"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm",
        isOpen ? "justify-between" : "justify-center"
      )}>
        {isOpen && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SMARTLOAN
              </h1>
              <p className="text-xs text-slate-400">Securities Lending</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col p-3 space-y-2">
        <div className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink key={item.id} item={item} isActive={activePage === item.id} />
          ))}
        </div>
        
        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/50">
          {isOpen ? (
            <div className="text-center">
              <p className="text-xs text-slate-500">Smart Loan v2.0</p>
              <p className="text-xs text-slate-600">Enterprise Edition</p>
            </div>
          ) : (
            <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto animate-pulse"></div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 