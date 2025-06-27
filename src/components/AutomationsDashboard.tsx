import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  TrendingUp, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  BarChart3,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Building,
  ArrowUp,
  ArrowDown,
  Settings,
  Bot,
  Timer,
  Target,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Types for Auto-Borrow and Auto-Loan Activity
interface AutoBorrowRequest {
  id: string
  ticker: string
  quantity: number
  requestTime: string
  status: 'Pending' | 'Filled' | 'Partial' | 'No-Fill' | 'Expired'
  requestedRate: number
  filledQuantity: number
  filledRate?: number
  counterpartiesQueried: string[]
  fillTime?: string
  processingTimeMs: number
  client: string
  fillSource?: string
}

interface AutoLoanInquiry {
  id: string
  ticker: string
  quantity: number
  inquiryTime: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired'
  requestedRate: number
  counterparty: string
  rejectReason?: 'Rate Too Low' | 'Not Available' | 'Risk Limit' | 'Regulatory' | 'Other'
  responseTime?: string
  processingTimeMs: number
  actualRate?: number
}

interface CounterpartyPerformance {
  counterparty: string
  autoBorrow: {
    requestsMade: number
    filled: number
    partial: number
    noFill: number
    fillRate: number
    avgProcessingTime: number
    avgFillRate: number
    totalVolume: number
  }
  autoLoan: {
    inquiriesReceived: number
    accepted: number
    rejected: number
    acceptanceRate: number
    avgResponseTime: number
    avgRate: number
    totalVolume: number
  }
}

interface UnfilledDemand {
  ticker: string
  totalRequests: number
  totalQuantity: number
  avgRequestedRate: number
  lastRequestTime: string
  demandStrength: 'High' | 'Medium' | 'Low'
  potentialRevenue: number
}

interface AutomationMetrics {
  autoBorrow: {
    totalRequests: number
    filled: number
    partial: number
    noFill: number
    fillRate: number
    avgProcessingTime: number
    totalVolume: number
    activeClients: number
  }
  autoLoan: {
    totalInquiries: number
    accepted: number
    rejected: number
    acceptanceRate: number
    avgResponseTime: number
    totalVolume: number
    activeCounterparties: number
    topRejectReason: string
  }
  demandIntelligence: {
    unfilledSecurities: number
    potentialRevenue: number
    topDemandSector: string
    demandTrend: 'Increasing' | 'Decreasing' | 'Stable'
  }
}

interface AutomationsDashboardProps {
  onNavigateToParameters?: () => void
}

const AutomationsDashboard: React.FC<AutomationsDashboardProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'auto-borrow' | 'auto-loan' | 'demand-intel'>('auto-borrow')
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>('all')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  const [autoBorrowRequests, setAutoBorrowRequests] = useState<AutoBorrowRequest[]>([])
  const [autoLoanInquiries, setAutoLoanInquiries] = useState<AutoLoanInquiry[]>([])
  const [counterpartyPerformance, setCounterpartyPerformance] = useState<CounterpartyPerformance[]>([])
  const [unfilledDemand, setUnfilledDemand] = useState<UnfilledDemand[]>([])
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null)

  // Generate realistic mock data
  const generateMockData = () => {
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'PYPL']
    const counterparties = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citi', 'UBS', 'Credit Suisse', 'Barclays']
    const clients = ['Client A', 'Client B', 'Client C', 'Client D', 'Client E']
    const statuses: Array<'Pending' | 'Filled' | 'Partial' | 'No-Fill' | 'Expired'> = ['Pending', 'Filled', 'Partial', 'No-Fill', 'Expired']
    const rejectReasons: Array<'Rate Too Low' | 'Not Available' | 'Risk Limit' | 'Regulatory' | 'Other'> = ['Rate Too Low', 'Not Available', 'Risk Limit', 'Regulatory', 'Other']

    // Generate Auto-Borrow Requests
    const borrowRequests: AutoBorrowRequest[] = []
    for (let i = 0; i < 50; i++) {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)]
      const quantity = Math.floor(Math.random() * 10000) + 1000
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const requestedRate = Math.random() * 5 + 1
      const processingTime = Math.floor(Math.random() * 300000) + 5000 // 5s to 5min
      
      borrowRequests.push({
        id: `AB${(i + 1).toString().padStart(3, '0')}`,
        ticker,
        quantity,
        requestTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        status,
        requestedRate,
        filledQuantity: status === 'Filled' ? quantity : status === 'Partial' ? Math.floor(quantity * (0.3 + Math.random() * 0.5)) : 0,
        filledRate: status !== 'No-Fill' && status !== 'Pending' ? requestedRate + (Math.random() - 0.5) * 0.5 : undefined,
        counterpartiesQueried: counterparties.slice(0, Math.floor(Math.random() * 4) + 2),
        fillTime: status === 'Filled' || status === 'Partial' ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : undefined,
        processingTimeMs: processingTime,
        client: clients[Math.floor(Math.random() * clients.length)],
        fillSource: status === 'Filled' || status === 'Partial' ? counterparties[Math.floor(Math.random() * counterparties.length)] : undefined
      })
    }

    // Generate Auto-Loan Inquiries
    const loanInquiries: AutoLoanInquiry[] = []
    for (let i = 0; i < 40; i++) {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)]
      const quantity = Math.floor(Math.random() * 8000) + 500
      const status = Math.random() > 0.3 ? (Math.random() > 0.6 ? 'Accepted' : 'Rejected') : 'Pending'
      const requestedRate = Math.random() * 4 + 0.5
      const processingTime = Math.floor(Math.random() * 120000) + 2000 // 2s to 2min
      
      loanInquiries.push({
        id: `AL${(i + 1).toString().padStart(3, '0')}`,
        ticker,
        quantity,
        inquiryTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        status,
        requestedRate,
        counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
        rejectReason: status === 'Rejected' ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : undefined,
        responseTime: status !== 'Pending' ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : undefined,
        processingTimeMs: processingTime,
        actualRate: status === 'Accepted' ? requestedRate + (Math.random() - 0.5) * 0.3 : undefined
      })
    }

    // Generate Counterparty Performance
    const cpPerformance: CounterpartyPerformance[] = counterparties.map(cp => {
      const cpBorrowReqs = borrowRequests.filter(req => req.counterpartiesQueried.includes(cp))
      const cpLoanInqs = loanInquiries.filter(inq => inq.counterparty === cp)
      
      return {
        counterparty: cp,
        autoBorrow: {
          requestsMade: cpBorrowReqs.length,
          filled: cpBorrowReqs.filter(req => req.status === 'Filled').length,
          partial: cpBorrowReqs.filter(req => req.status === 'Partial').length,
          noFill: cpBorrowReqs.filter(req => req.status === 'No-Fill').length,
          fillRate: cpBorrowReqs.length > 0 ? (cpBorrowReqs.filter(req => req.status === 'Filled' || req.status === 'Partial').length / cpBorrowReqs.length) * 100 : 0,
          avgProcessingTime: cpBorrowReqs.length > 0 ? cpBorrowReqs.reduce((sum, req) => sum + req.processingTimeMs, 0) / cpBorrowReqs.length : 0,
          avgFillRate: 85 + Math.random() * 10,
          totalVolume: cpBorrowReqs.reduce((sum, req) => sum + req.filledQuantity * 150, 0) // Mock price $150
        },
        autoLoan: {
          inquiriesReceived: cpLoanInqs.length,
          accepted: cpLoanInqs.filter(inq => inq.status === 'Accepted').length,
          rejected: cpLoanInqs.filter(inq => inq.status === 'Rejected').length,
          acceptanceRate: cpLoanInqs.length > 0 ? (cpLoanInqs.filter(inq => inq.status === 'Accepted').length / cpLoanInqs.length) * 100 : 0,
          avgResponseTime: cpLoanInqs.length > 0 ? cpLoanInqs.reduce((sum, inq) => sum + inq.processingTimeMs, 0) / cpLoanInqs.length : 0,
          avgRate: cpLoanInqs.filter(inq => inq.actualRate).reduce((sum, inq) => sum + (inq.actualRate || 0), 0) / Math.max(cpLoanInqs.filter(inq => inq.actualRate).length, 1),
          totalVolume: cpLoanInqs.filter(inq => inq.status === 'Accepted').reduce((sum, inq) => sum + inq.quantity * 150, 0)
        }
      }
    })

    // Generate Unfilled Demand
    const demandMap = new Map<string, { requests: number, quantity: number, rates: number[], lastTime: string }>()
    borrowRequests.filter(req => req.status === 'No-Fill' || req.status === 'Partial').forEach(req => {
      const existing = demandMap.get(req.ticker) || { requests: 0, quantity: 0, rates: [], lastTime: req.requestTime }
      demandMap.set(req.ticker, {
        requests: existing.requests + 1,
        quantity: existing.quantity + (req.quantity - req.filledQuantity),
        rates: [...existing.rates, req.requestedRate],
        lastTime: req.requestTime > existing.lastTime ? req.requestTime : existing.lastTime
      })
    })

    const unfilled: UnfilledDemand[] = Array.from(demandMap.entries()).map(([ticker, data]) => ({
      ticker,
      totalRequests: data.requests,
      totalQuantity: data.quantity,
      avgRequestedRate: data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length,
      lastRequestTime: data.lastTime,
      demandStrength: data.requests > 5 ? 'High' : data.requests > 2 ? 'Medium' : 'Low',
      potentialRevenue: data.quantity * 150 * (data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length) / 365 * 30 // 30 days potential
    })).sort((a, b) => b.potentialRevenue - a.potentialRevenue)

    // Calculate Metrics
    const metrics: AutomationMetrics = {
      autoBorrow: {
        totalRequests: borrowRequests.length,
        filled: borrowRequests.filter(req => req.status === 'Filled').length,
        partial: borrowRequests.filter(req => req.status === 'Partial').length,
        noFill: borrowRequests.filter(req => req.status === 'No-Fill').length,
        fillRate: (borrowRequests.filter(req => req.status === 'Filled' || req.status === 'Partial').length / borrowRequests.length) * 100,
        avgProcessingTime: borrowRequests.reduce((sum, req) => sum + req.processingTimeMs, 0) / borrowRequests.length,
        totalVolume: borrowRequests.reduce((sum, req) => sum + req.filledQuantity * 150, 0),
        activeClients: new Set(borrowRequests.map(req => req.client)).size
      },
      autoLoan: {
        totalInquiries: loanInquiries.length,
        accepted: loanInquiries.filter(inq => inq.status === 'Accepted').length,
        rejected: loanInquiries.filter(inq => inq.status === 'Rejected').length,
        acceptanceRate: (loanInquiries.filter(inq => inq.status === 'Accepted').length / loanInquiries.length) * 100,
        avgResponseTime: loanInquiries.reduce((sum, inq) => sum + inq.processingTimeMs, 0) / loanInquiries.length,
        totalVolume: loanInquiries.filter(inq => inq.status === 'Accepted').reduce((sum, inq) => sum + inq.quantity * 150, 0),
        activeCounterparties: new Set(loanInquiries.map(inq => inq.counterparty)).size,
        topRejectReason: 'Rate Too Low'
      },
      demandIntelligence: {
        unfilledSecurities: unfilled.length,
        potentialRevenue: unfilled.reduce((sum, item) => sum + item.potentialRevenue, 0),
        topDemandSector: 'Technology',
        demandTrend: 'Increasing'
      }
    }

    return { borrowRequests, loanInquiries, cpPerformance, unfilled, metrics }
  }

  // Initialize data
  useEffect(() => {
    const { borrowRequests, loanInquiries, cpPerformance, unfilled, metrics: newMetrics } = generateMockData()
    setAutoBorrowRequests(borrowRequests)
    setAutoLoanInquiries(loanInquiries)
    setCounterpartyPerformance(cpPerformance)
    setUnfilledDemand(unfilled)
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

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filled':
      case 'Accepted':
        return 'bg-green-100 text-green-800'
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pending':
        return 'bg-blue-100 text-blue-800'
      case 'No-Fill':
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Expired':
        return 'bg-gray-100 text-gray-800'
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
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Automation Activities</h1>
              <p className="text-sm text-gray-600">Auto-Borrow & Auto-Loan Performance</p>
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
          {/* Auto-Borrow Summary */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Auto-Borrow</h3>
              <RefreshCw className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.autoBorrow.totalRequests}</span>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">{metrics.autoBorrow.fillRate.toFixed(1)}% fill</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(metrics.autoBorrow.totalVolume)} volume
            </p>
          </div>

          {/* Auto-Loan Summary */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Auto-Loan</h3>
              <Building className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.autoLoan.totalInquiries}</span>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">{metrics.autoLoan.acceptanceRate.toFixed(1)}% accept</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(metrics.autoLoan.totalVolume)} volume
            </p>
          </div>

          {/* Processing Speed */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Processing Speed</h3>
              <Timer className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{formatTime(metrics.autoBorrow.avgProcessingTime)}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Avg borrow</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(metrics.autoLoan.avgResponseTime)} avg loan response
            </p>
          </div>

          {/* Demand Intelligence */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Unfilled Demand</h3>
              <Target className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.demandIntelligence.unfilledSecurities}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-orange-600">{metrics.demandIntelligence.demandTrend}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(metrics.demandIntelligence.potentialRevenue)} potential
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {[
                  { key: 'auto-borrow', label: 'Auto-Borrow Activity', icon: RefreshCw },
                  { key: 'auto-loan', label: 'Auto-Loan Activity', icon: Building },
                  { key: 'demand-intel', label: 'Demand Intelligence', icon: Target }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={viewMode === key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(key as any)}
                    className="h-9 px-4"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedCounterparty}
                  onChange={(e) => setSelectedCounterparty(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm h-9"
                >
                  <option value="all">All Counterparties</option>
                  {counterpartyPerformance.map(cp => (
                    <option key={cp.counterparty} value={cp.counterparty}>{cp.counterparty}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content based on view mode */}
          <div className="p-4">
            {viewMode === 'auto-borrow' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Auto-Borrow Requests</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Processing Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counterparties</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {autoBorrowRequests
                        .filter(req => 
                          req.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.client.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 20)
                        .map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{request.ticker}</div>
                            <div className="text-xs text-gray-500">Rate: {request.requestedRate.toFixed(2)}%</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">{formatNumber(request.quantity)}</div>
                            <div className="text-xs text-gray-500">Filled: {formatNumber(request.filledQuantity)}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={cn("text-xs font-medium px-2 py-1", getStatusColor(request.status))}>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">
                              {((request.filledQuantity / request.quantity) * 100).toFixed(1)}%
                            </div>
                            {request.filledRate && (
                              <div className="text-xs text-gray-500">@ {request.filledRate.toFixed(2)}%</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">{formatTime(request.processingTimeMs)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {request.counterpartiesQueried.slice(0, 2).join(', ')}
                              {request.counterpartiesQueried.length > 2 && ` +${request.counterpartiesQueried.length - 2}`}
                            </div>
                            {request.fillSource && (
                              <div className="text-xs text-green-600">Filled by: {request.fillSource}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{request.client}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'auto-loan' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Auto-Loan Inquiries</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counterparty</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Response Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {autoLoanInquiries
                        .filter(inq => 
                          inq.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inq.counterparty.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 20)
                        .map((inquiry) => (
                        <tr key={inquiry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{inquiry.ticker}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">{formatNumber(inquiry.quantity)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{inquiry.counterparty}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={cn("text-xs font-medium px-2 py-1", getStatusColor(inquiry.status))}>
                              {inquiry.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">
                              {inquiry.actualRate ? inquiry.actualRate.toFixed(2) : inquiry.requestedRate.toFixed(2)}%
                            </div>
                            {inquiry.actualRate && inquiry.actualRate !== inquiry.requestedRate && (
                              <div className="text-xs text-gray-500">Req: {inquiry.requestedRate.toFixed(2)}%</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-gray-900">{formatTime(inquiry.processingTimeMs)}</div>
                          </td>
                          <td className="px-4 py-3">
                            {inquiry.rejectReason && (
                              <div className="text-xs text-red-600">{inquiry.rejectReason}</div>
                            )}
                            {inquiry.status === 'Accepted' && (
                              <div className="text-xs text-green-600">✓ Accepted</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'demand-intel' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Unfilled Borrow Demand</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unfilledDemand.slice(0, 9).map((item) => (
                      <div key={item.ticker} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{item.ticker}</h4>
                          <Badge className={cn(
                            "text-xs px-2 py-1",
                            item.demandStrength === 'High' ? 'bg-red-100 text-red-800' :
                            item.demandStrength === 'Medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          )}>
                            {item.demandStrength}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requests:</span>
                            <span className="font-medium">{item.totalRequests}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{formatNumber(item.totalQuantity)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Rate:</span>
                            <span className="font-medium">{item.avgRequestedRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Potential:</span>
                            <span className="font-medium text-green-600">{formatCurrency(item.potentialRevenue)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Last request: {new Date(item.lastRequestTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Counterparty Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counterparty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Borrow Requests</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loan Inquiries</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accept Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Volume</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {counterpartyPerformance
                          .filter(cp => selectedCounterparty === 'all' || cp.counterparty === selectedCounterparty)
                          .map((cp) => (
                          <tr key={cp.counterparty} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{cp.counterparty}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">{cp.autoBorrow.requestsMade}</div>
                              <div className="text-xs text-gray-500">
                                {cp.autoBorrow.filled}F / {cp.autoBorrow.partial}P / {cp.autoBorrow.noFill}N
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">{cp.autoBorrow.fillRate.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">{formatTime(cp.autoBorrow.avgProcessingTime)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">{cp.autoLoan.inquiriesReceived}</div>
                              <div className="text-xs text-gray-500">
                                {cp.autoLoan.accepted}A / {cp.autoLoan.rejected}R
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">{cp.autoLoan.acceptanceRate.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">{formatTime(cp.autoLoan.avgResponseTime)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(cp.autoBorrow.totalVolume + cp.autoLoan.totalVolume)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomationsDashboard 