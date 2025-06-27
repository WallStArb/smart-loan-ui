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
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  TrendingDown,
  Minus
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
  currentPrice: number
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
    customer: { total: number; securities: number; totalValue: number }
    firm: { total: number; securities: number; totalValue: number }
    nonCustomer: { total: number; securities: number; totalValue: number }
    fpl: { total: number; securities: number; totalValue: number }
    s3Potential: { total: number; securities: number; totalValue: number }
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
  const [selectedTicker, setSelectedTicker] = useState<string>('')
  
  const [securities, setSecurities] = useState<SecurityAvailability[]>([])
  const [metrics, setMetrics] = useState<AvailabilityMetrics | null>(null)
  const [showAllS3Opportunities, setShowAllS3Opportunities] = useState(false)

  // Generate mock data with realistic securities lending rates
  const generateMockData = (): { securities: SecurityAvailability[], metrics: AvailabilityMetrics } => {
    const tickers = ['AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'CAT', 'CRM', 'V', 'BA', 'MCD', 'AXP', 'AMGN', 'IBM', 'TRV', 'JPM', 'HON', 'NKE', 'JNJ', 'WMT', 'PG', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'IWM', 'XLF', 'XLE', 'INTC', 'CSCO', 'ADBE', 'PFE', 'KO', 'VZ', 'DIS', 'NFLX', 'CRM', 'PYPL', 'UBER', 'ABNB', 'COIN', 'ROKU', 'SQ', 'SHOP', 'SPOT', 'DOCU', 'ZOOM', 'SNOW', 'PLTR', 'RBLX', 'RIVN', 'LCID', 'AMC', 'GME', 'MEME', 'SPCE', 'TLRY', 'SNDL']
    const descriptions = [
      'APPLE INC', 'MICROSOFT CORP', 'UNITEDHEALTH GROUP INC', 'GOLDMAN SACHS GROUP INC', 'HOME DEPOT INC',
      'CATERPILLAR INC', 'SALESFORCE INC', 'VISA INC-CLASS A', 'BOEING CO', 'MCDONALDS CORP',
      'AMERICAN EXPRESS CO', 'AMGEN INC', 'INTL BUSINESS MACHINES CORP', 'TRAVELERS COS INC', 'JPMORGAN CHASE & CO',
      'HONEYWELL INTERNATIONAL INC', 'NIKE INC-CLASS B', 'JOHNSON & JOHNSON', 'WALMART INC', 'PROCTER & GAMBLE CO',
      'NVIDIA CORP', 'TESLA INC', 'META PLATFORMS INC', 'ALPHABET INC-CL A', 'AMAZON.COM INC',
      'SPDR S&P 500 ETF', 'INVESCO QQQ TRUST', 'ISHARES RUSSELL 2000 ETF', 'FINANCIAL SELECT SECTOR SPDR', 'ENERGY SELECT SECTOR SPDR',
      'INTEL CORP', 'CISCO SYSTEMS INC', 'ADOBE INC', 'PFIZER INC', 'COCA-COLA CO', 'VERIZON COMMUNICATIONS', 'WALT DISNEY CO', 'NETFLIX INC', 'SALESFORCE INC', 'PAYPAL HOLDINGS',
      'UBER TECHNOLOGIES', 'AIRBNB INC', 'COINBASE GLOBAL', 'ROKU INC', 'BLOCK INC', 'SHOPIFY INC', 'SPOTIFY TECHNOLOGY', 'DOCUSIGN INC', 'ZOOM VIDEO COMMUNICATIONS', 'SNOWFLAKE INC',
      'PALANTIR TECHNOLOGIES', 'ROBLOX CORP', 'RIVIAN AUTOMOTIVE', 'LUCID GROUP INC', 'AMC ENTERTAINMENT', 'GAMESTOP CORP', 'MEME STOCK CORP', 'VIRGIN GALACTIC', 'TILRAY BRANDS', 'SUNDIAL GROWERS'
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

    for (let i = 0; i < 60; i++) {
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
      const currentPrice = 50 + Math.random() * 300 // Stock price between $50-$350
      
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
        currentPrice,
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
        securities: securities.filter(sec => sec.availabilityBreakdown.customer > 0).length,
        totalValue: securities.reduce((sum, sec) => sum + (sec.availabilityBreakdown.customer * sec.currentPrice), 0)
      },
      firm: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.firm, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.firm > 0).length,
        totalValue: securities.reduce((sum, sec) => sum + (sec.availabilityBreakdown.firm * sec.currentPrice), 0)
      },
      nonCustomer: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.nonCustomer, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.nonCustomer > 0).length,
        totalValue: securities.reduce((sum, sec) => sum + (sec.availabilityBreakdown.nonCustomer * sec.currentPrice), 0)
      },
      fpl: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.fpl, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.fpl > 0).length,
        totalValue: securities.reduce((sum, sec) => sum + (sec.availabilityBreakdown.fpl * sec.currentPrice), 0)
      },
      s3Potential: { 
        total: securities.reduce((sum, sec) => sum + sec.availabilityBreakdown.s3Potential, 0),
        securities: securities.filter(sec => sec.availabilityBreakdown.s3Potential > 0).length,
        totalValue: securities.reduce((sum, sec) => sum + (sec.availabilityBreakdown.s3Potential * sec.currentPrice), 0)
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
    const matchesTicker = selectedTicker === '' || security.ticker === selectedTicker
    return matchesSearch && matchesFilter && matchesTicker
  })

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient">
      {/* Compact Header */}
      <div className="max-w-full mx-auto mb-2 px-2">
        <div className="flex items-center justify-between p-2 bg-white rounded shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Securities Availability</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-fis-green-50 text-fis-green border-fis-green px-2 py-0.5 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
            <div className="w-1.5 h-1.5 bg-fis-green rounded-full animate-pulse"></div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateToParameters?.()}
              className="h-6 px-2 text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Config
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto">
        {/* Key Rate Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 px-2">
          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-xs font-medium text-gray-500">GC Rate</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-green-600">{formatRate(metrics.marketMetrics.gcRate)}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.difficultyBreakdown.gc.count} secs</div>
              </div>
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-gray-500">HTB Rate</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-red-600">{formatRate(metrics.marketMetrics.specialRate)}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.difficultyBreakdown.hardToBorrow.count} secs</div>
              </div>
              <TrendingDown className="w-3 h-3 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Building className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-gray-500">Internal Avail</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">{formatNumber(metrics.totalAvailable / 1000)}K</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatNumber(metrics.totalUtilized / 1000)}K used</div>
              </div>
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-medium text-gray-500">External Avail</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">
                  {formatNumber(metrics.sourceBreakdown.reduce((sum, s) => sum + s.totalAvailable, 0) / 1000)}K
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.sourceBreakdown.length} sources</div>
              </div>
              <BarChart3 className="w-3 h-3 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-gray-500">Utilization</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">{metrics.overallUtilization.toFixed(1)}%</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.marketMetrics.tightestSecurities} tight</div>
              </div>
              {metrics.trends.utilizationChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Total Secs</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">{metrics.totalSecurities}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">monitored</div>
              </div>
              <Target className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="flex flex-col lg:flex-row gap-3 mb-3 w-full px-2">
          {/* Securities Lending Categories */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Lending Categories</h3>
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('GC')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by GC securities"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">GC</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-green-600">{metrics.difficultyBreakdown.gc.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.gc.avgRate)}</div>
                </div>
              </div>

              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('Non-Interesting')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by Non-Interesting securities"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-900">Non-Int</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-gray-600">{metrics.difficultyBreakdown.nonInteresting.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.nonInteresting.avgRate)}</div>
                </div>
              </div>

              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('Warm')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by Warm securities"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-900">Warm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-orange-600">{metrics.difficultyBreakdown.warm.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.warm.avgRate)}</div>
                </div>
              </div>

              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-red-50 rounded border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('Hard-to-Borrow')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by Hard-to-Borrow securities"
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-medium text-gray-900">HTB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-red-600">{metrics.difficultyBreakdown.hardToBorrow.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.difficultyBreakdown.hardToBorrow.avgRate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Class Breakdown */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Asset Classes</h3>
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('Equity')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by Equity securities"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">Equity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-blue-600">{metrics.assetClassBreakdown.equity.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.equity.avgRate)}</div>
                </div>
              </div>

              <div 
                className="flex items-center justify-between px-1.5 py-1 bg-purple-50 rounded border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => {
                  setSelectedFilter('ETF')
                  setSelectedTicker('')
                  setSearchTerm('')
                }}
                title="Click to filter by ETF securities"
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-gray-900">ETF</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-purple-600">{metrics.assetClassBreakdown.etf.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.etf.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                <div className="flex items-center space-x-2">
                  <Shield className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">Corp Bond</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-green-600">{metrics.assetClassBreakdown.corporateBond.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.corporateBond.avgRate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 bg-yellow-50 rounded border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-gray-900">Gov Bond</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-yellow-600">{metrics.assetClassBreakdown.governmentBond.count}</div>
                  <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.governmentBond.avgRate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Anticipated Availability */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Anticipated Availability</h3>
            <div className="space-y-1">
              {/* Recalls Pending */}
              <div className="flex items-center justify-between px-1.5 py-1 bg-red-50 rounded border border-red-200">
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-medium text-gray-900">Recalls Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-red-600">-{formatNumber(Math.floor(Math.random() * 500 + 200))}K</div>
                  <div className="text-xs text-red-500">Today</div>
                </div>
              </div>

              {/* Anticipated Receives */}
              <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">Anticipated Receives</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-green-600">+{formatNumber(Math.floor(Math.random() * 800 + 300))}K</div>
                  <div className="text-xs text-green-500">T+1</div>
                </div>
              </div>

              {/* Pledge Recalls */}
              <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Shield className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-900">Pledge Recalls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-orange-600">-{formatNumber(Math.floor(Math.random() * 300 + 100))}K</div>
                  <div className="text-xs text-orange-500">T+2</div>
                </div>
              </div>

              {/* Net Change Summary */}
              <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">Net Change</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-blue-600">+{formatNumber(Math.floor(Math.random() * 200 + 50))}K</div>
                  <div className="text-xs text-blue-500">3D</div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Trends */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Availability Trends</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-green-50 to-green-100 rounded border border-green-200">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">Low Util (0-25%)</span>
                </div>
                <div className="text-xs font-bold text-green-600">{securities.filter(s => s.utilizationRate <= 25).length} secs</div>
              </div>

              <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Minus className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-gray-900">Mod Util (25-50%)</span>
                </div>
                <div className="text-xs font-bold text-yellow-600">{securities.filter(s => s.utilizationRate > 25 && s.utilizationRate <= 50).length} secs</div>
              </div>

              <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded border border-orange-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-900">High Util (50-75%)</span>
                </div>
                <div className="text-xs font-bold text-orange-600">{securities.filter(s => s.utilizationRate > 50 && s.utilizationRate <= 75).length} secs</div>
              </div>

              <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-red-50 to-red-100 rounded border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-medium text-gray-900">Critical (75%+)</span>
                </div>
                <div className="text-xs font-bold text-red-600">{securities.filter(s => s.utilizationRate > 75).length} secs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Loan Availability Types */}
        <div className="flex flex-col lg:flex-row gap-2 mb-3 w-full px-2">
          {/* Internal Availability Breakdown */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Availability</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">Customer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-blue-600">{formatNumber(metrics.availabilityTypeBreakdown.customer.total / 1000)}K</div>
                  <div className="text-xs text-blue-700">{formatCurrency(metrics.availabilityTypeBreakdown.customer.totalValue / 1000000)}M</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 bg-purple-50 rounded border border-purple-200">
                <div className="flex items-center space-x-1">
                  <Building className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-gray-900">Firm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-purple-600">{formatNumber(metrics.availabilityTypeBreakdown.firm.total / 1000)}K</div>
                  <div className="text-xs text-purple-700">{formatCurrency(metrics.availabilityTypeBreakdown.firm.totalValue / 1000000)}M</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-900">Non-Cust</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-orange-600">{formatNumber(metrics.availabilityTypeBreakdown.nonCustomer.total / 1000)}K</div>
                  <div className="text-xs text-orange-700">{formatCurrency(metrics.availabilityTypeBreakdown.nonCustomer.totalValue / 1000000)}M</div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-900">FPL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-green-600">{formatNumber(metrics.availabilityTypeBreakdown.fpl.total / 1000)}K</div>
                  <div className="text-xs text-green-700">{formatCurrency(metrics.availabilityTypeBreakdown.fpl.totalValue / 1000000)}M</div>
                </div>
              </div>
            </div>
          </div>

          {/* External Counterparty Availability */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">External Sources</h3>
            <div className="space-y-1">
              {metrics.sourceBreakdown.slice(0, 3).map((source, idx) => (
                <div key={source.counterparty} className="flex items-center justify-between px-1.5 py-1 bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      source.reliability > 95 ? 'bg-green-500' : 
                      source.reliability > 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs font-medium text-gray-900">{source.counterparty}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-gray-700">{formatNumber(source.totalAvailable / 1000)}K</div>
                    <div className="text-xs text-gray-600">{formatCurrency(source.totalAvailable * 150 / 1000000)}M</div>
                  </div>
                </div>
              ))}
              
              {/* Total External Summary */}
              <div className="mt-2 pt-1 border-t border-gray-200">
                <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded">
                  <span className="text-xs font-medium text-gray-900">Total External</span>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-blue-700">
                      {formatNumber(metrics.sourceBreakdown.reduce((sum, s) => sum + s.totalAvailable, 0) / 1000)}K
                    </div>
                    <div className="text-xs text-blue-600">
                      {formatCurrency(metrics.sourceBreakdown.reduce((sum, s) => sum + s.totalAvailable, 0) * 150 / 1000000)}M
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S3 Substitution Opportunities */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">S3 Substitution</h3>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-50 rounded border border-yellow-200">
                <span className="text-xs font-medium text-gray-900">S3 Potential</span>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-yellow-600">
                    {formatNumber(metrics.availabilityTypeBreakdown.s3Potential.total / 1000)}K
                  </div>
                  <div className="text-xs text-yellow-700">
                    {formatCurrency(metrics.availabilityTypeBreakdown.s3Potential.totalValue / 1000000)}M
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center justify-between px-1.5 py-1 bg-red-50 rounded border border-red-200">
                  <span className="text-xs text-gray-600">HTB+S3</span>
                  <div className="text-xs font-bold text-red-600">{metrics.s3Metrics.hardSecuritiesWithS3}</div>
                </div>
                <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                  <span className="text-xs text-gray-600">Warm+S3</span>
                  <div className="text-xs font-bold text-orange-600">{metrics.s3Metrics.warmSecuritiesWithS3}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                <span className="text-xs text-gray-600">Daily Revenue</span>
                <div className="text-xs font-bold text-green-600">
                  {formatCurrency(metrics.s3Metrics.potentialRevenue / 1000)}K
                </div>
              </div>
            </div>
          </div>



          {/* Hard Securities with S3 Widget */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 h-full flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">HTB S3 Opportunities</h3>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-gray-600">
                  {securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {securities
                .filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0)
                .slice(0, showAllS3Opportunities ? undefined : 3)
                .map((security) => (
                  <div 
                    key={security.id} 
                    className="flex items-center justify-between px-1.5 py-1 bg-red-50 rounded border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTicker(security.ticker)
                      setSelectedFilter('all')
                      setSearchTerm('')
                    }}
                    title={`Click to filter by ${security.ticker}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-900">{security.ticker}</span>
                      <span className="text-xs text-gray-600">{formatRate(security.averageRate)}</span>
                      {showAllS3Opportunities && (
                        <span className="text-xs text-gray-500">
                          {(security.availabilityBreakdown.s3Potential * (security.currentPrice || 50) / 1000000).toFixed(1)}M
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="text-xs font-bold text-red-600">
                        {formatNumber(security.availabilityBreakdown.s3Potential / 1000)}K
                      </div>
                      <span className="text-xs text-gray-500">S3</span>
                      {showAllS3Opportunities && (
                        <span className="text-xs text-gray-400">
                          ({security.availabilityBreakdown.s3Potential})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              
              {/* Show More/Less Button */}
              {securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length > 3 && (
                <div className="pt-1 border-t border-gray-200">
                  <button
                    onClick={() => setShowAllS3Opportunities(!showAllS3Opportunities)}
                    className="w-full flex items-center justify-center space-x-1 p-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAllS3Opportunities ? 'rotate-180' : ''}`} />
                    <span>
                      {showAllS3Opportunities 
                        ? 'Show Less' 
                        : `Show ${securities.filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0).length - 3} More`
                      }
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Securities Table */}
        <div className="bg-white rounded shadow border border-gray-200 mx-2">
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-sm font-semibold text-gray-900">Securities Availability</h2>
                {/* Active Filters Display */}
                <div className="flex items-center space-x-2">
                  {selectedTicker && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 flex items-center space-x-1">
                      <span>Ticker: {selectedTicker}</span>
                      <button
                        onClick={() => setSelectedTicker('')}
                        className="ml-1 hover:bg-blue-200 rounded"
                        title="Clear ticker filter"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedFilter !== 'all' && (
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 flex items-center space-x-1">
                      <span>Filter: {selectedFilter}</span>
                      <button
                        onClick={() => setSelectedFilter('all')}
                        className="ml-1 hover:bg-green-200 rounded"
                        title="Clear category filter"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {(selectedTicker || selectedFilter !== 'all' || searchTerm) && (
                    <button
                      onClick={() => {
                        setSelectedTicker('')
                        setSelectedFilter('all')
                        setSearchTerm('')
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                      title="Clear all filters"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs h-7"
                >
                  <option value="all">All</option>
                  <option value="GC">GC</option>
                  <option value="Non-Interesting">Non-Int</option>
                  <option value="Warm">Warm</option>
                  <option value="Hard-to-Borrow">HTB</option>
                  <option value="Equity">Equity</option>
                  <option value="ETF">ETF</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={12} />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 w-32 h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Cat</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avail</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Types</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Util</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sources</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSecurities.slice(0, 25).map((security) => (
                  <tr key={security.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2">
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
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getDifficultyIcon(security.difficulty)}
                        <Badge className={cn("text-xs font-medium px-1.5 py-0.5", getDifficultyColor(security.difficulty))}>
                          {security.difficulty === 'Hard-to-Borrow' ? 'HTB' : 
                           security.difficulty === 'Non-Interesting' ? 'Non-Int' : 
                           security.difficulty}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="text-sm font-medium text-gray-900">{formatNumber(security.totalAvailable / 1000)}K</div>
                      <div className="text-xs text-gray-500">{formatNumber(security.totalUtilized / 1000)}K used</div>
                    </td>
                    <td className="px-2 py-2 text-center">
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
                    <td className="px-2 py-2 text-right">
                      <div className={cn(
                        "text-sm font-medium",
                        security.averageRate < 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {formatRate(security.averageRate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRate(security.rateRange.min)}-{formatRate(security.rateRange.max)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              security.utilizationRate > 80 ? "bg-red-500" :
                              security.utilizationRate > 60 ? "bg-orange-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${Math.min(security.utilizationRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900 w-8 text-right">
                          {security.utilizationRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {security.hasOpenBorrows && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-1 py-0">B</Badge>
                        )}
                        {security.hasOpenLoans && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">L</Badge>
                        )}
                        {!security.hasOpenBorrows && !security.hasOpenLoans && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-xs font-medium text-gray-900">{security.sources.length}</span>
                        <span className="text-xs text-gray-500">CP</span>
                        {getTrendIcon(security.trends.availabilityTrend)}
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