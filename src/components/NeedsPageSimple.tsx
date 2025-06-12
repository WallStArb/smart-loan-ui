import React, { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Settings,
  Activity,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SecurityNeed {
  id: string
  ticker: string
  cusip: string
  description: string
  quantity: number
  marketValue: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  remainingQuantity: number
  curedQuantity: number
  borrowRate: number
  lastUpdate: string
}

interface NeedsPageProps {
  onNavigateToParameters?: () => void
}

const NeedsPageSimple: React.FC<NeedsPageProps> = ({ onNavigateToParameters }) => {
  const [securityNeeds, setSecurityNeeds] = useState<SecurityNeed[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'critical-only' | 'overview' | 'detailed'>('overview')
  const [lastUpdate] = useState(new Date())

  useEffect(() => {
    // Generate mock data
    const mockNeeds: SecurityNeed[] = [
      {
        id: '1',
        ticker: 'AAPL',
        cusip: '037833100',
        description: 'Apple Inc. Common Stock',
        quantity: 50000,
        marketValue: 8750000,
        priority: 'Critical',
        remainingQuantity: 35000,
        curedQuantity: 15000,
        borrowRate: 0.75,
        lastUpdate: '2 mins ago'
      },
      {
        id: '2',
        ticker: 'MSFT',
        cusip: '594918104',
        description: 'Microsoft Corporation',
        quantity: 25000,
        marketValue: 9500000,
        priority: 'High',
        remainingQuantity: 18000,
        curedQuantity: 7000,
        borrowRate: 0.45,
        lastUpdate: '5 mins ago'
      },
      {
        id: '3',
        ticker: 'GOOGL',
        cusip: '02079K305',
        description: 'Alphabet Inc. Class A',
        quantity: 15000,
        marketValue: 2100000,
        priority: 'Medium',
        remainingQuantity: 8000,
        curedQuantity: 7000,
        borrowRate: 0.25,
        lastUpdate: '8 mins ago'
      }
    ]
    setSecurityNeeds(mockNeeds)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-critical-muted text-critical'
      case 'High': return 'bg-status-high-muted text-status-high'
      case 'Medium': return 'bg-status-medium-muted text-status-medium'
      case 'Low': return 'bg-status-low-muted text-status-low'
      default: return 'bg-muted text-muted-foreground'
    }
  }

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

  const filteredNeeds = securityNeeds.filter(need => 
    need.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    need.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-fis-green to-fis-green-dark rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Needs Management</h1>
              <p className="text-sm text-gray-600">Monitor and manage securities borrowing needs</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-success-muted text-success border-success px-3 py-1">
              <Clock className="w-4 h-4 mr-1.5" />
              Updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
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

        {/* Controls */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
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
                        ? "bg-white text-fis-green shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search securities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fis-green focus:border-fis-green text-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Securities Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Securities Needs ({filteredNeeds.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Security</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Market Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Progress</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Rate</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNeeds.map((need) => (
                    <tr key={need.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{need.ticker}</div>
                          <div className="text-sm text-gray-500">{need.cusip}</div>
                          <div className="text-xs text-gray-400 mt-1">{need.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getPriorityColor(need.priority)}>
                          {need.priority}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-medium text-gray-900">{formatNumber(need.remainingQuantity)}</div>
                        <div className="text-xs text-gray-500">of {formatNumber(need.quantity)}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(need.marketValue)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-32">
                          <CureProgressBar need={need} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-medium text-gray-900">{need.borrowRate}%</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button size="sm" variant="info" className="h-8 px-3">
                            🔄 Borrow
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-3">
                            📞 Recall
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NeedsPageSimple 