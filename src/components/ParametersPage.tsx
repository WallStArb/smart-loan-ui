import React, { useState } from 'react'
import { 
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  Check,
  Info,
  Clock,
  History,
  Download,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  ToggleRight,
  ToggleLeft,
  Settings2,
  Shield,
  Zap,
  Building2,
  TrendingDown,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: number
  user: string
  action: string
  component: string
  section: string
  description: string
  time: string
  date: string
  latest: boolean
  icon: any
  iconColor: string
  bgColor: string
  oldValue?: any
  newValue: any
}

const ParametersPage: React.FC = () => {
  // Loading and UI states
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [settings, setSettings] = useState({
    // Regulatory Components (Mandatory)
    cnsDeliveryNeeds: true,
    dvpDeliveryNeeds: true,
    fullyPaidAccounts: true,
    otherAvailability: true,
    
    // Business Components (Configurable)
    regulatoryDeficits: true,
    customerShorts: true,
    customerCashMargin: true,
    customerShort: true,
    nonCustomerShorts: true,
    nonCustomerCashMargin: true,
    nonCustomerShort: true,
    firmShorts: true,
    shortsDeficitLimited: true,
    
    // Special Conditions
    borrowForDeficitWhenDeliveryExists: false,
    
    // Reduction Methods
    reduceByAnticipatedReceives: true,
    reduceByOpenStockLoans: false,
    reduceByOpenStockLoanRecall: false,
    priorityOrder: 'normal' as 'normal' | 'reverse',
    cutoffTime: '11:00',
    
    // UI state
    customerShortsExpanded: true,
    nonCustomerShortsExpanded: true,
    anticipatedReceivesExpanded: true,
    showAllAuditEntries: false
  })

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])

  const getComponentInfo = (key: string) => {
    const componentMap: Record<string, { name: string, section: string }> = {
      cnsDeliveryNeeds: { name: 'CNS Delivery Needs', section: 'Regulatory Components' },
      dvpDeliveryNeeds: { name: 'DVP Delivery Needs', section: 'Regulatory Components' },
      fullyPaidAccounts: { name: 'Fully Paid Accounts', section: 'Regulatory Components' },
      otherAvailability: { name: 'Other Availability', section: 'Regulatory Components' },
      regulatoryDeficits: { name: 'Regulatory Deficits', section: 'Business Components' },
      customerShorts: { name: 'Customer Shorts', section: 'Business Components' },
      customerCashMargin: { name: 'Customer Cash/Margin', section: 'Business Components' },
      customerShort: { name: 'Customer Short', section: 'Business Components' },
      nonCustomerShorts: { name: 'Non-Customer Shorts', section: 'Business Components' },
      nonCustomerCashMargin: { name: 'Non-Customer Cash/Margin', section: 'Business Components' },
      nonCustomerShort: { name: 'Non-Customer Short', section: 'Business Components' },
      firmShorts: { name: 'Firm Shorts', section: 'Business Components' },
      shortsDeficitLimited: { name: 'Shorts Deficit Limited', section: 'Business Components' },
      borrowForDeficitWhenDeliveryExists: { name: 'Borrow for Deficit When Delivery Exists', section: 'Special Conditions' },
      reduceByAnticipatedReceives: { name: 'Reduce by Anticipated Receives', section: 'Reduction Methods' },
      reduceByOpenStockLoans: { name: 'Reduce by Open Stock Loans', section: 'Reduction Methods' },
      reduceByOpenStockLoanRecall: { name: 'Reduce by Open Stock Loan Recall', section: 'Reduction Methods' },
      priorityOrder: { name: 'Priority Order', section: 'Reduction Methods' },
      cutoffTime: { name: 'Cutoff Time', section: 'Reduction Methods' }
    }
    return componentMap[key] || { name: key, section: 'Unknown' }
  }

  const addAuditEntry = (key: string, oldValue: any, newValue: any) => {
    // Skip UI state changes from audit
    if (['customerShortsExpanded', 'nonCustomerShortsExpanded', 'anticipatedReceivesExpanded', 'showAllAuditEntries'].includes(key)) {
      return
    }

    const componentInfo = getComponentInfo(key)
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    const dateString = 'Today'

    let action: string
    let description: string
    let icon: any
    let iconColor: string
    let bgColor: string

    if (typeof newValue === 'boolean') {
      action = newValue ? 'Component Enabled' : 'Component Disabled'
      description = `User ${newValue ? 'enabled' : 'disabled'} component: ${componentInfo.name}`
      icon = newValue ? ToggleRight : ToggleLeft
      iconColor = newValue ? 'text-success' : 'text-critical'
      bgColor = newValue ? 'bg-success-muted' : 'bg-critical-muted'
    } else if (key === 'priorityOrder') {
      action = 'Priority Modified'
      description = `User changed priority order from ${oldValue === 'normal' ? 'Normal' : 'Reverse'} to ${newValue === 'normal' ? 'Normal (CNS, DVP, FP, OA)' : 'Reverse (OA, FP, DVP, CNS)'}`
      icon = Settings2
      iconColor = 'text-warning'
      bgColor = 'bg-warning-muted'
    } else {
      action = 'Settings Modified'
      description = `User changed ${componentInfo.name} from ${oldValue} to ${newValue}`
      icon = Settings2
      iconColor = 'text-info'
      bgColor = 'bg-info-muted'
    }

    const newEntry: AuditEntry = {
      id: Date.now(),
      user: 'UR',
      action,
      component: componentInfo.name,
      section: componentInfo.section,
      description,
      time: timeString,
      date: dateString,
      latest: true,
      icon,
      iconColor,
      bgColor,
      oldValue,
      newValue
    }

    setAuditEntries(prev => {
      const updatedPrev = prev.map(entry => ({ ...entry, latest: false }))
      return [newEntry, ...updatedPrev]
    })
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => {
      // Validation for Customer Shorts sub-components - prevent unchecking last one
      if (key === 'customerCashMargin' && !value && prev.customerShorts && !prev.customerShort) {
        return prev // Don't allow unchecking if it's the last remaining sub-component
      }
      if (key === 'customerShort' && !value && prev.customerShorts && !prev.customerCashMargin) {
        return prev // Don't allow unchecking if it's the last remaining sub-component
      }
      
      // Validation for Non-Customer Shorts sub-components - prevent unchecking last one
      if (key === 'nonCustomerCashMargin' && !value && prev.nonCustomerShorts && !prev.nonCustomerShort) {
        return prev // Don't allow unchecking if it's the last remaining sub-component
      }
      if (key === 'nonCustomerShort' && !value && prev.nonCustomerShorts && !prev.nonCustomerCashMargin) {
        return prev // Don't allow unchecking if it's the last remaining sub-component
      }
      
      const newSettings = { ...prev, [key]: value }
      
      // Handle dependencies
      if (key === 'reduceByOpenStockLoans' && !value) {
        newSettings.reduceByOpenStockLoanRecall = false
        if (prev.reduceByOpenStockLoanRecall) {
          addAuditEntry('reduceByOpenStockLoanRecall', true, false)
        }
      }
      
      if (key === 'regulatoryDeficits' && !value) {
        newSettings.borrowForDeficitWhenDeliveryExists = false
        if (prev.borrowForDeficitWhenDeliveryExists) {
          addAuditEntry('borrowForDeficitWhenDeliveryExists', true, false)
        }
      }
      
      if (key === 'customerShorts' && !value) {
        newSettings.customerShortsExpanded = false
        if (prev.customerCashMargin) {
          newSettings.customerCashMargin = false
          addAuditEntry('customerCashMargin', true, false)
        }
        if (prev.customerShort) {
          newSettings.customerShort = false
          addAuditEntry('customerShort', true, false)
        }
      }
      
      if (key === 'nonCustomerShorts' && !value) {
        newSettings.nonCustomerShortsExpanded = false
        if (prev.nonCustomerCashMargin) {
          newSettings.nonCustomerCashMargin = false
          addAuditEntry('nonCustomerCashMargin', true, false)
        }
        if (prev.nonCustomerShort) {
          newSettings.nonCustomerShort = false
          addAuditEntry('nonCustomerShort', true, false)
        }
      }
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true)
      
      addAuditEntry(key, prev[key as keyof typeof prev], value)
      return newSettings
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Saving settings:', settings)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      // Add success audit entry
      addAuditEntry('systemSave', null, 'Configuration saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      // In a real app, you'd show an error toast here
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    console.log('Resetting settings')
    setHasUnsavedChanges(false)
    addAuditEntry('systemReset', null, 'All settings reset to defaults')
  }

  const handleExport = () => {
    console.log('Exporting audit log')
  }

  const visibleEntries = settings.showAllAuditEntries ? auditEntries : auditEntries.slice(0, 3)
  const remainingCount = auditEntries.length - 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-fis-orange to-fis-orange rounded-lg flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-gray-900">Needs Parameters</h1>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Configure securities lending parameters</span>
                {lastSaved && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-success-muted text-success border-success px-3 py-1">
              <Check className="w-4 h-4 mr-1.5" />
              Deficit Limited Active
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset} 
              className="h-9 px-4"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              className="h-9 px-4 bg-[#00a651] hover:bg-[#008A44] text-white border-[#00a651]"
              disabled={isLoading || !hasUnsavedChanges}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        
        {/* Left Column */}
        <div className="space-y-4">
          
          {/* Regulatory Components */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 min-w-[320px]">
            <CardHeader className="pb-3 border-b bg-[#015B7E]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#015B7E]/10 rounded-md flex items-center justify-center">
                    <Shield className="w-3 h-3 text-[#015B7E]" />
                  </div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Regulatory Components
                  </CardTitle>
                </div>
                <Badge className="bg-[#015B7E] text-white text-xs font-medium px-2 py-0.5">
                  Mandatory
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {[
                { 
                  key: 'cnsDeliveryNeeds', 
                  label: 'CNS Delivery', 
                  priority: '1st', 
                  color: 'bg-critical'
                },
                { 
                  key: 'dvpDeliveryNeeds', 
                  label: 'DVP Delivery', 
                  priority: '2nd', 
                  color: 'bg-status-high'
                },
                { 
                  key: 'fullyPaidAccounts', 
                  label: 'Fully Paid Accounts', 
                  priority: '3rd', 
                  color: 'bg-status-medium'
                },
                { 
                  key: 'otherAvailability', 
                  label: 'Other Availability', 
                  priority: '4th', 
                  color: 'bg-status-low'
                }
              ].map((item, index) => (
                <div key={item.key} className={cn(
                  "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors",
                  index !== 3 && "border-b border-gray-100"
                )}>
                  <div className="flex items-center space-x-2 text-left">
                    <div className="w-4 h-4 bg-[#00a651]/10 border border-[#00a651] rounded-sm flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-[#00a651]" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 text-left">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-right">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 text-center">Priority</div>
                      <Badge className={cn("text-white text-xs font-medium px-1.5 py-0", item.color)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-[#00a651]/10 text-[#00a651] border-[#00a651]/20 text-xs px-2 py-0.5">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Special Conditions */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 min-w-[320px]">
            <CardHeader className="pb-3 border-b bg-[#285BC5]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#285BC5]/10 rounded-md flex items-center justify-center">
                    <Zap className="w-3 h-3 text-[#285BC5]" />
                  </div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Special Conditions
                  </CardTitle>
                </div>
                <Badge className="bg-[#285BC5] text-white text-xs font-medium px-2 py-0.5">
                  Override Rules
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.borrowForDeficitWhenDeliveryExists}
                        disabled={settings.regulatoryDeficits}
                        onCheckedChange={(checked) => handleInputChange('borrowForDeficitWhenDeliveryExists', checked)}
                      />
                      <span className="text-sm font-medium">Borrow for deficit when delivery exists</span>
                    </div>
                  </div>
                  {settings.regulatoryDeficits && (
                    <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-amber-600 border-amber-200 bg-amber-50">
                      Blocked by Regulatory Deficits
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Business Components */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 min-w-[320px]">
            <CardHeader className="pb-3 border-b bg-[#00a651]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#00a651]/10 rounded-md flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-[#00a651]" />
                  </div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Business Components
                  </CardTitle>
                </div>
                <Badge className="bg-[#00a651] text-white text-xs font-medium px-2 py-0.5">
                  Configurable
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Regulatory Deficits */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={settings.regulatoryDeficits}
                      onCheckedChange={(checked) => handleInputChange('regulatoryDeficits', checked)}
                    />
                    <span className="text-sm font-medium">Regulatory Deficits</span>
                  </div>
                  <Badge variant="secondary" className={cn(
                    "text-xs px-2 py-0.5",
                    settings.regulatoryDeficits 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    {settings.regulatoryDeficits ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <Separator />

                {/* Customer Shorts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.customerShorts}
                        onCheckedChange={(checked) => handleInputChange('customerShorts', checked)}
                      />
                      <span className="text-sm font-medium">Customer Shorts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('customerShortsExpanded', !settings.customerShortsExpanded)}
                        className="h-6 w-6 p-0"
                      >
                        {settings.customerShortsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Badge variant="secondary" className={cn(
                        "text-xs px-2 py-0.5",
                        settings.customerShorts 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        {settings.customerShorts ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  {settings.customerShortsExpanded && settings.customerShorts && (
                    <div className="ml-6 mt-3">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={settings.customerCashMargin}
                              disabled={!settings.customerShorts}
                              onCheckedChange={(checked) => handleInputChange('customerCashMargin', checked)}
                            />
                            <span className="text-sm">Customer Cash/Margin</span>
                          </div>
                          <Badge variant="secondary" className={cn(
                            "text-xs px-2 py-0.5",
                            settings.customerCashMargin && settings.customerShorts
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {settings.customerCashMargin && settings.customerShorts ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={settings.customerShort}
                              disabled={!settings.customerShorts}
                              onCheckedChange={(checked) => handleInputChange('customerShort', checked)}
                            />
                            <span className="text-sm">Customer Short</span>
                          </div>
                          <Badge variant="secondary" className={cn(
                            "text-xs px-2 py-0.5",
                            settings.customerShort && settings.customerShorts
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {settings.customerShort && settings.customerShorts ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {/* Warning when no sub-components are selected */}
                        {settings.customerShorts && !settings.customerCashMargin && !settings.customerShort && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span className="text-amber-800 text-xs">
                                At least one sub-component must be selected for Customer Shorts to function
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Non-Customer Shorts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.nonCustomerShorts}
                        onCheckedChange={(checked) => handleInputChange('nonCustomerShorts', checked)}
                      />
                      <span className="text-sm font-medium">Non-Customer Shorts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('nonCustomerShortsExpanded', !settings.nonCustomerShortsExpanded)}
                        className="h-6 w-6 p-0"
                      >
                        {settings.nonCustomerShortsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Badge variant="secondary" className={cn(
                        "text-xs px-2 py-0.5",
                        settings.nonCustomerShorts 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        {settings.nonCustomerShorts ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  {settings.nonCustomerShortsExpanded && settings.nonCustomerShorts && (
                    <div className="ml-6 mt-3">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={settings.nonCustomerCashMargin}
                              disabled={!settings.nonCustomerShorts}
                              onCheckedChange={(checked) => handleInputChange('nonCustomerCashMargin', checked)}
                            />
                            <span className="text-sm">Non-Customer Cash/Margin</span>
                          </div>
                          <Badge variant="secondary" className={cn(
                            "text-xs px-2 py-0.5",
                            settings.nonCustomerCashMargin && settings.nonCustomerShorts
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {settings.nonCustomerCashMargin && settings.nonCustomerShorts ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={settings.nonCustomerShort}
                              disabled={!settings.nonCustomerShorts}
                              onCheckedChange={(checked) => handleInputChange('nonCustomerShort', checked)}
                            />
                            <span className="text-sm">Non-Customer Short</span>
                          </div>
                          <Badge variant="secondary" className={cn(
                            "text-xs px-2 py-0.5",
                            settings.nonCustomerShort && settings.nonCustomerShorts
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}>
                            {settings.nonCustomerShort && settings.nonCustomerShorts ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {/* Warning when no sub-components are selected */}
                        {settings.nonCustomerShorts && !settings.nonCustomerCashMargin && !settings.nonCustomerShort && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span className="text-amber-800 text-xs">
                                At least one sub-component must be selected for Non-Customer Shorts to function
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Firm Shorts */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={settings.firmShorts}
                      onCheckedChange={(checked) => handleInputChange('firmShorts', checked)}
                    >
                      <span className="text-sm font-medium">Firm Shorts</span>
                    </Checkbox>
                  </div>
                  <Badge variant="secondary" className={cn(
                    "text-xs px-2 py-0.5",
                    settings.firmShorts 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    {settings.firmShorts ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <Separator />

                {/* Shorts Deficit Limited - Enhanced Design */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">Shorts Deficit Limited:</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div 
                        onClick={() => handleInputChange('shortsDeficitLimited', true)}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                          settings.shortsDeficitLimited
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-400 bg-white hover:border-blue-600"
                        )}>
                          {settings.shortsDeficitLimited && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">Yes</span>
                      </div>
                      <div 
                        onClick={() => handleInputChange('shortsDeficitLimited', false)}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                          !settings.shortsDeficitLimited
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-400 bg-white hover:border-blue-600"
                        )}>
                          {!settings.shortsDeficitLimited && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">No</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-600 italic">
                      <span className="font-medium">Applies to:</span> Customer Shorts, Non-Customer Shorts, and Firm Shorts
                    </p>
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Info className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reduction Methods */}
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 min-w-[320px]">
            <CardHeader className="pb-3 border-b bg-[#1B1B6F]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#1B1B6F]/10 rounded-md flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-[#1B1B6F]" />
                  </div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Reduction Methods
                  </CardTitle>
                </div>
                <Badge className="bg-[#1B1B6F] text-white text-xs font-medium px-2 py-0.5">
                  Optimizations
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Reduce by Anticipated Receives - Exact Design Match */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.reduceByAnticipatedReceives}
                        onCheckedChange={(checked) => handleInputChange('reduceByAnticipatedReceives', checked)}
                      />
                      <span className="text-sm font-medium text-gray-900">Reduce by Anticipated Receives</span>
                      <Tooltip content="Automatically reduces borrowing needs based on expected incoming securities deliveries">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </Tooltip>
                      <span className="text-xs text-gray-600">Cutoff time:</span>
                      <div className="flex items-center space-x-1">
                        <Input
                          type="time"
                          value={settings.cutoffTime}
                          onChange={(e) => handleInputChange('cutoffTime', e.target.value)}
                          className="h-6 w-20 text-xs border-gray-300 focus:border-[#015B7E] focus:ring-[#015B7E] px-1"
                        />
                        <Tooltip content="Eastern Time">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        </Tooltip>
                        <span className="text-xs text-gray-600">ET</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleInputChange('anticipatedReceivesExpanded', !settings.anticipatedReceivesExpanded)}
                        className="h-6 w-6 p-0"
                      >
                        {settings.anticipatedReceivesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Badge variant="secondary" className={cn(
                        "text-xs px-2 py-0.5",
                        settings.reduceByAnticipatedReceives 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        {settings.reduceByAnticipatedReceives ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  {settings.anticipatedReceivesExpanded && (
                    <div className="ml-6 mt-3">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                          PRIORITY ORDER:
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              onClick={() => handleInputChange('priorityOrder', 'normal')}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors",
                                settings.priorityOrder === 'normal'
                                  ? "border-[#00a651] bg-[#00a651]"
                                  : "border-gray-300 bg-white hover:border-[#00a651]"
                              )}
                            >
                              {settings.priorityOrder === 'normal' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <label 
                              onClick={() => handleInputChange('priorityOrder', 'normal')}
                              className="text-sm text-gray-900 cursor-pointer"
                            >
                              Apply reductions in order of priority (CNS, DVP, FP, OA)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              onClick={() => handleInputChange('priorityOrder', 'reverse')}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors",
                                settings.priorityOrder === 'reverse'
                                  ? "border-[#00a651] bg-[#00a651]"
                                  : "border-gray-300 bg-white hover:border-[#00a651]"
                              )}
                            >
                              {settings.priorityOrder === 'reverse' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <label 
                              onClick={() => handleInputChange('priorityOrder', 'reverse')}
                              className="text-sm text-gray-900 cursor-pointer"
                            >
                              Apply reductions in reverse order (OA, FP, DVP, CNS)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Reduce by Open Stock Loans */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={settings.reduceByOpenStockLoans}
                      onCheckedChange={(checked) => handleInputChange('reduceByOpenStockLoans', checked)}
                    />
                    <span className="text-sm font-medium">Reduce by Open Stock Loans</span>
                  </div>
                  <Badge variant="secondary" className={cn(
                    "text-xs px-2 py-0.5",
                    settings.reduceByOpenStockLoans 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    {settings.reduceByOpenStockLoans ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <Separator />

                {/* Reduce by Open Stock Loan Recall */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.reduceByOpenStockLoanRecall}
                        disabled={!settings.reduceByOpenStockLoans}
                        onCheckedChange={(checked) => handleInputChange('reduceByOpenStockLoanRecall', checked)}
                      />
                      <span className="text-sm font-medium">Reduce by Open Stock Loan Recall</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-xs font-medium px-2 py-0.5",
                      settings.reduceByOpenStockLoans 
                        ? "text-emerald-600 border-emerald-200 bg-emerald-50" 
                        : "text-amber-600 border-amber-200 bg-amber-50"
                    )}>
                      {settings.reduceByOpenStockLoans ? "Available" : "Requires Open Stock Loans"}
                    </Badge>
                  </div>
                  {!settings.reduceByOpenStockLoans && (
                    <div className="ml-4 p-2 bg-amber-50 rounded-md border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-800 text-xs">
                          Enable "Reduce by Open Stock Loans" first to use this option
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Audit */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-4 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#015B7E]/10 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-[#015B7E]" />
                </div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-800">
                  Component Change Audit
                </CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  {auditEntries.length === 0 ? 'No changes yet' : `Showing ${visibleEntries.length} of ${auditEntries.length}`}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button size="sm" onClick={handleExport} className="h-8 px-3 bg-[#00a651] hover:bg-[#008A44] text-white border-[#00a651]">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 border-[#015B7E] text-[#015B7E] hover:bg-[#015B7E]/10">
                  <FileText className="w-4 h-4 mr-2" />
                  Full History
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {auditEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No changes recorded yet</h3>
                <p className="text-sm text-gray-500">Changes will appear here as you modify components</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleEntries.map((change, index) => {
                    const IconComponent = change.icon
                    return (
                      <div key={change.id} className={cn(
                        "flex items-start justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-sm",
                        change.bgColor,
                        change.latest && "ring-2 ring-blue-200"
                      )}>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg text-white font-bold flex items-center justify-center text-sm">
                            {change.user}
                          </div>
                          {change.latest && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 mt-1">
                              Latest
                            </Badge>
                          )}
                          <IconComponent className={cn("w-5 h-5 mt-1", change.iconColor)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">{change.action}</span>
                              <Badge variant="outline" className="text-xs border-gray-300">
                                {change.section}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="font-medium text-gray-800">{change.component}</span>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-gray-600">{change.description}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 ml-4">
                          <User className="w-4 h-4" />
                          <span>{change.user === 'UR' ? 'Current User' : change.user === 'SY' ? 'System' : 'Admin'}</span>
                          <Clock className="w-4 h-4" />
                          <span>{change.time}</span>
                          {change.date !== 'Today' && (
                            <>
                              <span>•</span>
                              <span>{change.date}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {!settings.showAllAuditEntries && remainingCount > 0 && (
                  <div className="text-center pt-4 border-t border-gray-200 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleInputChange('showAllAuditEntries', true)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show {remainingCount} more component changes
                    </Button>
                  </div>
                )}
                
                {settings.showAllAuditEntries && auditEntries.length > 3 && (
                  <div className="text-center pt-4 border-t border-gray-200 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleInputChange('showAllAuditEntries', false)}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show less
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ParametersPage


