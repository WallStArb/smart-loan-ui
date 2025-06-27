import React, { useState, useEffect } from 'react'
import { 
  Target, 
  TrendingUp, 
  Search, 
  Filter, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Clock,
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
  Settings,
  Zap,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Types for Availability data
interface SecurityAvailability {
  id: string
  ticker: string
  cusip: string
  description: string
  totalAvailable: number
  totalUtilized: number
  utilizationRate: number
  averageRate: number
  rateRange: { min: number; max: number }
  difficulty: 'Easy-to-Borrow' | 'Moderate' | 'Hard-to-Borrow' | 'Special'
  sources: Array<{
    counterparty: string
    available: number
    rate: number
    minQuantity: number
    lastUpdated: string
    isActive: boolean
  }>
  priceVolatility: number
  sector: string
  marketCap: 'Large' | 'Mid' | 'Small' | 'Micro'
  lastUpdate: string
  trends: {
    availabilityTrend: 'up' | 'down' | 'stable'
    rateTrend: 'up' | 'down' | 'stable'
    demandTrend: 'up' | 'down' | 'stable'
  }
  alerts?: string[]
}

interface AvailabilityMetrics {
  totalSecurities: number
  totalAvailable: number
  totalUtilized: number
  overallUtilization: number
  averageRate: number
  difficultiesBreakdown: {
    easyToBorrow: number
    moderate: number
    hardToBorrow: number
    special: number
  }
  sourceBreakdown: Array<{
    counterparty: string
    totalAvailable: number
    averageRate: number
    activeSecurities: number
    reliability: number
  }>
  marketMetrics: {
    tightestSecurities: number
    highVolatilitySecurities: number
    newSecurities: number
    expiringSources: number
  }
  trends: {
    availabilityChange: number
    rateChange: number
    utilizationChange: number
  }
}

interface AvailabilityDashboardProps {
  onNavigateToParameters?: () => void
}

const AvailabilityDashboard: React.FC<AvailabilityDashboardProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'counterparty'>('overview')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  
  const [securities, setSecurities] = useState<SecurityAvailability[]>([])
  const [metrics, setMetrics] = useState<AvailabilityMetrics | null>(null)

  // Generate mock data
  const generateMockData = (): { securities: SecurityAvailability[], metrics: AvailabilityMetrics } => {
    const tickers = ['AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'CRM', 'V', 'BA', 'MCD', 'AXP', 'AMGN', 'IBM', 'TRV', 'JPM', 'HON', 'NKE', 'JNJ', 'WMT', 'PG', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN']
    const descriptions = [
      'APPLE INC', 'MICROSOFT CORP', 'UNITEDHEALTH GROUP INC', 'GOLDMAN SACHS GROUP INC', 'HOME DEPOT INC',
      'CATERPILLAR INC', 'SALESFORCE INC', 'VISA INC-CLASS A', 'BOEING CO', 'MCDONALDS CORP',
      'AMERICAN EXPRESS CO', 'AMGEN INC', 'INTL BUSINESS MACHINES CORP', 'TRAVELERS COS INC', 'JPMORGAN CHASE & CO',
      'HONEYWELL INTERNATIONAL INC', 'NIKE INC-CLASS B', 'JOHNSON & JOHNSON', 'WALMART INC', 'PROCTER & GAMBLE CO',
      'NVIDIA CORP', 'TESLA INC', 'META PLATFORMS INC', 'ALPHABET INC-CL A', 'AMAZON.COM INC'
    ]
    const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary', 'Industrials', 'Consumer Staples', 'Energy', 'Communication Services', 'Materials']
    const counterparties = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citi', 'UBS', 'Barclays', 'Deutsche Bank', 'Credit Suisse', 'Wells Fargo']
    const difficulties: Array<'Easy-to-Borrow' | 'Moderate' | 'Hard-to-Borrow' | 'Special'> = ['Easy-to-Borrow', 'Moderate', 'Hard-to-Borrow', 'Special']
    const marketCaps: Array<'Large' | 'Mid' | 'Small' | 'Micro'> = ['Large', 'Mid', 'Small', 'Micro']
    const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable']

    const securities: SecurityAvailability[] = []
    const difficultiesBreakdown = { easyToBorrow: 0, moderate: 0, hardToBorrow: 0, special: 0 }
    const sourceMap = new Map<string, { totalAvailable: number, totalRate: number, count: number, activeSecurities: number }>()

    for (let i = 0; i < 30; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const sector = sectors[i % sectors.length]
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]
      const marketCap = marketCaps[Math.floor(Math.random() * marketCaps.length)]
      
      const totalAvailable = Math.floor(Math.random() * 500000) + 50000
      const totalUtilized = Math.floor(totalAvailable * (0.1 + Math.random() * 0.7))
      const utilizationRate = (totalUtilized / totalAvailable) * 100
      
      // Generate rate based on difficulty
      let baseRate = 0.5
      switch (difficulty) {
        case 'Easy-to-Borrow': baseRate = 0.5 + Math.random() * 1.5; break
        case 'Moderate': baseRate = 2 + Math.random() * 2; break
        case 'Hard-to-Borrow': baseRate = 4 + Math.random() * 3; break
        case 'Special': baseRate = 7 + Math.random() * 5; break
      }
      
      const rateVariance = baseRate * 0.3
      const rateRange = {
        min: Math.max(0.1, baseRate - rateVariance),
        max: baseRate + rateVariance
      }
      const averageRate = (rateRange.min + rateRange.max) / 2

      // Generate sources
      const numSources = Math.floor(Math.random() * 6) + 2
      const sources = []
      for (let j = 0; j < numSources; j++) {
        const counterparty = counterparties[j % counterparties.length]
        const available = Math.floor(totalAvailable * (0.1 + Math.random() * 0.4))
        const rate = rateRange.min + Math.random() * (rateRange.max - rateRange.min)
        const isActive = Math.random() > 0.1 // 90% chance of being active
        
        sources.push({
          counterparty,
          available,
          rate,
          minQuantity: Math.floor(Math.random() * 1000) + 100,
          lastUpdated: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
          isActive
        })

        // Update source breakdown
        if (!sourceMap.has(counterparty)) {
          sourceMap.set(counterparty, { totalAvailable: 0, totalRate: 0, count: 0, activeSecurities: 0 })
        }
        const sourceData = sourceMap.get(counterparty)!
        sourceData.totalAvailable += available
        sourceData.totalRate += rate
        sourceData.count++
        if (isActive) sourceData.activeSecurities++
      }

      const security: SecurityAvailability = {
        id: `AVAIL${(i + 1).toString().padStart(3, '0')}`,
        ticker,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description,
        totalAvailable,
        totalUtilized,
        utilizationRate,
        averageRate,
        rateRange,
        difficulty,
        sources,
        priceVolatility: Math.random() * 50 + 10,
        sector,
        marketCap,
        lastUpdate: new Date().toLocaleTimeString(),
        trends: {
          availabilityTrend: trends[Math.floor(Math.random() * trends.length)],
          rateTrend: trends[Math.floor(Math.random() * trends.length)],
          demandTrend: trends[Math.floor(Math.random() * trends.length)]
        },
        alerts: Math.random() > 0.8 ? ['Low availability', 'Rate increase'] : undefined
      }

      securities.push(security)

      // Update difficulty breakdown
      if (difficulty === 'Easy-to-Borrow') difficultiesBreakdown.easyToBorrow++
      else if (difficulty === 'Moderate') difficultiesBreakdown.moderate++
      else if (difficulty === 'Hard-to-Borrow') difficultiesBreakdown.hardToBorrow++
      else if (difficulty === 'Special') difficultiesBreakdown.special++
    }

    const sourceBreakdown = Array.from(sourceMap.entries()).map(([counterparty, data]) => ({
      counterparty,
      totalAvailable: data.totalAvailable,
      averageRate: data.totalRate / data.count,
      activeSecurities: data.activeSecurities,
      reliability: (data.activeSecurities / data.count) * 100
    }))

    const totalAvailable = securities.reduce((sum, s) => sum + s.totalAvailable, 0)
    const totalUtilized = securities.reduce((sum, s) => sum + s.totalUtilized, 0)

    const metrics: AvailabilityMetrics = {
      totalSecurities: securities.length,
      totalAvailable,
      totalUtilized,
      overallUtilization: (totalUtilized / totalAvailable) * 100,
      averageRate: securities.reduce((sum, s) => sum + s.averageRate, 0) / securities.length,
      difficultiesBreakdown,
      sourceBreakdown,
      marketMetrics: {
        tightestSecurities: securities.filter(s => s.utilizationRate > 80).length,
        highVolatilitySecurities: securities.filter(s => s.priceVolatility > 30).length,
        newSecurities: Math.floor(Math.random() * 8) + 2,
        expiringSources: Math.floor(Math.random() * 5) + 1
      },
      trends: {
        availabilityChange: (Math.random() - 0.5) * 10,
        rateChange: (Math.random() - 0.5) * 2,
        utilizationChange: (Math.random() - 0.5) * 15
      }
    }

    return { securities, metrics }
  }

  // Initialize data
  useEffect(() => {
    const { securities: newSecurities, metrics: newMetrics } = generateMockData()
    setSecurities(newSecurities)
    setMetrics(newMetrics)
  }, [])

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      
      // Update some securities with new availability/rates
      setSecurities(prev => prev.map(security => {
        if (Math.random() > 0.9) { // 10% chance to update
          const availabilityChange = (Math.random() - 0.5) * 0.1 // ±5% change
          const rateChange = (Math.random() - 0.5) * 0.2 // ±10% rate change
          
          return {
            ...security,
            totalAvailable: Math.max(10000, Math.floor(security.totalAvailable * (1 + availabilityChange))),
            averageRate: Math.max(0.1, security.averageRate * (1 + rateChange)),
            lastUpdate: new Date().toLocaleTimeString()
          }
        }
        return security
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy-to-Borrow':
        return 'bg-green-100 text-green-800'
      case 'Moderate':
        return 'bg-blue-100 text-blue-800'
      case 'Hard-to-Borrow':
        return 'bg-yellow-100 text-yellow-800'
      case 'Special':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />
      case 'stable':
        return <div className="w-3 h-0.5 bg-gray-400 rounded" />
    }
  }

  const filteredSecurities = securities.filter(security => {
    const matchesSearch = security.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         security.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = selectedDifficulty === 'all' || security.difficulty === selectedDifficulty
    return matchesSearch && matchesDifficulty
  })

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded-lg flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Availability Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor securities availability and borrowing capacity</p>
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
          {/* Total Available */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Available</h3>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalAvailable)}</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon('up')}
                <span className="text-xs text-green-600">+{metrics.trends.availabilityChange.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalSecurities} securities tracked
            </p>
          </div>

          {/* Overall Utilization */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Utilization Rate</h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.overallUtilization.toFixed(1)}%</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon('down')}
                <span className="text-xs text-red-600">{metrics.trends.utilizationChange.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatNumber(metrics.totalUtilized)} shares utilized
            </p>
          </div>

          {/* Average Rate */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Average Rate</h3>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.averageRate.toFixed(2)}%</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon('up')}
                <span className="text-xs text-red-600">+{metrics.trends.rateChange.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all tracked securities
            </p>
          </div>

          {/* Market Alerts */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Market Alerts</h3>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tight Securities:</span>
                <span className="font-medium text-orange-600">{metrics.marketMetrics.tightestSecurities}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">High Volatility:</span>
                <span className="font-medium text-red-600">{metrics.marketMetrics.highVolatilitySecurities}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expiring Sources:</span>
                <span className="font-medium text-yellow-600">{metrics.marketMetrics.expiringSources}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Securities by Difficulty</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.difficultiesBreakdown.easyToBorrow}</div>
                <div className="text-sm text-gray-600">Easy-to-Borrow</div>
                <div className="text-xs text-gray-500 mt-1">0.5% - 2.0% rates</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.difficultiesBreakdown.moderate}</div>
                <div className="text-sm text-gray-600">Moderate</div>
                <div className="text-xs text-gray-500 mt-1">2.0% - 4.0% rates</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{metrics.difficultiesBreakdown.hardToBorrow}</div>
                <div className="text-sm text-gray-600">Hard-to-Borrow</div>
                <div className="text-xs text-gray-500 mt-1">4.0% - 7.0% rates</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{metrics.difficultiesBreakdown.special}</div>
                <div className="text-sm text-gray-600">Special</div>
                <div className="text-xs text-gray-500 mt-1">7.0%+ rates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Securities Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Securities Availability</h2>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy-to-Borrow">Easy-to-Borrow</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Hard-to-Borrow">Hard-to-Borrow</option>
                  <option value="Special">Special</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Search securities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 h-9"
                  />
                </div>
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
                    Available
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate Range
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sources
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trends
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSecurities.map((security) => (
                  <tr key={security.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{security.ticker}</span>
                            {security.alerts && security.alerts.length > 0 && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{security.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(security.totalAvailable)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(security.totalUtilized)} used
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              security.utilizationRate > 80 ? "bg-red-500" :
                              security.utilizationRate > 60 ? "bg-yellow-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${Math.min(security.utilizationRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {security.utilizationRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {security.rateRange.min.toFixed(2)}% - {security.rateRange.max.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {security.averageRate.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs font-medium px-2 py-1", getDifficultyColor(security.difficulty))}>
                        {security.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {security.sources.filter(s => s.isActive).length} / {security.sources.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        Active sources
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(security.trends.availabilityTrend)}
                          <span className="text-xs text-gray-500">Avail</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(security.trends.rateTrend)}
                          <span className="text-xs text-gray-500">Rate</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(security.trends.demandTrend)}
                          <span className="text-xs text-gray-500">Demand</span>
                        </div>
                      </div>
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

export default AvailabilityDashboard 