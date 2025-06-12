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
import { useDensityMode } from '@/components/ui/density-toggle';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
  const { density } = useDensityMode();
  
  const menuItems = [
    { id: 'collateral', label: 'Collateral', icon: ShieldCheck, color: 'text-fis-green' },
    { id: 'needs', label: 'Needs', icon: TrendingUp, color: 'text-fis-blue' },
    { id: 'parameters', label: 'Parameters', icon: Settings, color: 'text-fis-orange' },
  ];

  const NavLink: React.FC<{ item: any; isActive: boolean }> = ({ item, isActive }) => (
    <Button
      variant="ghost"
      onClick={() => setActivePage(item.id)}
      className={cn(
        "w-full justify-start h-auto p-0 relative group",
        isOpen ? "px-3 py-3" : "px-3 py-3 justify-center",
        isActive 
          ? "bg-white/20 text-white hover:bg-white/30 border border-white/30" 
          : "text-white/80 hover:text-white hover:bg-white/10",
        density === 'compact' && "py-2 px-2"
      )}
    >
      <div className="flex items-center w-full">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          isActive ? "bg-gradient-to-br from-fis-green to-fis-green-dark text-white shadow-lg" : "text-white/70 group-hover:text-white",
          density === 'compact' && "p-1.5"
        )}>
          <item.icon size={density === 'compact' ? 16 : 20} className="flex-shrink-0" />
        </div>
        
        {isOpen && (
          <div className="flex items-center justify-between flex-1 ml-3">
            <span className={cn(
              "text-sm font-medium transition-opacity duration-200",
              density === 'compact' && "text-xs"
            )}>
              {item.label}
            </span>
            {isActive && (
              <Badge variant="secondary" className={cn(
                "bg-fis-green-light text-fis-green text-xs px-2 py-0.5",
                density === 'compact' && "text-xs px-1 py-0 hidden-compact"
              )}>
                Active
              </Badge>
            )}
          </div>
        )}
        
        {!isOpen && isActive && (
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-fis-green to-fis-green-dark rounded-r-full"></div>
        )}
      </div>
      
      {isActive && isOpen && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-fis-green to-fis-green-dark rounded-r-full"></div>
      )}
    </Button>
  );

  return (
    <div className={cn(
      "bg-gradient-to-b from-[#015B7E] via-[#015B7E] to-[#50FF48] text-white flex flex-col border-r border-slate-800/50 shadow-2xl",
      "transition-all duration-300 ease-in-out z-30",
      isOpen ? (density === 'compact' ? "w-48" : "w-64") : (density === 'compact' ? "w-16" : "w-20"),
      `density-${density}`
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-white/20 bg-black/10 backdrop-blur-sm",
        isOpen ? "justify-between" : "justify-center",
        density === 'compact' ? "h-12 px-2" : "h-16 px-4"
      )}>
        {isOpen ? (
          <div className="flex items-center space-x-3">
            <div>
              <h1 className={cn(
                "fis-headline leading-tight",
                density === 'compact' ? "text-sm" : "text-lg"
              )}>
                <span className="text-[#00a651]">FIS</span>
                <span className="mx-2 text-slate-400">|</span>
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">SMARTLOAN</span>
              </h1>
              <p className={cn(
                "fis-body-regular text-white/70",
                density === 'compact' ? "text-xs hidden-compact" : "text-xs"
              )}>
                Securities Lending
              </p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "fis-headline text-[#00a651]",
            density === 'compact' ? "text-xs" : "text-sm"
          )}>
            FIS
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors",
            density === 'compact' ? "p-1" : "p-2"
          )}
        >
          {isOpen ? (
            <ChevronLeft size={density === 'compact' ? 14 : 18} />
          ) : (
            <ChevronRight size={density === 'compact' ? 14 : 18} />
          )}
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className={cn(
        "flex-1 flex flex-col space-y-2",
        density === 'compact' ? "p-2" : "p-3"
      )}>
        <div className={cn(
          "flex-1",
          density === 'compact' ? "space-y-1" : "space-y-2"
        )}>
          {menuItems.map((item) => (
            <NavLink key={item.id} item={item} isActive={activePage === item.id} />
          ))}
        </div>
        
        {/* Footer */}
        <div className={cn(
          "border-t border-white/20",
          density === 'compact' ? "pt-2" : "pt-4"
        )}>
          {isOpen ? (
            <div className="text-center">
              <p className={cn(
                "text-white/60",
                density === 'compact' ? "text-xs" : "text-xs"
              )}>
                Smart Loan v2.0
              </p>
              <p className={cn(
                "text-white/50",
                density === 'compact' ? "text-xs hidden-compact" : "text-xs"
              )}>
                Enterprise Edition
              </p>
            </div>
          ) : (
            <div className={cn(
              "bg-fis-green rounded-full mx-auto animate-pulse",
              density === 'compact' ? "w-1.5 h-1.5" : "w-2 h-2"
            )}></div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 