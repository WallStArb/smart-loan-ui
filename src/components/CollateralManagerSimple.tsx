import React, { useState, useEffect } from 'react'
import { 
  Shield,
  DollarSign,
  Clock,
  Settings,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CollateralItem {
  id: string
  ticker: string
  cusip: string
  description: string
  quantity: number
  marketValue: number
  collateralValue: number
  haircut: number
  status: 'Active' | 'Pending' | 'Recalled' | 'Expired'
  lastUpdate: string
  eligibility: 'Eligible' | 'Restricted' | 'Ineligible'
}

interface CollateralManagerProps {
  onNavigateToParameters?: () => void
}

const CollateralManagerSimple: React.FC<CollateralManagerProps> = ({ onNavigateToParameters }) => {
  const [collateralItems, setCollateralItems] = useState<CollateralItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [lastUpdate] = useState(new Date())

  useEffect(() => {
    // Generate mock data
    const mockCollateral: CollateralItem[] = [
      {
        id: '1',
        ticker: 'TSLA',
        cusip: '88160R101',
        description: 'Tesla Inc. Common Stock',
        quantity: 10000,
        marketValue: 2500000,
        collateralValue: 2250000,
        haircut: 10,
        status: 'Active',
        lastUpdate: '1 min ago',
        eligibility: 'Eligible'
      },
      {
        id: '2',
        ticker: 'NVDA',
        cusip: '67066G104',
        description: 'NVIDIA Corporation',
        quantity: 5000,
        marketValue: 4200000,
        collateralValue: 3780000,
        haircut: 10,
        status: 'Active',
        lastUpdate: '3 mins ago',
        eligibility: 'Eligible'
      }
    ]
    setCollateralItems(mockCollateral)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success-muted text-success'
      case 'Pending': return 'bg-warning-muted text-warning'
      case 'Recalled': return 'bg-info-muted text-info'
      case 'Expired': return 'bg-critical-muted text-critical'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const filteredItems = collateralItems.filter(item => {
    const matchesSearch = item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalMarketValue = collateralItems.reduce((sum, item) => sum + item.marketValue, 0)
  const totalCollateralValue = collateralItems.reduce((sum, item) => sum + item.collateralValue, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-fis-green to-fis-green-dark rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Collateral Management</h1>
              <p className="text-sm text-gray-600">Monitor and manage collateral positions</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Market Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMarketValue)}</p>
                </div>
                <div className="w-8 h-8 bg-fis-green-muted rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-fis-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collateral Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollateralValue)}</p>
                </div>
                <div className="w-8 h-8 bg-info-muted rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Collateral Positions ({filteredItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Collateral Management</h3>
              <p className="text-gray-600 mb-4">
                Monitor and manage your collateral positions with real-time updates and comprehensive analytics.
              </p>
              <Button variant="success" className="mb-2">
                <Plus className="w-4 h-4 mr-2" />
                Add Collateral Position
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CollateralManagerSimple 