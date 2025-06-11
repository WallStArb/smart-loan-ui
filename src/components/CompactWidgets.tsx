import React from 'react'
import { 
  DollarSign, 
  Activity, 
  Shield, 
  TrendingUp 
} from 'lucide-react'

interface CompactMetrics {
  borrowingCosts: {
    averageRate: number
    totalCost: number
    highCostSecurities: number
    topSector: string
  }
  efficiency: {
    automationRate: number
    cureSuccessRate: number
    avgCureTime: number
    failures: number
  }
  risk: {
    concentrationRisk: number
    exposure: number
    criticalDeadlines: number
    highDeadlines: number
  }
  market: {
    yourRate: number
    marketRate: number
    performance: 'Better' | 'Worse'
    htbSecurities: number
    volatility: number
  }
}

const CompactWidgets: React.FC<{ metrics: CompactMetrics }> = ({ metrics }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
      {/* Ultra-Compact Borrowing Costs */}
      <div className="bg-white rounded-md shadow border border-gray-200 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <DollarSign className="w-3 h-3 text-purple-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">Costs</div>
            <div className="text-lg font-bold text-purple-600 leading-none">
              {metrics.borrowingCosts.averageRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-gray-500">Daily</div>
            <div className="font-semibold">{formatCurrency(metrics.borrowingCosts.totalCost)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">HTB</div>
            <div className="font-semibold text-orange-600">{metrics.borrowingCosts.highCostSecurities}</div>
          </div>
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">Top</div>
            <div className="font-semibold text-xs truncate">{metrics.borrowingCosts.topSector}</div>
          </div>
        </div>
      </div>

      {/* Ultra-Compact Efficiency */}
      <div className="bg-white rounded-md shadow border border-gray-200 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="w-3 h-3 text-green-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">Auto</div>
            <div className="text-lg font-bold text-green-600 leading-none">
              {metrics.efficiency.automationRate.toFixed(0)}%
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-gray-500">Success</div>
            <div className="font-semibold">{metrics.efficiency.cureSuccessRate}%</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">Time</div>
            <div className="font-semibold">{metrics.efficiency.avgCureTime}h</div>
          </div>
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">Fails</div>
            <div className="font-semibold text-red-600">{metrics.efficiency.failures}</div>
          </div>
        </div>
      </div>

      {/* Ultra-Compact Risk */}
      <div className="bg-white rounded-md shadow border border-gray-200 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-3 h-3 text-red-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">Risk</div>
            <div className="text-lg font-bold text-orange-600 leading-none">
              {metrics.risk.concentrationRisk.toFixed(0)}%
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-gray-500">Exp</div>
            <div className="font-semibold">${metrics.risk.exposure}M</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded text-xs">
            <span className="truncate">T+4</span>
            <span className="px-1 py-0.5 rounded font-medium bg-red-100 text-red-800">
              {metrics.risk.criticalDeadlines}
            </span>
          </div>
          <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded text-xs">
            <span className="truncate">RegSHO</span>
            <span className="px-1 py-0.5 rounded font-medium bg-orange-100 text-orange-800">
              {metrics.risk.highDeadlines}
            </span>
          </div>
        </div>
      </div>

      {/* Ultra-Compact Market Intel */}
      <div className="bg-white rounded-md shadow border border-gray-200 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-3 h-3 text-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">Market</div>
            <div className="flex items-center space-x-1">
              <div className="text-sm font-bold text-blue-600 leading-none">
                {metrics.market.yourRate.toFixed(1)}%
              </div>
              <div className={`text-xs px-1 py-0.5 rounded font-medium ${
                metrics.market.performance === 'Better' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {metrics.market.performance.charAt(0)}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-gray-500">Mkt</div>
            <div className="font-semibold">{metrics.market.marketRate.toFixed(1)}%</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">HTB</div>
            <div className="font-semibold text-orange-600">{metrics.market.htbSecurities}</div>
          </div>
          <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
            <div className="text-gray-500">Vol</div>
            <div className="font-semibold">{metrics.market.volatility}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example usage with demo data
export const CompactWidgetsDemo = () => {
  const demoMetrics: CompactMetrics = {
    borrowingCosts: {
      averageRate: 3.2,
      totalCost: 24500,
      highCostSecurities: 8,
      topSector: 'Tech'
    },
    efficiency: {
      automationRate: 87,
      cureSuccessRate: 94.2,
      avgCureTime: 2.3,
      failures: 12
    },
    risk: {
      concentrationRisk: 23,
      exposure: 15.2,
      criticalDeadlines: 8,
      highDeadlines: 3
    },
    market: {
      yourRate: 3.2,
      marketRate: 3.4,
      performance: 'Better',
      htbSecurities: 15,
      volatility: 15.3
    }
  }

  return (
    <div className="p-4 bg-gray-50">
      <h2 className="text-lg font-bold mb-4">Ultra-Compact Dashboard Widgets</h2>
      <CompactWidgets metrics={demoMetrics} />
      
      {/* Compact Sector Grid */}
      <div className="bg-white rounded-md shadow border border-gray-200">
        <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-md">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-900">Sector Costs</h3>
            <span className="text-xs text-gray-500">Rate • Cost • Vol</span>
          </div>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {[
              { sector: 'Technology', rate: 3.4, cost: 8500, volume: 145000, rank: 1 },
              { sector: 'Consumer', rate: 2.8, cost: 6200, volume: 98000, rank: 2 },
              { sector: 'Financial', rate: 2.1, cost: 4100, volume: 76000, rank: 3 },
              { sector: 'Healthcare', rate: 1.9, cost: 3800, volume: 54000, rank: 4 },
              { sector: 'Industrial', rate: 1.6, cost: 2900, volume: 42000, rank: 5 }
            ].map((sector) => (
              <div key={sector.sector} className="bg-gray-50 rounded px-2 py-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-900 truncate">{sector.sector}</span>
                  <span className={`text-xs px-1 py-0.5 rounded font-medium ${
                    sector.rank === 1 ? 'bg-red-100 text-red-800' :
                    sector.rank === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    #{sector.rank}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs text-center">
                  <div>
                    <div className="text-gray-500">Rate</div>
                    <div className="font-semibold">{sector.rate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Cost</div>
                    <div className="font-semibold">${(sector.cost / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Vol</div>
                    <div className="font-semibold">{(sector.volume / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompactWidgets 