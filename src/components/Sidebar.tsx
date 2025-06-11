import React from 'react';
import {
  Home, ArrowRightLeft, Package, ShieldCheck, TrendingDown,
  Bot, Undo, Warehouse, Activity, UserCog, BookUser, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react';

type Page = 'collateral' | 'needs';

const navItems = [
  { icon: Home, label: 'Home', page: 'collateral' },
  { icon: ArrowRightLeft, label: 'Trading', page: 'collateral' },
  { icon: ClipboardList, label: 'Needs', page: 'needs' },
  { icon: Package, label: 'OMS', page: 'collateral' },
  { icon: ShieldCheck, label: 'Collateral', page: 'collateral' },
  { icon: TrendingDown, label: 'Short Sale', page: 'collateral' },
  { icon: Bot, label: 'Auto Processes', page: 'collateral' },
  { icon: Undo, label: 'Recalls', page: 'collateral' },
  { icon: Warehouse, label: 'Inventory', page: 'collateral' },
  { icon: UserCog, label: 'Admin', page: 'collateral' },
  { icon: BookUser, label: 'Deal Book', page: 'collateral' }
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
  const getActiveLabel = () => {
    if (activePage === 'collateral') return 'Collateral';
    if (activePage === 'needs') return 'Needs';
    return 'Collateral';
  };
  
  return (
    <aside className={`relative bg-gray-800 text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        <nav className="flex-grow mt-4">
          <ul>
            {navItems.map(({ icon: Icon, label, page }) => (
              <li key={label}>
                <a
                  href="#"
                  onClick={() => setActivePage(page as Page)}
                  className={`flex items-center py-3 my-1 transition-colors duration-200 ${
                    label === getActiveLabel()
                      ? 'bg-gray-900 text-yellow-400 border-r-4 border-yellow-400'
                      : 'hover:bg-gray-700'
                  } ${isOpen ? 'px-6' : 'justify-center'}`}
                  title={label}
                >
                  <Icon size={22} />
                  <span className={`ml-4 transition-transform duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 -translate-x-8 hidden'}`}>
                    {label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-1 focus:outline-none ring-2 ring-gray-800"
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 