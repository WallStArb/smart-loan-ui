import React from 'react';
import { ChevronLeft, Sliders, BarChart2, Zap } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
  const menuItems = [
    { id: 'collateral', label: 'Collateral Manager', icon: BarChart2 },
    { id: 'config', label: 'Configuration', icon: Sliders },
    { id: 'another', label: 'Another Page', icon: Zap },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-gray-800 text-white w-64 p-4 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Menu</h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage(item.id);
                }}
                className={`flex items-center p-2 rounded-md transition-colors ${
                  activePage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3" size={20} />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 