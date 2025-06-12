import { useState, useEffect } from 'react'
import { 
  HelpCircle, 
  BarChart2, 
  Briefcase, 
  FileText, 
  AlertTriangle, 
  ChevronDown,
  Grid3X3,
  User,
  Settings,
  Shield,
  LogOut,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import FISSmartLoanLogo from '@/components/ui/fis-smartloan-logo';
import { DensityToggle, useDensityMode } from '@/components/ui/density-toggle';
import { DateTimeDisplay } from '@/components/ui/date-time-display';

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { density, changeDensity } = useDensityMode();

  return (
    <header className={`bg-[#012834] text-white shadow-2xl border-b border-slate-700/50 z-20 density-${density}`}>
      <div className="container mx-auto px-4">
        <div className={`flex justify-between items-center ${density === 'compact' ? 'py-1.5' : 'py-2.5'}`}>
          
          {/* Left: Branding & Environment */}
          <div className={`flex items-center ${density === 'compact' ? 'space-x-3' : 'space-x-4'}`}>
            <div className={`flex items-center ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}>
              <FISSmartLoanLogo variant="gradient" size={density === 'compact' ? 'sm' : 'md'} />
              <Separator orientation="vertical" className={`bg-slate-600 ${density === 'compact' ? 'h-6' : 'h-7'}`} />
              <div className={`flex items-center ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}>
                <Badge className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 ${density === 'compact' ? 'text-xs px-2 py-0.5' : ''}`}>
                  QA
                </Badge>
                <span className="text-slate-300 text-sm fis-body-regular hidden-compact">Loanet - Firm 9990</span>
              </div>
            </div>
          </div>

          {/* Center: Density Control & Quick Tools */}
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`flex items-center ${density === 'compact' ? 'space-x-1' : 'space-x-2'}`}>
                <span className="text-xs text-white/70 font-medium hidden-compact">View:</span>
                <DensityToggle 
                  density={density} 
                  onDensityChange={changeDensity}
                />
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
                >
                  <Grid3X3 size={16} />
                  <span className="fis-body-semibold hidden-compact">Quick Tools</span>
                  <ChevronDown size={14} />
                </Button>
                
                {showToolsMenu && (
                  <Card className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl z-50">
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                          <BarChart2 size={16} className="text-[#015B7E] mr-3" />
                          <span>Analytical Reports</span>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                          <Zap size={16} className="text-[#00a651] mr-3" />
                          <span>Borrow/Loan</span>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                          <FileText size={16} className="text-[#285BC5] mr-3" />
                          <span>Scratchpad</span>
                        </Button>
                        <Separator className="my-1.5" />
                        <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                          <HelpCircle size={16} className="text-[#1B1B6F] mr-3" />
                          <span>Help & Support</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status, Notifications & User */}
          <div className={`flex items-center ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}>
            
            {/* Current Time - Using new DateTimeDisplay component */}
            <div className={`hidden md:block ${density === 'compact' ? 'hidden-compact' : ''}`}>
              <DateTimeDisplay 
                variant={density === 'compact' ? 'minimal' : 'inline'} 
                size={density === 'compact' ? 'xs' : 'sm'} 
                showDate={!density || density !== 'compact'}
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative text-white hover:text-white hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all duration-200 bg-white/10 backdrop-blur-sm ${density === 'compact' ? 'p-2' : 'p-2.5'}`}
              >
                <AlertTriangle size={density === 'compact' ? 16 : 18} />
                <Badge className={`absolute -top-1 -right-1 bg-gradient-to-r from-[#50FF48] to-[#00a651] text-[#012834] text-xs p-0 flex items-center justify-center rounded-full border-2 border-white font-bold shadow-lg ${density === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}`}>
                  3
                </Badge>
              </Button>
              
              {showNotifications && (
                <Card className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl z-50">
                  <CardContent className="p-0">
                    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                        <p className="text-sm text-slate-900 font-medium">Margin call alert for Account #0801</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <User size={12} className="mr-1" />
                          2 minutes ago
                        </p>
                      </div>
                      <div className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                        <p className="text-sm text-slate-900 font-medium">New collateral pledge pending approval</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <User size={12} className="mr-1" />
                          15 minutes ago
                        </p>
                      </div>
                      <div className="px-4 py-2.5 hover:bg-slate-50 transition-colors">
                        <p className="text-sm text-slate-900 font-medium">Daily reconciliation completed</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <User size={12} className="mr-1" />
                          1 hour ago
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/50">
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-sm p-0 h-auto">
                        View all notifications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center text-white hover:text-white hover:bg-white/20 border border-white/30 hover:border-white/50 transition-all duration-200 bg-white/10 backdrop-blur-sm ${density === 'compact' ? 'space-x-2 p-2' : 'space-x-2.5 p-2.5'}`}
              >
                <div className={`flex items-center ${density === 'compact' ? 'space-x-2' : 'space-x-2.5'}`}>
                  <div className={`bg-gradient-to-br from-[#00a651] to-[#008A44] rounded-full flex items-center justify-center shadow-lg ${density === 'compact' ? 'w-6 h-6' : 'w-7 h-7'}`}>
                    <span className={`font-bold text-white ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>BG</span>
                  </div>
                  <div className="text-left hidden md:block">
                    <div className={`fis-body-bold text-white ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>BGoyette</div>
                    <div className="text-xs fis-body-regular text-white/80 hidden-compact">Firm 9990</div>
                  </div>
                </div>
                <ChevronDown size={density === 'compact' ? 12 : 14} className="text-[#50FF48]" />
              </Button>
              
              {showUserMenu && (
                <Card className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl z-50">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="font-bold text-white text-base">BG</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">BGoyette</p>
                          <p className="text-sm text-slate-600">Firm No. 9990</p>
                          <p className="text-xs text-slate-500 flex items-center mt-1">
                            <User size={12} className="mr-1" />
                            Last login: 06/10/2025 12:46 PM
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                        <User size={16} className="text-slate-500 mr-3" />
                        <span>Profile</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                        <Settings size={16} className="text-slate-500 mr-3" />
                        <span>User Settings</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-slate-700 hover:bg-slate-100">
                        <Shield size={16} className="text-slate-500 mr-3" />
                        <span>Security</span>
                      </Button>
                    </div>
                    
                    <Separator />
                    <div className="py-2">
                      <Button variant="ghost" className="w-full justify-start h-auto p-2.5 text-[#012834] hover:bg-[#012834]/10 hover:text-[#011E28]">
                        <LogOut size={16} className="mr-3" />
                        <span>Log Out</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 