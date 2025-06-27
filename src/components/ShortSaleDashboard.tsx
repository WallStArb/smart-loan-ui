import React, { useState, useEffect } from 'react'
import { 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Filter, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Clock,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Building,
  FileText,
  Shield,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Types for Short Sale data
interface ShortSalePosition {
  id: string
  ticker: string
  cusip: string
  description: string
  quantity: number
  marketValue: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  borrowRate: number
  borrowCost: number
  locateStatus: 'Located' | 'Hard-to-Borrow' | 'Easy-to-Borrow' | 'Unavailable'
  locateSource: string
  daysToSettle: number
  isRegSho: boolean
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  clientType: 'Institutional' | 'Retail' | 'Proprietary'
  sector: string
  lastUpdate: string
  expirationDate?: string
  utilizationRate: number
  availableShares: number
  hardToBorrowFee?: number
}

interface ShortSaleDashboardMetrics {
  totalPositions: number
  totalMarketValue: number
  totalUnrealizedPnL: number
  totalBorrowCost: number
  averageBorrowRate: number
  locateBreakdown: {
    located: number
    hardToBorrow: number
    easyToBorrow: number
    unavailable: number
  }
  clientBreakdown: {
    institutional: number
    retail: number
    proprietary: number
  }
  sectorExposure: Array<{
    sector: string
    value: number
    count: number
    averageRate: number
  }>
  riskMetrics: {
    concentrationRisk: number
    regShoPositions: number
    highCostPositions: number
    expiringLocates: number
  }
  dailyActivity: {
    newShorts: number
    covers: number
    locateRequests: number
    locateSuccessRate: number
  }
}

interface ShortSaleDashboardProps {
  onNavigateToParameters?: () => void
}

const ShortSaleDashboard: React.FC<ShortSaleDashboardProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('unrealizedPnL')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'risk-focused'>('overview')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  const [shortPositions, setShortPositions] = useState<ShortSalePosition[]>([])
  const [metrics, setMetrics] = useState<ShortSaleDashboardMetrics | null>(null)

  // Generate mock data
  const generateMockData = (): { positions: ShortSalePosition[], metrics: ShortSaleDashboardMetrics } => {
    const tickers = ['AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'CRM', 'V', 'BA', 'MCD', 'AXP', 'AMGN', 'IBM', 'TRV', 'JPM', 'HON', 'NKE', 'JNJ', 'WMT', 'PG']
    const descriptions = [
      'APPLE INC', 'MICROSOFT CORP', 'UNITEDHEALTH GROUP INC', 'GOLDMAN SACHS GROUP INC', 'HOME DEPOT INC',
      'CATERPILLAR INC', 'SALESFORCE INC', 'VISA INC-CLASS A', 'BOEING CO', 'MCDONALDS CORP',
      'AMERICAN EXPRESS CO', 'AMGEN INC', 'INTL BUSINESS MACHINES CORP', 'TRAVELERS COS INC', 'JPMORGAN CHASE & CO',
      'HONEYWELL INTERNATIONAL INC', 'NIKE INC-CLASS B', 'JOHNSON & JOHNSON', 'WALMART INC', 'PROCTER & GAMBLE CO'
    ]
    const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary', 'Industrials', 'Consumer Staples', 'Energy', 'Communication Services', 'Materials']
    const locateSources = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Internal Inventory', 'Bank of America', 'Citi', 'UBS', 'Barclays']
    const clientTypes: Array<'Institutional' | 'Retail' | 'Proprietary'> = ['Institutional', 'Retail', 'Proprietary']
    const locateStatuses: Array<'Located' | 'Hard-to-Borrow' | 'Easy-to-Borrow' | 'Unavailable'> = ['Located', 'Hard-to-Borrow', 'Easy-to-Borrow', 'Unavailable']

    const positions: ShortSalePosition[] = []
    let totalMarketValue = 0
    let totalUnrealizedPnL = 0
    let totalBorrowCost = 0

    const locateBreakdown = { located: 0, hardToBorrow: 0, easyToBorrow: 0, unavailable: 0 }
    const clientBreakdown = { institutional: 0, retail: 0, proprietary: 0 }
    const sectorMap = new Map<string, { value: number, count: number, totalRate: number }>()

    for (let i = 0; i < 25; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const sector = sectors[i % sectors.length]
      const locateSource = locateSources[i % locateSources.length]
      const clientType = clientTypes[i % clientTypes.length]
      const locateStatus = locateStatuses[Math.floor(Math.random() * locateStatuses.length)]
      
      const quantity = Math.floor(Math.random() * 10000) + 500
      const entryPrice = Math.random() * 300 + 50
      const currentPrice = entryPrice * (0.8 + Math.random() * 0.4) // ±20% price movement
      const marketValue = quantity * currentPrice
      const unrealizedPnL = quantity * (entryPrice - currentPrice)
      const borrowRate = Math.random() * 8 + 0.25
      const borrowCost = (marketValue * borrowRate) / 365
      const utilizationRate = Math.random() * 100
      const availableShares = Math.floor(quantity * (2 + Math.random() * 3))
      
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low'
      if (locateStatus === 'Unavailable' || (borrowRate > 6)) priority = 'Critical'
      else if (locateStatus === 'Hard-to-Borrow' || (borrowRate > 3)) priority = 'High'
      else if (utilizationRate > 80) priority = 'Medium'

      const position: ShortSalePosition = {
        id: `SHORT${(i + 1).toString().padStart(3, '0')}`,
        ticker,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description,
        quantity,
        marketValue,
        entryPrice,
        currentPrice,
        unrealizedPnL,
        borrowRate,
        borrowCost,
        locateStatus,
        locateSource,
        daysToSettle: Math.floor(Math.random() * 5) + 1,
        isRegSho: Math.random() > 0.8,
        priority,
        clientType,
        sector,
        lastUpdate: new Date().toLocaleTimeString(),
        utilizationRate,
        availableShares,
        hardToBorrowFee: borrowRate > 3 ? Math.random() * 1000 + 500 : undefined,
        expirationDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
      }

      positions.push(position)
      totalMarketValue += marketValue
      totalUnrealizedPnL += unrealizedPnL
      totalBorrowCost += borrowCost

      // Update breakdowns
      if (locateStatus === 'Located') locateBreakdown.located++
      else if (locateStatus === 'Hard-to-Borrow') locateBreakdown.hardToBorrow++
      else if (locateStatus === 'Easy-to-Borrow') locateBreakdown.easyToBorrow++
      else if (locateStatus === 'Unavailable') locateBreakdown.unavailable++

      if (clientType === 'Institutional') clientBreakdown.institutional++
      else if (clientType === 'Retail') clientBreakdown.retail++
      else if (clientType === 'Proprietary') clientBreakdown.proprietary++
      
      // Update sector breakdown
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { value: 0, count: 0, totalRate: 0 })
      }
      const sectorData = sectorMap.get(sector)!
      sectorData.value += marketValue
      sectorData.count++
      sectorData.totalRate += borrowRate
    }

    const sectorExposure = Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      count: data.count,
      averageRate: data.totalRate / data.count
    }))

    const metrics: ShortSaleDashboardMetrics = {
      totalPositions: positions.length,
      totalMarketValue,
      totalUnrealizedPnL,
      totalBorrowCost,
      averageBorrowRate: positions.reduce((sum, p) => sum + p.borrowRate, 0) / positions.length,
      locateBreakdown,
      clientBreakdown,
      sectorExposure,
      riskMetrics: {
        concentrationRisk: Math.max(...sectorExposure.map(s => s.value)) / totalMarketValue * 100,
        regShoPositions: positions.filter(p => p.isRegSho).length,
        highCostPositions: positions.filter(p => p.borrowRate > 5).length,
        expiringLocates: positions.filter(p => p.expirationDate && new Date(p.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
      },
      dailyActivity: {
        newShorts: Math.floor(Math.random() * 15) + 5,
        covers: Math.floor(Math.random() * 12) + 3,
        locateRequests: Math.floor(Math.random() * 25) + 10,
        locateSuccessRate: 85 + Math.random() * 10
      }
    }

    return { positions, metrics }
  }

  // Initialize data
  useEffect(() => {
    const { positions, metrics: newMetrics } = generateMockData()
    setShortPositions(positions)
    setMetrics(newMetrics)
  }, [])

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
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLocateStatusColor = (status: string) => {
    switch (status) {
      case 'Located':
        return 'bg-green-100 text-green-800'
      case 'Easy-to-Borrow':
        return 'bg-blue-100 text-blue-800'
      case 'Hard-to-Borrow':
        return 'bg-yellow-100 text-yellow-800'
      case 'Unavailable':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded-lg flex items-center justify-center shadow-sm">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Short Sale Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor and manage short sale positions</p>
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
              className="h-9 px-4"
            >
              <Settings className="w-4 h-4 mr-2" />
              Parameters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Positions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Positions</h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.totalPositions}</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Active
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Market Value: {formatCurrency(metrics.totalMarketValue)}
            </p>
          </div>

          {/* Unrealized P&L */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Unrealized P&L</h3>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-2xl font-bold",
                metrics.totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(metrics.totalUnrealizedPnL)}
              </span>
              {metrics.totalUnrealizedPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((metrics.totalUnrealizedPnL / metrics.totalMarketValue) * 100).toFixed(2)}% return
            </p>
          </div>

          {/* Borrow Costs */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Daily Borrow Cost</h3>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalBorrowCost)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg Rate: {metrics.averageBorrowRate.toFixed(2)}%
            </p>
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Risk Indicators</h3>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">RegSHO:</span>
                <span className="font-medium text-red-600">{metrics.riskMetrics.regShoPositions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">High Cost:</span>
                <span className="font-medium text-orange-600">{metrics.riskMetrics.highCostPositions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expiring:</span>
                <span className="font-medium text-yellow-600">{metrics.riskMetrics.expiringLocates}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Locate Status Breakdown */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Locate Status Breakdown</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.locateBreakdown.located}</div>
                <div className="text-sm text-gray-600">Located</div>
                <div className="text-xs text-gray-500 mt-1">Ready to trade</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.locateBreakdown.easyToBorrow}</div>
                <div className="text-sm text-gray-600">Easy-to-Borrow</div>
                <div className="text-xs text-gray-500 mt-1">Low cost</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{metrics.locateBreakdown.hardToBorrow}</div>
                <div className="text-sm text-gray-600">Hard-to-Borrow</div>
                <div className="text-xs text-gray-500 mt-1">Higher fees</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{metrics.locateBreakdown.unavailable}</div>
                <div className="text-sm text-gray-600">Unavailable</div>
                <div className="text-xs text-gray-500 mt-1">Cannot locate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Short Positions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="text"
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 h-9"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unrealized P&L
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locate Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrow Rate
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shortPositions.filter(position => 
                  position.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  position.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((position) => (
                  <tr key={position.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{position.ticker}</span>
                            {position.isRegSho && (
                              <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0">REG</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{position.cusip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(position.quantity)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(position.marketValue)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        "text-sm font-medium",
                        position.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(position.unrealizedPnL)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs font-medium px-2 py-1", getLocateStatusColor(position.locateStatus))}>
                        {position.locateStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {position.borrowRate.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs font-medium px-2 py-1", getPriorityColor(position.priority))}>
                        {position.priority}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShortSaleDashboard 