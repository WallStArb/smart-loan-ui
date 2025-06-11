import React from 'react';
import { HelpCircle, BarChart2, Briefcase, FileText, Settings, LogOut, User, Building, Bell } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-[#003366] text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold">
              <span className="text-green-400">FIS</span> SMARTLOAN
            </div>
            <div className="text-sm border-l border-gray-500 pl-4">
              QA | Loanet - Firm 9990
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-300">Last Login: 06/10/2025 12:46:03 PM</span>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <HelpCircle size={16} />
              <span>Help</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <BarChart2 size={16} />
              <span>Analytical Reports</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <Briefcase size={16} />
              <span>Borrow/Loan</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <FileText size={16} />
              <span>Scratchpad</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <Settings size={16} />
              <span>User Settings</span>
            </a>
            <a href="#" className="flex items-center space-x-1 hover:text-green-400">
              <LogOut size={16} />
              <span>Log Out</span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <Bell size={20} className="hover:text-green-400 cursor-pointer"/>
            <div className="text-right">
              <div className="font-semibold flex items-center space-x-1">
                <User size={16} /> 
                <span>BGoyette</span>
              </div>
              <div className="text-xs text-gray-300 flex items-center space-x-1">
                <Building size={12} />
                <span>Firm No. (9990)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 