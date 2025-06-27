import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  Search, 
  Filter, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Building,
  FileText,
  Shield,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  TrendingDown,
  ArrowRightLeft,
  MessageCircle,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Types for Borrow/Loan Activity data
interface BorrowLoanTransaction {
  id: string
  type: 'Borrow' | 'Loan' | 'Return' | 'Recall'
  ticker: string
  cusip: string
  description: string
  quantity: number
  rate: number
  counterparty: string
  startDate: string
  endDate?: string
  status: 'Active' | 'Pending' | 'Settled' | 'Recalled' | 'Returned' | 'Expired'
  marketValue: number
  collateralValue?: number
  dailyCost: number
  totalCost: number
  sector: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  lastUpdate: string
  fees?: {
    processingFee?: number
    htbFee?: number
    locateFee?: number
  }
  terms: {
    termLength: number // days
    callableAfter?: number // days
    dividendPass: boolean
    collateralType: 'Cash' | 'Securities' | 'LC'
  }
  riskMetrics: {
    haircut: number
    marginRequirement: number
    concentrationLimit: number
  }
}

interface ActivityMetrics {
  totalTransactions: number
  activeLoans: number
  activeBorrows: number
  totalOutstanding: number
  totalDailyCost: number
  averageRate: number
  typeBreakdown: {
    borrows: number
    loans: number
    returns: number
    recalls: number
  }
  statusBreakdown: {
    active: number
    pending: number
    settled: number
    recalled: number
    returned: number
    expired: number
  }
  counterpartyActivity: Array<{
    counterparty: string
    totalVolume: number
    transactionCount: number
    averageRate: number
    outstandingValue: number
    relationship: 'Prime Brokerage' | 'Bank' | 'Institutional' | 'Internal'
  }>
  performanceMetrics: {
    settlementRate: number
    averageSettlementTime: number // days
    failedTransactions: number
    recallSuccessRate: number
    returnSuccessRate: number
  }
  trendsData: {
    volumeChange: number
    rateChange: number
    activityChange: number
  }
}

interface BorrowLoanActivityDashboardProps {
  onNavigateToParameters?: () => void
}

const BorrowLoanActivityDashboard: React.FC<BorrowLoanActivityDashboardProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'performance'>('overview')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  const [transactions, setTransactions] = useState<BorrowLoanTransaction[]>([])
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null)

  // Generate mock data
  const generateMockData = (): { transactions: BorrowLoanTransaction[], metrics: ActivityMetrics } => {
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
    const types: Array<'Borrow' | 'Loan' | 'Return' | 'Recall'> = ['Borrow', 'Loan', 'Return', 'Recall']
    const statuses: Array<'Active' | 'Pending' | 'Settled' | 'Recalled' | 'Returned' | 'Expired'> = ['Active', 'Pending', 'Settled', 'Recalled', 'Returned', 'Expired']
    const collateralTypes: Array<'Cash' | 'Securities' | 'LC'> = ['Cash', 'Securities', 'LC']
    const relationships: Array<'Prime Brokerage' | 'Bank' | 'Institutional' | 'Internal'> = ['Prime Brokerage', 'Bank', 'Institutional', 'Internal']

    const transactions: BorrowLoanTransaction[] = []
    const typeBreakdown = { borrows: 0, loans: 0, returns: 0, recalls: 0 }
    const statusBreakdown = { active: 0, pending: 0, settled: 0, recalled: 0, returned: 0, expired: 0 }
    const counterpartyMap = new Map<string, { volume: number, count: number, totalRate: number, outstanding: number, relationship: string }>()

    for (let i = 0; i < 50; i++) {
      const ticker = tickers[i % tickers.length]
      const description = descriptions[i % descriptions.length]
      const sector = sectors[i % sectors.length]
      const type = types[Math.floor(Math.random() * types.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const counterparty = counterparties[i % counterparties.length]
      const collateralType = collateralTypes[Math.floor(Math.random() * collateralTypes.length)]
      const relationship = relationships[Math.floor(Math.random() * relationships.length)]
      
      const quantity = Math.floor(Math.random() * 50000) + 1000
      const price = Math.random() * 300 + 50
      const marketValue = quantity * price
      const rate = Math.random() * 6 + 0.5
      const termLength = Math.floor(Math.random() * 365) + 1
      const dailyCost = (marketValue * rate) / 365
      const totalCost = dailyCost * termLength
      
      const startDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
      const endDate = status === 'Active' ? new Date(startDate.getTime() + termLength * 24 * 60 * 60 * 1000) : undefined

      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low'
      if (status === 'Expired' || (rate > 5)) priority = 'Critical'
      else if (status === 'Pending' || (rate > 3)) priority = 'High'
      else if (marketValue > 1000000) priority = 'Medium'

      const transaction: BorrowLoanTransaction = {
        id: `TX${(i + 1).toString().padStart(4, '0')}`,
        type,
        ticker,
        cusip: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description,
        quantity,
        rate,
        counterparty,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        status,
        marketValue,
        collateralValue: collateralType === 'Cash' ? marketValue * 1.02 : undefined,
        dailyCost,
        totalCost,
        sector,
        priority,
        lastUpdate: new Date().toLocaleTimeString(),
        fees: rate > 3 ? {
          processingFee: Math.random() * 500 + 100,
          htbFee: Math.random() * 1000 + 200,
          locateFee: Math.random() * 300 + 50
        } : undefined,
        terms: {
          termLength,
          callableAfter: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 1 : undefined,
          dividendPass: Math.random() > 0.3,
          collateralType
        },
        riskMetrics: {
          haircut: Math.random() * 5 + 2,
          marginRequirement: Math.random() * 10 + 100,
          concentrationLimit: Math.random() * 20 + 10
        }
      }

      transactions.push(transaction)

      // Update breakdowns
      if (type === 'Borrow') typeBreakdown.borrows++
      else if (type === 'Loan') typeBreakdown.loans++
      else if (type === 'Return') typeBreakdown.returns++
      else if (type === 'Recall') typeBreakdown.recalls++

      if (status === 'Active') statusBreakdown.active++
      else if (status === 'Pending') statusBreakdown.pending++
      else if (status === 'Settled') statusBreakdown.settled++
      else if (status === 'Recalled') statusBreakdown.recalled++
      else if (status === 'Returned') statusBreakdown.returned++
      else if (status === 'Expired') statusBreakdown.expired++

      // Update counterparty breakdown
      if (!counterpartyMap.has(counterparty)) {
        counterpartyMap.set(counterparty, { volume: 0, count: 0, totalRate: 0, outstanding: 0, relationship })
      }
      const counterpartyData = counterpartyMap.get(counterparty)!
      counterpartyData.volume += marketValue
      counterpartyData.count++
      counterpartyData.totalRate += rate
      if (status === 'Active') counterpartyData.outstanding += marketValue
    }

    const counterpartyActivity = Array.from(counterpartyMap.entries()).map(([counterparty, data]) => ({
      counterparty,
      totalVolume: data.volume,
      transactionCount: data.count,
      averageRate: data.totalRate / data.count,
      outstandingValue: data.outstanding,
      relationship: data.relationship as 'Prime Brokerage' | 'Bank' | 'Institutional' | 'Internal'
    }))

    const totalOutstanding = transactions.filter(t => t.status === 'Active').reduce((sum, t) => sum + t.marketValue, 0)
    const totalDailyCost = transactions.filter(t => t.status === 'Active').reduce((sum, t) => sum + t.dailyCost, 0)
    const averageRate = transactions.reduce((sum, t) => sum + t.rate, 0) / transactions.length

    const metrics: ActivityMetrics = {
      totalTransactions: transactions.length,
      activeLoans: transactions.filter(t => t.type === 'Loan' && t.status === 'Active').length,
      activeBorrows: transactions.filter(t => t.type === 'Borrow' && t.status === 'Active').length,
      totalOutstanding,
      totalDailyCost,
      averageRate,
      typeBreakdown,
      statusBreakdown,
      counterpartyActivity,
      performanceMetrics: {
        settlementRate: 95.2 + Math.random() * 3,
        averageSettlementTime: 1.5 + Math.random() * 0.5,
        failedTransactions: Math.floor(Math.random() * 5) + 1,
        recallSuccessRate: 92 + Math.random() * 5,
        returnSuccessRate: 97 + Math.random() * 2
      },
      trendsData: {
        volumeChange: (Math.random() - 0.5) * 20,
        rateChange: (Math.random() - 0.5) * 3,
        activityChange: (Math.random() - 0.5) * 15
      }
    }

    return { transactions, metrics }
  }

  // Initialize data
  useEffect(() => {
    const { transactions: newTransactions, metrics: newMetrics } = generateMockData()
    setTransactions(newTransactions)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Settled':
        return 'bg-blue-100 text-blue-800'
      case 'Recalled':
        return 'bg-orange-100 text-orange-800'
      case 'Returned':
        return 'bg-purple-100 text-purple-800'
      case 'Expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Borrow':
        return 'bg-blue-100 text-blue-800'
      case 'Loan':
        return 'bg-green-100 text-green-800'
      case 'Return':
        return 'bg-purple-100 text-purple-800'
      case 'Recall':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.counterparty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || transaction.type === selectedType
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Borrow/Loan Activity Dashboard</h1>
              <p className="text-sm text-gray-600">Monitor borrowing and lending transactions</p>
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
          {/* Total Outstanding */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalOutstanding)}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+{metrics.trendsData.volumeChange.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalTransactions} total transactions
            </p>
          </div>

          {/* Active Positions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Active Positions</h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Borrows:</span>
                <span className="font-medium text-blue-600">{metrics.activeBorrows}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loans:</span>
                <span className="font-medium text-green-600">{metrics.activeLoans}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">{metrics.activeBorrows + metrics.activeLoans}</span>
              </div>
            </div>
          </div>

          {/* Daily Cost */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Daily Cost</h3>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalDailyCost)}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600">+{metrics.trendsData.rateChange.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg Rate: {metrics.averageRate.toFixed(2)}%
            </p>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Performance</h3>
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Settlement:</span>
                <span className="font-medium text-green-600">{metrics.performanceMetrics.settlementRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recall Success:</span>
                <span className="font-medium text-green-600">{metrics.performanceMetrics.recallSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Settlement:</span>
                <span className="font-medium text-gray-900">{metrics.performanceMetrics.averageSettlementTime.toFixed(1)}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Transaction Types */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Types</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{metrics.typeBreakdown.borrows}</div>
                  <div className="text-sm text-gray-600">Borrows</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics.typeBreakdown.loans}</div>
                  <div className="text-sm text-gray-600">Loans</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{metrics.typeBreakdown.returns}</div>
                  <div className="text-sm text-gray-600">Returns</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{metrics.typeBreakdown.recalls}</div>
                  <div className="text-sm text-gray-600">Recalls</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: `${(metrics.statusBreakdown.active / metrics.totalTransactions) * 100}%` }}></div>
                    </div>
                    <span className="font-medium text-green-600">{metrics.statusBreakdown.active}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-yellow-500 rounded-full" style={{ width: `${(metrics.statusBreakdown.pending / metrics.totalTransactions) * 100}%` }}></div>
                    </div>
                    <span className="font-medium text-yellow-600">{metrics.statusBreakdown.pending}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Settled</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${(metrics.statusBreakdown.settled / metrics.totalTransactions) * 100}%` }}></div>
                    </div>
                    <span className="font-medium text-blue-600">{metrics.statusBreakdown.settled}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="Borrow">Borrow</option>
                  <option value="Loan">Loan</option>
                  <option value="Return">Return</option>
                  <option value="Recall">Recall</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Settled">Settled</option>
                  <option value="Recalled">Recalled</option>
                  <option value="Returned">Returned</option>
                  <option value="Expired">Expired</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
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
                    Security
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counterparty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{transaction.ticker}</span>
                            {transaction.fees && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0">HTB</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{transaction.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs font-medium px-2 py-1", getTypeColor(transaction.type))}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(transaction.quantity)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.marketValue)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.rate.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.counterparty}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs font-medium px-2 py-1", getStatusColor(transaction.status))}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.dailyCost)}
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

export default BorrowLoanActivityDashboard 