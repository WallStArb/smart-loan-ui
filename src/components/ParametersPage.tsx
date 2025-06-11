import React, { useState } from 'react'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download,
  ChevronLeft,
  Filter,
  Bell,
  Clock,
  Shield,
  Target,
  Palette
} from 'lucide-react'

interface ParametersPageProps {
  onBack: () => void
}

const ParametersPage: React.FC<ParametersPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    // Filtering
    priorityFilter: 'all',
    needTypes: {
      cnsDelivery: true,
      dvpDelivery: true,
      regulatoryDeficit: true,
      customerShorts: true
    },
    
    // Risk Thresholds
    highBorrowRate: 5.0,
    criticalAging: 3,
    minMarketValue: 100000,
    
    // Automation
    autoCureSmall: true,
    smartBorrowing: true,
    autoRecall: false,
    autoCureThreshold: 50000,
    
    // Data Refresh
    refreshInterval: '5',
    liveMarketData: true,
    realTimeNotifications: true,
    
    // Display
    tableDensity: 'compact',
    showProgressIndicators: true,
    highlightUrgent: true,
    darkMode: false
  })

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    // In a real app, this would save to a backend or local storage
    console.log('Saving settings:', settings)
    // Show success message
  }

  const handleReset = () => {
    // Reset to default values
    setSettings({
      priorityFilter: 'all',
      needTypes: {
        cnsDelivery: true,
        dvpDelivery: true,
        regulatoryDeficit: true,
        customerShorts: true
      },
      highBorrowRate: 5.0,
      criticalAging: 3,
      minMarketValue: 100000,
      autoCureSmall: true,
      smartBorrowing: true,
      autoRecall: false,
      autoCureThreshold: 50000,
      refreshInterval: '5',
      liveMarketData: true,
      realTimeNotifications: true,
      tableDensity: 'compact',
      showProgressIndicators: true,
      highlightUrgent: true,
      darkMode: false
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'smart-loan-settings.json'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Smart Loan Parameters</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Config</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Filtering & Display */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtering & Display</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Filter</label>
                <select 
                  value={settings.priorityFilter}
                  onChange={(e) => handleInputChange('priorityFilter', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high-critical">High & Critical</option>
                  <option value="medium-above">Medium & Above</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Need Types</label>
                <div className="space-y-3">
                  {[
                    { key: 'cnsDelivery', label: 'CNS Delivery' },
                    { key: 'dvpDelivery', label: 'DVP Delivery' },
                    { key: 'regulatoryDeficit', label: 'Regulatory Deficit' },
                    { key: 'customerShorts', label: 'Customer Shorts' }
                  ].map(type => (
                    <label key={type.key} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={settings.needTypes[type.key as keyof typeof settings.needTypes]}
                        onChange={(e) => handleNestedChange('needTypes', type.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <span className="ml-3 text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Density</label>
                <select 
                  value={settings.tableDensity}
                  onChange={(e) => handleInputChange('tableDensity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="compact">Compact</option>
                  <option value="standard">Standard</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risk Thresholds */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Risk Thresholds</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">High Borrow Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.highBorrowRate}
                  onChange={(e) => handleInputChange('highBorrowRate', parseFloat(e.target.value))}
                  step="0.1" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Rates above this threshold will be highlighted as high risk</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Critical Aging (days)</label>
                <input 
                  type="number" 
                  value={settings.criticalAging}
                  onChange={(e) => handleInputChange('criticalAging', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Positions aging beyond this will be marked critical</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Market Value ($)</label>
                <input 
                  type="number" 
                  value={settings.minMarketValue}
                  onChange={(e) => handleInputChange('minMarketValue', parseInt(e.target.value))}
                  step="1000" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Only show positions above this market value</p>
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Automation</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.autoCureSmall}
                    onChange={(e) => handleInputChange('autoCureSmall', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Auto-cure small positions</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.smartBorrowing}
                    onChange={(e) => handleInputChange('smartBorrowing', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Enable smart borrowing</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.autoRecall}
                    onChange={(e) => handleInputChange('autoRecall', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Auto-recall opportunities</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-cure threshold ($)</label>
                <input 
                  type="number" 
                  value={settings.autoCureThreshold}
                  onChange={(e) => handleInputChange('autoCureThreshold', parseInt(e.target.value))}
                  step="1000" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Automatically cure positions below this value</p>
              </div>
            </div>
          </div>

          {/* Data Refresh & Notifications */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Data & Notifications</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval</label>
                <select 
                  value={settings.refreshInterval}
                  onChange={(e) => handleInputChange('refreshInterval', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.liveMarketData}
                    onChange={(e) => handleInputChange('liveMarketData', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Live market data</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.realTimeNotifications}
                    onChange={(e) => handleInputChange('realTimeNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Real-time notifications</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.showProgressIndicators}
                    onChange={(e) => handleInputChange('showProgressIndicators', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Show progress indicators</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.highlightUrgent}
                    onChange={(e) => handleInputChange('highlightUrgent', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Highlight urgent items</span>
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={settings.darkMode}
                    onChange={(e) => handleInputChange('darkMode', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm text-gray-700">Dark mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-blue-900">Configuration Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-900">Active Filters:</p>
              <p className="text-blue-700">Priority: {settings.priorityFilter}, {Object.values(settings.needTypes).filter(Boolean).length} need types</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">Automation:</p>
              <p className="text-blue-700">{[settings.autoCureSmall, settings.smartBorrowing, settings.autoRecall].filter(Boolean).length}/3 features enabled</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">Updates:</p>
              <p className="text-blue-700">Refresh every {settings.refreshInterval === 'manual' ? 'manually' : `${settings.refreshInterval}s`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParametersPage