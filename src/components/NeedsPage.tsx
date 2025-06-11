import React, { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Activity,
  Shield,
  BarChart3,
  Users,
  Building
} from 'lucide-react'
import { toast } from 'sonner'
import SmartLoanConfig from './SmartLoanConfig'

// Mock data types
interface SecurityNeed {
  id: string
  ticker: string
  cusip: string
  description: string
  quantity: number
  marketValue: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  needReasons: {
    cnsDelivery?: number
    dvpDelivery?: number
    regulatoryDeficit?: number
    customerShorts?: number
    nonCustomerShorts?: number
    firmShorts?: number
  }
  borrowRate: number
  sodQuantity: number
  curedQuantity: number
  remainingQuantity: number
  cureOptions: string[]
  isRegulatory: boolean
  agingDays: number
  lastUpdate: string
  sector?: string
  borrowCost?: number
  cureMethod?: 'Borrow' | 'Recall' | 'Pledge' | 'Auto' | null
  failedAttempts?: number
}

interface DashboardMetrics {
  totalNeeds: number
  totalNeedsChange: number
  totalMarketValue: number
  totalMarketValueChange: number
  agingNeeds: number
  agingNeedsChange: number
  regShoSecurities: number
  regShoChange: number
  rule204Securities: number
  dailyProgress: {
    target: number
    completed: number
    remaining: number
  }
  priorityBreakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
  trendingNeeds: {
    trendingUp: number
    trendingDown: number
    stable: number
  }
  cureMethods: {
    receives: number
    recalls: number
    returns: number
    borrows: number
    releases: number
  }
}

interface AdvancedMetrics {
  borrowingCosts: {
    averageRate: number
    totalCost: number
    costChange: number
    highCostSecurities: number
    counterpartyBreakdown: Array<{
      counterparty: string
      borrowCount: number
      totalBorrowAmount: number
      weightedAverageRate: number
      dailyCost: number
    }>
  }
  operationalEfficiency: {
    automationRate: number
    averageTimeTocure: number
    cureSuccessRate: number
    failureReasons: Array<{
      reason: string
      count: number
    }>
  }
  riskMetrics: {
    concentrationRisk: number
    regulatoryDeadlines: Array<{
      type: string
      count: number
      urgency: 'Critical' | 'High' | 'Medium' | 'Low'
    }>
    counterpartyExposure: Array<{
      counterparty: string
      exposure: number
      limit: number
    }>
  }
  marketIntelligence: {
    htbSecurities: number
    rateVolatility: number
    marketComparison: {
      yourAvgRate: number
      marketAvgRate: number
      performance: 'Better' | 'Worse' | 'Neutral'
    }
  }
}

const NeedsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('priority')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedSecurity, setSelectedSecurity] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedShorts, setExpandedShorts] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [securityNeeds, setSecurityNeeds] = useState<SecurityNeed[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)

  // Generate realistic mock data
  const generateMockData = (): { needs: SecurityNeed[], metrics: DashboardMetrics, advancedMetrics: AdvancedMetrics } => {
    const tickers = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'META', 'NFLX', 'ADBE', 'NVDA', 'CRM', 'AMZN']
    const descriptions = [
      'APPLE INC', 'TESLA INC', 'ALPHABET INC-CL A', 'MICROSOFT CORP', 'META PLATFORMS INC',
      'NETFLIX INC', 'ADOBE INC', 'NVIDIA CORP', 'SALESFORCE INC', 'AMAZON.COM INC'
    ]
    const sectors = ['Technology', 'Technology', 'Technology', 'Technology', 'Technology', 
                    'Media', 'Technology', 'Technology', 'Technology', 'Consumer']
    const cureMethods: Array<'Borrow' | 'Recall' | 'Pledge' | 'Auto'> = ['Borrow', 'Recall', 'Pledge', 'Auto']
    
    const needs: SecurityNeed[] = []
    let totalNeeds = 0
    let totalMarketValue = 0
    let agingNeeds = 0
    let regShoCount = 0
    const priorityCount = { critical: 0, high: 0, medium: 0, low: 0 }

    for (let i = 0; i < 30; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const quantity = Math.floor(Math.random() * 5000) + 100
      const price = Math.random() * 300 + 50
      const marketValue = quantity * price
      const agingDays = Math.floor(Math.random() * 10)
      const isRegulatory = Math.random() > 0.7
      
      // Generate need reasons
      const needReasons: any = {}
      const needTypes = ['cnsDelivery', 'dvpDelivery', 'regulatoryDeficit', 'customerShorts', 'nonCustomerShorts', 'firmShorts']
      const activeNeeds = needTypes.filter(() => Math.random() > 0.6)
      
      activeNeeds.forEach(type => {
        needReasons[type] = Math.floor(Math.random() * quantity * 0.5) + 50
      })

      // Determine priority based on need types and regulatory status
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low'
      if (needReasons.cnsDelivery || needReasons.dvpDelivery) priority = 'Critical'
      else if (needReasons.regulatoryDeficit || isRegulatory) priority = 'High'
      else if (needReasons.customerShorts) priority = 'Medium'

      const sodQuantity = quantity + Math.floor(Math.random() * 1000)
      const curedQuantity = Math.floor(Math.random() * sodQuantity * 0.4)
      const remainingQuantity = sodQuantity - curedQuantity

      const borrowRate = Math.random() * 8 + 0.5
      const sector = sectors[i % sectors.length]
      const cureMethod = curedQuantity > 0 ? cureMethods[Math.floor(Math.random() * cureMethods.length)] : null
      const borrowCost = (curedQuantity * price * borrowRate) / 365 // Daily cost
      
      const need: SecurityNeed = {
        id: `NEED${(i + 1).toString().padStart(3, '0')}`,
        ticker: `${ticker}${i > 9 ? (i + 1) : ''}`,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: `${description}${i > 9 ? ` ${i + 1}` : ''}`,
        quantity,
        marketValue,
        priority,
        needReasons,
        borrowRate,
        sodQuantity,
        curedQuantity,
        remainingQuantity,
        cureOptions: ['Borrow', 'Recall', 'Pledge Release'].filter(() => Math.random() > 0.3),
        isRegulatory,
        agingDays,
        lastUpdate: new Date().toLocaleTimeString(),
        sector,
        borrowCost,
        cureMethod,
        failedAttempts: Math.floor(Math.random() * 3)
      }

      needs.push(need)
      totalNeeds += remainingQuantity
      totalMarketValue += marketValue
      if (agingDays > 3) agingNeeds++
      if (isRegulatory) regShoCount++
      priorityCount[priority.toLowerCase() as keyof typeof priorityCount]++
    }

    const metrics: DashboardMetrics = {
      totalNeeds,
      totalNeedsChange: Math.floor(Math.random() * 10) - 5,
      totalMarketValue,
      totalMarketValueChange: (Math.random() - 0.5) * 2000000,
      agingNeeds,
      agingNeedsChange: Math.floor(Math.random() * 6) - 3,
      regShoSecurities: regShoCount,
      regShoChange: 0,
      rule204Securities: Math.floor(Math.random() * 8) + 2,
      dailyProgress: {
        target: Math.floor(totalNeeds * 1.4),
        completed: Math.floor(totalNeeds * 0.4),
        remaining: totalNeeds
      },
      priorityBreakdown: priorityCount,
      trendingNeeds: {
        trendingUp: Math.floor(Math.random() * 5) + 2,
        trendingDown: Math.floor(Math.random() * 4) + 1,
        stable: Math.floor(Math.random() * 6) + 3
      },
      cureMethods: {
        receives: Math.floor(Math.random() * 150) + 50,
        recalls: Math.floor(Math.random() * 120) + 30,
        returns: Math.floor(Math.random() * 80) + 20,
        borrows: Math.floor(Math.random() * 200) + 100,
        releases: Math.floor(Math.random() * 60) + 15
      }
    }

    // Generate advanced metrics
    const totalBorrowCost = needs.reduce((sum, need) => sum + (need.borrowCost || 0), 0)
    const averageRate = needs.reduce((sum, need) => sum + need.borrowRate, 0) / needs.length
    const automatedCures = needs.filter(need => need.cureMethod === 'Auto').length
    const automationRate = (automatedCures / needs.filter(need => need.curedQuantity > 0).length) * 100
    
    const sectorBreakdown = sectors.map(sector => {
      const sectorNeeds = needs.filter(need => need.sector === sector)
      return {
        sector,
        averageRate: sectorNeeds.reduce((sum, need) => sum + need.borrowRate, 0) / sectorNeeds.length || 0,
        volume: sectorNeeds.reduce((sum, need) => sum + need.curedQuantity, 0),
        cost: sectorNeeds.reduce((sum, need) => sum + (need.borrowCost || 0), 0)
      }
    })

    const advancedMetrics: AdvancedMetrics = {
      borrowingCosts: {
        averageRate,
        totalCost: totalBorrowCost,
        costChange: (Math.random() - 0.5) * 10000,
        highCostSecurities: needs.filter(need => need.borrowRate > 5).length,
        counterpartyBreakdown: [
          { 
            counterparty: 'GSCO', 
            borrowCount: Math.floor(Math.random() * 25) + 15, 
            totalBorrowAmount: (Math.random() * 8000000) + 5000000, 
            weightedAverageRate: (Math.random() * 3) + 4.5, 
            dailyCost: (Math.random() * 15000) + 8000 
          },
          { 
            counterparty: 'MSWM', 
            borrowCount: Math.floor(Math.random() * 20) + 12, 
            totalBorrowAmount: (Math.random() * 7000000) + 4000000, 
            weightedAverageRate: (Math.random() * 2.8) + 4.2, 
            dailyCost: (Math.random() * 12000) + 7000 
          },
          { 
            counterparty: 'JPMC', 
            borrowCount: Math.floor(Math.random() * 30) + 18, 
            totalBorrowAmount: (Math.random() * 9000000) + 6000000, 
            weightedAverageRate: (Math.random() * 3.5) + 4.8, 
            dailyCost: (Math.random() * 18000) + 10000 
          },
          { 
            counterparty: 'RBC', 
            borrowCount: Math.floor(Math.random() * 15) + 8, 
            totalBorrowAmount: (Math.random() * 4000000) + 2500000, 
            weightedAverageRate: (Math.random() * 2.5) + 4.0, 
            dailyCost: (Math.random() * 8000) + 4500 
          },
          { 
            counterparty: 'CS', 
            borrowCount: Math.floor(Math.random() * 18) + 10, 
            totalBorrowAmount: (Math.random() * 5500000) + 3000000, 
            weightedAverageRate: (Math.random() * 3.2) + 4.6, 
            dailyCost: (Math.random() * 11000) + 6000 
          },
          { 
            counterparty: 'BAC', 
            borrowCount: Math.floor(Math.random() * 22) + 14, 
            totalBorrowAmount: (Math.random() * 6500000) + 4500000, 
            weightedAverageRate: (Math.random() * 2.9) + 4.3, 
            dailyCost: (Math.random() * 13000) + 7500 
          },
          { 
            counterparty: 'UBS', 
            borrowCount: Math.floor(Math.random() * 12) + 6, 
            totalBorrowAmount: (Math.random() * 3500000) + 2000000, 
            weightedAverageRate: (Math.random() * 2.7) + 4.1, 
            dailyCost: (Math.random() * 7500) + 4000 
          },
          { 
            counterparty: 'BARC', 
            borrowCount: Math.floor(Math.random() * 16) + 9, 
            totalBorrowAmount: (Math.random() * 4800000) + 2800000, 
            weightedAverageRate: (Math.random() * 3.1) + 4.4, 
            dailyCost: (Math.random() * 9500) + 5500 
          }
        ]
      },
      operationalEfficiency: {
        automationRate,
        averageTimeTocure: 2.3,
        cureSuccessRate: 94.2,
        failureReasons: [
          { reason: 'No availability', count: 12 },
          { reason: 'Rate too high', count: 8 },
          { reason: 'Counterparty limit', count: 5 }
        ]
      },
      riskMetrics: {
        concentrationRisk: 23.5,
        regulatoryDeadlines: [
          { type: 'T+4 Settlement', count: 8, urgency: 'High' },
          { type: 'RegSHO Close-out', count: 3, urgency: 'Critical' },
          { type: 'Dividend Record', count: 12, urgency: 'Medium' }
        ],
        counterpartyExposure: [
          { counterparty: 'Goldman Sachs', exposure: 15.2, limit: 25.0 },
          { counterparty: 'Morgan Stanley', exposure: 12.8, limit: 20.0 },
          { counterparty: 'JPMorgan', exposure: 18.5, limit: 30.0 }
        ]
      },
      marketIntelligence: {
        htbSecurities: needs.filter(need => need.borrowRate > 3).length,
        rateVolatility: 15.3,
        marketComparison: {
          yourAvgRate: averageRate,
          marketAvgRate: averageRate * 1.05,
          performance: averageRate < averageRate * 1.05 ? 'Better' : 'Worse'
        }
      }
    }

    return { needs, metrics, advancedMetrics }
  }

  // Initialize data
  useEffect(() => {
    const { needs, metrics: newMetrics, advancedMetrics: newAdvancedMetrics } = generateMockData()
    setSecurityNeeds(needs)
    setMetrics(newMetrics)
    setAdvancedMetrics(newAdvancedMetrics)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      
      // Randomly update some metrics
      if (metrics) {
        const updatedMetrics = { ...metrics }
        if (Math.random() > 0.8) {
          updatedMetrics.totalNeeds += Math.floor(Math.random() * 10) - 5
          updatedMetrics.dailyProgress.completed += Math.floor(Math.random() * 3)
          updatedMetrics.dailyProgress.remaining = updatedMetrics.dailyProgress.target - updatedMetrics.dailyProgress.completed
          
          // Show toast notification for significant updates
          if (Math.random() > 0.9) {
            toast.info('Data refreshed - new securities detected', {
              duration: 3000,
            })
          }
        }
        setMetrics(updatedMetrics)
      }

      // Randomly update some securities
      setSecurityNeeds(prev => prev.map(need => {
        if (Math.random() > 0.9) {
          const cureChange = Math.floor(Math.random() * 100)
          const wasFullyCured = need.remainingQuantity > 0 && (need.remainingQuantity - cureChange) <= 0
          
          const updatedNeed = {
            ...need,
            curedQuantity: Math.min(need.sodQuantity, need.curedQuantity + cureChange),
            remainingQuantity: Math.max(0, need.remainingQuantity - cureChange),
            lastUpdate: new Date().toLocaleTimeString()
          }
          
          // Show success toast when security is fully cured
          if (wasFullyCured) {
            toast.success(`${need.ticker} fully cured (${formatNumber(cureChange)} shares)`, {
              duration: 4000,
            })
          }
          
          return updatedNeed
        }
        return need
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [metrics])

  // Filter and sort data
  const filteredAndSortedNeeds = securityNeeds
    .filter(need => 
      need.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.cusip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SecurityNeed]
      let bVal: any = b[sortColumn as keyof SecurityNeed]
      
      if (sortColumn === 'priority') {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
        aVal = priorityOrder[a.priority]
        bVal = priorityOrder[b.priority]
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const toggleRowExpansion = (needId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId)
    } else {
      newExpanded.add(needId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleSectionCollapse = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatNeedReason = (reason: string) => {
    if (reason === 'cnsDelivery') return 'CNS Delivery';
    if (reason === 'dvpDelivery') return 'DVP Delivery';
    if (reason === 'regulatoryDeficit') return 'Deficit';
    
    const spaced = reason.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collapsible Sidebar for Parameters */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Smart Loan Parameters</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          <SmartLoanConfig />
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Smart Loan</h1>
                <p className="text-slate-300 text-xs">Needs Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-slate-300 text-xs">Last Update</p>
                <p className="font-medium text-sm">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Ultra-Compact Metrics Cards */}
        <div className="p-2">


          {/* Need Types Breakdown - Compact with Progress */}
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-4">
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Securities by Need Type</h3>
                <button
                  onClick={() => toggleSectionCollapse('needTypes')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={collapsedSections.has('needTypes') ? 'Expand section' : 'Collapse section'}
                >
                  {collapsedSections.has('needTypes') ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            {!collapsedSections.has('needTypes') && (
              <div className="p-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* CNS Delivery */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                        <Shield className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">CNS</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.filter(need => need.needReasons.cnsDelivery).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.cnsDelivery)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.cnsDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.cnsDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.cnsDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3 * 0.6))}, 
                          Recall {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.cnsDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3 * 0.4))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DVP Delivery */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                        <Building className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">DVP</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.filter(need => need.needReasons.dvpDelivery).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.dvpDelivery)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.dvpDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.dvpDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.dvpDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25 * 0.8))}, 
                          Antic. {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.dvpDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25 * 0.2))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Deficit */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Deficit</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.filter(need => need.needReasons.regulatoryDeficit).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.regulatoryDeficit)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.regulatoryDeficit)
                              .reduce((sum, need) => sum + (need.needReasons.regulatoryDeficit || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.regulatoryDeficit)
                              .reduce((sum, need) => sum + (need.needReasons.regulatoryDeficit || 0), 0) * 0.45)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Recall {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.regulatoryDeficit)
                            .reduce((sum, need) => sum + (need.needReasons.regulatoryDeficit || 0), 0) * 0.45 * 0.7))}, 
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.regulatoryDeficit)
                            .reduce((sum, need) => sum + (need.needReasons.regulatoryDeficit || 0), 0) * 0.45 * 0.3))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Needs - Expandable */}
                <div className="col-span-1 lg:col-span-1 xl:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Short Needs</span>
                        <button
                          onClick={() => setExpandedShorts(!expandedShorts)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedShorts ? (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {securityNeeds.filter(need => 
                          need.needReasons.customerShorts || 
                          need.needReasons.nonCustomerShorts || 
                          need.needReasons.firmShorts
                        ).length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(
                          securityNeeds
                            .filter(need => 
                              need.needReasons.customerShorts || 
                              need.needReasons.nonCustomerShorts || 
                              need.needReasons.firmShorts
                            )
                            .reduce((sum, need) => sum + need.marketValue, 0)
                        )}
                      </p>
                    </div>
                    <div className="text-xs">
                      <div className="bg-gray-50 rounded p-2 min-w-32">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <span className="text-gray-500">SOD:</span>
                          <span className="font-medium">
                            {formatNumber(
                              securityNeeds.reduce((sum, need) => 
                                sum + (need.needReasons.customerShorts || 0) + 
                                (need.needReasons.nonCustomerShorts || 0) + 
                                (need.needReasons.firmShorts || 0), 0)
                            )}
                          </span>
                          <span className="text-gray-500">Cured:</span>
                          <span className="font-medium text-green-600">
                            {formatNumber(
                              Math.floor(securityNeeds.reduce((sum, need) => 
                                sum + (need.needReasons.customerShorts || 0) + 
                                (need.needReasons.nonCustomerShorts || 0) + 
                                (need.needReasons.firmShorts || 0), 0) * 0.32)
                            )}
                          </span>
                          <span className="text-gray-600 col-span-2">
                            Borrow {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => 
                              sum + (need.needReasons.customerShorts || 0) + 
                              (need.needReasons.nonCustomerShorts || 0) + 
                              (need.needReasons.firmShorts || 0), 0) * 0.32 * 0.78))}, 
                            Other {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => 
                              sum + (need.needReasons.customerShorts || 0) + 
                              (need.needReasons.nonCustomerShorts || 0) + 
                              (need.needReasons.firmShorts || 0), 0) * 0.32 * 0.22))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {expandedShorts && (
                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
                      {/* Customer Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-yellow-100 rounded flex items-center justify-center">
                              <Users className="w-2 h-2 text-yellow-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Customer</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.customerShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.customerShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.customerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.customerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.customerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35 * 0.85))}, 
                                Pledge {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.customerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35 * 0.15))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Non-Customer Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                              <Building className="w-2 h-2 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Non-Customer</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.nonCustomerShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.nonCustomerShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.nonCustomerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.nonCustomerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.nonCustomerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4 * 0.5))}, 
                                Recall {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.nonCustomerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4 * 0.5))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Firm Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                              <BarChart3 className="w-2 h-2 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Firm</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.firmShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.firmShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.firmShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.firmShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0) * 0.2)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.firmShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0) * 0.2))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Securities */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <Activity className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Total</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds.reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds.reduce((sum, need) => {
                              return sum + Object.values(need.needReasons).reduce((reasonSum, qty) => reasonSum + (qty || 0), 0)
                            }, 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0) * 0.65))}, 
                          Recall {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0) * 0.35))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Ultra-Compact Progress and Priority */}
          <div className="bg-white rounded-md shadow border border-gray-200 mb-3">
            <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Progress & Priority Overview</h3>
                <button
                  onClick={() => toggleSectionCollapse('progressPriority')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={collapsedSections.has('progressPriority') ? 'Expand section' : 'Collapse section'}
                >
                  {collapsedSections.has('progressPriority') ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            {!collapsedSections.has('progressPriority') && (
              <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Daily Progress */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Progress</div>
                  <div className="text-lg font-bold text-blue-600 leading-none">
                    {Math.round((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100)}%
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Target</div>
                  <div className="font-semibold">{formatNumber(metrics.dailyProgress.target / 1000)}K</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                  <div className="text-gray-500">Done</div>
                  <div className="font-semibold text-green-600">{formatNumber(metrics.dailyProgress.completed / 1000)}K</div>
                </div>
                <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                  <div className="text-gray-500">Left</div>
                  <div className="font-semibold text-orange-600">{formatNumber(metrics.dailyProgress.remaining / 1000)}K</div>
                </div>
              </div>
            </div>

            {/* Priority Categories */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Priority</div>
                  <div className="text-lg font-bold text-red-600 leading-none">
                    {metrics.priorityBreakdown.critical + metrics.priorityBreakdown.high}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold">{Object.values(metrics.priorityBreakdown).reduce((a, b) => a + b, 0)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-red-50 px-1.5 py-1 rounded text-center">
                  <div className="text-red-500">CRIT</div>
                  <div className="font-semibold text-red-600">{metrics.priorityBreakdown.critical}</div>
                </div>
                <div className="bg-orange-50 px-1.5 py-1 rounded text-center">
                  <div className="text-orange-500">HIGH</div>
                  <div className="font-semibold text-orange-600">{metrics.priorityBreakdown.high}</div>
                </div>
                <div className="bg-yellow-50 px-1.5 py-1 rounded text-center">
                  <div className="text-yellow-600">MED</div>
                  <div className="font-semibold text-yellow-700">{metrics.priorityBreakdown.medium}</div>
                </div>
                <div className="bg-blue-50 px-1.5 py-1 rounded text-center">
                  <div className="text-blue-500">LOW</div>
                  <div className="font-semibold text-blue-600">{metrics.priorityBreakdown.low}</div>
                </div>
              </div>
            </div>

            {/* Cure Methods */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <RefreshCw className="w-3 h-3 text-green-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Cure Methods</div>
                  <div className="text-lg font-bold text-green-600 leading-none">
                    {Object.values(metrics.cureMethods).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold">Today</div>
                </div>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                  <span>Receives</span>
                  <span className="font-semibold text-blue-600">{metrics.cureMethods.receives}</span>
                </div>
                <div className="flex justify-between bg-orange-50 px-1.5 py-0.5 rounded">
                  <span>Recalls</span>
                  <span className="font-semibold text-orange-600">{metrics.cureMethods.recalls}</span>
                </div>
                <div className="flex justify-between bg-green-50 px-1.5 py-0.5 rounded">
                  <span>Returns</span>
                  <span className="font-semibold text-green-600">{metrics.cureMethods.returns}</span>
                </div>
                <div className="flex justify-between bg-purple-50 px-1.5 py-0.5 rounded">
                  <span>Borrows</span>
                  <span className="font-semibold text-purple-600">{metrics.cureMethods.borrows}</span>
                </div>
                <div className="flex justify-between bg-yellow-50 px-1.5 py-0.5 rounded">
                  <span>Releases</span>
                  <span className="font-semibold text-yellow-600">{metrics.cureMethods.releases}</span>
                </div>
              </div>
            </div>
                </div>
              </div>
            )}
          </div>

          {/* Ultra-Compact Advanced Analytics - Collapsible */}
          {advancedMetrics && (
            <div className="bg-white rounded-md shadow border border-gray-200 mb-4">
              <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900">Advanced Analytics</h3>
                  <button
                    onClick={() => toggleSectionCollapse('analytics')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={collapsedSections.has('analytics') ? 'Expand section' : 'Collapse section'}
                  >
                    {collapsedSections.has('analytics') ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {!collapsedSections.has('analytics') && (
                <div className="p-2">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Need Support Borrowing */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="w-3 h-3 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Need Support Borrowing</div>
                      <div className="text-lg font-bold text-purple-600 leading-none">
                        {advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.borrowCount, 0)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Borrows</div>
                      <div className="font-semibold">Today</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                      <span>Total Amount</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.totalBorrowAmount, 0) / 1000000).replace('$', '')}M
                      </span>
                    </div>
                    <div className="flex justify-between bg-purple-50 px-1.5 py-0.5 rounded">
                      <span>WAR Rate</span>
                      <span className="font-semibold text-purple-600">{advancedMetrics.borrowingCosts.averageRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between bg-green-50 px-1.5 py-0.5 rounded">
                      <span>Daily Cost</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.dailyCost, 0) / 1000).replace('$', '')}K
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto-Borrow Statistics */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-3 h-3 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Auto-Borrow Statistics</div>
                      <div className="text-lg font-bold text-green-600 leading-none">
                        {Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Attempted</div>
                      <div className="font-semibold">Today</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-green-50 px-1.5 py-0.5 rounded">
                      <span>Successful</span>
                      <span className="font-semibold text-green-600">{Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5 * 0.92)}</span>
                    </div>
                    <div className="flex justify-between bg-red-50 px-1.5 py-0.5 rounded">
                      <span>Not Filled</span>
                      <span className="font-semibold text-red-600">{Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5 * 0.08)}</span>
                    </div>
                    <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                      <span>Success Rate</span>
                      <span className="font-semibold text-blue-600">{advancedMetrics.operationalEfficiency.cureSuccessRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Securities */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="w-3 h-3 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Securities</div>
                      <div className="text-lg font-bold text-blue-600 leading-none">
                        {securityNeeds.filter(need => need.remainingQuantity > 0).length}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">SOD</div>
                      <div className="font-semibold">{securityNeeds.length}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                      <div className="text-gray-500">Cured</div>
                      <div className="font-semibold text-green-600">{securityNeeds.filter(need => need.remainingQuantity === 0).length}</div>
                    </div>
                    <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                      <div className="text-gray-500">Remain</div>
                      <div className="font-semibold text-orange-600">{securityNeeds.filter(need => need.remainingQuantity > 0).length}</div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Needs */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Regulatory Needs</div>
                      <div className="text-lg font-bold text-orange-600 leading-none">
                        {formatNumber(
                          securityNeeds
                            .filter(need => need.agingDays > 3 && need.needReasons.regulatoryDeficit)
                            .reduce((sum, need) => sum + (need.needReasons.regulatoryDeficit || 0), 0)
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Aged</div>
                      <div className="font-semibold">Deficits</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded">
                      <span>RegSHO</span>
                      <span className="font-semibold text-red-600">{metrics.regShoSecurities}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded">
                      <span>Rule 204</span>
                      <span className="font-semibold text-orange-600">{metrics.rule204Securities}</span>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ultra-Compact Counterparty Breakdown - Collapsible */}
          {advancedMetrics && (
              <div className="bg-white rounded-md shadow border border-gray-200 mb-4">
                <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md">
                                      <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-900">Top Counterparty Borrowing</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Live • Ranked by efficiency</span>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <button
                          onClick={() => toggleSectionCollapse('counterparty')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={collapsedSections.has('counterparty') ? 'Expand section' : 'Collapse section'}
                        >
                          {collapsedSections.has('counterparty') ? (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                </div>
                {!collapsedSections.has('counterparty') && (
                  <div className="p-1.5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-1.5">
                      {advancedMetrics.borrowingCosts.counterpartyBreakdown
                        .sort((a, b) => b.dailyCost - a.dailyCost)
                        .slice(0, 6)
                        .map((counterparty, idx) => {
                          const avgRate = advancedMetrics.borrowingCosts.averageRate
                          const efficiency = ((avgRate - counterparty.weightedAverageRate) / avgRate) * 100
                          const fillRate = 90 + Math.random() * 8 // Mock fill rate 90-98%
                          const trend = Math.random() > 0.5 ? 'up' : 'down'
                          const trendValue = (Math.random() * 15).toFixed(1)
                          
                          return (
                            <div key={counterparty.counterparty} className="bg-gray-50 rounded px-1.5 py-1 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200 cursor-pointer group">
                              {/* Header Row */}
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-bold text-gray-900 truncate">{counterparty.counterparty}</span>
                                <div className="flex items-center space-x-1">
                                  <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend === 'up' ? '↗' : '↘'}{trendValue}%
                                  </span>
                                  <span className={`text-xs px-1 py-0.5 rounded-full font-bold ${
                                    idx === 0 ? 'bg-red-100 text-red-700' :
                                    idx === 1 ? 'bg-orange-100 text-orange-700' :
                                    idx === 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Metrics Grid */}
                              <div className="grid grid-cols-3 gap-0.5 text-xs mb-1">
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">WAR</div>
                                  <div className={`font-bold ${efficiency > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {counterparty.weightedAverageRate.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">Vol</div>
                                  <div className="font-bold text-blue-700">{formatCurrency(counterparty.totalBorrowAmount / 1000000).replace('$', '')}M</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">Cost</div>
                                  <div className="font-bold text-purple-700">{formatCurrency(counterparty.dailyCost / 1000).replace('$', '')}K</div>
                                </div>
                              </div>
                              
                              {/* Performance Bar */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Fill Rate</span>
                                  <span className={`font-semibold ${fillRate > 95 ? 'text-green-600' : fillRate > 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {fillRate.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                      fillRate > 95 ? 'bg-green-500' : fillRate > 90 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${fillRate}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Bottom Row - Count & Efficiency */}
                              <div className="flex items-center justify-between mt-1 text-xs">
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-500">{counterparty.borrowCount}</span>
                                  <span className="text-gray-400">borrows</span>
                                </div>
                                <div className={`px-1 py-0.5 rounded text-xs font-medium ${
                                  efficiency > 5 ? 'bg-green-100 text-green-700' :
                                  efficiency > 0 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {efficiency > 0 ? '+' : ''}{efficiency.toFixed(0)}%
                                </div>
                              </div>
                              
                              {/* Hover Details */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 text-xs text-gray-600 border-t border-gray-200 pt-1">
                                Avg Time: {(Math.random() * 3 + 0.5).toFixed(1)}min • Success: {(92 + Math.random() * 6).toFixed(0)}%
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    
                    {/* Summary Footer */}
                    <div className="mt-2 pt-1.5 border-t border-gray-200 bg-gray-50 rounded px-2 py-1">
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div>
                          <div className="font-bold text-gray-900">{advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.borrowCount, 0)}</div>
                          <div className="text-gray-600">Borrows</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-700">{formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.totalBorrowAmount, 0) / 1000000).replace('$', '')}M</div>
                          <div className="text-gray-600">Volume</div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-700">{advancedMetrics.borrowingCosts.averageRate.toFixed(2)}%</div>
                          <div className="text-gray-600">Avg Rate</div>
                        </div>
                        <div>
                          <div className="font-bold text-green-700">{formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.dailyCost, 0) / 1000).replace('$', '')}K</div>
                          <div className="text-gray-600">Daily Cost</div>
                        </div>
                        <div>
                          <div className="font-bold text-orange-700">{(93.5 + Math.random() * 4).toFixed(1)}%</div>
                          <div className="text-gray-600">Fill Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Securities Needs Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {/* Table Header */}
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Securities Needs</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search securities..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => toast.info('Filter functionality coming soon', { duration: 2000 })}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                  <button 
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      toast.loading('Exporting securities data...', { duration: 1000 })
                      setTimeout(() => {
                        toast.success(`Exported ${filteredAndSortedNeeds.length} securities to CSV`, { duration: 3000 })
                      }, 1000)
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('ticker')}>
                      <div className="flex items-center space-x-1">
                        <span>Ticker</span>
                        {sortColumn === 'ticker' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc</th>
                    <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('quantity')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Quantity</span>
                        {sortColumn === 'quantity' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Need Reasons</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('priority')}>
                      <div className="flex items-center space-x-1">
                        <span>Priority</span>
                        {sortColumn === 'priority' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('borrowRate')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Borrow Rate</span>
                        {sortColumn === 'borrowRate' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th colSpan={2} className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedNeeds.map((need) => (
                    <React.Fragment key={need.id}>
                      <tr className="hover:bg-gray-50 text-sm">
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div>
                            <span className="font-medium text-gray-900">{need.ticker}</span>
                            <span className="text-xs text-gray-500 ml-2">{need.cusip}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div className="text-gray-900 truncate max-w-48" title={need.description}>
                            {need.description}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right whitespace-nowrap">
                          <div className="font-medium text-gray-900">{formatNumber(need.remainingQuantity)} / {formatNumber(need.sodQuantity)}</div>
                        </td>
                        <td className="px-2 py-1" style={{ maxWidth: '300px' }}>
                          <div className="flex flex-wrap items-center gap-1">
                            {Object.entries(need.needReasons).slice(0, 2).map(([reason, qty]) => (
                              <span key={reason} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {formatNeedReason(reason)}: {formatNumber(qty as number)}
                              </span>
                            ))}
                            {Object.keys(need.needReasons).length > 2 && (
                              <span className="text-xs text-gray-500 ml-1">
                                +{Object.keys(need.needReasons).length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(need.priority)}`}>
                              {need.priority}
                            </span>
                            {need.isRegulatory && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Regulatory
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right whitespace-nowrap">
                          <div className="font-medium text-gray-900">{need.borrowRate.toFixed(2)}%</div>
                        </td>
                        <td className="px-2 py-1 text-center" colSpan={2}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                              onClick={() => {
                                 if (need.remainingQuantity === 0) {
                                  toast.info(`${need.ticker} is already fully cured`)
                                } else {
                                  // Default action or open menu
                                  toast.success(`Cure process initiated for ${need.ticker}`)
                                }
                              }}
                            >
                              Cure
                              <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                            </button>
                            {/* This is a simplified dropdown. A real implementation would use a library like Headless UI. */}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => toggleRowExpansion(need.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows.has(need.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Row Details */}
                      {expandedRows.has(need.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-3 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Need Details</h4>
                                <div className="space-y-1">
                                  <p><span className="text-gray-600">CUSIP:</span> {need.cusip}</p>
                                  <p><span className="text-gray-600">Market Value:</span> {formatCurrency(need.marketValue)}</p>
                                  <p><span className="text-gray-600">Aging:</span> {need.agingDays} days</p>
                                  <p><span className="text-gray-600">Last Update:</span> {need.lastUpdate}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Progress Tracking</h4>
                                <div className="space-y-1">
                                  <p><span className="text-gray-600">SOD Quantity:</span> {formatNumber(need.sodQuantity)}</p>
                                  <p><span className="text-gray-600">Cured:</span> {formatNumber(need.curedQuantity)}</p>
                                  <p><span className="text-gray-600">Remaining:</span> {formatNumber(need.remainingQuantity)}</p>
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${(need.curedQuantity / need.sodQuantity) * 100}%` }}
                                      ></div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {Math.round((need.curedQuantity / need.sodQuantity) * 100)}% resolved
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Available Actions</h4>
                                <div className="space-y-2">
                                  <button 
                                    className="w-full text-left px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                    onClick={() => {
                                      toast.loading(`Initiating borrow for ${need.ticker}...`, { duration: 2000 })
                                      setTimeout(() => {
                                        toast.success(`Borrow request submitted for ${formatNumber(need.remainingQuantity)} shares of ${need.ticker}`, { 
                                          duration: 4000 
                                        })
                                      }, 2000)
                                    }}
                                  >
                                    🔄 Borrow {formatNumber(need.remainingQuantity)} shares
                                  </button>
                                  <button 
                                    className="w-full text-left px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
                                    onClick={() => {
                                      toast.loading(`Processing recall for ${need.ticker}...`, { duration: 1500 })
                                      setTimeout(() => {
                                        toast.success(`Recall initiated for existing ${need.ticker} loans`, { duration: 3000 })
                                      }, 1500)
                                    }}
                                  >
                                    📞 Recall existing loans
                                  </button>
                                  <button 
                                    className="w-full text-left px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                                    onClick={() => {
                                      toast.loading(`Checking pledge inventory for ${need.ticker}...`, { duration: 1000 })
                                      setTimeout(() => {
                                        if (Math.random() > 0.7) {
                                          toast.success(`Released ${Math.floor(need.remainingQuantity * 0.3)} pledged shares of ${need.ticker}`, { 
                                            duration: 4000 
                                          })
                                        } else {
                                          toast.warning(`No pledged ${need.ticker} shares available for release`, { duration: 3000 })
                                        }
                                      }, 1000)
                                    }}
                                  >
                                    🔓 Release pledged securities
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NeedsPage

