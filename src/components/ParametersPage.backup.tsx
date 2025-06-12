import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download,
  Clock,
  AlertTriangle,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  History,
  FileText,
  ToggleLeft,
  ToggleRight,
  Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
// Tooltips removed for compatibility
import { Checkbox } from '@/components/ui/checkbox'
import CustomCheckbox from '@/components/ui/custom-checkbox'
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
    cutoffPeriod: 'AM' as 'AM' | 'PM',
    
    // UI state
    customerShortsExpanded: true,
    nonCustomerShortsExpanded: true,
    anticipatedReceivesExpanded: true,
    showAllAuditEntries: false
  })

  // Start with empty audit entries - will be populated as changes are made
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
      cutoffTime: { name: 'Cutoff Time', section: 'Reduction Methods' },
      cutoffPeriod: { name: 'Cutoff Period', section: 'Reduction Methods' }
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
    const dateString = 'Today' // In real app, could be more sophisticated

    let action: string
    let description: string
    let icon: any
    let iconColor: string
    let bgColor: string

    // Determine action type and description based on the change
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
    } else if (key === 'cutoffTime' || key === 'cutoffPeriod') {
      action = 'Time Setting Modified'
      const fullTime = key === 'cutoffTime' ? `${newValue} ${settings.cutoffPeriod}` : `${settings.cutoffTime} ${newValue}`
      description = `User changed cutoff time to ${fullTime} ET`
      icon = Settings2
      iconColor = 'text-info'
      bgColor = 'bg-info-muted'
    } else {
      action = 'Settings Modified'
      description = `User changed ${componentInfo.name} from ${oldValue} to ${newValue}`
      icon = Settings2
      iconColor = 'text-info'
      bgColor = 'bg-info-muted'
    }

    // Handle dependent component changes
    if (key === 'reduceByOpenStockLoans' && !newValue && settings.reduceByOpenStockLoanRecall) {
      description += '. Auto-disabled dependent component: Open Stock Loan Recall'
    }

    const newEntry: AuditEntry = {
      id: Date.now(), // Simple ID generation
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
      // Mark all previous entries as not latest
      const updatedPrev = prev.map(entry => ({ ...entry, latest: false }))
      return [newEntry, ...updatedPrev]
    })
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      
      // Handle dependency: Reduce by Open Stock Loan Recall requires Reduce by Open Stock Loans
      if (key === 'reduceByOpenStockLoans' && !value) {
        newSettings.reduceByOpenStockLoanRecall = false
        if (prev.reduceByOpenStockLoanRecall) {
          addAuditEntry('reduceByOpenStockLoanRecall', true, false)
        }
      }
      
      // Handle dependency: Borrow for deficit when delivery exists conflicts with Regulatory Deficits
      if (key === 'regulatoryDeficits' && value && prev.borrowForDeficitWhenDeliveryExists) {
        newSettings.borrowForDeficitWhenDeliveryExists = false
        addAuditEntry('borrowForDeficitWhenDeliveryExists', true, false)
      }
      
      // Handle dependency: Customer Shorts sub-components require Customer Shorts to be enabled
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
      
      // Handle dependency: Non-Customer Shorts sub-components require Non-Customer Shorts to be enabled
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
      
      // Only add audit entry for actual parameter changes (not UI state)
      const uiStateKeys = ['customerShortsExpanded', 'nonCustomerShortsExpanded', 'anticipatedReceivesExpanded', 'showAllAuditEntries']
      if (!uiStateKeys.includes(key)) {
        addAuditEntry(key, prev[key as keyof typeof prev], value)
      }
      
      return newSettings
    })
  }

  const handleSave = () => {
    console.log('Saving settings:', settings)
    // In real app, this would save to backend and create a save audit entry
    addAuditEntry('systemSave', null, 'Configuration saved successfully')
  }

  const handleReset = () => {
    const defaultSettings = {
      cnsDeliveryNeeds: true,
      dvpDeliveryNeeds: true,
      fullyPaidAccounts: true,
      otherAvailability: true,
      regulatoryDeficits: true,
      customerShorts: false,
      customerCashMargin: true,
      customerShort: true,
      nonCustomerShorts: true,
      nonCustomerCashMargin: true,
      nonCustomerShort: true,
      firmShorts: true,
      shortsDeficitLimited: true,
      borrowForDeficitWhenDeliveryExists: false,
      reduceByAnticipatedReceives: true,
      reduceByOpenStockLoans: false,
      reduceByOpenStockLoanRecall: false,
      priorityOrder: 'normal' as 'normal' | 'reverse',
      cutoffTime: '11:00',
      cutoffPeriod: 'AM' as 'AM' | 'PM',
      customerShortsExpanded: true,
      nonCustomerShortsExpanded: true,
      anticipatedReceivesExpanded: true,
      showAllAuditEntries: false
    }

    // Record reset action
    const resetEntry: AuditEntry = {
      id: Date.now(),
      user: 'UR',
      action: 'Configuration Reset',
      component: 'All Parameters',
      section: 'System',
      description: 'User reset all parameters to default values',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
      date: 'Today',
      latest: true,
      icon: RotateCcw,
      iconColor: 'text-status-high',
      bgColor: 'bg-status-high-muted',
      oldValue: 'various',
      newValue: 'defaults'
    }

    setAuditEntries(prev => {
      const updatedPrev = prev.map(entry => ({ ...entry, latest: false }))
      return [resetEntry, ...updatedPrev]
    })

    setSettings(defaultSettings)
  }

  const handleExport = () => {
    console.log('Exporting audit log')
    // In real app, this would export the audit log
  }

  // Using shadcn/ui Checkbox component for consistency

  const visibleEntries = settings.showAllAuditEntries ? auditEntries : auditEntries.slice(0, 3)
  const remainingCount = Math.max(0, auditEntries.length - 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
        {/* Modern Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-fis-orange to-fis-orange rounded-lg flex items-center justify-center shadow-sm">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Smart Loan Parameters</h1>
                <p className="text-sm text-gray-600">Configure securities lending parameters</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-success-muted text-success border-success px-3 py-1">
                    <Check className="w-4 h-4 mr-1.5" />
                    Deficit Limited Active
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shorts are currently limited to deficit quantities only</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleReset} className="h-9 px-4">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all parameters to default values</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleSave} variant="success">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save all parameter changes and apply to system</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Compact Content Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left Column */}
          <div className="space-y-4">
            
            {/* Regulatory Components - Compact Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b bg-critical-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-critical-muted rounded-md flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-critical" />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800 cursor-help">
                          Regulatory Components
                        </CardTitle>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mandatory regulatory requirements that must be satisfied first</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5">
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
                    color: 'bg-critical',
                    tooltip: 'Continuous Net Settlement delivery obligations - highest priority regulatory requirement'
                  },
                  { 
                    key: 'dvpDeliveryNeeds', 
                    label: 'DVP Delivery', 
                    priority: '2nd', 
                    color: 'bg-status-high',
                    tooltip: 'Delivery versus Payment obligations - second priority regulatory requirement'
                  },
                  { 
                    key: 'fullyPaidAccounts', 
                    label: 'Fully Paid Accounts', 
                    priority: '3rd', 
                    color: 'bg-status-medium',
                    tooltip: 'Customer fully paid securities lending needs - third priority requirement'
                  },
                  { 
                    key: 'otherAvailability', 
                    label: 'Other Availability', 
                    priority: '4th', 
                    color: 'bg-status-low',
                    tooltip: 'Other regulatory availability requirements - lowest priority mandatory component'
                  }
                ].map((item, index) => (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-help",
                        index !== 3 && "border-b border-gray-100"
                      )}>
                        <div className="flex items-center space-x-2 text-left">
                          <div className="w-4 h-4 bg-success-muted border border-success rounded-sm flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-success" />
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
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </CardContent>
            </Card>

            {/* Special Conditions - Compact Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800 cursor-help">
                          Special Conditions
                        </CardTitle>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Special override conditions that modify standard processing rules</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge className="bg-amber-600 text-white text-xs font-medium px-2 py-0.5">
                    Override Rules
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1 cursor-help">
                                            <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={settings.borrowForDeficitWhenDeliveryExists}
                      disabled={settings.regulatoryDeficits}
                      onCheckedChange={(checked) => handleInputChange('borrowForDeficitWhenDeliveryExists', checked)}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Borrow for deficit when delivery exists</span>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>When enabled, allows borrowing to cover deficits even when delivery obligations exist.<br/>
                        Conflicts with Regulatory Deficits - cannot be used together.</p>
                      </TooltipContent>
                    </Tooltip>
                    {settings.regulatoryDeficits && (
                      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-amber-600 border-amber-200 bg-amber-50">
                        Blocked by Regulatory Deficits
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-2 bg-amber-50 rounded-md border border-amber-200">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span className="text-amber-800 font-medium text-xs">
                        {settings.regulatoryDeficits 
                          ? "Disabled: Cannot be used with Regulatory Deficits" 
                          : "Conflicts with Regulatory Deficits"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            
            {/* Business Components - Compact Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                      <FileText className="w-3 h-3 text-blue-600" />
                    </div>
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                      Business Components
                    </CardTitle>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5">
                    Configurable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                
                {/* Regulatory Deficits */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 text-left cursor-help">
                        <CustomCheckbox 
                          checked={settings.regulatoryDeficits}
                          onChange={(checked) => handleInputChange('regulatoryDeficits', checked)}
                        >
                          <span className="text-sm font-medium text-gray-900 text-left">Regulatory Deficits</span>
                        </CustomCheckbox>
                        <Info className="w-3 h-3 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <p>Calculate and satisfy regulatory deficit requirements first.<br/>
                      Conflicts with "Borrow for deficit when delivery exists".</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator />

                {/* Customer Shorts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 text-left cursor-help">
                          <CustomCheckbox 
                            checked={settings.customerShorts}
                            onChange={(checked) => handleInputChange('customerShorts', checked)}
                          >
                            <span className="text-sm font-medium text-gray-900 text-left">Customer Shorts</span>
                          </CustomCheckbox>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Include customer short positions in borrowing calculations.<br/>
                        Aggregates from cash/margin and short accounts.</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={!settings.customerShorts}
                        onClick={() => settings.customerShorts && handleInputChange('customerShortsExpanded', !settings.customerShortsExpanded)}
                        className={cn(
                          "h-6 px-1.5",
                          settings.customerShorts 
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                            : "text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {settings.customerShortsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span className="ml-1 text-xs">{settings.customerShortsExpanded ? 'Hide' : 'Show'}</span>
                      </Button>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  
                  {settings.customerShortsExpanded && settings.customerShorts && (
                    <div className="ml-4 p-2 bg-gray-50 rounded-md border-l-2 border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 text-left">Aggregated From:</p>
                      <div className="space-y-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-left cursor-help">
                              <CustomCheckbox 
                                checked={settings.customerCashMargin}
                                onChange={(checked) => handleInputChange('customerCashMargin', checked)}
                              >
                                <span className="text-xs text-left">Customer Cash/Margin (technical shorts)</span>
                              </CustomCheckbox>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Technical short positions from customer cash and margin accounts</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-left cursor-help">
                              <CustomCheckbox 
                                checked={settings.customerShort}
                                onChange={(checked) => handleInputChange('customerShort', checked)}
                              >
                                <span className="text-xs text-left">Customer Short</span>
                              </CustomCheckbox>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actual customer short sale positions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-500 italic mt-2 text-left">
                        Note: At least one sub-component must be selected
                      </p>
                    </div>
                  )}
                  
                  {!settings.customerShorts && settings.customerShortsExpanded && (
                    <div className="ml-4 p-2 bg-amber-50 rounded-md border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-800 text-xs text-left">
                          Enable "Customer Shorts" to configure sub-components
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Non-Customer Shorts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 text-left cursor-help">
                          <CustomCheckbox 
                            checked={settings.nonCustomerShorts}
                            onChange={(checked) => handleInputChange('nonCustomerShorts', checked)}
                          >
                            <span className="text-sm font-medium text-gray-900 text-left">Non-Customer Shorts</span>
                          </CustomCheckbox>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Include non-customer short positions in borrowing calculations.<br/>
                        Aggregates from proprietary and institutional accounts.</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={!settings.nonCustomerShorts}
                        onClick={() => settings.nonCustomerShorts && handleInputChange('nonCustomerShortsExpanded', !settings.nonCustomerShortsExpanded)}
                        className={cn(
                          "h-6 px-1.5",
                          settings.nonCustomerShorts 
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                            : "text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {settings.nonCustomerShortsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span className="ml-1 text-xs">{settings.nonCustomerShortsExpanded ? 'Hide' : 'Show'}</span>
                      </Button>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  
                  {settings.nonCustomerShortsExpanded && settings.nonCustomerShorts && (
                    <div className="ml-4 p-2 bg-gray-50 rounded-md border-l-2 border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 text-left">Aggregated From:</p>
                      <div className="space-y-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-left cursor-help">
                              <CustomCheckbox 
                                checked={settings.nonCustomerCashMargin}
                                onChange={(checked) => handleInputChange('nonCustomerCashMargin', checked)}
                              >
                                <span className="text-xs text-left">Non-Customer Cash/Margin (technical shorts)</span>
                              </CustomCheckbox>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Technical short positions from proprietary and institutional accounts</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-left cursor-help">
                              <CustomCheckbox 
                                checked={settings.nonCustomerShort}
                                onChange={(checked) => handleInputChange('nonCustomerShort', checked)}
                              >
                                <span className="text-xs text-left">Non-Customer Short</span>
                              </CustomCheckbox>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actual non-customer short sale positions</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-500 italic mt-2 text-left">
                        Note: At least one sub-component must be selected
                      </p>
                    </div>
                  )}
                  
                  {!settings.nonCustomerShorts && settings.nonCustomerShortsExpanded && (
                    <div className="ml-4 p-2 bg-amber-50 rounded-md border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-800 text-xs text-left">
                          Enable "Non-Customer Shorts" to configure sub-components
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Firm Shorts */}
                <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 text-left cursor-help">
                        <CustomCheckbox 
                          checked={settings.firmShorts}
                          onChange={(checked) => handleInputChange('firmShorts', checked)}
                        >
                          <span className="text-sm font-medium text-gray-900 text-left">Firm Shorts</span>
                        </CustomCheckbox>
                        <Info className="w-3 h-3 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Include firm proprietary short positions in borrowing calculations.<br/>
                      Subject to shorts deficit limited rules if enabled.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Shorts Deficit Limited - Only show when Firm Shorts is checked */}
                {settings.firmShorts && (
                  <>
                    <Separator />
                    <div className="py-1">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between mb-3 cursor-help">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 text-left">Shorts Deficit Limited:</span>
                                <Info className="w-3 h-3 text-gray-400" />
                              </div>
                              <div className="flex space-x-6">
                                <div className="flex items-center space-x-2">
                                  <div
                                    onClick={() => handleInputChange('shortsDeficitLimited', true)}
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all duration-200",
                                      settings.shortsDeficitLimited
                                        ? "border-green-500 bg-green-500"
                                        : "border-gray-300 bg-white hover:border-green-300"
                                    )}
                                  >
                                    {settings.shortsDeficitLimited && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <label 
                                    onClick={() => handleInputChange('shortsDeficitLimited', true)}
                                    className="text-sm text-gray-900 text-left cursor-pointer"
                                  >
                                    Yes
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div
                                    onClick={() => handleInputChange('shortsDeficitLimited', false)}
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all duration-200",
                                      !settings.shortsDeficitLimited
                                        ? "border-red-500 bg-red-500"
                                        : "border-gray-300 bg-white hover:border-red-300"
                                    )}
                                  >
                                    {!settings.shortsDeficitLimited && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <label 
                                    onClick={() => handleInputChange('shortsDeficitLimited', false)}
                                    className="text-sm text-gray-900 text-left cursor-pointer"
                                  >
                                    No
                                  </label>
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>When enabled, limits all short positions to deficit quantities only.<br/>
                            Applies to Customer Shorts, Non-Customer Shorts, and Firm Shorts.</p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-xs text-gray-600 italic text-left">
                          Applies to: Customer Shorts, Non-Customer Shorts, and Firm Shorts
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Reduction Methods - Compact Card */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b bg-emerald-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                      <ChevronDown className="w-3 h-3 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                      Reduction Methods
                    </CardTitle>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-xs font-medium px-2 py-0.5">
                    Optimization
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                
                {/* Reduce by Anticipated Receives */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <CustomCheckbox 
                        checked={settings.reduceByAnticipatedReceives}
                        onChange={(checked) => handleInputChange('reduceByAnticipatedReceives', checked)}
                      >
                        <span className="text-sm font-medium">Reduce by Anticipated Receives</span>
                      </CustomCheckbox>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleInputChange('anticipatedReceivesExpanded', !settings.anticipatedReceivesExpanded)}
                        className="h-6 px-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {settings.anticipatedReceivesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span className="ml-1 text-xs">{settings.anticipatedReceivesExpanded ? 'Hide' : 'Show'}</span>
                      </Button>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-gray-600">Cutoff:</span>
                      <input 
                        type="time" 
                        value={settings.cutoffTime}
                        onChange={(e) => handleInputChange('cutoffTime', e.target.value)}
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs w-16 h-6 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                      />
                      <select 
                        value={settings.cutoffPeriod}
                        onChange={(e) => handleInputChange('cutoffPeriod', e.target.value)}
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs w-12 h-6 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">ET</span>
                    </div>
                  </div>
                  
                  {settings.anticipatedReceivesExpanded && (
                    <div className="ml-4 p-2 bg-emerald-50 rounded-md border-l-2 border-emerald-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Priority Order:</p>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 p-2 bg-white rounded-md border border-gray-200 hover:border-emerald-300 transition-colors">
                          <div
                            onClick={() => handleInputChange('priorityOrder', 'normal')}
                            className={cn(
                              "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center mt-0.5 transition-all duration-200",
                              settings.priorityOrder === 'normal'
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300 bg-white hover:border-emerald-300"
                            )}
                          >
                            {settings.priorityOrder === 'normal' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <label 
                              onClick={() => handleInputChange('priorityOrder', 'normal')}
                              className="text-xs font-medium text-gray-900 cursor-pointer"
                            >
                              Normal Priority Order
                            </label>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Apply reductions in order: CNS → DVP → Fully Paid → Other Availability
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2 p-2 bg-white rounded-md border border-gray-200 hover:border-emerald-300 transition-colors">
                          <div
                            onClick={() => handleInputChange('priorityOrder', 'reverse')}
                            className={cn(
                              "w-4 h-4 rounded-full border-2 cursor-pointer flex items-center justify-center mt-0.5 transition-all duration-200",
                              settings.priorityOrder === 'reverse'
                                ? "border-purple-500 bg-purple-500"
                                : "border-gray-300 bg-white hover:border-purple-300"
                            )}
                          >
                            {settings.priorityOrder === 'reverse' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <label 
                              onClick={() => handleInputChange('priorityOrder', 'reverse')}
                              className="text-xs font-medium text-gray-900 cursor-pointer"
                            >
                              Reverse Priority Order
                            </label>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Apply reductions in reverse: Other Availability → Fully Paid → DVP → CNS
                            </p>
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
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Reduce by Open Stock Loans</span>
                    <Info className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
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
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Reduce by Open Stock Loan Recall</span>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Change Audit */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-800">
                  Component Change Audit
                </CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  {auditEntries.length === 0 ? 'No changes yet' : `Showing ${visibleEntries.length} of ${auditEntries.length}`}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button size="sm" onClick={handleExport} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 border-purple-200 text-purple-700 hover:bg-purple-50">
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


