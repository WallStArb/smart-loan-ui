import React, { useState, useEffect } from 'react'
import { 
  Target, 
  TrendingUp, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Building,
  FileText,
  Shield,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Settings,
  TrendingDown,
  Minus,
  User,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  industryBreakdown: Array<{
    industry: string
    totalAvailable: number
    totalValue: number
    percentage: number
    securities: number
    avgRate: number
  }>
}

interface AvailabilityDashboardProps {
  onNavigateToParameters?: () => void
}

const AvailabilityDashboard: React.FC<AvailabilityDashboardProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedTicker, setSelectedTicker] = useState<string>('')
  const [securities, setSecurities] = useState<SecurityAvailability[]>([])
  const [metrics, setMetrics] = useState<AvailabilityMetrics | null>(null)
  const [showAllS3Opportunities, setShowAllS3Opportunities] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [showFirstRow, setShowFirstRow] = useState(true)
  const [showSecondRow, setShowSecondRow] = useState(true)
  const [showThirdRow, setShowThirdRow] = useState(true)

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
    const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary', 'Industrials', 'Consumer Staples', 'Energy', 'Utilities', 'Real Estate', 'Materials', 'Communication Services']
    const counterparties = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citi']
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
    const gcRate = 4.5

    for (let i = 0; i < 60; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const sector = sectors[i % sectors.length]
      let assetClass: 'Equity' | 'Corporate Bond' | 'Government Bond' | 'ETF' | 'Other' = 'Equity'
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

    // Calculate industry breakdown
    const industryMap = new Map<string, { totalAvailable: number, totalValue: number, securities: number, totalRate: number }>()
    securities.forEach(sec => {
      if (!industryMap.has(sec.sector)) {
        industryMap.set(sec.sector, { totalAvailable: 0, totalValue: 0, securities: 0, totalRate: 0 })
      }
      const industryData = industryMap.get(sec.sector)!
      industryData.totalAvailable += sec.totalAvailable
      industryData.totalValue += sec.totalAvailable * sec.currentPrice
      industryData.securities += 1
      industryData.totalRate += sec.averageRate
    })

    const totalAvailableAcrossIndustries = securities.reduce((sum, sec) => sum + sec.totalAvailable, 0)
    const industryBreakdown = Array.from(industryMap.entries()).map(([industry, data]) => ({
      industry,
      totalAvailable: data.totalAvailable,
      totalValue: data.totalValue,
      percentage: (data.totalAvailable / totalAvailableAcrossIndustries) * 100,
      securities: data.securities,
      avgRate: data.totalRate / data.securities
    })).sort((a, b) => b.totalAvailable - a.totalAvailable)

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
      },
      industryBreakdown
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
            
            <div className="flex items-center space-x-1 border-l pl-2 ml-2">
              <span className="text-xs text-gray-500">Rows:</span>
              <button
                onClick={() => setShowFirstRow(!showFirstRow)}
                className={`h-6 px-2 text-xs rounded border transition-colors ${
                  showFirstRow 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
                title="Toggle Row 1 (Internal/External Availability, Categories, Asset Classes)"
              >
                1
              </button>
              <button
                onClick={() => setShowSecondRow(!showSecondRow)}
                className={`h-6 px-2 text-xs rounded border transition-colors ${
                  showSecondRow 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
                title="Toggle Row 2 (S3 Substitution, HTB S3 Opportunities, FPL, Market Summary)"
              >
                2
              </button>
              <button
                onClick={() => setShowThirdRow(!showThirdRow)}
                className={`h-6 px-2 text-xs rounded border transition-colors ${
                  showThirdRow 
                    ? 'bg-purple-100 text-purple-700 border-purple-300' 
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
                title="Toggle Row 3 (Availability Trends, Anticipated Availability, Industry Breakdown)"
              >
                3
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto">

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
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-medium text-gray-500">External Avail</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">
                  {formatNumber(metrics.sourceBreakdown.reduce((sum, s) => sum + s.totalAvailable, 0) / 1000)}K
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.sourceBreakdown.length} sources</div>
              </div>
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
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-gray-400" />
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


                  <div className="flex flex-col gap-3 mb-3 w-full px-2">
            {/* First Row */}
            {showFirstRow && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Internal Availability Widget - First */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Availability</h3>
              <div className="space-y-1">
                {/* Customer */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900">Customer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-blue-600">6,049.99K</div>
                    <div className="text-xs text-gray-500">$1,231M</div>
                  </div>
                </div>

                {/* Firm */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-gray-900">Firm</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-purple-600">3,235.403K</div>
                    <div className="text-xs text-gray-500">$678M</div>
                  </div>
                </div>

                {/* Non-Cust */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-gray-900">Non-Cust</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-orange-600">4,526.649K</div>
                    <div className="text-xs text-gray-500">$957M</div>
                  </div>
                </div>

                {/* FPL */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">FPL</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">1,990.717K</div>
                    <div className="text-xs text-gray-500">$409M</div>
                  </div>
                </div>
              </div>
            </div>

            {/* External CP Avail Widget - Second */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">External CP Avail</h3>
              <div className="space-y-1">
                {/* Morgan Stanley */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium text-gray-900">Morgan Stanley</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-yellow-600">5,025.091K</div>
                    <div className="text-xs text-gray-500">$754M</div>
                  </div>
                </div>

                {/* Goldman Sachs */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-900">Goldman Sachs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">4,973.444K</div>
                    <div className="text-xs text-gray-500">$746M</div>
                  </div>
                </div>

                {/* JPMorgan */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-gray-900">JPMorgan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-blue-600">4,435.759K</div>
                    <div className="text-xs text-gray-500">$665M</div>
                  </div>
                </div>

                {/* Total External */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-gray-100 rounded border border-gray-300 mt-1 pt-1 border-t-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">Total External</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-gray-700">23,580.575K</div>
                    <div className="text-xs font-medium text-gray-600">$3,537M</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
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


            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
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
                    <Activity className="w-3 h-3 text-blue-600" />
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

                <div 
                  className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => {
                    setSelectedFilter('Corporate Bond')
                    setSelectedTicker('')
                    setSearchTerm('')
                  }}
                  title="Click to filter by Corporate Bond securities"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">Corp Bond</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">{metrics.assetClassBreakdown.corporateBond.count}</div>
                    <div className="text-xs text-gray-500">{formatRate(metrics.assetClassBreakdown.corporateBond.avgRate)}</div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between px-1.5 py-1 bg-yellow-50 rounded border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => {
                    setSelectedFilter('Government Bond')
                    setSelectedTicker('')
                    setSearchTerm('')
                  }}
                  title="Click to filter by Government Bond securities"
                >
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




          </div>
            )}

          {/* Second Row */}
          {showSecondRow && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* S3 Substitution Widget - Far Left */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">S3 Substitution</h3>
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-600 font-bold">📌</span>
                </div>
              </div>
              <div className="space-y-1">
                {/* S3 Potential */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-900">S3 Potential</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-yellow-600">1,805.668K</div>
                    <div className="text-xs text-gray-500">$306M</div>
                  </div>
                </div>

                {/* HTB vs S3 */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-900">HTB+S3</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-red-600">12</div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-900">Warm+S3</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-orange-600">14</div>
                  </div>
                </div>

                {/* Daily Revenue */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-900">Daily Revenue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">$36K</div>
                  </div>
                </div>
              </div>
            </div>

            {/* S3 Opportunities Widget - Second */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">HTB S3 Opportunities</h3>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-gray-600">5</span>
                </div>
              </div>
              <div className="space-y-1">
                {securities
                  .filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.s3Potential > 0)
                  .slice(0, 3)
                  .map((security) => (
                    <div 
                      key={`s3-${security.id}`} 
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
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="text-xs font-bold text-red-600">
                          {formatNumber(security.availabilityBreakdown.s3Potential / 1000)}K
                        </div>
                        <span className="text-xs text-gray-500">S3</span>
                      </div>
                    </div>
                  ))}
                
                {/* Show 2 More Button */}
                <div className="pt-1 border-t border-gray-200">
                  <button
                    onClick={() => setShowAllS3Opportunities(!showAllS3Opportunities)}
                    className="w-full flex items-center justify-center space-x-1 p-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>Show 2 More</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FPL Widget - Third */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">HTB FPL Availability</h3>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-gray-600">5</span>
                </div>
              </div>
              <div className="space-y-1">
                {securities
                  .filter(sec => sec.difficulty === 'Hard-to-Borrow' && sec.availabilityBreakdown.fpl > 0)
                  .slice(0, 3)
                  .map((security) => (
                    <div 
                      key={`fpl-${security.id}`} 
                      className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
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
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="text-xs font-bold text-blue-600">
                          {formatNumber(security.availabilityBreakdown.fpl / 1000)}K
                        </div>
                        <span className="text-xs text-gray-500">FPL</span>
                      </div>
                    </div>
                  ))}
                
                {/* Show 2 More Button */}
                <div className="pt-1 border-t border-gray-200">
                  <button
                    onClick={() => setShowAllS3Opportunities(!showAllS3Opportunities)}
                    className="w-full flex items-center justify-center space-x-1 p-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                    <span>Show 2 More</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Market Summary Widget - Fourth */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Market Summary</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900">Avg Rate</span>
                  </div>
                  <div className="text-xs font-bold text-blue-600">{formatRate(metrics.averageRate)}</div>
                </div>

                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">Total Avail</span>
                  </div>
                  <div className="text-xs font-bold text-green-600">{formatNumber(metrics.totalAvailable / 1000000)}M</div>
                </div>

                <div className="flex items-center justify-between px-1.5 py-1 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <Target className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-gray-900">Utilization</span>
                  </div>
                  <div className="text-xs font-bold text-orange-600">{metrics.overallUtilization.toFixed(1)}%</div>
                </div>

                <div className="flex items-center justify-between px-1.5 py-1 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-gray-900">Securities</span>
                  </div>
                  <div className="text-xs font-bold text-purple-600">{metrics.totalSecurities}</div>
                </div>
              </div>
            </div>
          </div>
            )}

          {/* Third Row */}
          {showThirdRow && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {/* Availability Trends Widget */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Availability Trends</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-green-50 to-green-100 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">Low Util (0-25%)</span>
                  </div>
                  <div className="text-xs font-bold text-green-600">7 secs</div>
                </div>

                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <Minus className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs font-medium text-gray-900">Mod Util (25-50%)</span>
                  </div>
                  <div className="text-xs font-bold text-yellow-600">21 secs</div>
                </div>

                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-gray-900">High Util (50-75%)</span>
                  </div>
                  <div className="text-xs font-bold text-orange-600">26 secs</div>
                </div>

                <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-red-50 to-red-100 rounded border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-xs font-medium text-gray-900">Critical (75%+)</span>
                  </div>
                  <div className="text-xs font-bold text-red-600">6 secs</div>
                </div>
              </div>
            </div>

            {/* Anticipated Availability Widget */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Anticipated Availability</h3>
              <div className="space-y-1">
                {/* Anticipated Receives - First */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">Anticipated Receives</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">+479K</div>
                    <div className="text-xs text-green-500">Incoming</div>
                  </div>
                </div>

                {/* Recalls Pending - Returns availability */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <ArrowLeft className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-900">Recalls Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-blue-600">+292K</div>
                    <div className="text-xs text-blue-500">Returning</div>
                  </div>
                </div>

                {/* Pledge Recalls */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-900">Pledge Recalls</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-green-600">+386K</div>
                    <div className="text-xs text-green-500">Returning</div>
                  </div>
                </div>

                {/* Net Change Summary */}
                <div className="flex items-center justify-between px-1.5 py-1 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-gray-900">Net Change</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs font-bold text-purple-600">+1,157K</div>
                    <div className="text-xs text-purple-500">Total Gain</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability by Industry Widget */}
            <div className="bg-white rounded shadow border border-gray-200 p-2 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Availability by Industry</h3>
                <div className="flex items-center space-x-1">
                  <Building className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-gray-600">{metrics.industryBreakdown.length}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                {metrics.industryBreakdown
                  .slice(0, showAllIndustries ? metrics.industryBreakdown.length : 4)
                  .map((industry, index) => (
                    <div 
                      key={industry.industry} 
                      className={`flex items-center justify-between px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-colors ${
                        index === 0 ? 'bg-blue-50 border-blue-200' :
                        index === 1 ? 'bg-green-50 border-green-200' :
                        index === 2 ? 'bg-purple-50 border-purple-200' :
                        index === 3 ? 'bg-orange-50 border-orange-200' :
                        index === 4 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        // Could filter by sector/industry if needed
                        setSearchTerm('')
                        setSelectedFilter('all')
                        setSelectedTicker('')
                      }}
                      title={`${industry.industry}: ${formatNumber(industry.securities)} securities, ${formatRate(industry.avgRate)} avg rate`}
                    >
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-900 truncate">{industry.industry}</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className={`text-xs font-bold ${
                          index === 0 ? 'text-blue-600' :
                          index === 1 ? 'text-green-600' :
                          index === 2 ? 'text-purple-600' :
                          index === 3 ? 'text-orange-600' :
                          index === 4 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {formatCurrency(industry.totalValue / 1000000)}M
                        </div>
                        <div className="text-xs text-gray-500">
                          {industry.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                
                {metrics.industryBreakdown.length > 4 && (
                  <div className="pt-0.5 border-t border-gray-200">
                    <button
                      onClick={() => setShowAllIndustries(!showAllIndustries)}
                      className="w-full flex items-center justify-center space-x-1 p-0.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAllIndustries ? 'rotate-180' : ''}`} />
                      <span>{showAllIndustries ? 'Show Less' : `Show ${metrics.industryBreakdown.length - 4} More`}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
            )}
        </div>

        <div className="bg-white rounded shadow border border-gray-200 mx-2">
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-sm font-semibold text-gray-900">Securities Availability</h2>
    
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