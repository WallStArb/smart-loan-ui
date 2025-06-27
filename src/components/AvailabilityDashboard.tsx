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

// Types for Availability data with real securities lending categories
interface SecurityAvailability {
  id: string
  ticker: string
  cusip: string
  description: string
  assetClass: 'Equity' | 'Corporate Bond' | 'Government Bond' | 'ETF' | 'Other'
  totalAvailable: number
  totalUtilized: number
  utilizationRate: number
  averageRate: number
  rateRange: { min: number; max: number }
  difficulty: 'GC' | 'Non-Interesting' | 'Warm' | 'Hard-to-Borrow'
  hasOpenBorrows: boolean
  hasOpenLoans: boolean
  // Smart Loan specific availability types
  availabilityBreakdown: {
    customer: number
    firm: number
    nonCustomer: number
    fpl: number // Full Paid Lending
    s3Potential: number // S3 substitution potential
  }
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
  // Smart Loan availability type totals
  availabilityTypeBreakdown: {
    customer: { total: number; securities: number }
    firm: { total: number; securities: number }
    nonCustomer: { total: number; securities: number }
    fpl: { total: number; securities: number }
    s3Potential: { total: number; securities: number }
  }
  assetClassBreakdown: {
    equity: { count: number; available: number; avgRate: number }
    corporateBond: { count: number; available: number; avgRate: number }
    governmentBond: { count: number; available: number; avgRate: number }
    etf: { count: number; available: number; avgRate: number }
    other: { count: number; available: number; avgRate: number }
  }
  difficultyBreakdown: {
    gc: { count: number; available: number; avgRate: number }
    nonInteresting: { count: number; available: number; avgRate: number }
    warm: { count: number; available: number; avgRate: number }
    hardToBorrow: { count: number; available: number; avgRate: number }
  }
  // S3 specific metrics
  s3Metrics: {
    substitutionOpportunities: number
    potentialRevenue: number
    hardSecuritiesWithS3: number
    warmSecuritiesWithS3: number
  }
  sourceBreakdown: Array<{
    counterparty: string
    totalAvailable: number
    averageRate: number
    activeSecurities: number
    reliability: number
  }>
  marketMetrics: {
    gcRate: number
    specialRate: number
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
  const [viewMode, setViewMode] = useState<'overview' | 'asset-class' | 'difficulty'>('overview')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  
  const [securities, setSecurities] = useState<SecurityAvailability[]>([])
  const [metrics, setMetrics] = useState<AvailabilityMetrics | null>(null)

  // Generate mock data with realistic securities lending rates
  const generateMockData = (): { securities: SecurityAvailability[], metrics: AvailabilityMetrics } => {
    const tickers = ['AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'CRM', 'V', 'BA', 'MCD', 'AXP', 'AMGN', 'IBM', 'TRV', 'JPM', 'HON', 'NKE', 'JNJ', 'WMT', 'PG', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'IWM', 'XLF', 'XLE']
    const descriptions = [
      'APPLE INC', 'MICROSOFT CORP', 'UNITEDHEALTH GROUP INC', 'GOLDMAN SACHS GROUP INC', 'HOME DEPOT INC',
      'CATERPILLAR INC', 'SALESFORCE INC', 'VISA INC-CLASS A', 'BOEING CO', 'MCDONALDS CORP',
      'AMERICAN EXPRESS CO', 'AMGEN INC', 'INTL BUSINESS MACHINES CORP', 'TRAVELERS COS INC', 'JPMORGAN CHASE & CO',
      'HONEYWELL INTERNATIONAL INC', 'NIKE INC-CLASS B', 'JOHNSON & JOHNSON', 'WALMART INC', 'PROCTER & GAMBLE CO',
      'NVIDIA CORP', 'TESLA INC', 'META PLATFORMS INC', 'ALPHABET INC-CL A', 'AMAZON.COM INC',
      'SPDR S&P 500 ETF', 'INVESCO QQQ TRUST', 'ISHARES RUSSELL 2000 ETF', 'FINANCIAL SELECT SECTOR SPDR', 'ENERGY SELECT SECTOR SPDR'
    ]
    const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary', 'Industrials', 'Consumer Staples', 'Energy', 'Communication Services', 'Materials', 'ETF']
    const counterparties = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citi', 'UBS', 'Barclays', 'Deutsche Bank', 'Credit Suisse', 'Wells Fargo']
    const assetClasses: Array<'Equity' | 'Corporate Bond' | 'Government Bond' | 'ETF' | 'Other'> = ['Equity', 'Corporate Bond', 'Government Bond', 'ETF', 'Other']
    const marketCaps: Array<'Large' | 'Mid' | 'Small' | 'Micro'> = ['Large', 'Mid', 'Small', 'Micro']
    const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable']

    const securities: SecurityAvailability[] = []
    const difficultyBreakdown = { 
      gc: { count: 0, available: 0, avgRate: 0 },
      nonInteresting: { count: 0, available: 0, avgRate: 0 },
      warm: { count: 0, available: 0, avgRate: 0 },
      hardToBorrow: { count: 0, available: 0, avgRate: 0 }
    }
    const assetClassBreakdown = {
      equity: { count: 0, available: 0, avgRate: 0 },
      corporateBond: { count: 0, available: 0, avgRate: 0 },
      governmentBond: { count: 0, available: 0, avgRate: 0 },
      etf: { count: 0, available: 0, avgRate: 0 },
      other: { count: 0, available: 0, avgRate: 0 }
    }
    const sourceMap = new Map<string, { totalAvailable: number, totalRate: number, count: number, activeSecurities: number }>()

    // GC Rate (General Collateral - Fed Funds Rate)
    const gcRate = 4.5

    for (let i = 0; i < 30; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const sector = sectors[i % sectors.length]
      let assetClass: 'Equity' | 'Corporate Bond' | 'Government Bond' | 'ETF' | 'Other' = 'Equity'
      
      // Determine asset class based on ticker
      if (ticker.includes('SPY') || ticker.includes('QQQ') || ticker.includes('IWM') || ticker.includes('XL')) {
        assetClass = 'ETF'
      } else if (Math.random() < 0.1) {
        assetClass = assetClasses[Math.floor(Math.random() * assetClasses.length)]
      }
      
      const marketCap = marketCaps[Math.floor(Math.random() * marketCaps.length)]
      
      const totalAvailable = Math.floor(Math.random() * 500000) + 50000
      const totalUtilized = Math.floor(totalAvailable * (0.1 + Math.random() * 0.7))
      const utilizationRate = (totalUtilized / totalAvailable) * 100
      
      const hasOpenBorrows = Math.random() > 0.3
      const hasOpenLoans = Math.random() > 0.4
      
      // Determine difficulty based on realistic securities lending categories
      let difficulty: 'GC' | 'Non-Interesting' | 'Warm' | 'Hard-to-Borrow'
      let averageRate: number
      
      const rand = Math.random()
      if (rand < 0.4) { // 40% GC
        difficulty = 'GC'
        averageRate = gcRate + (Math.random() - 0.5) * 0.5 // Around 4.5% ± 0.25%
      } else if (rand < 0.55) { // 15% Non-Interesting (GC but no open positions)
        difficulty = 'Non-Interesting'
        averageRate = gcRate + (Math.random() - 0.5) * 0.3 // Around GC rate
      } else if (rand < 0.8) { // 25% Warm
        difficulty = 'Warm'
        averageRate = Math.random() * 2 // 0% to 2%
      } else { // 20% Hard-to-Borrow
        difficulty = 'Hard-to-Borrow'
        averageRate = -2 - Math.random() * 3 // -2% to -5% (more negative = harder)
      }
      
      // For Non-Interesting, override to have no open positions
      if (difficulty === 'Non-Interesting') {
        hasOpenBorrows && Math.random() > 0.8 // Very few open borrows
        hasOpenLoans && Math.random() > 0.8 // Very few open loans
      }
      
      const rateVariance = Math.abs(averageRate) * 0.3
      const rateRange = {
        min: averageRate - rateVariance,
        max: averageRate + rateVariance
      }

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

      // Generate Smart Loan availability breakdown
      const customerAvail = Math.floor(totalAvailable * (0.2 + Math.random() * 0.3))
      const firmAvail = Math.floor(totalAvailable * (0.1 + Math.random() * 0.2))
      const nonCustomerAvail = Math.floor(totalAvailable * (0.15 + Math.random() * 0.25))
      const fplAvail = Math.floor(totalAvailable * (0.05 + Math.random() * 0.15))
      
      // S3 potential only for Hard-to-Borrow and Warm securities
      const s3Potential = (difficulty === 'Hard-to-Borrow' || difficulty === 'Warm') 
        ? Math.floor(totalAvailable * (0.1 + Math.random() * 0.3))
        : 0

      const security: SecurityAvailability = {
        id: `AVAIL${(i + 1).toString().padStart(3, '0')}`,
        ticker,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description,
        assetClass,
        totalAvailable,
        totalUtilized,
        utilizationRate,
        averageRate,
        rateRange,
        difficulty,
        hasOpenBorrows,
        hasOpenLoans,
        availabilityBreakdown: {
          customer: customerAvail,
          firm: firmAvail,
          nonCustomer: nonCustomerAvail,
          fpl: fplAvail,
          s3Potential
        },
        sources,
        priceVolatility: Math.random() * 30 + 5,
        sector,
        marketCap,
        lastUpdate: new Date().toLocaleTimeString(),
        trends: {
          availabilityTrend: trends[Math.floor(Math.random() * trends.length)],
          rateTrend: trends[Math.floor(Math.random() * trends.length)],
          demandTrend: trends[Math.floor(Math.random() * trends.length)]
        },
        alerts: Math.random() > 0.8 ? ['Rate Alert', 'Low Availability'] : undefined
      }

      securities.push(security)

      // Update difficulty breakdown
      const diffKey = difficulty === 'GC' ? 'gc' : 
                     difficulty === 'Non-Interesting' ? 'nonInteresting' : 
                     difficulty === 'Warm' ? 'warm' : 'hardToBorrow'
      difficultyBreakdown[diffKey].count++
      difficultyBreakdown[diffKey].available += totalAvailable
      difficultyBreakdown[diffKey].avgRate += averageRate

      // Update asset class breakdown
      const assetKey = assetClass === 'Equity' ? 'equity' :
                      assetClass === 'Corporate Bond' ? 'corporateBond' :
                      assetClass === 'Government Bond' ? 'governmentBond' :
                      assetClass === 'ETF' ? 'etf' : 'other'
      assetClassBreakdown[assetKey].count++
      assetClassBreakdown[assetKey].available += totalAvailable
      assetClassBreakdown[assetKey].avgRate += averageRate
    }

    // Calculate averages
    Object.values(difficultyBreakdown).forEach(item => {
      if (item.count > 0) item.avgRate = item.avgRate / item.count
    })
    Object.values(assetClassBreakdown).forEach(item => {
      if (item.count > 0) item.avgRate = item.avgRate / item.count
    })

    // Generate source breakdown
    const sourceBreakdown = Array.from(sourceMap.entries()).map(([counterparty, data]) => ({
      counterparty,
      totalAvailable: data.totalAvailable,
      averageRate: data.totalRate / data.count,
      activeSecurities: data.activeSecurities,
      reliability: 90 + Math.random() * 8 // 90-98%
    }))

    // Calculate availability type breakdown
    const availabilityTypeBreakdown = {
      customer: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.customer, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.customer > 0).length
      },
      firm: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.firm, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.firm > 0).length
      },
      nonCustomer: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.nonCustomer, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.nonCustomer > 0).length
      },
      fpl: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.fpl, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.fpl > 0).length
      },
      s3Potential: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.s3Potential, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.s3Potential > 0).length
      }
    }

    // Calculate S3 metrics
    const hardSecuritiesWithS3 = securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length
    const warmSecuritiesWithS3 = securities.filter(sec => sec.difficulty === 'Warm' && sec.availabilityBreakdown.s3Potential > 0).length
    const s3Metrics = {
      substitutionOpportunities: hardSecuritiesWithS3 + warmSecuritiesWithS3,
      potentialRevenue: securities
        .filter(sec => sec.availabilityBreakdown.s3Potential > 0)
        .reduce((sum, sec) => sum + (sec.availabilityBreakdown.s3Potential * Math.abs(sec.averageRate) * 0.01), 0),
      hardSecuritiesWithS3,
      warmSecuritiesWithS3
    }

    const metrics: AvailabilityMetrics = {
      totalSecurities: securities.length,
      totalAvailable: securities.reduce((sum, sec) => sum + sec.totalAvailable, 0),
      totalUtilized: securities.reduce((sum, sec) => sum + sec.totalUtilized, 0),
      overallUtilization: securities.reduce((sum, sec) => sum + sec.utilizationRate, 0) / securities.length,
      averageRate: securities.reduce((sum, sec) => sum + sec.averageRate, 0) / securities.length,
      availabilityTypeBreakdown,
      assetClassBreakdown,
      difficultyBreakdown,
      s3Metrics,
      sourceBreakdown: sourceBreakdown.sort((a, b) => b.totalAvailable - a.totalAvailable),
      marketMetrics: {
        gcRate,
        specialRate: -2.5, // Hard-to-borrow average
        tightestSecurities: securities.filter(sec => sec.utilizationRate > 80).length,
        highVolatilitySecurities: securities.filter(sec => sec.priceVolatility > 20).length,
        newSecurities: Math.floor(Math.random() * 5) + 2,
        expiringSources: Math.floor(Math.random() * 8) + 3
      },
      trends: {
        availabilityChange: (Math.random() - 0.5) * 10,
        rateChange: (Math.random() - 0.5) * 0.5,
        utilizationChange: (Math.random() - 0.5) * 5
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
      
      // Update some securities
      setSecurities(prev => prev.map(security => {
        if (Math.random() > 0.9) { // 10% chance to update
          const newUtilized = Math.max(0, security.totalUtilized + Math.floor((Math.random() - 0.5) * 1000))
          return {
            ...security,
            totalUtilized: Math.min(newUtilized, security.totalAvailable),
            utilizationRate: (Math.min(newUtilized, security.totalAvailable) / security.totalAvailable) * 100,
            lastUpdate: new Date().toLocaleTimeString()
          }
        }
        return security
      }))
    }, 5000)

    return () => clearInterval(interval)
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

  const formatRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'GC':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Non-Interesting':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'Warm':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Hard-to-Borrow':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'GC':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'Non-Interesting':
        return <Target className="w-4 h-4 text-gray-600" />
      case 'Warm':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'Hard-to-Borrow':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Target className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />
      case 'stable':
        return <ArrowUp className="w-3 h-3 text-gray-600 transform rotate-90" />
    }
  }

  const filteredSecurities = securities.filter(security => {
    const matchesSearch = security.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         security.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || 
                         security.difficulty === selectedFilter ||
                         security.assetClass === selectedFilter
    return matchesSearch && matchesFilter
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
              <h1 className="text-lg font-semibold text-gray-900">Securities Availability</h1>
              <p className="text-sm text-gray-600">Monitor lending availability and rates</p>
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
        {/* Key Rate Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">GC Rate (Fed Funds)</h3>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-600">{formatRate(metrics.marketMetrics.gcRate)}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">General Collateral</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.difficultyBreakdown.gc.count} securities
            </p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Special Rate</h3>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-600">{formatRate(metrics.marketMetrics.specialRate)}</span>
              <div className="flex items-center space-x-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600">Hard-to-Borrow</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.difficultyBreakdown.hardToBorrow.count} securities
            </p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Available</h3>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalAvailable)}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">{metrics.trends.availabilityChange.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatNumber(metrics.totalUtilized)} utilized
            </p>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Utilization Rate</h3>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.overallUtilization.toFixed(1)}%</span>
              <div className="flex items-center space-x-1">
                {metrics.trends.utilizationChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={`text-xs ${metrics.trends.utilizationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(metrics.trends.utilizationChange).toFixed(1)}%
                </span>
              </div>
            </div>
                          <p className="text-xs text-gray-500 mt-1">
                {metrics.marketMetrics.tightestSecurities} tight (&gt;80%)
            </p>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Securities Lending Categories */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Securities Lending Categories</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">GC (General Collateral)</div>
                    <div className="text-sm text-gray-600">Around Fed Funds Rate</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{metrics.difficultyBreakdown.gc.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.gc.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Non-Interesting</div>
                    <div className="text-sm text-gray-600">GC but no open borrows/loans</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">{metrics.difficultyBreakdown.nonInteresting.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.nonInteresting.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Warm</div>
                    <div className="text-sm text-gray-600">Between GC and HTB (≤2%)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{metrics.difficultyBreakdown.warm.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.warm.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Hard-to-Borrow</div>
                    <div className="text-sm text-gray-600">Negative rates (≤-2%)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{metrics.difficultyBreakdown.hardToBorrow.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.hardToBorrow.avgRate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Class Breakdown */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Class Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Equity</div>
                    <div className="text-sm text-gray-600">{formatNumber(metrics.assetClassBreakdown.equity.available)} available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{metrics.assetClassBreakdown.equity.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.equity.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">ETF</div>
                    <div className="text-sm text-gray-600">{formatNumber(metrics.assetClassBreakdown.etf.available)} available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{metrics.assetClassBreakdown.etf.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.etf.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Corporate Bond</div>
                    <div className="text-sm text-gray-600">{formatNumber(metrics.assetClassBreakdown.corporateBond.available)} available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{metrics.assetClassBreakdown.corporateBond.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.corporateBond.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-gray-900">Government Bond</div>
                    <div className="text-sm text-gray-600">{formatNumber(metrics.assetClassBreakdown.governmentBond.available)} available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{metrics.assetClassBreakdown.governmentBond.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.governmentBond.avgRate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Loan Availability Types */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Availability Type Breakdown */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Loan Availability Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Customer</div>
                    <div className="text-sm text-gray-600">{metrics.availabilityTypeBreakdown.customer.securities} securities</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{formatNumber(metrics.availabilityTypeBreakdown.customer.total)}</div>
                  <div className="text-xs text-gray-500">shares</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Firm</div>
                    <div className="text-sm text-gray-600">{metrics.availabilityTypeBreakdown.firm.securities} securities</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{formatNumber(metrics.availabilityTypeBreakdown.firm.total)}</div>
                  <div className="text-xs text-gray-500">shares</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Non-Customer</div>
                    <div className="text-sm text-gray-600">{metrics.availabilityTypeBreakdown.nonCustomer.securities} securities</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{formatNumber(metrics.availabilityTypeBreakdown.nonCustomer.total)}</div>
                  <div className="text-xs text-gray-500">shares</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">FPL (Full Paid)</div>
                    <div className="text-sm text-gray-600">{metrics.availabilityTypeBreakdown.fpl.securities} securities</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{formatNumber(metrics.availabilityTypeBreakdown.fpl.total)}</div>
                  <div className="text-xs text-gray-500">shares</div>
                </div>
              </div>
            </div>
          </div>

          {/* S3 Substitution Opportunities */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">S3 Substitution Potential</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {formatNumber(metrics.availabilityTypeBreakdown.s3Potential.total)}
                </div>
                <div className="text-sm text-gray-600">Total S3 Potential Shares</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.availabilityTypeBreakdown.s3Potential.securities} securities
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                  <div className="font-bold text-red-600 text-lg">{metrics.s3Metrics.hardSecuritiesWithS3}</div>
                  <div className="text-xs text-gray-600">Hard-to-Borrow with S3</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                  <div className="font-bold text-orange-600 text-lg">{metrics.s3Metrics.warmSecuritiesWithS3}</div>
                  <div className="text-xs text-gray-600">Warm with S3</div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Potential Revenue</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(metrics.s3Metrics.potentialRevenue)}/day
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  From {metrics.s3Metrics.substitutionOpportunities} substitution opportunities
                </div>
              </div>
            </div>
          </div>

          {/* Hard Securities with S3 Widget */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hard Securities - S3 Opportunities</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-3">
              {securities
                .filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0)
                .slice(0, 5)
                .map((security) => (
                  <div key={security.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{security.ticker}</div>
                      <div className="text-xs text-gray-600">
                        Rate: {formatRate(security.averageRate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600 text-sm">
                        {formatNumber(security.availabilityBreakdown.s3Potential)}
                      </div>
                      <div className="text-xs text-gray-500">S3 potential</div>
                    </div>
                  </div>
                ))}
              
              {securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    View All {securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length} Securities
                  </Button>
                </div>
              )}
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
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm h-9"
                >
                  <option value="all">All Categories</option>
                  <option value="GC">GC</option>
                  <option value="Non-Interesting">Non-Interesting</option>
                  <option value="Warm">Warm</option>
                  <option value="Hard-to-Borrow">Hard-to-Borrow</option>
                  <option value="Equity">Equity</option>
                  <option value="ETF">ETF</option>
                  <option value="Corporate Bond">Corporate Bond</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Availability Types</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activity</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sources</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSecurities.slice(0, 20).map((security) => (
                  <tr key={security.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{security.ticker}</span>
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0">{security.assetClass}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-48">{security.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {getDifficultyIcon(security.difficulty)}
                        <Badge className={cn("text-xs font-medium px-2 py-1", getDifficultyColor(security.difficulty))}>
                          {security.difficulty}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-gray-900">{formatNumber(security.totalAvailable)}</div>
                      <div className="text-xs text-gray-500">{formatNumber(security.totalUtilized)} used</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {security.availabilityBreakdown.customer > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0">
                            C:{formatNumber(security.availabilityBreakdown.customer)}
                          </Badge>
                        )}
                        {security.availabilityBreakdown.firm > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0">
                            F:{formatNumber(security.availabilityBreakdown.firm)}
                          </Badge>
                        )}
                        {security.availabilityBreakdown.nonCustomer > 0 && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0">
                            NC:{formatNumber(security.availabilityBreakdown.nonCustomer)}
                          </Badge>
                        )}
                        {security.availabilityBreakdown.fpl > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0">
                            FPL:{formatNumber(security.availabilityBreakdown.fpl)}
                          </Badge>
                        )}
                        {security.availabilityBreakdown.s3Potential > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0 font-bold">
                            S3:{formatNumber(security.availabilityBreakdown.s3Potential)}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        "font-medium",
                        security.averageRate < 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {formatRate(security.averageRate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRate(security.rateRange.min)} - {formatRate(security.rateRange.max)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              security.utilizationRate > 80 ? "bg-red-500" :
                              security.utilizationRate > 60 ? "bg-orange-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${Math.min(security.utilizationRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {security.utilizationRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {security.hasOpenBorrows && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0">B</Badge>
                        )}
                        {security.hasOpenLoans && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0">L</Badge>
                        )}
                        {!security.hasOpenBorrows && !security.hasOpenLoans && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">{security.sources.length}</span>
                        <span className="text-xs text-gray-500">CPs</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(security.trends.availabilityTrend)}
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