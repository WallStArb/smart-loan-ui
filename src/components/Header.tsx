import { useState, useEffect } from 'react'
import { 
  HelpCircle, 
  BarChart2, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut, 
  User, 
  Building, 
  Bell, 
  ChevronDown,
  Clock,
  Shield,
  Menu,
  X
} from 'lucide-react';

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentTime = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <header className="bg-[#003366] text-white shadow-lg border-b border-[#004080]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          
          {/* Left: Branding & Environment */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold">
                <span className="text-green-400">FIS</span> <span className="text-white">SMARTLOAN</span>
              </div>
              <div className="h-6 w-px bg-gray-500"></div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-2 py-1 bg-orange-600 rounded text-xs font-medium">QA</span>
                <span className="text-gray-300">Loanet - Firm 9990</span>
              </div>
            </div>
          </div>

          {/* Center: Quick Tools */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#004080] transition-colors"
              >
                <Menu size={16} />
                <span className="text-sm">Quick Tools</span>
                <ChevronDown size={14} />
              </button>
              
              {showToolsMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <BarChart2 size={16} className="text-blue-500" />
                    <span>Analytical Reports</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <Briefcase size={16} className="text-green-500" />
                    <span>Borrow/Loan</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FileText size={16} className="text-purple-500" />
                    <span>Scratchpad</span>
                  </a>
                  <div className="border-t border-gray-200 my-2"></div>
                  <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <HelpCircle size={16} className="text-orange-500" />
                    <span>Help & Support</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status, Notifications & User */}
          <div className="flex items-center space-x-4">
            
            {/* Current Time */}
            <div className="hidden md:flex items-center space-x-2 text-xs text-gray-300 bg-[#004080] px-3 py-1.5 rounded-lg">
              <Clock size={14} />
              <span>{currentTime}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-[#004080] transition-colors"
              >
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
              </button>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm text-gray-900">Margin call alert for Account #0801</p>
                      <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm text-gray-900">New collateral pledge pending approval</p>
                      <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-900">Daily reconciliation completed</p>
                      <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-700">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#004080] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">BG</span>
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-semibold">BGoyette</div>
                    <div className="text-xs text-gray-300">Firm 9990</div>
                  </div>
                </div>
                <ChevronDown size={14} />
              </button>
              
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="font-bold text-white">BG</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">BGoyette</p>
                        <p className="text-sm text-gray-500">Firm No. 9990</p>
                        <p className="text-xs text-gray-400">Last login: 06/10/2025 12:46 PM</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <User size={16} className="text-gray-500" />
                      <span>Profile</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <Settings size={16} className="text-gray-500" />
                      <span>User Settings</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                      <Shield size={16} className="text-gray-500" />
                      <span>Security</span>
                    </a>
                  </div>
                  
                  <div className="border-t border-gray-200 py-2">
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50">
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showToolsMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowToolsMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header; 