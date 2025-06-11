import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
  const menuItems = [
    { id: 'collateral', label: 'Collateral', icon: ShieldCheck },
    { id: 'needs', label: 'Needs', icon: TrendingUp },
    { id: 'parameters', label: 'Parameters', icon: Settings },
  ];

  const NavLink: React.FC<{ item: any; isActive: boolean }> = ({ item, isActive }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setActivePage(item.id);
      }}
      className={`
        flex items-center text-gray-300 hover:text-white hover:bg-gray-700
        transition-colors duration-200 relative
        ${isOpen ? 'px-4 py-2.5 rounded-lg' : 'p-3 justify-center rounded-md'}
        ${isActive ? 'bg-gray-700 text-white' : ''}
      `}
    >
      <item.icon size={20} className="flex-shrink-0" />
      <span className={`
        ml-4 text-sm font-medium
        transition-opacity duration-200
        ${isOpen ? 'opacity-100' : 'opacity-0 absolute'}
      `}>
        {item.label}
      </span>
      {isActive && (
        <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r-full"></div>
      )}
    </a>
  );

  return (
    <div className={`
      bg-[#002244] text-white flex flex-col
      transition-all duration-300 ease-in-out z-30
      ${isOpen ? 'w-64' : 'w-20 items-center'}
    `}>
      <div className={`
        flex items-center
        ${isOpen ? 'justify-between' : 'justify-center'}
        h-16 px-4 border-b border-gray-700
      `}>
        {isOpen && <h1 className="text-lg font-bold">SMARTLOAN</h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-gray-700">
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 flex flex-col p-2 space-y-1">
        <div className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <NavLink key={item.id} item={item} isActive={activePage === item.id} />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 