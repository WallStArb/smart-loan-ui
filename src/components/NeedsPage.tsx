import React, { useState, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Clock,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  Download,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Settings,
  Shield,
  Building,
  Users,
  FileText,
  Columns
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import FISLogo from '@/components/ui/fis-logo'

// Mock data types
interface SecurityNeed {
  id: string
  ticker: string
  cusip: string
  description: string
  quantity: number
  marketValue: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  needReasons: {
    cnsDelivery?: number
    dvpDelivery?: number
    deficit?: number
    customerShorts?: number
    nonCustomerShorts?: number
    firmShorts?: number
  }
  // Critical 204 CNS delivery failure from prior day
  is204CNS?: boolean
  borrowRate: number
  sodQuantity: number
  curedQuantity: number
  remainingQuantity: number
  cureOptions: string[]
  isRegulatory: boolean
  agingDays: number
  lastUpdate: string
  sector?: string
  borrowCost?: number
  cureMethod?: 'Borrow' | 'Recall' | 'Pledge' | 'Auto' | null
  failedAttempts?: number
  // Outstanding positions that can be recalled/released
  outstandingLoan?: number  // Quantity currently on loan that can be recalled
  outstandingPledge?: number  // Quantity currently pledged that can be released
  // Enhanced trade activity data
  tradeActivity?: {
    // Shorts/Covers
    customerShortCovers?: number
    nonCustomerShortCovers?: number
    firmShortCovers?: number
    // Customer trading (cash and margin)
    customerCashBuys?: number
    customerCashSells?: number
    customerMarginBuys?: number
    customerMarginSells?: number
    // Non-Customer trading (cash and margin)
    nonCustomerCashBuys?: number
    nonCustomerCashSells?: number
    nonCustomerMarginBuys?: number
    nonCustomerMarginSells?: number
    // Firm trading
    firmBuys?: number
    firmSells?: number
  }
}

interface DashboardMetrics {
  totalNeeds: number
  totalNeedsChange: number
  totalMarketValue: number
  totalMarketValueChange: number
  agingNeeds: number
  agingNeedsChange: number
  regShoSecurities: number
  regShoChange: number
  rule204Securities: number
  dailyProgress: {
    target: number
    completed: number
    remaining: number
  }
  priorityBreakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
  trendingNeeds: {
    trendingUp: number
    trendingDown: number
    stable: number
  }
  cureMethods: {
    receives: number
    recalls: number
    returns: number
    borrows: number
    releases: number
  }
  borrowRecallActivity: {
    borrowsMade: number
    borrowsPending: number
    recallsMade: number
    recallsPending: number
    borrowsSuccessRate: number
    recallsSuccessRate: number
  }
}

interface AdvancedMetrics {
  borrowingCosts: {
    averageRate: number
    totalCost: number
    costChange: number
    highCostSecurities: number
    counterpartyBreakdown: Array<{
      counterparty: string
      borrowCount: number
      totalBorrowAmount: number
      weightedAverageRate: number
      dailyCost: number
    }>
  }
  operationalEfficiency: {
    automationRate: number
    averageTimeTocure: number
    cureSuccessRate: number
    failureReasons: Array<{
      reason: string
      count: number
    }>
  }
  riskMetrics: {
    concentrationRisk: number
    regulatoryDeadlines: Array<{
      type: string
      count: number
      urgency: 'Critical' | 'High' | 'Medium' | 'Low'
    }>
    counterpartyExposure: Array<{
      counterparty: string
      exposure: number
      limit: number
    }>
  }
  marketIntelligence: {
    htbSecurities: number
    rateVolatility: number
    marketComparison: {
      yourAvgRate: number
      marketAvgRate: number
      performance: 'Better' | 'Worse' | 'Neutral'
    }
  }
}

interface NeedsPageProps {
  onNavigateToParameters?: () => void
}

const NeedsPage: React.FC<NeedsPageProps> = ({ onNavigateToParameters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('priority')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedShorts, setExpandedShorts] = useState(false)
  const [showFirstRow, setShowFirstRow] = useState(true)
  const [showSecondRow, setShowSecondRow] = useState(true)
  const [showThirdRow, setShowThirdRow] = useState(true)
  
  // New UX improvements - Enhanced view modes and filtering
  const [viewMode, setViewMode] = useState<'critical-only' | 'overview' | 'detailed'>('overview')
  const [selectedSecurities, setSelectedSecurities] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  
  // Column visibility controls
  const [showColumnControls, setShowColumnControls] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({
    symbol: true,
    cusip: false,
    description: false,
    startOfDay: true,
    cured: true,
    remaining: true,
    amount: true,
    needReasons: true,
    priority: true,
    borrowRate: false
  })

  // Apply view mode filtering
  const getFilteredNeeds = () => {
    let filtered = [...securityNeeds]

    // Apply advanced filters first
    if (advancedFilters.needTypes.cns || advancedFilters.needTypes.dvp || 
        advancedFilters.needTypes.deficit || advancedFilters.needTypes.agedDeficit || 
        advancedFilters.tradeActivity.customerShorts || advancedFilters.tradeActivity.nonCustomerShorts || 
        advancedFilters.tradeActivity.firmShorts) {
      
      filtered = filtered.filter(need => {
        // Need type filters
        const needTypeMatch = 
          (advancedFilters.needTypes.cns && need.needReasons.cnsDelivery) ||
          (advancedFilters.needTypes.dvp && need.needReasons.dvpDelivery) ||
          (advancedFilters.needTypes.deficit && need.needReasons.deficit) ||
          (advancedFilters.needTypes.agedDeficit && need.needReasons.deficit && need.agingDays >= advancedFilters.agedDeficitDays)
        
        // Trade activity filters (individual)
        const tradeActivityFiltersActive = advancedFilters.tradeActivity.customerShorts || 
                                          advancedFilters.tradeActivity.nonCustomerShorts || 
                                          advancedFilters.tradeActivity.firmShorts
        
        const tradeActivityMatch = tradeActivityFiltersActive ? 
          (advancedFilters.tradeActivity.customerShorts && need.needReasons.customerShorts) ||
          (advancedFilters.tradeActivity.nonCustomerShorts && need.needReasons.nonCustomerShorts) ||
          (advancedFilters.tradeActivity.firmShorts && need.needReasons.firmShorts) : 
          true
        
        // If no need type filters are active, only apply trade activity filter
        const needTypeFiltersActive = advancedFilters.needTypes.cns || advancedFilters.needTypes.dvp || 
                                     advancedFilters.needTypes.deficit || advancedFilters.needTypes.agedDeficit
        
        return (!needTypeFiltersActive || needTypeMatch) && tradeActivityMatch
      })
    }

    // Apply view mode
    switch (viewMode) {
      case 'critical-only':
        filtered = filtered.filter(need => ['Critical', 'High'].includes(need.priority))
        break
      case 'overview':
        // Show top 15 items by priority and market value
        filtered = filtered
          .sort((a, b) => {
            const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            if (aPriority !== bPriority) return bPriority - aPriority
            return b.marketValue - a.marketValue
          })
          .slice(0, 15)
        break
      case 'detailed':
        // Show all items
        break
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(need => 
        need.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        need.cusip.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [securityNeeds, setSecurityNeeds] = useState<SecurityNeed[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)
  const [counterpartySortBy, setCounterpartySortBy] = useState<'borrowCount' | 'totalBorrowAmount' | 'dailyCost' | 'weightedAverageRate'>('dailyCost')
  const [showAllCounterparties, setShowAllCounterparties] = useState(false)
  
  // Advanced filtering state
  const [advancedFilters, setAdvancedFilters] = useState({
    needTypes: {
      cns: false,
      dvp: false,
      deficit: false,
      agedDeficit: false
    },
    agedDeficitDays: 3,
    tradeActivity: {
      customerShorts: false,
      nonCustomerShorts: false,
      firmShorts: false
    },
    showFilterPanel: false
  })

  // Initialize data
  useEffect(() => {
    const generateMockData = () => {
      const mockNeeds: SecurityNeed[] = [
        // Technology Sector
        { id: '1', ticker: 'AAPL', cusip: '037833100', description: 'Apple Inc.', quantity: 50000, marketValue: 8500000, priority: 'Critical', needReasons: { cnsDelivery: 50000, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: true, borrowRate: -2.5, sodQuantity: 50000, curedQuantity: 15000, remainingQuantity: 35000, cureOptions: ['Borrow', 'Recall'], isRegulatory: true, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 212500, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 20000, outstandingPledge: 0 },
        { id: '2', ticker: 'MSFT', cusip: '594918104', description: 'Microsoft Corporation', quantity: 40000, marketValue: 12000000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 40000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -1.8, sodQuantity: 40000, curedQuantity: 18000, remainingQuantity: 22000, cureOptions: ['Recall', 'Borrow'], isRegulatory: true, agingDays: 3, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 396000, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 25000, outstandingPledge: 5000 },
        { id: '3', ticker: 'NVDA', cusip: '67066G104', description: 'NVIDIA Corporation', quantity: 25000, marketValue: 8750000, priority: 'Critical', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 25000, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -3.2, sodQuantity: 25000, curedQuantity: 5000, remainingQuantity: 20000, cureOptions: ['Borrow', 'Pledge'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 280000, cureMethod: 'Borrow', failedAttempts: 2, outstandingLoan: 0, outstandingPledge: 8000 },
        { id: '4', ticker: 'GOOGL', cusip: '02079K305', description: 'Alphabet Inc.', quantity: 35000, marketValue: 10500000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 35000, firmShorts: 0 }, is204CNS: false, borrowRate: -1.2, sodQuantity: 35000, curedQuantity: 12000, remainingQuantity: 23000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 126000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 18000, outstandingPledge: 0 },
        { id: '5', ticker: 'CRM', cusip: '79466L302', description: 'Salesforce Inc.', quantity: 30000, marketValue: 6000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 30000, deficit: 0, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -0.8, sodQuantity: 30000, curedQuantity: 18000, remainingQuantity: 12000, cureOptions: ['Borrow', 'Anticipatory'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 48000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 10000, outstandingPledge: 0 },
        { id: '6', ticker: 'INTC', cusip: '458140100', description: 'Intel Corporation', quantity: 45000, marketValue: 1800000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 45000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.2, sodQuantity: 45000, curedQuantity: 27000, remainingQuantity: 18000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Technology', borrowCost: 3600, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 30000, outstandingPledge: 0 },
        { id: '7', ticker: 'V', cusip: '92826C839', description: 'Visa Inc.', quantity: 20000, marketValue: 4000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 20000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.5, sodQuantity: 20000, curedQuantity: 8000, remainingQuantity: 12000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Financial Services', borrowCost: 60000, cureMethod: 'Borrow', failedAttempts: 1, outstandingLoan: 15000, outstandingPledge: 0 },
        
        // Healthcare Sector
        { id: '8', ticker: 'JNJ', cusip: '477160101', description: 'Johnson & Johnson', quantity: 35000, marketValue: 5600000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 35000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.1, sodQuantity: 35000, curedQuantity: 28000, remainingQuantity: 7000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Healthcare', borrowCost: 700, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 25000, outstandingPledge: 0 },
        { id: '9', ticker: 'UNH', cusip: '91324P102', description: 'UnitedHealth Group Inc.', quantity: 25000, marketValue: 12500000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 25000, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -1.5, sodQuantity: 25000, curedQuantity: 10000, remainingQuantity: 15000, cureOptions: ['Borrow', 'Pledge'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Healthcare', borrowCost: 187500, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 0, outstandingPledge: 8000 },
        { id: '10', ticker: 'PFE', cusip: '717081103', description: 'Pfizer Inc.', quantity: 60000, marketValue: 1800000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 60000, deficit: 0, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.3, sodQuantity: 60000, curedQuantity: 42000, remainingQuantity: 18000, cureOptions: ['Borrow', 'Anticipatory'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Healthcare', borrowCost: 5400, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 35000, outstandingPledge: 0 },
        
        // Financial Services
        { id: '11', ticker: 'JPM', cusip: '46625H100', description: 'JPMorgan Chase & Co.', quantity: 40000, marketValue: 6000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 40000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.8, sodQuantity: 40000, curedQuantity: 24000, remainingQuantity: 16000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Financial Services', borrowCost: 128000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 20000, outstandingPledge: 0 },
        { id: '12', ticker: 'BAC', cusip: '060505104', description: 'Bank of America Corp.', quantity: 50000, marketValue: 1500000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 50000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.2, sodQuantity: 50000, curedQuantity: 35000, remainingQuantity: 15000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Financial Services', borrowCost: 3000, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 40000, outstandingPledge: 0 },
        { id: '13', ticker: 'GS', cusip: '38141G104', description: 'Goldman Sachs Group Inc.', quantity: 15000, marketValue: 6000000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 15000, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -1.8, sodQuantity: 15000, curedQuantity: 6000, remainingQuantity: 9000, cureOptions: ['Borrow', 'Pledge'], isRegulatory: false, agingDays: 3, lastUpdate: new Date().toLocaleTimeString(), sector: 'Financial Services', borrowCost: 162000, cureMethod: 'Borrow', failedAttempts: 1, outstandingLoan: 0, outstandingPledge: 5000 },
        { id: '14', ticker: 'AXP', cusip: '025816109', description: 'American Express Co.', quantity: 25000, marketValue: 4000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 25000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.6, sodQuantity: 25000, curedQuantity: 15000, remainingQuantity: 10000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Financial Services', borrowCost: 60000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 18000, outstandingPledge: 0 },
        
        // Consumer Discretionary
        { id: '15', ticker: 'AMZN', cusip: '023135106', description: 'Amazon.com Inc.', quantity: 30000, marketValue: 4500000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 30000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.9, sodQuantity: 30000, curedQuantity: 18000, remainingQuantity: 12000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Discretionary', borrowCost: 108000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 20000, outstandingPledge: 0 },
        { id: '16', ticker: 'HD', cusip: '437076102', description: 'Home Depot Inc.', quantity: 35000, marketValue: 14000000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 35000, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -1.4, sodQuantity: 35000, curedQuantity: 14000, remainingQuantity: 21000, cureOptions: ['Borrow', 'Pledge'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Discretionary', borrowCost: 294000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 0, outstandingPledge: 10000 },
        { id: '17', ticker: 'MCD', cusip: '580135101', description: 'McDonald\'s Corp.', quantity: 20000, marketValue: 5000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 20000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.7, sodQuantity: 20000, curedQuantity: 12000, remainingQuantity: 8000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Discretionary', borrowCost: 56000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 15000, outstandingPledge: 0 },
        { id: '18', ticker: 'NKE', cusip: '654106103', description: 'Nike Inc.', quantity: 25000, marketValue: 2500000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 25000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.1, sodQuantity: 25000, curedQuantity: 17500, remainingQuantity: 7500, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Discretionary', borrowCost: 750, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 20000, outstandingPledge: 0 },
        
        // Industrials
        { id: '19', ticker: 'BA', cusip: '097023105', description: 'Boeing Co.', quantity: 30000, marketValue: 6000000, priority: 'Critical', needReasons: { cnsDelivery: 30000, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: true, borrowRate: -2.8, sodQuantity: 30000, curedQuantity: 9000, remainingQuantity: 21000, cureOptions: ['Borrow', 'Recall'], isRegulatory: true, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Industrials', borrowCost: 588000, cureMethod: 'Borrow', failedAttempts: 1, outstandingLoan: 15000, outstandingPledge: 0 },
        { id: '20', ticker: 'CAT', cusip: '141017105', description: 'Caterpillar Inc.', quantity: 40000, marketValue: 8000000, priority: 'High', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 40000, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: -1.6, sodQuantity: 40000, curedQuantity: 16000, remainingQuantity: 24000, cureOptions: ['Borrow', 'Pledge'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Industrials', borrowCost: 384000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 0, outstandingPledge: 12000 },
        { id: '21', ticker: 'MMM', cusip: '88579Y101', description: '3M Co.', quantity: 35000, marketValue: 3500000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 35000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.5, sodQuantity: 35000, curedQuantity: 21000, remainingQuantity: 14000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Industrials', borrowCost: 70000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 25000, outstandingPledge: 0 },
        { id: '22', ticker: 'UNP', cusip: '907818108', description: 'Union Pacific Corp.', quantity: 20000, marketValue: 4000000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 20000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.2, sodQuantity: 20000, curedQuantity: 14000, remainingQuantity: 6000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Industrials', borrowCost: 1200, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 15000, outstandingPledge: 0 },
        
        // Energy
        { id: '23', ticker: 'CVX', cusip: '166764100', description: 'Chevron Corp.', quantity: 25000, marketValue: 3750000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 25000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.6, sodQuantity: 25000, curedQuantity: 15000, remainingQuantity: 10000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Energy', borrowCost: 60000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 18000, outstandingPledge: 0 },
        { id: '24', ticker: 'XOM', cusip: '30231G102', description: 'Exxon Mobil Corp.', quantity: 30000, marketValue: 3000000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 30000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.1, sodQuantity: 30000, curedQuantity: 21000, remainingQuantity: 9000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Energy', borrowCost: 900, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 25000, outstandingPledge: 0 },
        
        // Consumer Staples
        { id: '25', ticker: 'PG', cusip: '742718109', description: 'Procter & Gamble Co.', quantity: 40000, marketValue: 6000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 40000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.8, sodQuantity: 40000, curedQuantity: 24000, remainingQuantity: 16000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Staples', borrowCost: 128000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 28000, outstandingPledge: 0 },
        { id: '26', ticker: 'KO', cusip: '191216100', description: 'Coca-Cola Co.', quantity: 45000, marketValue: 2250000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 45000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.2, sodQuantity: 45000, curedQuantity: 31500, remainingQuantity: 13500, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Staples', borrowCost: 2700, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 35000, outstandingPledge: 0 },
        { id: '27', ticker: 'WMT', cusip: '931142103', description: 'Walmart Inc.', quantity: 35000, marketValue: 5250000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 35000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.7, sodQuantity: 35000, curedQuantity: 21000, remainingQuantity: 14000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Consumer Staples', borrowCost: 98000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 25000, outstandingPledge: 0 },
        
        // Communication Services
        { id: '28', ticker: 'DIS', cusip: '254687106', description: 'Walt Disney Co.', quantity: 30000, marketValue: 3000000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 30000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.1, sodQuantity: 30000, curedQuantity: 21000, remainingQuantity: 9000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Communication Services', borrowCost: 900, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 22000, outstandingPledge: 0 },
        
        // Materials
        { id: '29', ticker: 'DOW', cusip: '260557103', description: 'Dow Inc.', quantity: 40000, marketValue: 2000000, priority: 'Low', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 40000, customerShorts: 0, nonCustomerShorts: 0, firmShorts: 0 }, is204CNS: false, borrowRate: 0.3, sodQuantity: 40000, curedQuantity: 28000, remainingQuantity: 12000, cureOptions: ['Recall', 'Borrow'], isRegulatory: false, agingDays: 1, lastUpdate: new Date().toLocaleTimeString(), sector: 'Materials', borrowCost: 3600, cureMethod: 'Recall', failedAttempts: 0, outstandingLoan: 30000, outstandingPledge: 0 },
        
        // Real Estate
        { id: '30', ticker: 'AMGN', cusip: '031162100', description: 'Amgen Inc.', quantity: 25000, marketValue: 5000000, priority: 'Medium', needReasons: { cnsDelivery: 0, dvpDelivery: 0, deficit: 0, customerShorts: 0, nonCustomerShorts: 25000, firmShorts: 0 }, is204CNS: false, borrowRate: -0.9, sodQuantity: 25000, curedQuantity: 15000, remainingQuantity: 10000, cureOptions: ['Borrow', 'Recall'], isRegulatory: false, agingDays: 2, lastUpdate: new Date().toLocaleTimeString(), sector: 'Healthcare', borrowCost: 90000, cureMethod: 'Borrow', failedAttempts: 0, outstandingLoan: 18000, outstandingPledge: 0 }
      ]

      const mockMetrics: DashboardMetrics = {
        totalNeeds: 30,
        totalNeedsChange: 5,
        totalMarketValue: 185000000,
        totalMarketValueChange: 15000000,
        agingNeeds: 8,
        agingNeedsChange: 2,
        regShoSecurities: 3,
        regShoChange: 1,
        rule204Securities: 2,
        dailyProgress: {
          target: 45,
          completed: 28,
          remaining: 17
        },
        priorityBreakdown: {
          critical: 3,
          high: 8,
          medium: 12,
          low: 7
        },
        trendingNeeds: {
          trendingUp: 15,
          trendingDown: 8,
          stable: 7
        },
        cureMethods: {
          receives: 45,
          recalls: 32,
          returns: 18,
          borrows: 52,
          releases: 12
        },
        borrowRecallActivity: {
          borrowsMade: 52,
          borrowsPending: 8,
          recallsMade: 32,
          recallsPending: 5,
          borrowsSuccessRate: 92,
          recallsSuccessRate: 88
        }
      }

      const mockAdvancedMetrics: AdvancedMetrics = {
        borrowingCosts: {
          averageRate: -1.84,
          totalCost: 786500,
          costChange: -125000,
          highCostSecurities: 3,
          counterpartyBreakdown: [
            {
              counterparty: 'Counterparty A',
              borrowCount: 8,
              totalBorrowAmount: 15000000,
              weightedAverageRate: -1.5,
              dailyCost: 225000
            },
            {
              counterparty: 'Counterparty B',
              borrowCount: 5,
              totalBorrowAmount: 12000000,
              weightedAverageRate: -2.1,
              dailyCost: 252000
            },
            {
              counterparty: 'Counterparty C',
              borrowCount: 3,
              totalBorrowAmount: 8000000,
              weightedAverageRate: -1.8,
              dailyCost: 144000
            }
          ]
        },
        operationalEfficiency: {
          automationRate: 0.75,
          averageTimeTocure: 2.3,
          cureSuccessRate: 94,
          failureReasons: [
            { reason: 'No inventory available', count: 3 },
            { reason: 'Rate too high', count: 2 },
            { reason: 'Counterparty limit reached', count: 1 }
          ]
        },
        riskMetrics: {
          concentrationRisk: 0.35,
          regulatoryDeadlines: [
            { type: 'RegSHO Close-out', count: 1, urgency: 'Critical' },
            { type: 'Rule 204 CNS', count: 1, urgency: 'Critical' },
            { type: 'Aged Deficit', count: 2, urgency: 'High' }
          ],
          counterpartyExposure: [
            { counterparty: 'Counterparty A', exposure: 15000000, limit: 25000000 },
            { counterparty: 'Counterparty B', exposure: 12000000, limit: 20000000 },
            { counterparty: 'Counterparty C', exposure: 8000000, limit: 15000000 }
          ]
        },
        marketIntelligence: {
          htbSecurities: 2,
          rateVolatility: 0.15,
          marketComparison: {
            yourAvgRate: -1.84,
            marketAvgRate: -1.65,
            performance: 'Worse'
          }
        }
      }

      return { needs: mockNeeds, metrics: mockMetrics, advancedMetrics: mockAdvancedMetrics }
    }

    const { needs, metrics, advancedMetrics } = generateMockData()
    setSecurityNeeds(needs)
    setMetrics(metrics)
    setAdvancedMetrics(advancedMetrics)
  }, [])

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const filterPanel = document.querySelector('[data-filter-panel]')
      const filterButton = document.querySelector('[data-filter-button]')
      
      if (advancedFilters.showFilterPanel && 
          filterPanel && 
          !filterPanel.contains(event.target as Node) &&
          filterButton &&
          !filterButton.contains(event.target as Node)) {
        setAdvancedFilters(prev => ({ ...prev, showFilterPanel: false }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [advancedFilters.showFilterPanel])

  // Smart filter presets (after securityNeeds is initialized)
  const filterPresets = [
    {
      id: 'urgent-action',
      label: 'Urgent Action Required',
      description: 'Critical & High priority items',
      filter: (need: SecurityNeed) => ['Critical', 'High'].includes(need.priority),
      count: securityNeeds.filter(need => ['Critical', 'High'].includes(need.priority)).length
    },
    {
      id: 'regulatory-deadlines',
      label: 'Regulatory Deadlines',
      description: 'Items with regulatory requirements',
      filter: (need: SecurityNeed) => need.isRegulatory,
      count: securityNeeds.filter(need => need.isRegulatory).length
    },
    {
      id: 'high-value',
      label: 'High Value (>$1M)',
      description: 'Securities with market value over $1M',
      filter: (need: SecurityNeed) => need.marketValue > 1000000,
      count: securityNeeds.filter(need => need.marketValue > 1000000).length
    }
  ]

  // Bulk operations
  const handleBulkAction = (action: 'borrow' | 'recall' | 'release', securities: SecurityNeed[]) => {
    setIsLoading(true)
    console.log(`🔄 Bulk ${action} initiated for ${securities.length} securities`)
    
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(need => {
        if (securities.some(s => s.id === need.id)) {
          const cureAmount = Math.floor(need.remainingQuantity * 0.7)
          return {
            ...need,
            curedQuantity: need.curedQuantity + cureAmount,
            remainingQuantity: need.remainingQuantity - cureAmount,
            lastUpdate: new Date().toLocaleTimeString(),
            cureMethod: action === 'borrow' ? 'Borrow' : action === 'recall' ? 'Recall' : 'Pledge'
          }
        }
        return need
      }))
      setSelectedSecurities(new Set())
      setIsLoading(false)
    }, 2000)
  }

  const toggleSecuritySelection = (securityId: string) => {
    setSelectedSecurities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(securityId)) {
        newSet.delete(securityId)
      } else {
        newSet.add(securityId)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    const visibleIds = getFilteredNeeds().map(need => need.id)
    setSelectedSecurities(new Set(visibleIds))
  }

  const clearSelection = () => {
    setSelectedSecurities(new Set())
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      
      // Randomly update some metrics
      if (metrics) {
        const updatedMetrics = { ...metrics }
        if (Math.random() > 0.8) {
          updatedMetrics.totalNeeds += Math.floor(Math.random() * 10) - 5
          updatedMetrics.dailyProgress.completed += Math.floor(Math.random() * 3)
          updatedMetrics.dailyProgress.remaining = updatedMetrics.dailyProgress.target - updatedMetrics.dailyProgress.completed
          
          // Show toast notification for significant updates
          if (Math.random() > 0.9) {
            // console.log('Data refreshed - new securities detected')
          }
        }
        setMetrics(updatedMetrics)
      }

      // Randomly update some securities
      setSecurityNeeds(prev => prev.map(need => {
        if (Math.random() > 0.9) {
          const cureChange = Math.floor(Math.random() * 100)
          const wasFullyCured = need.remainingQuantity > 0 && (need.remainingQuantity - cureChange) <= 0
          
          const updatedNeed = {
            ...need,
            curedQuantity: Math.min(need.sodQuantity, need.curedQuantity + cureChange),
            remainingQuantity: Math.max(0, need.remainingQuantity - cureChange),
            lastUpdate: new Date().toLocaleTimeString()
          }
          
          // Show success toast when security is fully cured
          if (wasFullyCured) {
            // console.log(`${need.ticker} fully cured (${formatNumber(cureChange)} shares)`)
          }
          
          return updatedNeed
        }
        return need
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [metrics])

  // Filter and sort data
  const filteredAndSortedNeeds = getFilteredNeeds()
    .sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SecurityNeed]
      let bVal: any = b[sortColumn as keyof SecurityNeed]
      
      if (sortColumn === 'priority') {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
        aVal = priorityOrder[a.priority]
        bVal = priorityOrder[b.priority]
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const toggleRowExpansion = (needId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(needId)) {
      newExpanded.delete(needId)
    } else {
      newExpanded.add(needId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleSectionCollapse = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

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
        return 'fis-critical-gradient text-red-800 border-red-200'
      case 'High':
        return 'fis-high-gradient text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const formatNeedReason = (reason: string) => {
    if (reason === 'cnsDelivery') return 'CNS Delivery';
    if (reason === 'dvpDelivery') return 'DVP Delivery';
    if (reason === 'deficit') return 'Deficit';
    
    const spaced = reason.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  // Quick action handlers
  const handleQuickBorrow = (need: SecurityNeed) => {
    console.log(`🔄 Auto-borrowing ${formatNumber(need.remainingQuantity)} shares of ${need.ticker}`)
    // Simulate API call
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(n => 
        n.id === need.id 
          ? { ...n, curedQuantity: n.curedQuantity + Math.floor(n.remainingQuantity * 0.8), lastUpdate: new Date().toLocaleTimeString() }
          : n
      ))
    }, 2000)
  }

  const handleQuickRecall = (need: SecurityNeed) => {
    console.log(`📞 Initiating recall for ${need.ticker}`)
    // Simulate API call
    setTimeout(() => {
      setSecurityNeeds(prev => prev.map(n => 
        n.id === need.id 
          ? { ...n, curedQuantity: n.curedQuantity + Math.floor(n.remainingQuantity * 0.6), lastUpdate: new Date().toLocaleTimeString() }
          : n
      ))
    }, 1500)
  }



  // Add visual progress component
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

  if (!metrics) return <div>Loading...</div>

  return (
    <div className="fis-page-gradient p-6">
        {/* Modern Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Needs Management</h1>
                <p className="text-sm text-gray-600">Monitor and manage securities borrowing needs</p>
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
              
              <div className="flex items-center space-x-1 border-l pl-3 ml-3">
                <span className="text-xs text-gray-500">Rows:</span>
                <button
                  onClick={() => setShowFirstRow(!showFirstRow)}
                  className={`h-6 px-2 text-xs rounded border transition-colors ${
                    showFirstRow 
                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                  title="Toggle Row 1 (Need Types Breakdown)"
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
                  title="Toggle Row 2 (Progress & Priority Metrics)"
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
                  title="Toggle Row 3 (Advanced Analytics)"
                >
                  3
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">{/* Main Dashboard */}

        {/* Compact Summary Metrics Bar - Availability Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 px-2">
          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-gray-500">Critical</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-red-600">{metrics.priorityBreakdown.critical}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatCurrency(securityNeeds.filter(n => n.priority === 'Critical').reduce((sum, n) => sum + n.marketValue, 0) / 1000000).replace('$', '')}M</div>
              </div>
              <TrendingUp className="w-3 h-3 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-gray-500">Aging</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-orange-600">{metrics.agingNeeds}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">3+ days</div>
              </div>
              <TrendingDown className="w-3 h-3 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-gray-500">RegSHO</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-blue-600">{metrics.regShoSecurities}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">securities</div>
              </div>
              <TrendingUp className="w-3 h-3 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-xs font-medium text-gray-500">Progress</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-green-600">{Math.round((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100)}%</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{metrics.dailyProgress.completed}/{metrics.dailyProgress.target}</div>
              </div>
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-gray-500">Borrow Cost</span>
              <div className="flex-1 text-center">
                <span className={`text-sm font-bold ${(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length) > 0 ? '+' : ''}{(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length).toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">avg</div>
              </div>
              <TrendingDown className="w-3 h-3 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded shadow border border-gray-200 px-1.5 py-1">
            <div className="flex items-center space-x-2">
              <Target className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Total Needs</span>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-gray-900">{metrics.totalNeeds}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatCurrency(metrics.totalMarketValue / 1000000).replace('$', '')}M</div>
              </div>
              <TrendingUp className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions Cards - Availability Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 px-2">
          {/* Critical Actions */}
          <div className="bg-white rounded-lg shadow border border-red-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Critical Actions</h3>
              </div>
              <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">204 CNS Failures:</span>
                <span className="text-sm font-bold text-red-600">{securityNeeds.filter(n => n.is204CNS).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">RegSHO Close-outs:</span>
                <span className="text-sm font-bold text-red-600">{metrics.regShoSecurities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Aging 3+ Days:</span>
                <span className="text-sm font-bold text-orange-600">{securityNeeds.filter(n => n.agingDays >= 3).length}</span>
              </div>
              <div className="pt-1 border-t border-gray-200">
                <Button size="sm" className="w-full h-7 text-xs bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Prioritize All
                </Button>
              </div>
            </div>
          </div>

          {/* Borrow Opportunities */}
          <div className="bg-white rounded-lg shadow border border-blue-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Borrow Queue</h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Ready</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Pending Borrows:</span>
                <span className="text-sm font-bold text-blue-600">{metrics.borrowRecallActivity.borrowsPending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Success Rate:</span>
                <span className="text-sm font-bold text-green-600">{metrics.borrowRecallActivity.borrowsSuccessRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Avg Cost:</span>
                <span className={`text-sm font-bold ${(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length) > 0 ? '+' : ''}{(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length).toFixed(1)}%
                </span>
              </div>
              <div className="pt-1 border-t border-gray-200">
                <Button size="sm" className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Execute Borrows
                </Button>
              </div>
            </div>
          </div>

          {/* Recall Opportunities */}
          <div className="bg-white rounded-lg shadow border border-green-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-gray-900">Recall Queue</h3>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">Available</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Outstanding Loans:</span>
                <span className="text-sm font-bold text-green-600">{formatNumber(securityNeeds.reduce((sum, n) => sum + (n.outstandingLoan || 0), 0))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Recall Success:</span>
                <span className="text-sm font-bold text-green-600">{metrics.borrowRecallActivity.recallsSuccessRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Processing:</span>
                <span className="text-sm font-bold text-yellow-600">{metrics.borrowRecallActivity.recallsPending}</span>
              </div>
              <div className="pt-1 border-t border-gray-200">
                <Button size="sm" className="w-full h-7 text-xs bg-green-600 hover:bg-green-700">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Execute Recalls
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white rounded-lg shadow border border-purple-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900">Daily Progress</h3>
              </div>
              <Badge className="bg-purple-100 text-purple-800 text-xs">{Math.round((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100)}%</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Target:</span>
                <span className="text-sm font-bold text-gray-900">{metrics.dailyProgress.target}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Completed:</span>
                <span className="text-sm font-bold text-green-600">{metrics.dailyProgress.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Remaining:</span>
                <span className="text-sm font-bold text-orange-600">{metrics.dailyProgress.remaining}</span>
              </div>
              <div className="pt-1 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Securities Risk Cards - Availability Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3 px-2">
          {/* Highest Risk Securities */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Highest Risk</h3>
              </div>
              <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>
            </div>
            <div className="space-y-1">
              {securityNeeds
                .filter(n => n.priority === 'Critical' || n.is204CNS || n.agingDays >= 3)
                .slice(0, 3)
                .map((security, index) => (
                  <div key={security.id} className="flex justify-between items-center py-0.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{security.ticker}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(security.marketValue)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${
                        security.is204CNS ? 'text-red-600' : 
                        security.priority === 'Critical' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {security.is204CNS ? '204 CNS' : 
                         security.priority === 'Critical' ? 'CRITICAL' : `${security.agingDays}d`}
                      </div>
                      <div className="text-xs text-gray-500">{security.borrowRate.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              }
              {securityNeeds.filter(n => n.priority === 'Critical' || n.is204CNS || n.agingDays >= 3).length > 3 && (
                <div className="pt-1 border-t border-gray-200">
                  <div className="text-xs text-center text-gray-500">
                    +{securityNeeds.filter(n => n.priority === 'Critical' || n.is204CNS || n.agingDays >= 3).length - 3} more critical
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Highest Borrow Costs */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">High Borrow Cost</h3>
              </div>
              <Badge className="bg-red-100 text-red-800 text-xs">Expensive</Badge>
            </div>
            <div className="space-y-1">
              {securityNeeds
                .sort((a, b) => a.borrowRate - b.borrowRate) // Sort by lowest (most negative) rates = highest cost
                .slice(0, 3)
                .map((security, index) => (
                  <div key={security.id} className="flex justify-between items-center py-0.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{security.ticker}</div>
                      <div className="text-xs text-gray-500">{formatNumber(security.remainingQuantity)} shares</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${security.borrowRate < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {security.borrowRate > 0 ? '+' : ''}{security.borrowRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">{formatCurrency(security.marketValue)}</div>
                    </div>
                  </div>
                ))
              }
              <div className="pt-1 border-t border-gray-200">
                <div className="text-xs text-center text-gray-600 font-medium">
                  Avg: {(securityNeeds.reduce((sum, n) => sum + n.borrowRate, 0) / securityNeeds.length).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Largest Quantities */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Largest Needs</h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Volume</Badge>
            </div>
            <div className="space-y-1">
              {securityNeeds
                .sort((a, b) => b.marketValue - a.marketValue)
                .slice(0, 3)
                .map((security, index) => (
                  <div key={security.id} className="flex justify-between items-center py-0.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{security.ticker}</div>
                      <div className="text-xs text-gray-500">{formatNumber(security.remainingQuantity)} shares</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-600">{formatCurrency(security.marketValue)}</div>
                      <div className={`text-xs ${getPriorityColor(security.priority)}`}>{security.priority}</div>
                    </div>
                  </div>
                ))
              }
              <div className="pt-1 border-t border-gray-200">
                <div className="text-xs text-center text-blue-600 font-medium">
                  Total: {formatCurrency(metrics.totalMarketValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Cure Methods */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-semibold text-gray-900">Cure Methods</h3>
              </div>
              <Badge className="bg-green-100 text-green-800 text-xs">Total Today</Badge>
            </div>
            <div className="space-y-1">
              {/* Total Today */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Total Today:</span>
                <span className="text-lg font-bold text-green-600">{metrics.cureMethods.receives + metrics.cureMethods.recalls + metrics.cureMethods.returns + metrics.cureMethods.borrows}</span>
              </div>
              
              {/* Top Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">{metrics.cureMethods.receives}</div>
                  <div className="text-xs text-gray-500">Receives</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">{metrics.cureMethods.recalls}</div>
                  <div className="text-xs text-gray-500">Recalls</div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">{metrics.cureMethods.returns}</div>
                  <div className="text-xs text-gray-500">Returns</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600">{metrics.cureMethods.borrows}</div>
                  <div className="text-xs text-gray-500">Borrows</div>
                </div>
              </div>

              {/* Releases - if available */}
              {metrics.cureMethods.releases && (
                <div className="pt-1 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-600">{metrics.cureMethods.releases}</div>
                    <div className="text-xs text-gray-500">Releases</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Borrow & Recall Activity */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Borrow & Recall Activity</h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">Made Today</Badge>
            </div>
            <div className="space-y-1">
              {/* Made Today Numbers */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Made Today:</span>
                <span className="text-lg font-bold text-blue-600">{metrics.borrowRecallActivity.borrowsMade + metrics.borrowRecallActivity.recallsMade}</span>
              </div>
              
              {/* Borrows Section */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">{metrics.borrowRecallActivity.borrowsMade}</div>
                  <div className="text-xs text-blue-500">Borrows</div>
                  <div className="text-xs text-gray-500">Made</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600">{metrics.borrowRecallActivity.recallsMade}</div>
                  <div className="text-xs text-orange-500">Recalls</div>
                  <div className="text-xs text-gray-500">Made</div>
                </div>
              </div>

              {/* Pending Section */}
              <div className="pt-1 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-600">{metrics.borrowRecallActivity.borrowsPending}</div>
                    <div className="text-xs text-gray-500">Borrows Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-600">{metrics.borrowRecallActivity.recallsPending}</div>
                    <div className="text-xs text-gray-500">Recalls Pending</div>
                  </div>
                </div>
              </div>

              {/* Success Rates */}
              <div className="pt-1 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{metrics.borrowRecallActivity.borrowsSuccessRate}%</div>
                    <div className="text-xs text-gray-500">Borrow Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{metrics.borrowRecallActivity.recallsSuccessRate}%</div>
                    <div className="text-xs text-gray-500">Recall Success</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra-Compact Metrics Cards */}
        <div className="p-2">

          <>
          {/* First Row - Need Types Breakdown */}
          {showFirstRow && (
          <div className="fis-dashboard-section rounded-md shadow-lg mb-3">
            <div className="px-3 py-1.5 border-b border-gray-200 fis-table-header rounded-t-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Securities by Need Type</h3>
                <button
                  onClick={() => toggleSectionCollapse('needTypes')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={collapsedSections.has('needTypes') ? 'Expand section' : 'Collapse section'}
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-500 transition-transform duration-200",
                    collapsedSections.has('needTypes') ? "transform rotate-180" : ""
                  )} />
                </button>
              </div>
            </div>
            {!collapsedSections.has('needTypes') && (
              <div className="p-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* CNS Delivery */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                        <Shield className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">CNS</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.filter(need => need.needReasons.cnsDelivery).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.cnsDelivery)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.cnsDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.cnsDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.cnsDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3 * 0.6))}, 
                          Recall {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.cnsDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.cnsDelivery || 0), 0) * 0.3 * 0.4))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DVP Delivery */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                        <Building className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">DVP</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.filter(need => need.needReasons.dvpDelivery).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.dvpDelivery)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.dvpDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.dvpDelivery)
                              .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.dvpDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25 * 0.8))}, 
                          Antic. {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.dvpDelivery)
                            .reduce((sum, need) => sum + (need.needReasons.dvpDelivery || 0), 0) * 0.25 * 0.2))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Deficit */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Deficit</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                                              {securityNeeds.filter(need => need.needReasons.deficit).length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds
                          .filter(need => need.needReasons.deficit)
                          .reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds
                              .filter(need => need.needReasons.deficit)
                              .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            Math.floor(securityNeeds
                              .filter(need => need.needReasons.deficit)
                              .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Recall {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45 * 0.7))}, 
                          Borrow {formatNumber(Math.floor(securityNeeds
                            .filter(need => need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0) * 0.45 * 0.3))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Needs - Expandable */}
                <div className="col-span-1 lg:col-span-1 xl:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Short Needs</span>
                        <button
                          onClick={() => setExpandedShorts(!expandedShorts)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedShorts ? (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {securityNeeds.filter(need => 
                          need.needReasons.customerShorts || 
                          need.needReasons.nonCustomerShorts || 
                          need.needReasons.firmShorts
                        ).length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(
                          securityNeeds
                            .filter(need => 
                              need.needReasons.customerShorts || 
                              need.needReasons.nonCustomerShorts || 
                              need.needReasons.firmShorts
                            )
                            .reduce((sum, need) => sum + need.marketValue, 0)
                        )}
                      </p>
                    </div>
                    <div className="text-xs">
                      <div className="bg-gray-50 rounded p-2 min-w-32">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <span className="text-gray-500">SOD:</span>
                          <span className="font-medium">
                            {formatNumber(
                              securityNeeds.reduce((sum, need) => 
                                sum + (need.needReasons.customerShorts || 0) + 
                                (need.needReasons.nonCustomerShorts || 0) + 
                                (need.needReasons.firmShorts || 0), 0)
                            )}
                          </span>
                          <span className="text-gray-500">Cured:</span>
                          <span className="font-medium text-green-600">
                            {formatNumber(
                              Math.floor(securityNeeds.reduce((sum, need) => 
                                sum + (need.needReasons.customerShorts || 0) + 
                                (need.needReasons.nonCustomerShorts || 0) + 
                                (need.needReasons.firmShorts || 0), 0) * 0.32)
                            )}
                          </span>
                          <span className="text-gray-600 col-span-2">
                            Borrow {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => 
                              sum + (need.needReasons.customerShorts || 0) + 
                              (need.needReasons.nonCustomerShorts || 0) + 
                              (need.needReasons.firmShorts || 0), 0) * 0.32 * 0.78))}, 
                            Other {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => 
                              sum + (need.needReasons.customerShorts || 0) + 
                              (need.needReasons.nonCustomerShorts || 0) + 
                              (need.needReasons.firmShorts || 0), 0) * 0.32 * 0.22))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {expandedShorts && (
                    <div className="mt-4 ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
                      {/* Customer Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-yellow-100 rounded flex items-center justify-center">
                              <Users className="w-2 h-2 text-yellow-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Customer</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.customerShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.customerShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.customerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.customerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.customerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35 * 0.85))}, 
                                Pledge {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.customerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.customerShorts || 0), 0) * 0.35 * 0.15))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Non-Customer Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                              <Building className="w-2 h-2 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Non-Customer</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.nonCustomerShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.nonCustomerShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.nonCustomerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.nonCustomerShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.nonCustomerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4 * 0.5))}, 
                                Recall {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.nonCustomerShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.nonCustomerShorts || 0), 0) * 0.4 * 0.5))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Firm Shorts */}
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                              <BarChart3 className="w-2 h-2 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Firm</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {securityNeeds.filter(need => need.needReasons.firmShorts).length}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(
                              securityNeeds
                                .filter(need => need.needReasons.firmShorts)
                                .reduce((sum, need) => sum + need.marketValue, 0)
                            )}
                          </p>
                        </div>
                        <div className="text-xs">
                          <div className="bg-gray-50 rounded p-2 min-w-28">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <span className="text-gray-500">SOD:</span>
                              <span className="font-medium">
                                {formatNumber(
                                  securityNeeds
                                    .filter(need => need.needReasons.firmShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0)
                                )}
                              </span>
                              <span className="text-gray-500">Cured:</span>
                              <span className="font-medium text-green-600">
                                {formatNumber(
                                  Math.floor(securityNeeds
                                    .filter(need => need.needReasons.firmShorts)
                                    .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0) * 0.2)
                                )}
                              </span>
                              <span className="text-gray-600 col-span-2 text-xs">
                                Borrow {formatNumber(Math.floor(securityNeeds
                                  .filter(need => need.needReasons.firmShorts)
                                  .reduce((sum, need) => sum + (need.needReasons.firmShorts || 0), 0) * 0.2))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Securities */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <Activity className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">Total</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {securityNeeds.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(
                        securityNeeds.reduce((sum, need) => sum + need.marketValue, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="bg-gray-50 rounded p-2 min-w-32">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-gray-500">SOD:</span>
                        <span className="font-medium">
                          {formatNumber(
                            securityNeeds.reduce((sum, need) => {
                              return sum + Object.values(need.needReasons).reduce((reasonSum, qty) => reasonSum + (qty || 0), 0)
                            }, 0)
                          )}
                        </span>
                        <span className="text-gray-500">Cured:</span>
                        <span className="font-medium text-green-600">
                          {formatNumber(
                            securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0)
                          )}
                        </span>
                        <span className="text-gray-600 col-span-2">
                          Borrow {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0) * 0.65))}, 
                          Recall {formatNumber(Math.floor(securityNeeds.reduce((sum, need) => sum + need.curedQuantity, 0) * 0.35))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
          )}

          {/* Second Row - Ultra-Compact Progress and Priority */}
          {showSecondRow && (
          <div className="bg-white rounded-md shadow border border-gray-200 mb-3">
            <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Daily Progress & Priority Distribution</h3>
                <div className="flex items-center space-x-2">
                  {/* FIS Balance Line Indicator */}
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-0.5 bg-gradient-to-r from-fis-green to-gray-300"></div>
                    <span className="text-xs text-gray-500">Live</span>
                    <div className="w-1.5 h-1.5 bg-fis-green rounded-full animate-pulse"></div>
                  </div>
                  <button
                    onClick={() => toggleSectionCollapse('progress')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={collapsedSections.has('progress') ? 'Expand section' : 'Collapse section'}
                  >
                    {collapsedSections.has('progress') ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {!collapsedSections.has('progress') && (
              <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            {/* Daily Progress */}
            <div className="fis-metric-gradient rounded-md shadow-sm border border-gray-100 p-2">
              <div className="flex items-center space-x-2 mb-1">      
                <div className="w-3 h-3 bg-fis-green rounded-full shadow-sm"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Daily Progress</div>
                  <div className="text-lg font-bold text-fis-green leading-none">
                    {Math.round((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100)}%
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Target</div>
                  <div className="font-semibold">{metrics.dailyProgress.target}</div>
                </div>
              </div>
              {/* FIS Balance Line Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div 
                    className="fis-progress-gradient h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((metrics.dailyProgress.completed / metrics.dailyProgress.target) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{metrics.dailyProgress.completed} completed</span>
                  <span>{metrics.dailyProgress.remaining} remaining</span>
                </div>
              </div>
            </div>

            {/* Priority Categories */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Priority</div>
                  <div className="text-lg font-bold text-red-600 leading-none">
                    {metrics.priorityBreakdown.critical + metrics.priorityBreakdown.high}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold">{Object.values(metrics.priorityBreakdown).reduce((a, b) => a + b, 0)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-red-50 px-1.5 py-1 rounded text-center">
                  <div className="text-red-500">CRIT</div>
                  <div className="font-semibold text-red-600">{metrics.priorityBreakdown.critical}</div>
                </div>
                <div className="bg-orange-50 px-1.5 py-1 rounded text-center">
                  <div className="text-orange-500">HIGH</div>
                  <div className="font-semibold text-orange-600">{metrics.priorityBreakdown.high}</div>
                </div>
                <div className="bg-yellow-50 px-1.5 py-1 rounded text-center">
                  <div className="text-yellow-600">MED</div>
                  <div className="font-semibold text-yellow-700">{metrics.priorityBreakdown.medium}</div>
                </div>
                <div className="bg-blue-50 px-1.5 py-1 rounded text-center">
                  <div className="text-blue-500">LOW</div>
                  <div className="font-semibold text-blue-600">{metrics.priorityBreakdown.low}</div>
                </div>
              </div>
            </div>

            {/* Cure Methods */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <RefreshCw className="w-3 h-3 text-green-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Cure Methods</div>
                  <div className="text-lg font-bold text-green-600 leading-none">
                    {Object.values(metrics.cureMethods).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold">Today</div>
                </div>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                  <span>Receives</span>
                  <span className="font-semibold text-blue-600">{metrics.cureMethods.receives}</span>
                </div>
                <div className="flex justify-between bg-orange-50 px-1.5 py-0.5 rounded">
                  <span>Recalls</span>
                  <span className="font-semibold text-orange-600">{metrics.cureMethods.recalls}</span>
                </div>
                <div className="flex justify-between bg-green-50 px-1.5 py-0.5 rounded">
                  <span>Returns</span>
                  <span className="font-semibold text-green-600">{metrics.cureMethods.returns}</span>
                </div>
                <div className="flex justify-between bg-purple-50 px-1.5 py-0.5 rounded">
                  <span>Borrows</span>
                  <span className="font-semibold text-purple-600">{metrics.cureMethods.borrows}</span>
                </div>
                <div className="flex justify-between bg-yellow-50 px-1.5 py-0.5 rounded">
                  <span>Releases</span>
                  <span className="font-semibold text-yellow-600">{metrics.cureMethods.releases}</span>
                </div>
              </div>
            </div>

            {/* Borrow & Recall Activity */}
            <div className="bg-white rounded-md shadow border border-gray-200 p-2">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-3 h-3 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900">Borrow & Recall Activity</div>
                  <div className="text-lg font-bold text-indigo-600 leading-none">
                    {metrics.borrowRecallActivity.borrowsMade + metrics.borrowRecallActivity.recallsMade}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Made</div>
                  <div className="font-semibold">Today</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-0.5 text-xs mb-1">
                <div className="bg-blue-50 px-1.5 py-1 rounded text-center">
                  <div className="text-blue-500 text-xs">Borrows</div>
                  <div className="font-semibold text-blue-600">{metrics.borrowRecallActivity.borrowsMade}</div>
                  <div className="text-gray-500 text-xs">Made</div>
                </div>
                <div className="bg-orange-50 px-1.5 py-1 rounded text-center">
                  <div className="text-orange-500 text-xs">Recalls</div>
                  <div className="font-semibold text-orange-600">{metrics.borrowRecallActivity.recallsMade}</div>
                  <div className="text-gray-500 text-xs">Made</div>
                </div>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between bg-purple-50 px-1.5 py-0.5 rounded">
                  <span>Borrows Pending</span>
                  <span className="font-semibold text-purple-600">{metrics.borrowRecallActivity.borrowsPending}</span>
                </div>
                <div className="flex justify-between bg-yellow-50 px-1.5 py-0.5 rounded">
                  <span>Recalls Pending</span>
                  <span className="font-semibold text-yellow-600">{metrics.borrowRecallActivity.recallsPending}</span>
                </div>
                <div className="grid grid-cols-2 gap-0.5 text-xs">
                  <div className="bg-green-50 px-1 py-0.5 rounded text-center">
                    <div className="text-green-500 text-xs">Borrow Success</div>
                    <div className="font-semibold text-green-600">{metrics.borrowRecallActivity.borrowsSuccessRate}%</div>
                  </div>
                  <div className="bg-teal-50 px-1 py-0.5 rounded text-center">
                    <div className="text-teal-500 text-xs">Recall Success</div>
                    <div className="font-semibold text-teal-600">{metrics.borrowRecallActivity.recallsSuccessRate}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
          )}

          {/* Third Row - Ultra-Compact Advanced Analytics - Collapsible */}
          {showThirdRow && advancedMetrics && (
            <div className="bg-white rounded-md shadow border border-gray-200 mb-4">
              <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900">Advanced Analytics</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSectionCollapse('analytics')}
                    className="h-6 px-1 text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.has('analytics') ? (
                      <>
                        <ChevronDown size={16} className="mr-1" />
                        <span className="text-xs">Show Analytics</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp size={16} className="mr-1" />
                        <span className="text-xs">Hide Analytics</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {!collapsedSections.has('analytics') && (
                <div className="p-2">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Need Support Borrowing */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="w-3 h-3 text-[#1B1B6F]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Need Support Borrowing</div>
                      <div className="text-lg font-bold text-[#1B1B6F] leading-none">
                        {advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.borrowCount, 0)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Borrows</div>
                      <div className="font-semibold">Today</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                      <span>Total Amount</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.totalBorrowAmount, 0) / 1000000).replace('$', '')}M
                      </span>
                    </div>
                    <div className="flex justify-between bg-[#1B1B6F]/10 px-1.5 py-0.5 rounded">
                      <span>WAR Rate</span>
                      <span className="font-semibold text-[#1B1B6F]">{advancedMetrics.borrowingCosts.averageRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between bg-[#00a651]/10 px-1.5 py-0.5 rounded">
                      <span>Daily Cost</span>
                      <span className="font-semibold text-[#00a651]">
                        {formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.dailyCost, 0) / 1000).replace('$', '')}K
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto-Borrow Statistics */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-3 h-3 text-[#00a651]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Auto-Borrow Statistics</div>
                      <div className="text-lg font-bold text-[#00a651] leading-none">
                        {Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Attempted</div>
                      <div className="font-semibold">Today</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-[#00a651]/10 px-1.5 py-0.5 rounded">
                      <span>Successful</span>
                      <span className="font-semibold text-[#00a651]">{Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5 * 0.92)}</span>
                    </div>
                    <div className="flex justify-between bg-red-50 px-1.5 py-0.5 rounded">
                      <span>Not Filled</span>
                      <span className="font-semibold text-red-600">{Math.floor(advancedMetrics.operationalEfficiency.automationRate * 2.5 * 0.08)}</span>
                    </div>
                    <div className="flex justify-between bg-blue-50 px-1.5 py-0.5 rounded">
                      <span>Success Rate</span>
                      <span className="font-semibold text-blue-600">{advancedMetrics.operationalEfficiency.cureSuccessRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Securities */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="w-3 h-3 text-[#015B7E]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Securities</div>
                      <div className="text-lg font-bold text-[#015B7E] leading-none">
                        {securityNeeds.filter(need => need.remainingQuantity > 0).length}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">SOD</div>
                      <div className="font-semibold">{securityNeeds.length}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                      <div className="text-gray-500">Cured</div>
                      <div className="font-semibold text-[#00a651]">{securityNeeds.filter(need => need.remainingQuantity === 0).length}</div>
                    </div>
                    <div className="bg-gray-50 px-1.5 py-1 rounded text-center">
                      <div className="text-gray-500">Remain</div>
                      <div className="font-semibold text-orange-600">{securityNeeds.filter(need => need.remainingQuantity > 0).length}</div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Needs */}
                <div className="bg-white rounded-md shadow border border-gray-200 p-2 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-[#285BC5]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">Regulatory Needs</div>
                      <div className="text-lg font-bold text-[#285BC5] leading-none">
                        {formatNumber(
                          securityNeeds
                            .filter(need => need.agingDays > 3 && need.needReasons.deficit)
                            .reduce((sum, need) => sum + (need.needReasons.deficit || 0), 0)
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Aged</div>
                      <div className="font-semibold">Deficits</div>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded">
                      <span>RegSHO</span>
                      <span className="font-semibold text-red-600">{metrics.regShoSecurities}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-1.5 py-0.5 rounded">
                      <span>Rule 204</span>
                      <span className="font-semibold text-orange-600">{metrics.rule204Securities}</span>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Counterparty Borrowing - Enhanced with sorting and expand/collapse */}
          {showThirdRow && advancedMetrics && (
              <div className="bg-white rounded-md shadow border border-gray-200 mb-4">
                <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-900">Counterparty Borrowing</h3>
                    
                    {/* Summary Totals in top bar */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="text-center">
                        <span className="font-bold text-gray-900">{advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.borrowCount, 0)}</span>
                        <span className="text-gray-600 ml-1">Borrows</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-blue-700">{formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.totalBorrowAmount, 0) / 1000000).replace('$', '')}M</span>
                        <span className="text-gray-600 ml-1">Volume</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-purple-700">{advancedMetrics.borrowingCosts.averageRate.toFixed(2)}%</span>
                        <span className="text-gray-600 ml-1">Avg Rate</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-green-700">{formatCurrency(advancedMetrics.borrowingCosts.counterpartyBreakdown.reduce((sum, cp) => sum + cp.dailyCost, 0) / 1000).replace('$', '')}K</span>
                        <span className="text-gray-600 ml-1">Daily Cost</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-orange-700">{(93.5 + Math.random() * 4).toFixed(1)}%</span>
                        <span className="text-gray-600 ml-1">Fill Rate</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Sort Dropdown */}
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Sort by:</span>
                        <select 
                          value={counterpartySortBy}
                          onChange={(e) => setCounterpartySortBy(e.target.value as typeof counterpartySortBy)}
                          className="text-xs bg-transparent border border-gray-300 rounded px-1 py-0.5 text-gray-700"
                        >
                          <option value="borrowCount"># Borrows</option>
                          <option value="totalBorrowAmount">Amount</option>
                          <option value="dailyCost">Daily Cost</option>
                          <option value="weightedAverageRate">Rate</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Live Grid</span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionCollapse('counterparty')}
                        className="h-6 px-1 text-gray-500 hover:text-gray-700"
                      >
                        {collapsedSections.has('counterparty') ? (
                          <>
                            <ChevronDown size={16} className="mr-1" />
                            <span className="text-xs">Show</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp size={16} className="mr-1" />
                            <span className="text-xs">Hide</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                {!collapsedSections.has('counterparty') && (
                  <div className="p-1.5">
                    {/* Main row with 5-6 counterparties */}
                    <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 mb-2">
                      {advancedMetrics.borrowingCosts.counterpartyBreakdown
                        .sort((a, b) => {
                          switch (counterpartySortBy) {
                            case 'borrowCount':
                              return b.borrowCount - a.borrowCount
                            case 'totalBorrowAmount':
                              return b.totalBorrowAmount - a.totalBorrowAmount
                            case 'dailyCost':
                              return b.dailyCost - a.dailyCost
                            case 'weightedAverageRate':
                              return a.weightedAverageRate - b.weightedAverageRate
                            default:
                              return b.dailyCost - a.dailyCost
                          }
                        })
                        .slice(0, showAllCounterparties ? undefined : 6)
                        .map((counterparty, idx) => {
                          const avgRate = advancedMetrics.borrowingCosts.averageRate
                          const efficiency = ((avgRate - counterparty.weightedAverageRate) / avgRate) * 100
                          const fillRate = 90 + Math.random() * 8 // Mock fill rate 90-98%
                          const trend = Math.random() > 0.5 ? 'up' : 'down'
                          const trendValue = (Math.random() * 15).toFixed(1)
                          
                          return (
                            <div key={counterparty.counterparty} className="bg-gray-50 rounded px-1.5 py-1 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200 cursor-pointer group">
                              {/* Header Row */}
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-bold text-gray-900 truncate">{counterparty.counterparty}</span>
                                <div className="flex items-center space-x-1">
                                  <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                    <span>{trendValue}%</span>
                                  </div>
                                  <span className={`text-xs px-1 py-0.5 rounded-full font-bold ${
                                    idx === 0 ? 'bg-red-100 text-red-700' :
                                    idx === 1 ? 'bg-orange-100 text-orange-700' :
                                    idx === 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Metrics Grid */}
                              <div className="grid grid-cols-3 gap-0.5 text-xs mb-1">
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">WAR</div>
                                  <div className={`font-bold ${efficiency > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {counterparty.weightedAverageRate.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">Vol</div>
                                  <div className="font-bold text-blue-700">{formatCurrency(counterparty.totalBorrowAmount / 1000000).replace('$', '')}M</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-500 text-xs">Cost</div>
                                  <div className="font-bold text-purple-700">{formatCurrency(counterparty.dailyCost / 1000).replace('$', '')}K</div>
                                </div>
                              </div>
                              
                              {/* Performance Bar */}
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Fill Rate</span>
                                  <span className={`font-semibold ${fillRate > 95 ? 'text-green-600' : fillRate > 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {fillRate.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                      fillRate > 95 ? 'bg-green-500' : fillRate > 90 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${fillRate}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Bottom Row - Count & Efficiency */}
                              <div className="flex items-center justify-between mt-1 text-xs">
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-500">{counterparty.borrowCount}</span>
                                  <span className="text-gray-400">borrows</span>
                                </div>
                                <div className={`px-1 py-0.5 rounded text-xs font-medium ${
                                  efficiency > 5 ? 'bg-green-100 text-green-700' :
                                  efficiency > 0 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {efficiency > 0 ? '+' : ''}{efficiency.toFixed(0)}%
                                </div>
                              </div>
                              
                              {/* Hover Details */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 text-xs text-gray-600 border-t border-gray-200 pt-1">
                                Avg Time: {(Math.random() * 3 + 0.5).toFixed(1)}min • Success: {(92 + Math.random() * 6).toFixed(0)}%
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    
                    {/* Show More/Less Button */}
                    {advancedMetrics.borrowingCosts.counterpartyBreakdown.length > 6 && (
                      <div className="flex justify-center mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllCounterparties(!showAllCounterparties)}
                          className="h-7 px-3 text-xs"
                        >
                          <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${showAllCounterparties ? 'rotate-180' : ''}`} />
                          {showAllCounterparties ? `Show Less` : `Show ${advancedMetrics.borrowingCosts.counterpartyBreakdown.length - 6} More`}
                        </Button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

          {/* Securities Needs Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {/* Table Header */}
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Securities Needs</h2>
                  
                  {/* View Mode Controls */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">View:</span>
                    <div className="flex bg-gray-100 rounded p-1">
                      {[
                        { key: 'critical-only', label: 'Critical Only', icon: AlertTriangle },
                        { key: 'overview', label: 'Overview', icon: BarChart3 },
                        { key: 'detailed', label: 'Detailed', icon: Activity }
                      ].map(({ key, label, icon: Icon }) => (
                        <Button
                          key={key}
                          variant={viewMode === key ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode(key as any)}
                          className="h-8 px-3 text-sm"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      type="text"
                      placeholder="Search securities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 h-9 bg-background border-input focus:border-[#015B7E] focus:ring-[#015B7E]"
                    />
                  </div>
                  
                  {/* Bulk Action Buttons - Show when items are selected */}
                  {selectedSecurities.size > 0 && (
                    <>
                      <div className="h-6 w-px bg-gray-300"></div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">
                          {selectedSecurities.size} selected
                        </span>
                        <Button 
                          size="sm"
                          className="h-8 bg-[#00a651] hover:bg-[#008A44] text-white border-[#00a651]"
                          onClick={() => {
                            const selectedNeeds = filteredAndSortedNeeds.filter(need => selectedSecurities.has(need.id))
                            handleBulkAction('borrow', selectedNeeds)
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Borrow ({selectedSecurities.size})
                        </Button>
                        <Button 
                          size="sm"
                          className="h-8 bg-[#015B7E] hover:bg-[#014A68] text-white border-[#015B7E]"
                          onClick={() => {
                            const selectedNeeds = filteredAndSortedNeeds.filter(need => selectedSecurities.has(need.id))
                            handleBulkAction('recall', selectedNeeds)
                          }}
                        >
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Recall ({selectedSecurities.size})
                        </Button>
                      </div>
                    </>
                  )}
                  
                  <div className="relative">
                    <Button 
                      variant="outline"
                      size="sm"
                      className={`h-8 ${advancedFilters.showFilterPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, showFilterPanel: !prev.showFilterPanel }))}
                      data-filter-button
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {(advancedFilters.needTypes.cns || advancedFilters.needTypes.dvp || 
                        advancedFilters.needTypes.deficit || advancedFilters.needTypes.agedDeficit || 
                        advancedFilters.tradeActivity.customerShorts || advancedFilters.tradeActivity.nonCustomerShorts || 
                        advancedFilters.tradeActivity.firmShorts) && (
                        <div className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </Button>
                    
                    {/* Advanced Filter Panel */}
                    {advancedFilters.showFilterPanel && (
                      <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4" data-filter-panel>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
                            <button
                              onClick={() => setAdvancedFilters({
                                needTypes: { cns: false, dvp: false, deficit: false, agedDeficit: false },
                                agedDeficitDays: 3,
                                tradeActivity: { customerShorts: false, nonCustomerShorts: false, firmShorts: false },
                                showFilterPanel: true
                              })}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Clear All
                            </button>
                          </div>
                          
                          {/* Need Types */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Need Types</h4>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.needTypes.cns}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    needTypes: { ...prev.needTypes, cns: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">CNS Delivery</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.needTypes.dvp}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    needTypes: { ...prev.needTypes, dvp: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">DVP Delivery</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.needTypes.deficit}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    needTypes: { ...prev.needTypes, deficit: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Deficit</span>
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.needTypes.agedDeficit}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    needTypes: { ...prev.needTypes, agedDeficit: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Aged Deficit (</span>
                                <input
                                  type="number"
                                  value={advancedFilters.agedDeficitDays}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    agedDeficitDays: parseInt(e.target.value) || 3
                                  }))}
                                  min="1"
                                  max="30"
                                  className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5"
                                />
                                <span className="text-sm text-gray-700">+ days)</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3">
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Trade Activity</h4>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.tradeActivity.customerShorts}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    tradeActivity: { ...prev.tradeActivity, customerShorts: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Customer Shorts</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.tradeActivity.nonCustomerShorts}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    tradeActivity: { ...prev.tradeActivity, nonCustomerShorts: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Non-Customer Shorts</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={advancedFilters.tradeActivity.firmShorts}
                                  onChange={(e) => setAdvancedFilters(prev => ({
                                    ...prev,
                                    tradeActivity: { ...prev.tradeActivity, firmShorts: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Firm Shorts</span>
                              </label>
                            </div>
                          </div>
                          
                          {/* Filter Results Summary */}
                          <div className="border-t border-gray-200 pt-3">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">
                                {getFilteredNeeds().length} of {securityNeeds.length} securities
                              </span>
                              {(advancedFilters.needTypes.cns || advancedFilters.needTypes.dvp || 
                                advancedFilters.needTypes.deficit || advancedFilters.needTypes.agedDeficit || 
                                advancedFilters.tradeActivity.customerShorts || advancedFilters.tradeActivity.nonCustomerShorts || 
                                advancedFilters.tradeActivity.firmShorts) && (
                                <span className="text-blue-600"> (filtered)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Column Visibility Controls */}
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowColumnControls(!showColumnControls)}
                      className="h-8 mr-2"
                      title="Configure visible columns"
                    >
                      <Columns className="w-4 h-4 mr-2" />
                      Columns
                    </Button>
                    {showColumnControls && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Visible Columns</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(columnVisibility).map(([key, visible]) => {
                            const labels = {
                              symbol: 'Symbol',
                              cusip: 'CUSIP',
                              description: 'Description',
                              startOfDay: 'Start of Day',
                              cured: 'Cured',
                              remaining: 'Remaining',
                              amount: 'Amount',
                              needReasons: 'Need Reasons',
                              priority: 'Priority',
                              borrowRate: 'Borrow Rate'
                            }
                            return (
                              <label key={key} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={visible}
                                  onChange={(e) => setColumnVisibility(prev => ({
                                    ...prev,
                                    [key]: e.target.checked
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">{labels[key as keyof typeof labels]}</span>
                              </label>
                            )
                          })}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => setColumnVisibility({
                              symbol: true, cusip: false, description: false,
                              startOfDay: true, cured: true, remaining: true,
                              amount: true, needReasons: true, priority: true, borrowRate: false
                            })}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Reset to defaults
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      // console.log('Exporting securities data...')
                      setTimeout(() => {
                        // console.log(`Exported ${filteredAndSortedNeeds.length} securities to CSV`)
                      }, 1000)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              

            </div>

            {/* Enhanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="fis-table-header">
                  <tr>
                    <th className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={selectedSecurities.size === filteredAndSortedNeeds.length && filteredAndSortedNeeds.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllVisible()
                          } else {
                            clearSelection()
                          }
                        }}
                        className="rounded border-gray-300 text-fis-green focus:ring-fis-green"
                      />
                    </th>
                    <th className="px-1 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                    {columnVisibility.symbol && (
                      <th 
                        className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('ticker')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>SYMBOL</span>
                          {sortColumn === 'ticker' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.cusip && (
                      <th className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSIP</th>
                    )}
                    {columnVisibility.description && (
                      <th className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC</th>
                    )}
                    {columnVisibility.startOfDay && (
                      <th 
                        className="px-1 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('sodQuantity')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>SOD</span>
                          {sortColumn === 'sodQuantity' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.cured && (
                      <th 
                        className="px-1 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('curedQuantity')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>CURED</span>
                          {sortColumn === 'curedQuantity' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.remaining && (
                      <th 
                        className="px-1 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('remainingQuantity')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>REMAINING</span>
                          {sortColumn === 'remainingQuantity' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.amount && (
                      <th 
                        className="px-1 py-0.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('marketValue')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>AMOUNT</span>
                          {sortColumn === 'marketValue' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.needReasons && (
                      <th className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NEED REASONS</th>
                    )}
                    {columnVisibility.priority && (
                      <th 
                        className="px-1 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('priority')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>PRIORITY</span>
                          {sortColumn === 'priority' && (
                            sortDirection === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    )}
                    {columnVisibility.borrowRate && (
                      <th className="px-1 py-0.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BORROW RATE</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedNeeds.map((need) => {
                    // Helper function to render compact need reasons
                    const renderNeedReasons = () => {
                      const reasons = []
                      if (need.needReasons.cnsDelivery) reasons.push({ type: 'CNS', value: need.needReasons.cnsDelivery, color: 'bg-red-100 text-red-700' })
                      if (need.needReasons.dvpDelivery) reasons.push({ type: 'DVP', value: need.needReasons.dvpDelivery, color: 'bg-orange-100 text-orange-700' })
                      if (need.needReasons.deficit) reasons.push({ type: 'REG', value: need.needReasons.deficit, color: 'bg-red-100 text-red-800' })
                      if (need.needReasons.customerShorts) reasons.push({ type: 'CUST', value: need.needReasons.customerShorts, color: 'bg-blue-100 text-blue-700' })
                      if (need.needReasons.nonCustomerShorts) reasons.push({ type: 'NON-CUST', value: need.needReasons.nonCustomerShorts, color: 'bg-purple-100 text-purple-700' })
                      if (need.needReasons.firmShorts) reasons.push({ type: 'FIRM', value: need.needReasons.firmShorts, color: 'bg-gray-100 text-gray-700' })
                      
                      return (
                        <div className="flex flex-wrap gap-1">
                          {reasons.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reason.color}`}>
                              <span className="font-semibold">{reason.type}</span>
                              <span className="ml-1">{formatNumber(reason.value || 0)}</span>
                            </div>
                          ))}
                          {reasons.length > 3 && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{reasons.length - 3}
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <React.Fragment key={need.id}>
                        <tr className={cn(
                          "hover:bg-gray-50 transition-colors border-b border-gray-100",
                          selectedSecurities.has(need.id) && "bg-blue-50",
                          need.priority === 'Critical' && need.is204CNS && "bg-red-50",
                          need.priority === 'Critical' && !need.is204CNS && "bg-orange-50"
                        )}>
                          <td className="px-1 py-0.5">
                            <Checkbox
                              checked={selectedSecurities.has(need.id)}
                              onCheckedChange={() => toggleSecuritySelection(need.id)}
                            />
                          </td>
                          <td className="px-1 py-0.5 text-center">
                            <button
                              onClick={() => toggleRowExpansion(need.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {expandedRows.has(need.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 transform -rotate-90" />
                              )}
                            </button>
                          </td>
                          {columnVisibility.symbol && (
                            <td className="px-1 py-0.5">
                              <div className="flex items-center space-x-1">
                                <span className="font-semibold text-gray-900 text-sm">{need.ticker}</span>
                                {need.is204CNS && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 animate-pulse">204</span>
                                )}
                                {need.isRegulatory && (
                                  <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0">REG</Badge>
                                )}
                                {need.agingDays > 3 && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs px-1 py-0">{need.agingDays}d</Badge>
                                )}
                              </div>
                            </td>
                          )}
                          {columnVisibility.cusip && (
                            <td className="px-1 py-0.5">
                              <span className="text-xs text-gray-600 font-mono">{need.cusip}</span>
                            </td>
                          )}
                          {columnVisibility.description && (
                            <td className="px-1 py-0.5">
                              <div className="text-sm text-gray-900 truncate max-w-32">{need.description}</div>
                            </td>
                          )}
                          {columnVisibility.startOfDay && (
                            <td className="px-1 py-0.5 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(need.sodQuantity)}</div>
                            </td>
                          )}
                          {columnVisibility.cured && (
                            <td className="px-1 py-0.5 text-right">
                              <div className={`text-sm font-medium ${need.curedQuantity === need.sodQuantity ? 'text-green-600' : need.curedQuantity > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                                {formatNumber(need.curedQuantity)}
                              </div>
                            </td>
                          )}
                          {columnVisibility.remaining && (
                            <td className="px-1 py-0.5 text-right">
                              <div className={`text-sm font-medium ${need.remainingQuantity === 0 ? 'text-green-600' : need.remainingQuantity > need.sodQuantity * 0.5 ? 'text-red-600' : 'text-orange-600'}`}>
                                {formatNumber(need.remainingQuantity)}
                              </div>
                            </td>
                          )}
                          {columnVisibility.amount && (
                            <td className="px-1 py-0.5 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(need.marketValue)}</div>
                            </td>
                          )}
                          {columnVisibility.needReasons && (
                            <td className="px-1 py-0.5">
                              {renderNeedReasons()}
                            </td>
                          )}
                          {columnVisibility.priority && (
                            <td className="px-1 py-0.5 text-center">
                              <Badge className={cn("text-xs font-medium px-1 py-0.5", getPriorityColor(need.priority))}>
                                {need.priority}
                              </Badge>
                            </td>
                          )}
                          {columnVisibility.borrowRate && (
                            <td className="px-1 py-0.5 text-center">
                              <div className="text-sm font-medium text-gray-900">{need.borrowRate.toFixed(2)}%</div>
                            </td>
                          )}
                        </tr>
                      
                                             {/* Expandable Details Row */}
                                               {expandedRows.has(need.id) && (
                           <tr className="bg-gray-50">
                                                         <td colSpan={2 + Object.values(columnVisibility).filter(Boolean).length} className="px-4 py-3">
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                                {/* Need Breakdown & Progress */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <FileText className="w-4 h-4 mr-1" />
                                      Need Breakdown
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      {(need.needReasons.cnsDelivery || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">CNS Delivery:</span>
                                          <span className="font-medium text-red-600">{formatNumber(need.needReasons.cnsDelivery || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.dvpDelivery || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">DVP Delivery:</span>
                                          <span className="font-medium text-orange-600">{formatNumber(need.needReasons.dvpDelivery || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.deficit || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Deficit:</span>
                                          <span className="font-medium text-red-700">{formatNumber(need.needReasons.deficit || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.customerShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Customer:</span>
                                          <span className="font-medium text-blue-600">{formatNumber(need.needReasons.customerShorts || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.nonCustomerShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Non-Customer:</span>
                                          <span className="font-medium text-purple-600">{formatNumber(need.needReasons.nonCustomerShorts || 0)}</span>
                                        </div>
                                      )}
                                      {(need.needReasons.firmShorts || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Firm:</span>
                                          <span className="font-medium text-gray-600">{formatNumber(need.needReasons.firmShorts || 0)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-3 pt-2 border-t">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium">{((need.quantity - need.remainingQuantity) / need.quantity * 100).toFixed(1)}%</span>
                                      </div>
                                      <CureProgressBar need={need} />
                                    </div>
                                  </div>
                                </div>

                                {/* Actions & Status */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <Settings className="w-4 h-4 mr-1" />
                                      Quick Actions
                                    </h4>
                                    <div className="space-y-2">
                                      {/* Always show Borrow option */}
                                      <Button
                                        size="sm"
                                        onClick={() => handleQuickBorrow(need)}
                                        className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                                        variant="outline"
                                      >
                                        🔄 Borrow {formatNumber(need.remainingQuantity)}
                                      </Button>
                                      
                                      {/* Only show Recall if there's an outstanding loan */}
                                      {need.outstandingLoan && need.outstandingLoan > 0 && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleQuickRecall(need)}
                                          className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 h-8"
                                          variant="outline"
                                        >
                                          📞 Recall {formatNumber(need.outstandingLoan)}
                                        </Button>
                                      )}
                                      
                                      {/* Only show Release Pledge if there's an outstanding pledge */}
                                      {need.outstandingPledge && need.outstandingPledge > 0 && (
                                        <Button
                                          size="sm"
                                          className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50 h-8"
                                          variant="outline"
                                        >
                                          🔓 Release Pledge {formatNumber(need.outstandingPledge)}
                                        </Button>
                                      )}
                                      
                                      {/* Show if no existing positions available */}
                                      {(!need.outstandingLoan || need.outstandingLoan === 0) && (!need.outstandingPledge || need.outstandingPledge === 0) && (
                                        <div className="text-xs text-gray-500 italic py-2 px-3 bg-gray-50 rounded">
                                          No existing loans or pledges to recall/release
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Outstanding Positions Summary */}
                                    <div className="mt-3 pt-2 border-t text-xs">
                                      <div className="text-gray-700 font-medium mb-1">Outstanding Positions:</div>
                                      {need.outstandingLoan && need.outstandingLoan > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                          <span>On Loan:</span>
                                          <span className="font-medium text-orange-600">{formatNumber(need.outstandingLoan)}</span>
                                        </div>
                                      )}
                                      {need.outstandingPledge && need.outstandingPledge > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                          <span>Pledged:</span>
                                          <span className="font-medium text-purple-600">{formatNumber(need.outstandingPledge)}</span>
                                        </div>
                                      )}
                                      {(!need.outstandingLoan || need.outstandingLoan === 0) && (!need.outstandingPledge || need.outstandingPledge === 0) && (
                                        <div className="text-gray-500 text-xs">None</div>
                                      )}
                                      
                                      {/* Coverage Analysis */}
                                      {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) > 0 && (
                                        <div className="mt-2 pt-1 border-t border-gray-100">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">Available Coverage:</span>
                                            <span className={`font-medium ${
                                              ((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) >= need.remainingQuantity 
                                                ? 'text-green-600' 
                                                : 'text-yellow-600'
                                            }`}>
                                              {formatNumber((need.outstandingLoan || 0) + (need.outstandingPledge || 0))} / {formatNumber(need.remainingQuantity)}
                                            </span>
                                          </div>
                                          {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) >= need.remainingQuantity && (
                                            <div className="text-xs text-green-600 mt-1">✓ Sufficient to cover need</div>
                                          )}
                                          {((need.outstandingLoan || 0) + (need.outstandingPledge || 0)) < need.remainingQuantity && (
                                            <div className="text-xs text-yellow-600 mt-1">⚠ Partial coverage only</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Counterparty Availability */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <Users className="w-4 h-4 mr-1" />
                                      Availability
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Goldman:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-green-600">{formatNumber(Math.floor(need.remainingQuantity * 0.6))}</span>
                                          <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Morgan:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-green-600">{formatNumber(Math.floor(need.remainingQuantity * 0.3))}</span>
                                          <Badge className="bg-green-100 text-green-800 text-xs px-1">✓</Badge>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">JPMorgan:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-medium text-yellow-600">{formatNumber(Math.floor(need.remainingQuantity * 0.1))}</span>
                                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1">~</Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                                      <div className="flex justify-between">
                                        <span>Rate Range:</span>
                                        <span>2.5% - 4.2%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Updated:</span>
                                        <span>2 min ago</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Trade Activity */}
                                <div className="lg:col-span-1">
                                  <div className="bg-white rounded-lg border p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                      <Activity className="w-4 h-4 mr-1" />
                                      Trade activity
                                    </h4>
                                    <div className="space-y-1.5 text-xs">
                                      {/* Customer Shorts/Cover */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Customer Shorts/Cover:</span>
                                        <span className="font-medium">
                                          <span className="text-blue-600">{formatNumber(need.needReasons.customerShorts || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.customerShortCovers || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.needReasons.customerShorts || 0) - (need.tradeActivity?.customerShortCovers || 0))}</span>
                                        </span>
                                      </div>
                                      
                                      {/* Non-Customer Shorts/Cover */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Non-Customer Shorts/Cover:</span>
                                        <span className="font-medium">
                                          <span className="text-purple-600">{formatNumber(need.needReasons.nonCustomerShorts || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.nonCustomerShortCovers || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.needReasons.nonCustomerShorts || 0) - (need.tradeActivity?.nonCustomerShortCovers || 0))}</span>
                                        </span>
                                      </div>
                                      
                                      {/* Firm Shorts/Cover */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Firm Shorts/Cover:</span>
                                        <span className="font-medium">
                                          <span className="text-gray-600">{formatNumber(need.needReasons.firmShorts || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.firmShortCovers || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.needReasons.firmShorts || 0) - (need.tradeActivity?.firmShortCovers || 0))}</span>
                                        </span>
                                      </div>

                                      {/* Separator */}
                                      <div className="border-t border-gray-200 my-2"></div>

                                      {/* Customer Cash Buy/Sell */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Customer Cash Buy/Sell:</span>
                                        <span className="font-medium">
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.customerCashBuys || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-red-600">{formatNumber(need.tradeActivity?.customerCashSells || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.tradeActivity?.customerCashBuys || 0) - (need.tradeActivity?.customerCashSells || 0))}</span>
                                        </span>
                                      </div>

                                      {/* Customer Margin Buy/Sell */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Customer Margin Buy/Sell:</span>
                                        <span className="font-medium">
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.customerMarginBuys || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-red-600">{formatNumber(need.tradeActivity?.customerMarginSells || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.tradeActivity?.customerMarginBuys || 0) - (need.tradeActivity?.customerMarginSells || 0))}</span>
                                        </span>
                                      </div>

                                      {/* Non-Customer Cash Buy/Sell */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Non-Customer Cash Buy/Sell:</span>
                                        <span className="font-medium">
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.nonCustomerCashBuys || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-red-600">{formatNumber(need.tradeActivity?.nonCustomerCashSells || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.tradeActivity?.nonCustomerCashBuys || 0) - (need.tradeActivity?.nonCustomerCashSells || 0))}</span>
                                        </span>
                                      </div>

                                      {/* Non-Customer Margin Buy/Sell */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Non-Customer Margin Buy/Sell:</span>
                                        <span className="font-medium">
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.nonCustomerMarginBuys || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-red-600">{formatNumber(need.tradeActivity?.nonCustomerMarginSells || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.tradeActivity?.nonCustomerMarginBuys || 0) - (need.tradeActivity?.nonCustomerMarginSells || 0))}</span>
                                        </span>
                                      </div>

                                      {/* Firm Buy/Sell */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Firm Buy/Sell:</span>
                                        <span className="font-medium">
                                          <span className="text-green-600">{formatNumber(need.tradeActivity?.firmBuys || 0)}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-red-600">{formatNumber(need.tradeActivity?.firmSells || 0)}</span>
                                          <span className="ml-2 text-gray-800">{formatNumber((need.tradeActivity?.firmBuys || 0) - (need.tradeActivity?.firmSells || 0))}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        </div>
      </div>

      {/* System Description */}
      <div className="bg-white border-t border-gray-200 p-6 mt-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Securities Needs Management System</h2>
          
          {/* Executive Summary */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">System Purpose & Business Value</h3>
            <p className="text-blue-800 leading-relaxed">
              The Securities Needs Management System provides real-time monitoring and resolution of securities delivery obligations, 
              regulatory failures, and short covering requirements. It aggregates needs from multiple sources including CNS deliveries, 
              DVP settlements, customer shorts, and regulatory deficits, providing traders with comprehensive visibility and automated 
              cure options to ensure timely settlement and regulatory compliance.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 p-5 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3">Critical Need Detection</h3>
              <p className="text-sm text-red-800 mb-3">
                Automatically identifies and prioritizes critical needs including 204 CNS failures, aged deficits, and regulatory violations 
                requiring immediate attention.
              </p>
              <div className="text-xs text-red-700 space-y-1">
                <div><strong>204 CNS Failures:</strong> Prior day CNS delivery failures requiring immediate resolution</div>
                <div><strong>Aged Deficits:</strong> Multi-day fails approaching regulatory limits</div>
                <div><strong>Regulatory Shorts:</strong> Reg SHO close-out requirements</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-5 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Automated Cure Options</h3>
              <p className="text-sm text-green-800 mb-3">
                Provides multiple cure mechanisms including borrows, recalls, pledges, and anticipated receives with real-time 
                availability and cost analysis.
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <div><strong>Smart Borrowing:</strong> Automated counterparty selection based on rates and availability</div>
                <div><strong>Recall Management:</strong> Efficient recall of existing loans with optimal timing</div>
                <div><strong>Pledge Optimization:</strong> Strategic use of pledged securities for settlement</div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-5 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">Real-Time Analytics</h3>
              <p className="text-sm text-purple-800 mb-3">
                Comprehensive metrics including borrowing costs, counterparty performance, operational efficiency, and risk exposure 
                to support informed decision-making.
              </p>
              <div className="text-xs text-purple-700 space-y-1">
                <div><strong>Cost Analysis:</strong> Real-time borrowing costs and rate trends</div>
                <div><strong>Performance Metrics:</strong> Cure success rates and efficiency measures</div>
                <div><strong>Risk Monitoring:</strong> Concentration risk and regulatory deadline tracking</div>
              </div>
            </div>
          </div>

          {/* Workflow Process */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Typical Daily Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-b from-red-50 to-red-100 p-4 rounded-lg text-center">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <h4 className="font-semibold text-red-900 mb-2">Morning Review</h4>
                <p className="text-xs text-red-800">Review overnight fails, 204 CNS issues, and critical needs requiring immediate attention</p>
              </div>
              <div className="bg-gradient-to-b from-orange-50 to-orange-100 p-4 rounded-lg text-center">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <h4 className="font-semibold text-orange-900 mb-2">Prioritization</h4>
                <p className="text-xs text-orange-800">System automatically prioritizes needs by regulatory requirements, aging, and market value</p>
              </div>
              <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <h4 className="font-semibold text-yellow-900 mb-2">Cure Execution</h4>
                <p className="text-xs text-yellow-800">Execute cures through borrowing, recalls, or pledges based on cost and availability</p>
              </div>
              <div className="bg-gradient-to-b from-green-50 to-green-100 p-4 rounded-lg text-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                <h4 className="font-semibold text-green-900 mb-2">Monitoring</h4>
                <p className="text-xs text-green-800">Track cure progress, settlement confirmations, and new needs throughout the day</p>
              </div>
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">5</div>
                <h4 className="font-semibold text-blue-900 mb-2">Reporting</h4>
                <p className="text-xs text-blue-800">Generate end-of-day reports on cure success, costs, and outstanding needs</p>
              </div>
            </div>
          </div>

          {/* Integration Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Risk Mitigation</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>Regulatory Compliance:</strong> Automated tracking of Reg SHO close-out requirements</li>
                  <li>• <strong>Settlement Risk:</strong> Early identification and resolution of potential fails</li>
                  <li>• <strong>Cost Control:</strong> Optimal cure selection based on real-time market rates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Operational Efficiency</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Automated Workflows:</strong> Streamlined cure processes with minimal manual intervention</li>
                  <li>• <strong>Real-Time Visibility:</strong> Comprehensive dashboard with drill-down capabilities</li>
                  <li>• <strong>Performance Analytics:</strong> Detailed metrics for continuous process improvement</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integration & Data Sources</h3>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg text-center flex-1">
                <div className="font-semibold text-blue-900">CNS/DVP Systems</div>
                <div className="text-xs text-blue-800">Delivery obligations & settlement instructions</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="bg-green-100 p-3 rounded-lg text-center flex-1">
                <div className="font-semibold text-green-900">Trade Systems</div>
                <div className="text-xs text-green-800">Short positions & customer activity</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="bg-purple-100 p-3 rounded-lg text-center flex-1">
                <div className="font-semibold text-purple-900">Needs Engine</div>
                <div className="text-xs text-purple-800">Aggregation & prioritization</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="bg-orange-100 p-3 rounded-lg text-center flex-1">
                <div className="font-semibold text-orange-900">Cure Execution</div>
                <div className="text-xs text-orange-800">Automated resolution workflows</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NeedsPage

