import React, { useState, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Clock,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Settings,
  Shield,
  Building,
  Users,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import FISLogo from '@/components/ui/fis-logo'

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
    deficit?: number
    customerShorts?: number
    nonCustomerShorts?: number
    firmShorts?: number
  }
  // Critical 204 CNS delivery failure from prior day
  is204CNS?: boolean
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
  // Outstanding positions that can be recalled/released
  outstandingLoan?: number  // Quantity currently on loan that can be recalled
  outstandingPledge?: number  // Quantity currently pledged that can be released
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

interface NeedsPageProps {
  onNavigateToParameters?: () => void
}

const NeedsPage: React.FC<NeedsPageProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('priority')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedShorts, setExpandedShorts] = useState(false)
  
  // New UX improvements - Enhanced view modes and filtering
  const [viewMode, setViewMode] = useState<'critical-only' | 'overview' | 'detailed'>('overview')
  const [selectedSecurities, setSelectedSecurities] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Apply view mode filtering
  const getFilteredNeeds = () => {
    let filtered = [...securityNeeds]

    // Apply view mode
    switch (viewMode) {
      case 'critical-only':
        filtered = filtered.filter(need => ['Critical', 'High'].includes(need.priority))
        break
      case 'overview':
        // Show top 15 items by priority and market value
        filtered = filtered
          .sort((a, b) => {
            const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            if (aPriority !== bPriority) return bPriority - aPriority
            return b.marketValue - a.marketValue
          })
          .slice(0, 15)
        break
      case 'detailed':
        // Show all items
        break
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(need => 
        need.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.cusip.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [securityNeeds, setSecurityNeeds] = useState<SecurityNeed[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)

  // Generate realistic mock data
  const generateMockData = (): { needs: SecurityNeed[], metrics: DashboardMetrics, advancedMetrics: AdvancedMetrics } => {
    const tickers = ['AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'CRM', 'V', 'BA', 'MCD', 'AXP', 'AMGN', 'IBM', 'TRV', 'JPM', 'HON', 'NKE', 'JNJ', 'WMT', 'PG', 'CVX', 'KO', 'MRK', 'CSCO', 'DIS', 'DOW', 'INTC', 'MMM', 'VZ', 'WBA']
    const descriptions = [
      'APPLE INC', 'MICROSOFT CORP', 'UNITEDHEALTH GROUP INC', 'GOLDMAN SACHS GROUP INC', 'HOME DEPOT INC',
      'CATERPILLAR INC', 'SALESFORCE INC', 'VISA INC-CLASS A', 'BOEING CO', 'MCDONALDS CORP',
      'AMERICAN EXPRESS CO', 'AMGEN INC', 'INTL BUSINESS MACHINES CORP', 'TRAVELERS COS INC', 'JPMORGAN CHASE & CO',
      'HONEYWELL INTERNATIONAL INC', 'NIKE INC-CLASS B', 'JOHNSON & JOHNSON', 'WALMART INC', 'PROCTER & GAMBLE CO',
      'CHEVRON CORP', 'COCA-COLA CO', 'MERCK & CO INC', 'CISCO SYSTEMS INC', 'WALT DISNEY CO',
      'DOW INC', 'INTEL CORP', '3M CO', 'VERIZON COMMUNICATIONS INC', 'WALGREENS BOOTS ALLIANCE INC'
    ]
    const sectors = ['Technology', 'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary', 
                    'Industrials', 'Technology', 'Financial Services', 'Industrials', 'Consumer Discretionary',
                    'Financial Services', 'Healthcare', 'Technology', 'Financial Services', 'Financial Services',
                    'Industrials', 'Consumer Discretionary', 'Healthcare', 'Consumer Staples', 'Consumer Staples',
                    'Energy', 'Consumer Staples', 'Healthcare', 'Technology', 'Communication Services',
                    'Materials', 'Technology', 'Industrials', 'Communication Services', 'Consumer Staples']
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
      const needTypes = ['cnsDelivery', 'dvpDelivery', 'deficit', 'customerShorts', 'nonCustomerShorts', 'firmShorts']
      const activeNeeds = needTypes.filter(() => Math.random() > 0.6)
      
      activeNeeds.forEach(type => {
        needReasons[type] = Math.floor(Math.random() * quantity * 0.5) + 50
      })

      // Critical 204 CNS delivery failure (prior day CNS delivery not met)
      const is204CNS = needReasons.cnsDelivery && Math.random() < 0.15 // 15% of CNS deliveries are 204s
      
      // Determine priority based on need types and regulatory status
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low'
      if (is204CNS) priority = 'Critical' // 204 CNS always gets highest priority
      else if (needReasons.cnsDelivery || needReasons.dvpDelivery) priority = 'Critical'
      else if (needReasons.deficit || isRegulatory) priority = 'High'
      else if (needReasons.customerShorts) priority = 'Medium'

      const sodQuantity = quantity + Math.floor(Math.random() * 1000)
      const curedQuantity = Math.floor(Math.random() * sodQuantity * 0.4)
      const remainingQuantity = sodQuantity - curedQuantity

      const borrowRate = Math.random() * 8 + 0.5
      const sector = sectors[i % sectors.length]
      const cureMethod = curedQuantity > 0 ? cureMethods[Math.floor(Math.random() * cureMethods.length)] : null
      const borrowCost = (curedQuantity * price * borrowRate) / 365 // Daily cost
      
      // Generate realistic outstanding positions
      const hasOutstandingLoan = Math.random() > 0.6 // 40% chance of having an outstanding loan
      const hasOutstandingPledge = Math.random() > 0.7 // 30% chance of having an outstanding pledge
      const outstandingLoan = hasOutstandingLoan ? Math.floor(quantity * (0.1 + Math.random() * 0.4)) : 0
      const outstandingPledge = hasOutstandingPledge ? Math.floor(quantity * (0.05 + Math.random() * 0.3)) : 0

      const need: SecurityNeed = {
        id: `NEED${(i + 1).toString().padStart(3, '0')}`,
        ticker: ticker,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: description,
        quantity,
        marketValue,
        priority,
        needReasons,
        is204CNS,
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
        failedAttempts: Math.floor(Math.random() * 3),
        outstandingLoan: outstandingLoan > 0 ? outstandingLoan : undefined,
        outstandingPledge: outstandingPledge > 0 ? outstandingPledge : undefined
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
      rule204Securities: needs.filter(need => need.is204CNS).length,
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

  // Smart filter presets (after securityNeeds is initialized)
  const filterPresets = [
    {
      id: 'urgent-action',
      label: 'Urgent Action Required',
      description: 'Critical & High priority items',
      filter: (need: SecurityNeed) => ['Critical', 'High'].includes(need.priority),
      count: securityNeeds.filter(need => ['Critical', 'High'].includes(need.priority)).length
    },
    {
      id: 'regulatory-deadlines',
      label: 'Regulatory Deadlines',
      description: 'Items with regulatory requirements',
      filter: (need: SecurityNeed) => need.isRegulatory,
      count: securityNeeds.filter(need => need.isRegulatory).length
    },
    {
      id: 'high-value',
      label: 'High Value (>$1M)',
      description: 'Securities with market value over $1M',
      filter: (need: SecurityNeed) => need.marketValue > 1000000,
      count: securityNeeds.filter(need => need.marketValue > 1000000).length
    }
  ]

  // Bulk operations
  const handleBulkAction = (action: 'borrow' | 'recall' | 'release', securities: SecurityNeed[]) => {
    setIsLoading(true)
    console.log(`🔄 Bulk ${action} initiated for ${securities.length} securities`)
    
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(need => {
        if (securities.some(s => s.id === need.id)) {
          const cureAmount = Math.floor(need.remainingQuantity * 0.7)
          return {
            ...need,
            curedQuantity: need.curedQuantity + cureAmount,
            remainingQuantity: need.remainingQuantity - cureAmount,
            lastUpdate: new Date().toLocaleTimeString(),
            cureMethod: action === 'borrow' ? 'Borrow' : action === 'recall' ? 'Recall' : 'Pledge'
          }
        }
        return need
      }))
      setSelectedSecurities(new Set())
      setIsLoading(false)
    }, 2000)
  }

  const toggleSecuritySelection = (securityId: string) => {
    setSelectedSecurities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(securityId)) {
        newSet.delete(securityId)
      } else {
        newSet.add(securityId)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    const visibleIds = getFilteredNeeds().map(need => need.id)
    setSelectedSecurities(new Set(visibleIds))
  }

  const clearSelection = () => {
    setSelectedSecurities(new Set())
  }

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
            // console.log('Data refreshed - new securities detected')
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
            // console.log(`${need.ticker} fully cured (${formatNumber(cureChange)} shares)`)
          }
          
          return updatedNeed
        }
        return need
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [metrics])

  // Filter and sort data
  const filteredAndSortedNeeds = getFilteredNeeds()
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
      case 'Critical':
        return 'fis-critical-gradient text-red-800 border-red-200'
      case 'High':
        return 'fis-high-gradient text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const formatNeedReason = (reason: string) => {
    if (reason === 'cnsDelivery') return 'CNS Delivery';
    if (reason === 'dvpDelivery') return 'DVP Delivery';
    if (reason === 'deficit') return 'Deficit';
    
    const spaced = reason.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  // Quick action handlers
  const handleQuickBorrow = (need: SecurityNeed) => {
    console.log(`🔄 Auto-borrowing ${formatNumber(need.remainingQuantity)} shares of ${need.ticker}`)
    // Simulate API call
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(n => 
        n.id === need.id 
          ? { ...n, curedQuantity: n.curedQuantity + Math.floor(n.remainingQuantity * 0.8), lastUpdate: new Date().toLocaleTimeString() }
          : n
      ))
    }, 2000)
  }

  const handleQuickRecall = (need: SecurityNeed) => {
    console.log(`📞 Initiating recall for ${need.ticker}`)
    // Simulate API call
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(n => 
        n.id === need.id 
          ? { ...n, curedQuantity: n.curedQuantity + Math.floor(n.remainingQuantity * 0.6), lastUpdate: new Date().toLocaleTimeString() }
          : n
      ))
    }, 1500)
  }



  // Add visual progress component
  const CureProgressBar = ({ need }: { need: SecurityNeed }) => {
    const progressPercentage = ((need.quantity - need.remainingQuantity) / need.quantity) * 100
    const isComplete = need.remainingQuantity === 0
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-700">
            Cure Progress
          </span>
          <span className="text-xs text-gray-500">
            {formatNumber(need.quantity - need.remainingQuantity)} / {formatNumber(need.quantity)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              isComplete 
                ? "bg-progress-complete" 
                : progressPercentage > 75 
                  ? "bg-info"
                  : progressPercentage > 50
                    ? "bg-progress-partial"
                    : "bg-critical"
            )}
            style={{ width: `${Math.max(progressPercentage, 2)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isComplete ? "✓ Complete" : `${progressPercentage.toFixed(1)}% cured`}
        </div>
      </div>
    )
  }

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient p-6">
        {/* Modern Header with Gradient */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="fis-header-gradient p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              <FISLogo variant="icon" size="sm" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Needs Management <span className="text-sm font-normal text-gray-600">- Monitor and manage securities borrowing needs</span></h1>
                {/* FIS Balance Line Indicator */}
                <div className="flex items-center space-x-2 mt-1">
                  <div className="fis-balance-line w-8"></div>
                  <span className="text-xs text-gray-500">FIS Securities Lending Platform</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-fis-green-50 text-fis-green border-fis-green px-3 py-1">
                <Clock className="w-4 h-4 mr-1.5" />
                Updated: {lastUpdate.toLocaleTimeString()}
              </Badge>
              <div className="w-2 h-2 bg-fis-green rounded-full animate-pulse"></div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigateToParameters?.()}
                className="fis-button-primary h-9 px-4 border-0"
              >
                <Settings className="w-4 h-4 mr-2" />
                Parameters
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">{/* Main Dashboard */}

        {/* Ultra-Compact Metrics Cards */}
        <div className="p-2">


          {/* Need Types Breakdown - Compact with Progress */}
          <div className="fis-dashboard-section rounded-md shadow-lg mb-3">
            <div className="px-3 py-1.5 border-b border-gray-200 fis-table-header rounded-t-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Securities by Need Type</h3>
                <button
                  onClick={() => toggleSectionCollapse('needTypes')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={collapsedSections.has('needTypes') ? 'Expand section' : 'Collapse section'}
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-500 transition-transform duration-200",
                    collapsedSections.has('needTypes') ? "transform rotate-180" : ""
                  )} />
                </button>
              </div>
            </div>
            {!collapsedSections.has('needTypes') && (
              <div className="p-2">
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
                                              {securityNeeds.filter(need => need.needReasons.deficit).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.deficit)
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
                              .filter(need => need.needReasons.deficit)
                              .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.deficit)
                              .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Recall {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45 * 0.7))}, 
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45 * 0.3))}
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
                            <ChevronDown className="w-3 h-3 text-gray-500" />
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
            <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Daily Progress & Priority Distribution</h3>
                <div className="flex items-center space-x-2">
                  {/* FIS Balance Line Indicator */}
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-0.5 bg-gradient-to-r from-fis-green to-gray-300"></div>
                    <span className="text-xs text-gray-500">Live</span>
                    <div className="w-1.5 h-1.5 bg-fis-green rounded-full animate-pulse"></div>
                  </div>
                  <button
                    onClick={() => toggleSectionCollapse('progress')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={collapsedSections.has('progress') ? 'Expand section' : 'Collapse section'}
                  >
                    {collapsedSections.has('progress') ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {!collapsedSections.has('progress') && (
              <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Daily Progress */}
            <div className="fis-metric-gradient rounded-md shadow-sm border border-gray-100 p-2">
              <div className="flex items-center space-x-2 mb-1">      
                <div className="w-3 h-3 bg-fis-green rounded-full shadow-sm"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Daily Progress</div>
                  <div className="text-lg font-bold text-fis-green leading-none">
                    {Math.round((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100)}%
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Target</div>
                  <div className="font-semibold">{metrics.dailyProgress.target}</div>
                </div>
              </div>
              {/* FIS Balance Line Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div 
                    className="fis-progress-gradient h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{metrics.dailyProgress.completed} completed</span>
                  <span>{metrics.dailyProgress.remaining} remaining</span>
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
                      <ChevronDown className="w-4 h-4 text-gray-500" />
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
                            .filter(need => need.agingDays > 3 && need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0)
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
                          <span>Live Grid - Ranked by efficiency</span>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <button
                          onClick={() => toggleSectionCollapse('counterparty')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={collapsedSections.has('counterparty') ? 'Expand section' : 'Collapse section'}
                        >
                          {collapsedSections.has('counterparty') ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
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
                                  <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                    <span>{trendValue}%</span>
                                  </div>
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
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Securities Needs</h2>
                  
                  {/* View Mode Controls */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {[
                        { key: 'critical-only', label: 'Critical Only', icon: AlertTriangle },
                        { key: 'overview', label: 'Overview', icon: BarChart3 },
                        { key: 'detailed', label: 'Detailed', icon: Activity }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setViewMode(key as any)}
                          className={cn(
                            "flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            viewMode === key
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
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
                  
                  {/* Bulk Action Buttons - Show when items are selected */}
                  {selectedSecurities.size > 0 && (
                    <>
                      <div className="h-6 w-px bg-gray-300"></div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">
                          {selectedSecurities.size} selected
                        </span>
                        <button 
                          className="fis-button-primary flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg"
                          onClick={() => {
                            const selectedNeeds = filteredAndSortedNeeds.filter(need => selectedSecurities.has(need.id))
                            handleBulkAction('borrow', selectedNeeds)
                          }}
                        >
                          <span>🔄</span>
                          <span>Borrow ({selectedSecurities.size})</span>
                        </button>
                        <button 
                          className="fis-button-secondary flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg"
                          onClick={() => {
                            const selectedNeeds = filteredAndSortedNeeds.filter(need => selectedSecurities.has(need.id))
                            handleBulkAction('recall', selectedNeeds)
                          }}
                        >
                          <span>📞</span>
                          <span>Recall ({selectedSecurities.size})</span>
                        </button>
                      </div>
                    </>
                  )}
                  
                  <button 
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => console.log('Filter functionality coming soon')}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                  <button 
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      // console.log('Exporting securities data...')
                      setTimeout(() => {
                        // console.log(`Exported ${filteredAndSortedNeeds.length} securities to CSV`)
                      }, 1000)
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              {/* Quick Filters Row */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">Quick Filters:</span>
                  <div className="flex space-x-2">
                    {filterPresets.map(preset => (
                      <button
                        key={preset.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          const filtered = securityNeeds.filter(preset.filter)
                          setSelectedSecurities(new Set(filtered.map(n => n.id)))
                        }}
                      >
                        {preset.label}
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {preset.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="fis-table-header">
                  <tr>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedSecurities.size === filteredAndSortedNeeds.length && filteredAndSortedNeeds.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllVisible()
                          } else {
                            clearSelection()
                          }
                        }}
                        className="rounded border-gray-300 text-fis-green focus:ring-fis-green"
                      />
                    </th>
                    <th className="px-2 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      
                    </th>
                    <th 
                      className="px-2 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('ticker')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>TICKER</span>
                        {sortColumn === 'ticker' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DESC
                    </th>
                    <th 
                      className="px-2 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>QUANTITY</span>
                        {sortColumn === 'quantity' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-2 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('marketValue')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>AMOUNT</span>
                        {sortColumn === 'marketValue' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NEED REASONS
                    </th>
                    <th 
                      className="px-2 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>PRIORITY</span>
                        {sortColumn === 'priority' && (
                          sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BORROW RATE
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedNeeds.map((need) => {
                    // Helper function to render compact need reasons
                    const renderNeedReasons = () => {
                      const reasons = []
                      if (need.needReasons.cnsDelivery) reasons.push({ type: 'CNS', value: need.needReasons.cnsDelivery, color: 'bg-red-100 text-red-700' })
                      if (need.needReasons.dvpDelivery) reasons.push({ type: 'DVP', value: need.needReasons.dvpDelivery, color: 'bg-orange-100 text-orange-700' })
                      if (need.needReasons.deficit) reasons.push({ type: 'REG', value: need.needReasons.deficit, color: 'bg-red-100 text-red-800' })
                      if (need.needReasons.customerShorts) reasons.push({ type: 'CUST', value: need.needReasons.customerShorts, color: 'bg-blue-100 text-blue-700' })
                      if (need.needReasons.nonCustomerShorts) reasons.push({ type: 'NON-CUST', value: need.needReasons.nonCustomerShorts, color: 'bg-purple-100 text-purple-700' })
                      if (need.needReasons.firmShorts) reasons.push({ type: 'FIRM', value: need.needReasons.firmShorts, color: 'bg-gray-100 text-gray-700' })
                      
                      return (
                        <div className="flex flex-wrap gap-1">
                          {reasons.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reason.color}`}>
                              <span className="font-semibold">{reason.type}</span>
                              <span className="ml-1">{formatNumber(reason.value || 0)}</span>
                            </div>
                          ))}
                          {reasons.length > 3 && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{reasons.length - 3}
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <React.Fragment key={need.id}>
                        <tr className={cn(
                          "hover:bg-gray-50 transition-colors border-b border-gray-100",
                          selectedSecurities.has(need.id) && "bg-blue-50"
                        )}>
                          <td className="px-2 py-1">
                            <input
                              type="checkbox"
                              checked={selectedSecurities.has(need.id)}
                              onChange={() => toggleSecuritySelection(need.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => toggleRowExpansion(need.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {expandedRows.has(need.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 transform -rotate-90" />
                              )}
                            </button>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 text-sm">{need.ticker}</span>
                              <span className="text-xs text-gray-500">{need.cusip}</span>
                              {need.is204CNS && (
                                <div className="relative">
                                  <span className="badge-204 animate-bounce-alert">
                                    204
                                  </span>
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                </div>
                              )}
                              {need.isRegulatory && (
                                <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0">REG</Badge>
                              )}
                              {need.agingDays > 3 && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0">
                                  {need.agingDays}d
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="text-sm text-gray-900 truncate max-w-48">
                              {need.description}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatNumber(need.quantity)} / {formatNumber(need.remainingQuantity)}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(need.marketValue)}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            {renderNeedReasons()}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <Badge className={cn("text-xs font-medium px-2 py-1", getPriorityColor(need.priority))}>
                              {need.priority}
                            </Badge>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {need.borrowRate.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      
                      {/* Expandable Details Row */}
                                              {expandedRows.has(need.id) && (
                          <tr className="bg-gray-50">
                                                        <td colSpan={9} className="px-4 py-3">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                {/* Need Breakdown & Progress */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <FileText className="w-4 h-4 mr-1" />
                                      Need Breakdown
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      {(need.needReasons.cnsDelivery || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">CNS Delivery:</span>
                                          <span className="font-medium text-red-600">{formatNumber(need.needReasons.cnsDelivery || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.dvpDelivery || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">DVP Delivery:</span>
                                          <span className="font-medium text-orange-600">{formatNumber(need.needReasons.dvpDelivery || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.deficit || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Deficit:</span>
                                          <span className="font-medium text-red-700">{formatNumber(need.needReasons.deficit || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.customerShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Customer:</span>
                                          <span className="font-medium text-blue-600">{formatNumber(need.needReasons.customerShorts || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.nonCustomerShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Non-Customer:</span>
                                          <span className="font-medium text-purple-600">{formatNumber(need.needReasons.nonCustomerShorts || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.firmShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Firm:</span>
                                          <span className="font-medium text-gray-600">{formatNumber(need.needReasons.firmShorts || 0)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-3 pt-2 border-t">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium">{((need.quantity - need.remainingQuantity) / need.quantity * 100).toFixed(1)}%</span>
                                      </div>
                                      <CureProgressBar need={need} />
                                    </div>
                                  </div>
                                </div>

                                {/* Actions & Status */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <Settings className="w-4 h-4 mr-1" />
                                      Quick Actions
                                    </h4>
                                    <div className="space-y-2">
                                      {/* Always show Borrow option */}
                                      <Button
                                        size="sm"
                                        onClick={() => handleQuickBorrow(need)}
                                        className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                                        variant="outline"
                                      >
                                        🔄 Borrow {formatNumber(need.remainingQuantity)}
                                      </Button>
                                      
                                      {/* Only show Recall if there's an outstanding loan */}
                                      {need.outstandingLoan && need.outstandingLoan > 0 && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleQuickRecall(need)}
                                          className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 h-8"
                                          variant="outline"
                                        >
                                          📞 Recall {formatNumber(need.outstandingLoan)}
                                        </Button>
                                      )}
                                      
                                      {/* Only show Release Pledge if there's an outstanding pledge */}
                                      {need.outstandingPledge && need.outstandingPledge > 0 && (
                                        <Button
                                          size="sm"
                                          className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50 h-8"
                                          variant="outline"
                                        >
                                          🔓 Release Pledge {formatNumber(need.outstandingPledge)}
                                        </Button>
                                      )}
                                      
                                      {/* Show if no existing positions available */}
                                      {(!need.outstandingLoan || need.outstandingLoan === 0) && (!need.outstandingPledge || need.outstandingPledge === 0) && (
                                        <div className="text-xs text-gray-500 italic py-2 px-3 bg-gray-50 rounded">
                                          No existing loans or pledges to recall/release
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Outstanding Positions Summary */}
                                    <div className="mt-3 pt-2 border-t text-xs">
                                      <div className="text-gray-700 font-medium mb-1">Outstanding Positions:</div>
                                      {need.outstandingLoan && need.outstandingLoan > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                          <span>On Loan:</span>
                                          <span className="font-medium text-orange-600">{formatNumber(need.outstandingLoan)}</span>
                                        </div>
                                      )}
                                      {need.outstandingPledge && need.outstandingPledge > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                          <span>Pledged:</span>
                                          <span className="font-medium text-purple-600">{formatNumber(need.outstandingPledge)}</span>
                                        </div>
                                      )}
                                      {(!need.outstandingLoan || need.outstandingLoan === 0) && (!need.outstandingPledge || need.outstandingPledge === 0) && (
                                        <div className="text-gray-500 text-xs">None</div>
                                      )}
                                      
                                      {/* Coverage Analysis */}
                                      {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) > 0 && (
                                        <div className="mt-2 pt-1 border-t border-gray-100">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">Available Coverage:</span>
                                            <span className={`font-medium ${
                                              ((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) >= need.remainingQuantity 
                                                ? 'text-green-600' 
                                                : 'text-yellow-600'
                                            }`}>
                                              {formatNumber((need.outstandingLoan || 0) + (need.outstandingPledge || 0))} / {formatNumber(need.remainingQuantity)}
                                            </span>
                                          </div>
                                          {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) >= need.remainingQuantity && (
                                            <div className="text-xs text-green-600 mt-1">✓ Sufficient to cover need</div>
                                          )}
                                          {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) < need.remainingQuantity && (
                                            <div className="text-xs text-yellow-600 mt-1">⚠ Partial coverage only</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Counterparty Availability */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <Users className="w-4 h-4 mr-1" />
                                      Availability
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Goldman:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-green-600">{formatNumber(Math.floor(need.remainingQuantity * 0.6))}</span>
                                          <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Morgan:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-green-600">{formatNumber(Math.floor(need.remainingQuantity * 0.3))}</span>
                                          <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">JPMorgan:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-yellow-600">{formatNumber(Math.floor(need.remainingQuantity * 0.1))}</span>
                                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1">~</Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                                      <div className="flex justify-between">
                                        <span>Rate Range:</span>
                                        <span>2.5% - 4.2%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Updated:</span>
                                        <span>2 min ago</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                        </tr>
                      )}
                    </React.Fragment>
                    )
                  })}
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

