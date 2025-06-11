import React, { useState } from 'react'
import { 
  Settings, 
  HelpCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Activity,
  Save,
  RotateCcw,
  Download,
  FileText,
  Eye,
  Clock,
  Shield,
  Building,
  AlertTriangle,
  TrendingDown,
  CheckSquare,
  Square
} from 'lucide-react'
import { toast } from 'sonner'

interface ConfigurationItem {
  id: string
  label: string
  checked: boolean
  priority?: string
  canDisable?: boolean
  applyTo?: string
  cutoffTime?: string
  tooltip: string
  subComponents?: Array<{
    id: string
    label: string
    checked: boolean
  }>
  priorityOrder?: string
}

const SmartLoanConfig = () => {
  const [currentMode, setCurrentMode] = useState('Deficit Limited - Fully Calculated')
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [currentUser] = useState('Current User') // In real app, this would come from auth
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<any>(null)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showFullAuditHistory, setShowFullAuditHistory] = useState(false)
  const [expandedComponents, setExpandedComponents] = useState<string[]>([])
  
  // Audit Trail Functions
  const logAuditEvent = (action: string, details: string, changes?: any) => {
    const auditEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentUser,
      action,
      details,
      changes,
      mode: currentMode
    }
    
    setAuditTrail(prev => [auditEntry, ...prev.slice(0, 19)]) // Keep last 20 for display
    localStorage.setItem('smartLoanAuditTrail', JSON.stringify([auditEntry, ...auditTrail.slice(0, 19)]))
  }

  const downloadAuditReport = () => {
    const auditReport = {
      exportDate: new Date().toISOString(),
      configuration: {
        mode: currentMode,
        businessComponents: businessComponents.filter(c => c.checked).map(c => ({ id: c.id, label: c.label })),
        shortsDeficitLimited: shortsDeficitLimited,
        specialConditions: specialConditions.filter(c => c.checked).map(c => ({ id: c.id, label: c.label })),
        reductionMethods: reductionMethods.filter(c => c.checked).map(c => ({ id: c.id, label: c.label, applyTo: c.applyTo }))
      },
      auditTrail: auditTrail
    }
    
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart-loan-audit-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  const [regulatoryComponents, setRegulatoryComponents] = useState([
    { id: 'cnsDelivery', label: 'CNS Delivery', checked: true, priority: '1st', canDisable: false, tooltip: 'Securities that must be delivered through the Continuous Net Settlement system' },
    { id: 'dvpDelivery', label: 'DVP Delivery', checked: true, priority: '2nd', canDisable: false, tooltip: 'Securities that must be delivered versus payment to counterparties' },
    { id: 'fullyPaid', label: 'Fully Paid Accounts', checked: true, priority: '3rd', canDisable: false, tooltip: 'Customer fully paid positions that require physical delivery or borrowing' },
    { id: 'otherAvailability', label: 'Other Availability', checked: true, priority: '4th', canDisable: false, tooltip: 'Other firm inventory positions that may require borrowing to cover obligations' }
  ])

  const [businessComponents, setBusinessComponents] = useState([
    { id: 'regulatoryDeficits', label: 'Regulatory Deficits', checked: true, tooltip: 'Shortfall positions that must be covered to meet regulatory requirements' },
          { 
        id: 'customerShorts', 
        label: 'Customer Shorts', 
        checked: true, 
        tooltip: 'Customer short sales that require securities to be borrowed for delivery',
        subComponents: [
          { id: 'customerCashMargin', label: 'Customer Cash/Margin (technical shorts)', checked: true },
          { id: 'customerShort', label: 'Customer Short', checked: true }
        ]
      },
      { 
        id: 'nonCustomer', 
        label: 'Non-Customer Shorts', 
        checked: true, 
        tooltip: 'Firm proprietary trading positions that may require borrowing',
        subComponents: [
          { id: 'nonCustomerCashMargin', label: 'Non-Customer Cash/Margin (technical shorts)', checked: true },
          { id: 'nonCustomerShort', label: 'Non-Customer Short', checked: true }
        ]
      },
    { id: 'firmShorts', label: 'Firm Shorts', checked: true, tooltip: 'Firm short trading positions that require securities borrowing' }
  ])
  
  const [shortsDeficitLimited, setShortsDeficitLimited] = useState(true)

  const [specialConditions, setSpecialConditions] = useState([
    { id: 'overrideDelivery', label: 'Borrow for deficit need when delivery need exists', checked: true, tooltip: 'Automatically borrow securities to cover deficit positions when delivery obligations exist' }
  ])

  const [reductionMethods, setReductionMethods] = useState([
    { 
      id: 'anticipatedReceives', 
      label: 'Reduce by Anticipated Receives', 
      checked: true, 
      applyTo: 'Deficit Limited Components Only', 
      cutoffTime: '11:00', 
      priorityOrder: 'normal',
      tooltip: 'Reduce borrow needs by expected incoming securities until cutoff time',
      subComponents: [
        { id: 'priorityNormal', label: 'Apply reductions in order of priority (CNS, DVP)', checked: true },
        { id: 'priorityReverse', label: 'Apply reductions in reverse order (DVP, CNS)', checked: false }
      ]
    },
    { id: 'openStockLoans', label: 'Reduce by Open Stock Loans', checked: true, applyTo: 'All Components', tooltip: 'Reduce borrow needs by recalling existing stock loans to other parties' },
    { id: 'openStockLoanRecall', label: 'Reduce by Open Stock Loan Recall', checked: true, applyTo: 'All Components', tooltip: 'Reduce borrow needs by securities from recalled loans not yet returned' }
  ])

  const handleToggle = (
    items: ConfigurationItem[],
    setItems: any,
    id: string
  ) => {
    const item = items.find(i => i.id === id)
    const newState = !item?.checked
    
    // If unchecking a component that has sub-components, close its expansion
    if (!newState && item?.subComponents && expandedComponents.includes(id)) {
      setExpandedComponents(prev => prev.filter(compId => compId !== id))
    }
    
    // Handle dependency: if unchecking "Open Stock Loans", also uncheck "Open Stock Loan Recall"
    if (id === 'openStockLoans' && !newState) {
      setItems(items.map((item: ConfigurationItem) => {
        if (item.id === id) {
          return { ...item, checked: newState }
        } else if (item.id === 'openStockLoanRecall') {
          return { ...item, checked: false }
        }
        return item
      }))
      
      logAuditEvent(
        'Component Toggle',
        `${newState ? 'Enabled' : 'Disabled'} component: ${item?.label}. Also disabled dependent component: Open Stock Loan Recall`,
        { componentId: id, previousState: item?.checked, newState, dependentDisabled: 'openStockLoanRecall' }
      )
    } 
    // Handle dependency: if enabling "Regulatory Deficits", disable "Borrow for deficit need when delivery need exists"
    else if (id === 'regulatoryDeficits' && newState && items === businessComponents) {
      setItems(items.map((item: ConfigurationItem) =>
        item.id === id ? { ...item, checked: newState } : item
      ))
      
      // Also disable the special condition
      setSpecialConditions(prev => prev.map(item => 
        item.id === 'overrideDelivery' ? { ...item, checked: false } : item
      ))
      
      logAuditEvent(
        'Component Toggle',
        `${newState ? 'Enabled' : 'Disabled'} component: ${item?.label}. Also disabled dependent component: Borrow for deficit need when delivery need exists`,
        { componentId: id, previousState: item?.checked, newState, dependentDisabled: 'overrideDelivery' }
      )
    } else {
      setItems(items.map((item: ConfigurationItem) =>
        item.id === id ? { ...item, checked: newState } : item
      ))
      
      logAuditEvent(
        'Component Toggle',
        `${newState ? 'Enabled' : 'Disabled'} component: ${item?.label}`,
        { componentId: id, previousState: item?.checked, newState }
      )
    }
  }

  const handleShortsDeficitLimitedChange = (value: boolean) => {
    setShortsDeficitLimited(value)
    
    logAuditEvent(
      'Shorts Deficit Limitation Change',
      `Set deficit limited to ${value ? 'Yes' : 'No'} for all shorts components`,
      { previousValue: shortsDeficitLimited, newValue: value }
    )
  }

  const handleCutoffTimeChange = (id: string, time: string) => {
    setReductionMethods(reductionMethods.map((item: ConfigurationItem) =>
      item.id === id ? { ...item, cutoffTime: time } : item
    ))
  }

  const handleSubComponentToggle = (parentId: string, subId: string) => {
    setBusinessComponents(businessComponents.map((item: ConfigurationItem) => {
      if (item.id === parentId && item.subComponents) {
        const updatedSubComponents = item.subComponents.map(sub => 
          sub.id === subId ? { ...sub, checked: !sub.checked } : sub
        )
        
        // Ensure at least one sub-component is selected
        const hasChecked = updatedSubComponents.some(sub => sub.checked)
        if (!hasChecked) {
          // Keep at least one checked - don't allow unchecking all
          return item
        }
        
        const subComponent = item.subComponents.find(sub => sub.id === subId)
        logAuditEvent(
          'Sub-Component Toggle',
          `${!subComponent?.checked ? 'Enabled' : 'Disabled'} ${subComponent?.label} within ${item.label}`,
          { parentId, subId, componentLabel: subComponent?.label, newState: !subComponent?.checked }
        )
        
        return { ...item, subComponents: updatedSubComponents }
      }
      return item
    }))
  }

  const handlePriorityOrderChange = (parentId: string, selectedId: string) => {
    setReductionMethods(reductionMethods.map((item: ConfigurationItem) => {
      if (item.id === parentId && item.subComponents) {
        const updatedSubComponents = item.subComponents.map(sub => ({
          ...sub,
          checked: sub.id === selectedId
        }))
        
        const newPriorityOrder = selectedId === 'priorityNormal' ? 'normal' : 'reverse'
        
        logAuditEvent(
          'Priority Order Change',
          `Changed priority order to ${newPriorityOrder} for ${item.label}`,
          { parentId, selectedId, newPriorityOrder }
        )
        
        return { 
          ...item, 
          subComponents: updatedSubComponents,
          priorityOrder: newPriorityOrder
        }
      }
      return item
    }))
  }

  const toggleComponentExpansion = (componentId: string) => {
    setExpandedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    )
  }

  const handleSaveConfiguration = () => {
    console.log('Configuration saved!', {
      regulatoryComponents,
      businessComponents,
      specialConditions,
      reductionMethods
    })
    toast.success('Configuration saved successfully!', {
      duration: 3000,
      description: 'All parameters have been updated and applied.'
    })
  }

  const handleResetToDefaults = () => {
    // Reset to initial state
    setRegulatoryComponents([
      { id: 'cnsDelivery', label: 'CNS Delivery', checked: true, priority: '1st', canDisable: false, tooltip: 'Securities that must be delivered through the Continuous Net Settlement system' },
      { id: 'dvpDelivery', label: 'DVP Delivery', checked: true, priority: '2nd', canDisable: false, tooltip: 'Securities that must be delivered versus payment to counterparties' },
      { id: 'fullyPaid', label: 'Fully Paid Accounts', checked: true, priority: '3rd', canDisable: false, tooltip: 'Customer fully paid positions that require physical delivery or borrowing' },
      { id: 'otherAvailability', label: 'Other Availability', checked: true, priority: '4th', canDisable: false, tooltip: 'Other firm inventory positions that may require borrowing to cover obligations' }
    ])
    
    toast.warning('Configuration reset to defaults', {
      duration: 3000,
      description: 'All parameters have been restored to default values.'
    })
    setBusinessComponents([
      { id: 'regulatoryDeficits', label: 'Regulatory Deficits', checked: true, tooltip: 'Shortfall positions that must be covered to meet regulatory requirements' },
      { 
        id: 'customerShorts', 
        label: 'Customer Shorts', 
        checked: true, 
        tooltip: 'Customer short sales that require securities to be borrowed for delivery',
        subComponents: [
          { id: 'customerCashMargin', label: 'Customer Cash/Margin (technical shorts)', checked: true },
          { id: 'customerShort', label: 'Customer Short', checked: true }
        ]
      },
      { 
        id: 'nonCustomer', 
        label: 'Non-Customer Shorts', 
        checked: true, 
        tooltip: 'Firm proprietary trading positions that may require borrowing',
        subComponents: [
          { id: 'nonCustomerCashMargin', label: 'Non-Customer Cash/Margin (technical shorts)', checked: true },
          { id: 'nonCustomerShort', label: 'Non-Customer Short', checked: true }
        ]
      },
      { id: 'firmShorts', label: 'Firm Shorts', checked: true, tooltip: 'Firm short trading positions that require securities borrowing' }
    ])
    setShortsDeficitLimited(true)
    setSpecialConditions([
      { id: 'overrideDelivery', label: 'Borrow for deficit need when delivery need exists', checked: true, tooltip: 'Automatically borrow securities to cover deficit positions when delivery obligations exist' }
    ])
    setReductionMethods([
      { 
        id: 'anticipatedReceives', 
        label: 'Reduce by Anticipated Receives', 
        checked: true, 
        applyTo: 'Deficit Limited Components Only', 
        cutoffTime: '11:00', 
        priorityOrder: 'normal',
        tooltip: 'Reduce borrow needs by expected incoming securities until cutoff time',
        subComponents: [
          { id: 'priorityNormal', label: 'Apply reductions in order of priority (CNS, DVP)', checked: true },
          { id: 'priorityReverse', label: 'Apply reductions in reverse order (DVP, CNS)', checked: false }
        ]
      },
      { id: 'openStockLoans', label: 'Reduce by Open Stock Loans', checked: true, applyTo: 'All Components', tooltip: 'Reduce borrow needs by recalling existing stock loans to other parties' },
      { id: 'openStockLoanRecall', label: 'Reduce by Open Stock Loan Recall', checked: true, applyTo: 'All Components', tooltip: 'Reduce borrow needs by securities from recalled loans not yet returned' }
    ])
    setCurrentMode('Deficit Limited - Fully Calculated')
    console.log('Configuration reset to defaults')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Smart Loan Needs Parameters</h1>
            <p className="text-sm text-gray-600">Configure securities lending parameters</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Activity className="w-3 h-3 mr-1.5 text-green-600" />
            {currentMode}
          </div>
          <button
            onClick={handleResetToDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveConfiguration}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
        {/* Regulatory Components */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-3 py-2 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Regulatory Components</h2>
              <div className="px-1.5 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-medium">Mandatory</div>
            </div>
          </div>
          <div className="p-2 space-y-1">
                        {regulatoryComponents.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-md transition-colors group">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span 
                    className={`text-sm font-medium cursor-help ${item.id === 'otherAvailability' ? 'text-orange-600' : 'text-gray-900'}`}
                    title={item.tooltip}
                  >
                    {item.label}
                  </span>
                </div>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                  item.priority === '1st' ? 'bg-red-100 text-red-700' :
                  item.priority === '2nd' ? 'bg-orange-100 text-orange-700' :
                  item.priority === '3rd' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {item.priority.charAt(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Components */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Business Components</h2>
              <div className="px-1.5 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-medium">Configurable</div>
            </div>
          </div>
          <div className="p-2 space-y-2">
            {businessComponents.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggle(businessComponents, setBusinessComponents, item.id)}
                      className="flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-700 transition-colors"
                      aria-label={`Toggle ${item.label}`}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <label 
                      className="text-sm text-gray-900 cursor-pointer" 
                      title={item.tooltip}
                      onClick={() => handleToggle(businessComponents, setBusinessComponents, item.id)}
                    >
                      {item.label}
                    </label>
                    {item.subComponents && item.checked && (
                      <button
                        onClick={() => toggleComponentExpansion(item.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title={expandedComponents.includes(item.id) ? 'Hide details' : 'Show breakdown'}
                      >
                        {expandedComponents.includes(item.id) ? (
                          <ChevronDown className="w-3 h-3 transition-transform" />
                        ) : (
                          <ChevronRight className="w-3 h-3 transition-transform" />
                        )}
                        <span>{expandedComponents.includes(item.id) ? 'Hide' : 'Details'}</span>
                      </button>
                    )}
                    <div className="group relative">
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {item.tooltip}
                      </div>
                                        </div>
                  </div>

                </div>
                
                {/* Sub-components dropdown */}
                {item.subComponents && item.checked && expandedComponents.includes(item.id) && (
                  <div className="ml-7 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="mb-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Aggregated from:
                    </div>
                    <div className="space-y-2">
                      {item.subComponents.map((subItem) => (
                        <div key={subItem.id} className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSubComponentToggle(item.id, subItem.id)}
                            className="flex items-center justify-center w-3 h-3 text-blue-600 hover:text-blue-700 transition-colors"
                            aria-label={`Toggle ${subItem.label}`}
                          >
                            {subItem.checked ? (
                              <CheckSquare className="w-3 h-3" />
                            ) : (
                              <Square className="w-3 h-3" />
                            )}
                          </button>
                          <label 
                            className="text-xs text-gray-700 cursor-pointer"
                            onClick={() => handleSubComponentToggle(item.id, subItem.id)}
                          >
                            {subItem.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Note: At least one sub-component must be selected
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Consolidated Deficit Limited Control for Shorts */}
            {(businessComponents.find(c => c.id === 'customerShorts')?.checked || 
              businessComponents.find(c => c.id === 'nonCustomer')?.checked || 
              businessComponents.find(c => c.id === 'firmShorts')?.checked) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">Shorts Deficit Limited:</span>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Controls whether Customer Shorts, Non-Customer Shorts, and Firm Shorts are deficit limited
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="shortsDeficitLimited"
                        checked={shortsDeficitLimited === true}
                        onChange={() => handleShortsDeficitLimitedChange(true)}
                        className="h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <span className="text-gray-400">•</span>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="shortsDeficitLimited"
                        checked={shortsDeficitLimited === false}
                        onChange={() => handleShortsDeficitLimitedChange(false)}
                        className="h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 italic">
                  Applies to: Customer Shorts, Non-Customer Shorts, and Firm Shorts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Special Conditions */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-2 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Special Conditions</h2>
              <div className="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full font-medium">Override Rules</div>
            </div>
          </div>
          <div className="p-2 space-y-2">
            {specialConditions.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (!(item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked)) {
                      handleToggle(specialConditions, setSpecialConditions, item.id)
                    }
                  }}
                  disabled={item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked}
                  className={`flex items-center justify-center w-4 h-4 transition-colors ${
                    item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked 
                      ? 'text-gray-400 cursor-not-allowed opacity-60' 
                      : 'text-orange-600 hover:text-orange-700 cursor-pointer'
                  }`}
                  aria-label={`Toggle ${item.label}`}
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <label 
                  className={`text-sm cursor-pointer ${
                    item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked 
                      ? 'text-gray-400' 
                      : 'text-gray-900'
                  }`} 
                  title={item.tooltip}
                  onClick={() => {
                    if (!(item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked)) {
                      handleToggle(specialConditions, setSpecialConditions, item.id)
                    }
                  }}
                >
                  {item.label}
                </label>
                {item.id === 'overrideDelivery' && businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                    Conflicts with Regulatory Deficits
                  </span>
                )}
                {item.id === 'overrideDelivery' && item.checked && !businessComponents.find(b => b.id === 'regulatoryDeficits')?.checked && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Active
                  </span>
                )}
                <div className="group relative">
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {item.tooltip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reduction Methods */}
        <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Reduction Methods</h2>
              <div className="px-1.5 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-medium">Optimization</div>
            </div>
          </div>
          <div className="p-2 space-y-2">
            {reductionMethods.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (!(item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked)) {
                          handleToggle(reductionMethods, setReductionMethods, item.id)
                        }
                      }}
                      disabled={item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked}
                      className={`flex items-center justify-center w-4 h-4 transition-colors ${
                        item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked 
                          ? 'text-gray-400 cursor-not-allowed opacity-50' 
                          : 'text-green-600 hover:text-green-700 cursor-pointer'
                      }`}
                      aria-label={`Toggle ${item.label}`}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <label 
                      className={`text-sm cursor-pointer ${
                        item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked 
                          ? 'text-gray-400' 
                          : 'text-gray-900'
                      }`} 
                      title={item.tooltip}
                      onClick={() => {
                        if (!(item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked)) {
                          handleToggle(reductionMethods, setReductionMethods, item.id)
                        }
                      }}
                    >
                      {item.label}
                    </label>
                    {item.subComponents && item.checked && (
                      <button
                        onClick={() => toggleComponentExpansion(item.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        title={expandedComponents.includes(item.id) ? 'Hide details' : 'Show priority order'}
                      >
                        {expandedComponents.includes(item.id) ? (
                          <ChevronDown className="w-3 h-3 transition-transform" />
                        ) : (
                          <ChevronRight className="w-3 h-3 transition-transform" />
                        )}
                        <span>{expandedComponents.includes(item.id) ? 'Hide' : 'Details'}</span>
                      </button>
                    )}
                    {item.id === 'openStockLoanRecall' && !reductionMethods.find(i => i.id === 'openStockLoans')?.checked && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                        Requires Open Stock Loans
                      </span>
                    )}
                    <div className="group relative">
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {item.tooltip}
                      </div>
                    </div>
                  </div>
                  
                  {item.id === 'anticipatedReceives' && item.checked && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <label className="text-xs text-gray-600">Cutoff time:</label>
                      <div className="group relative">
                        <input
                          type="time"
                          value={item.cutoffTime}
                          onChange={(e) => handleCutoffTimeChange(item.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          After {item.cutoffTime} ET, anticipated receives will not reduce needs
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">ET</span>
                    </div>
                  )}
                </div>
                
                                 {/* Sub-components dropdown for priority order */}
                 {item.subComponents && item.checked && expandedComponents.includes(item.id) && (
                   <div className="ml-7 p-3 bg-gray-50 rounded-lg border border-gray-200">
                     <div className="mb-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
                       Priority Order:
                     </div>
                     <div className="space-y-2">
                       {item.subComponents.map((subItem) => (
                         <div key={subItem.id} className="flex items-center space-x-2">
                           <button
                             onClick={() => handlePriorityOrderChange(item.id, subItem.id)}
                             className="flex items-center justify-center w-3 h-3 text-green-600 hover:text-green-700 transition-colors"
                             aria-label={`Select ${subItem.label}`}
                           >
                             {subItem.checked ? (
                               <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-green-600 flex items-center justify-center">
                                 <div className="w-1 h-1 bg-white rounded-full"></div>
                               </div>
                             ) : (
                               <div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div>
                             )}
                           </button>
                           <label 
                             className="text-xs text-gray-700 cursor-pointer"
                             onClick={() => handlePriorityOrderChange(item.id, subItem.id)}
                           >
                             {subItem.label}
                           </label>
                         </div>
                       ))}
                     </div>
                     <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                       <div className="flex items-start space-x-1">
                         <div className="w-3 h-3 flex items-center justify-center mt-0.5">
                           <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                         </div>
                         <span>
                           <strong>Note:</strong> Anticipated receives only apply to delivery components
                         </span>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      </div>





      {/* Change Audit Trail */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mt-4">
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-3 py-2 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Change Audit</h2>
              <div className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 text-xs rounded-full font-medium">
                {auditTrail.length > 0 ? `Last ${Math.min(auditTrail.length, showFullAuditHistory ? 20 : 3)}` : 'No Changes'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadAuditReport}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                title="Download audit report"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
              {auditTrail.length > 3 && (
                <button
                  onClick={() => setShowFullAuditHistory(!showFullAuditHistory)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  {showFullAuditHistory ? (
                    <ChevronDown className="w-3 h-3 transition-transform" />
                  ) : (
                    <Eye className="w-3 h-3 transition-transform" />
                  )}
                  <span>{showFullAuditHistory ? 'Show Less' : 'Show History'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-3">
          {auditTrail.length === 0 ? (
            <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
                <span>No configuration changes recorded yet</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Recent changes - always show last 3 */}
              {auditTrail.slice(0, showFullAuditHistory ? 20 : 3).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => {
                    setSelectedAuditEntry(entry)
                    setShowAuditModal(true)
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
                        entry.mode === 'deficit-limited' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.mode === 'deficit-limited' ? 'DL' : 'UR'}
                      </span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 flex-shrink-0">{entry.action}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm text-gray-600 truncate">{entry.details}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 flex-shrink-0">
                    <span className="hidden sm:inline">👤 {entry.user}</span>
                    <span>🕒 {new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
              
              {/* Show more indicator */}
              {!showFullAuditHistory && auditTrail.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    +{auditTrail.length - 3} more changes available
                  </span>
                </div>
              )}
              
              {/* Scrollable area for full history */}
              {showFullAuditHistory && auditTrail.length > 10 && (
                <div className="text-center py-2 border-t border-gray-200 mt-3 pt-3">
                  <span className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    📊 Showing last 20 changes • Full audit history available in database
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail Modal */}
      {showAuditModal && selectedAuditEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-gray-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Details</h2>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {selectedAuditEntry.mode === 'deficit-limited' ? 'Deficit Limited' : 'Unrestricted'}
                  </span>
                </div>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Action</h3>
                  <p className="text-lg font-medium text-gray-800">{selectedAuditEntry.action}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedAuditEntry.details}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">User</h3>
                    <p className="text-gray-700">{selectedAuditEntry.user}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Timestamp</h3>
                    <p className="text-gray-700">{new Date(selectedAuditEntry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Calculation Mode</h3>
                  <p className="text-gray-700">{selectedAuditEntry.mode === 'deficit-limited' ? 'Deficit Limited' : 'Unrestricted'}</p>
                </div>
                {selectedAuditEntry.changes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Change Details</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedAuditEntry.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartLoanConfig 