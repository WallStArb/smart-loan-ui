import React, { useState, useEffect } from 'react'
import { 
  Search, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Filter,
  Plus,
  Download,
  Eye,
  Building2,
  CreditCard,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Account {
  id: string
  accountName: string
  hypothetical: boolean
  loanBalance: number
  creditLine: number
  collateralValue: number
  marketValue: number
  haircut: number  // Haircut percentage (e.g., 5 for 5%)
  availToRecall: number
  maxAvailToPledge: number
  balanceUpdated: string
  updatedBy: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  utilizationRatio: number
  marginCallStatus: 'None' | 'Warning' | 'Call' | 'Urgent'
  accountType: 'Customer' | 'Non-Customer' | 'Firm' | 'Triparty'
  concentration: number
  lastActivity: string
}

interface CollateralMetrics {
  totalCollateralValue: number
  totalLoanBalance: number
  totalCreditLine: number
  overallUtilization: number
  accountsAtRisk: number
  marginCalls: number
  availableCapacity: number
  pledgedSecurities: number
  recallOpportunities: number
}

const CollateralManager = () => {
  const [activeTab, setActiveTab] = useState('account')
  const [activeSubNav, setActiveSubNav] = useState('Collateral Manager')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [accounts, setAccounts] = useState<Account[]>([])
  const [metrics, setMetrics] = useState<CollateralMetrics | null>(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [sortColumn, setSortColumn] = useState('riskLevel')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [editingBalance, setEditingBalance] = useState<string | null>(null)
  const [tempBalance, setTempBalance] = useState('')

  const subNavItems = [
    'Collateral Manager', 
    'Pledge/Recall Status', 
    'Collateral Exclusions', 
    'File Upload', 
    'Recall Priority'
  ]

  useEffect(() => {
    const generateAccounts = (): Account[] => {
      const riskLevels: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical']
      const marginStatuses: Array<'None' | 'Warning' | 'Call' | 'Urgent'> = ['None', 'Warning', 'Call', 'Urgent']

      // Helper function to get account details based on account number
      const getAccountDetails = (accountNumber: string) => {
        const num = parseInt(accountNumber)
        
        if (num >= 690 && num < 700) {
          // 06XX range - Customer Bank Loans
          const index = num - 690 + 1
          return {
            name: `Customer Bank Loan ${index}`,
            type: 'Customer' as const
          }
        } else if (num >= 700 && num < 800) {
          // 07XX range - Firm accounts
          const index = num - 700 + 1
          return {
            name: `Firm Account ${index}`,
            type: 'Firm' as const
          }
        } else if (num >= 800 && num < 900) {
          // 08XX range - Non-Customer accounts
          const index = num - 800 + 1
          return {
            name: `Non-Customer Account ${index}`,
            type: 'Non-Customer' as const
          }
        } else if (num >= 900 && num < 1000) {
          // 09XX range - Tri-Party accounts
          const index = num - 900 + 1
          return {
            name: `Tri-Party Account ${index}`,
            type: 'Triparty' as const
          }
        } else {
          // Fallback for other ranges
          return {
            name: `Account ${num}`,
            type: 'Customer' as const
          }
        }
      }

      return Array.from({ length: 15 }, (_, i) => {
        const loanBalanceRaw = Math.random() * 490000000 + 10000000; // 10M to 500M
        const loanBalance = Math.round(loanBalanceRaw / 10000000) * 10000000;
        
        const creditLineRaw = loanBalance * (1.2 + Math.random() * 0.8); // 120% to 200% of loan
        const creditLine = Math.round(creditLineRaw / 10000000) * 10000000;
        
        const haircut = 2 + Math.random() * 13
        const marketValueMultiplier = 0.9 + Math.random() * 0.3
        const marketValue = loanBalance * marketValueMultiplier
        const collateralValue = marketValue * (1 - haircut / 100)
        
        const utilizationRatio = (loanBalance / creditLine) * 100
        const isUnderCollateralized = collateralValue < loanBalance;

        // Logical Risk Calculation
        let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
        if (isUnderCollateralized || utilizationRatio > 95) {
          riskLevel = 'Critical';
        } else if (utilizationRatio > 85) {
          riskLevel = 'High';
        } else if (utilizationRatio > 65) {
          riskLevel = 'Medium';
        } else {
          riskLevel = 'Low';
        }
        
        const marginStatuses: Array<'None' | 'Warning' | 'Call' | 'Urgent'> = ['None', 'Warning', 'Call', 'Urgent']
        let marginCallStatus: 'None' | 'Warning' | 'Call' | 'Urgent' = 'None';
        if (isUnderCollateralized) {
            marginCallStatus = marginStatuses[Math.floor(Math.random() * 2) + 2]; // Call or Urgent
        } else if (utilizationRatio > 85) {
            marginCallStatus = 'Warning';
        }

        let accountNumber: string
        if (i < 4) {
          accountNumber = `${String(690 + i).padStart(4, '0')}`
        } else if (i < 8) {
          accountNumber = `${String(700 + (i - 4)).padStart(4, '0')}`
        } else if (i < 12) {
          accountNumber = `${String(800 + (i - 8)).padStart(4, '0')}`
        } else {
          accountNumber = `${String(900 + (i - 12)).padStart(4, '0')}`
        }

        const accountDetails = getAccountDetails(accountNumber)
        
        return {
          id: accountNumber,
          accountName: accountDetails.name,
          hypothetical: Math.random() > 0.8,
          loanBalance,
          creditLine,
          collateralValue,
          marketValue,
          haircut,
          availToRecall: Math.max(0, collateralValue - loanBalance),
          maxAvailToPledge: Math.max(0, creditLine - loanBalance),
          balanceUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString(),
          updatedBy: ['ujwala', 'Gitesh5', 'BGoyette', 'system', 'admin'][Math.floor(Math.random() * 5)],
          riskLevel,
          utilizationRatio,
          marginCallStatus,
          accountType: accountDetails.type,
          concentration: Math.random() * 40 + 5,
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString()
        }
      })
    }

    const accountData = generateAccounts()
    setAccounts(accountData)

    const totalCollateralValue = accountData.reduce((sum, acc) => sum + acc.collateralValue, 0)
    const totalLoanBalance = accountData.reduce((sum, acc) => sum + acc.loanBalance, 0)
    const totalCreditLine = accountData.reduce((sum, acc) => sum + acc.creditLine, 0)
    const accountsAtRisk = accountData.filter(acc => acc.riskLevel === 'High' || acc.riskLevel === 'Critical').length
    const marginCalls = accountData.filter(acc => acc.marginCallStatus === 'Call' || acc.marginCallStatus === 'Urgent').length

    setMetrics({
      totalCollateralValue,
      totalLoanBalance,
      totalCreditLine,
      overallUtilization: (totalLoanBalance / totalCreditLine) * 100,
      accountsAtRisk,
      marginCalls,
      availableCapacity: totalCreditLine - totalLoanBalance,
      pledgedSecurities: Math.floor(Math.random() * 500) + 200,
      recallOpportunities: Math.floor(Math.random() * 50) + 15
    })
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

  const formatMillions = (value: number) => {
    const millions = value / 1000000
    return `$${Math.round(millions)}MM`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-red-700 bg-red-50 border-red-200'
      case 'High': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'Low': return 'text-green-700 bg-green-50 border-green-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getMarginCallColor = (status: string) => {
    switch (status) {
      case 'Urgent': return 'text-red-700 bg-red-100'
      case 'Call': return 'text-orange-700 bg-orange-100'
      case 'Warning': return 'text-yellow-700 bg-yellow-100'
      default: return 'text-green-700 bg-green-100'
    }
  }

  const toggleRowExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedRows)
    newExpanded.has(accountId) ? newExpanded.delete(accountId) : newExpanded.add(accountId)
    setExpandedRows(newExpanded)
  }

  const toggleSectionCollapse = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    newCollapsed.has(sectionId) ? newCollapsed.delete(sectionId) : newCollapsed.add(sectionId)
    setCollapsedSections(newCollapsed)
  }

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortDirection(newDirection)
    setSortColumn(column)
  }

  // Helper function to get collateral status
  const getCollateralStatus = (account: Account) => {
    const difference = account.collateralValue - account.loanBalance
    const percentage = Math.abs((difference / account.loanBalance) * 100)
    
    if (difference > 0) {
      return {
        status: 'over',
        type: 'Over-Collateralized', 
        amount: difference,
        percentage,
        color: 'text-green-700 bg-green-50 border-green-200',
        bgColor: 'bg-green-100',
        icon: '↗',
        action: 'Can Recall'
      }
    } else if (difference < 0) {
      return {
        status: 'under',
        type: 'Under-Collateralized',
        amount: Math.abs(difference),
        percentage,
        color: 'text-red-700 bg-red-50 border-red-200', 
        bgColor: 'bg-red-100',
        icon: '↘',
        action: 'Need to Pledge'
      }
    } else {
      return {
        status: 'adequate',
        type: 'Adequately Collateralized',
        amount: 0,
        percentage: 0,
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        bgColor: 'bg-blue-100',
        icon: '→',
        action: 'Balanced'
      }
    }
  }

  // Handle loan balance editing
  const handleBalanceEdit = (accountId: string, currentBalance: number) => {
    setEditingBalance(accountId)
    setTempBalance(currentBalance.toString())
  }

  const handleBalanceSave = (accountId: string) => {
    const newBalance = parseFloat(tempBalance)
    if (!isNaN(newBalance) && newBalance > 0) {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, loanBalance: newBalance, utilizationRatio: (newBalance / acc.creditLine) * 100 }
          : acc
      ))
    }
    setEditingBalance(null)
    setTempBalance('')
  }

  const handleBalanceCancel = () => {
    setEditingBalance(null)
    setTempBalance('')
  }

  // Generate mock securities data for "By Security" view
  const generateSecurities = () => {
    const securities = [
      { symbol: 'AAPL', cusip: '037833100', name: 'Apple Inc' },
      { symbol: 'MSFT', cusip: '594918104', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', cusip: '02079K305', name: 'Alphabet Inc Class A' },
      { symbol: 'TSLA', cusip: '88160R101', name: 'Tesla Inc' },
      { symbol: 'NVDA', cusip: '67066G104', name: 'NVIDIA Corporation' },
      { symbol: 'JPM', cusip: '46625H100', name: 'JPMorgan Chase & Co' },
      { symbol: 'JNJ', cusip: '478160104', name: 'Johnson & Johnson' },
      { symbol: 'V', cusip: '92826C839', name: 'Visa Inc Class A' },
      { symbol: 'PG', cusip: '742718109', name: 'Procter & Gamble Company' },
      { symbol: 'UNH', cusip: '91324P102', name: 'UnitedHealth Group Inc' },
      { symbol: 'HD', cusip: '437076102', name: 'Home Depot Inc' },
      { symbol: 'MA', cusip: '57636Q104', name: 'Mastercard Inc Class A' },
    ]

    return securities.map(security => {
      // Generate pledged positions across different accounts
      const pledgedPositions = accounts
        .filter(() => Math.random() > 0.3) // Not all securities are pledged to all accounts
        .map(account => ({
          accountId: account.id,
          accountName: account.accountName,
          pledgedQuantity: Math.floor(Math.random() * 10000) + 1000,
          marketValue: (Math.random() * 500000) + 100000,
          haircut: account.haircut,
          collateralValue: 0 // Will be calculated
        }))
        .filter(position => position.pledgedQuantity > 0)

      // Calculate collateral values
      pledgedPositions.forEach(position => {
        position.collateralValue = position.marketValue * (1 - position.haircut / 100)
      })

      const totalPledgedQuantity = pledgedPositions.reduce((sum, pos) => sum + pos.pledgedQuantity, 0)
      const totalMarketValue = pledgedPositions.reduce((sum, pos) => sum + pos.marketValue, 0)
      const totalCollateralValue = pledgedPositions.reduce((sum, pos) => sum + pos.collateralValue, 0)

      return {
        ...security,
        pledgedPositions,
        totalPledgedQuantity,
        totalMarketValue,
        totalCollateralValue,
        currentPrice: totalMarketValue / totalPledgedQuantity || 0,
        sector: ['Technology', 'Financial', 'Healthcare', 'Consumer Goods', 'Industrial'][Math.floor(Math.random() * 5)]
      }
    }).filter(security => security.pledgedPositions.length > 0)
  }

  const [securities] = useState(() => generateSecurities())

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.id.includes(searchTerm)
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'risk' && (account.riskLevel === 'High' || account.riskLevel === 'Critical')) ||
                         (selectedFilter === 'margin' && account.marginCallStatus !== 'None') ||
                         (selectedFilter === 'customer' && account.accountType === 'Customer') ||
                         (selectedFilter === 'firm' && account.accountType === 'Firm')
    return matchesSearch && matchesFilter
  })

  const filteredSecurities = securities.filter(security => {
    const matchesSearch = security.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         security.cusip.includes(searchTerm) ||
                         security.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'risk' && security.pledgedPositions.some(pos => {
                           const account = accounts.find(acc => acc.id === pos.accountId)
                           return account && (account.riskLevel === 'High' || account.riskLevel === 'Critical')
                         })) ||
                         (selectedFilter === 'customer' && security.pledgedPositions.some(pos => {
                           const account = accounts.find(acc => acc.id === pos.accountId)
                           return account && account.accountType === 'Customer'
                         })) ||
                         (selectedFilter === 'firm' && security.pledgedPositions.some(pos => {
                           const account = accounts.find(acc => acc.id === pos.accountId)
                           return account && account.accountType === 'Firm'
                         }))
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
        {/* Modern Header - More Compact */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#012834] to-[#012834]/80 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Collateral Management</h1>
                <p className="text-xs text-gray-600">Manage and monitor collateral positions across all accounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Updated: {lastUpdate.toLocaleTimeString()}
              </Badge>
              <Tooltip content="Configure collateral management settings">
                <Button variant="outline" size="sm" className="h-7 px-2 py-1">
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2 border-b bg-gray-50/50">
              {/* Sub Navigation */}
              <div className="flex items-center justify-between mb-2">
                <nav className="flex space-x-4">
                  {subNavItems.map(item => (
                    <Button
                      key={item}
                      variant="ghost"
                      onClick={() => setActiveSubNav(item)}
                      className={cn(
                        "pb-1 px-1 border-b-2 font-medium text-xs transition-colors h-auto",
                        item === activeSubNav
                          ? 'border-[#015B7E] text-[#015B7E] bg-transparent hover:bg-transparent'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent'
                      )}
                    >
                      {item}
                    </Button>
                  ))}
                </nav>
              </div>
            </CardHeader>

            <CardContent className="p-3">
            {/* Enhanced Analytics Dashboard */}
            {metrics && (
              <div className="mb-4 space-y-3">
                {/* Dashboard Header with Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-semibold text-gray-900">Analytics Dashboard</h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                      Live Data
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSectionCollapse('analytics')}
                    className="h-6 px-1.5 text-gray-500 hover:text-gray-700"
                  >
                    {collapsedSections.has('analytics') ? (
                      <>
                        <ChevronDown size={14} className="mr-1" />
                        <span className="text-xs">Show</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp size={14} className="mr-1" />
                        <span className="text-xs">Hide</span>
                      </>
                    )}
                  </Button>
                </div>

                {!collapsedSections.has('analytics') && (
                <div className="space-y-3">
                {/* Primary Metrics Cards - More Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                  {/* Total Collateral Value Card */}
                  <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <Shield className="text-[#015B7E]" size={14} />
                          <p className="text-xs font-medium text-muted-foreground">Total Collateral Value</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(metrics.totalCollateralValue)}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingUp className="text-[#00a651]" size={10} />
                          <span className="text-xs text-[#00a651] font-medium">+2.5% vs last month</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[#015B7E]/10 rounded-lg flex items-center justify-center">
                        <Shield className="text-[#015B7E]" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Loan Balance Card */}
                  <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <DollarSign className="text-[#00a651]" size={14} />
                          <p className="text-xs font-medium text-muted-foreground">Total Loan Balance</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(metrics.totalLoanBalance)}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingDown className="text-[#285BC5]" size={10} />
                          <span className="text-xs text-[#285BC5] font-medium">-1.2% vs last month</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[#00a651]/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-[#00a651]" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Utilization Card with Progress Bar */}
                  <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <Target className="text-[#285BC5]" size={14} />
                          <p className="text-xs font-medium text-muted-foreground">Overall Utilization</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">{metrics.overallUtilization.toFixed(1)}%</p>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${
                              metrics.overallUtilization > 85 ? 'bg-[#1B1B6F]' :
                              metrics.overallUtilization > 70 ? 'bg-[#285BC5]' :
                              metrics.overallUtilization > 50 ? 'bg-[#015B7E]' : 'bg-[#00a651]'
                            }`}
                            style={{ width: `${Math.min(metrics.overallUtilization, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[#285BC5]/10 rounded-lg flex items-center justify-center">
                        <Target className="text-[#285BC5]" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Average Loan Rate Card */}
                  <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <Activity className="text-[#1B1B6F]" size={14} />
                          <p className="text-xs font-medium text-muted-foreground">Average Loan Rate</p>
                        </div>
                        <p className="text-lg font-bold text-foreground">{((metrics.totalLoanBalance * 0.045) / metrics.totalLoanBalance * 100).toFixed(2)}%</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <DollarSign className="text-[#00a651]" size={10} />
                          <span className="text-xs text-[#00a651] font-medium">Daily Cost: {formatCurrency((metrics.totalLoanBalance * 0.045) / 360)}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-[#1B1B6F]/10 rounded-lg flex items-center justify-center">
                        <Activity className="text-[#1B1B6F]" size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Secondary Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-0.5">
                        <CheckCircle className="text-green-500" size={14} />
                      </div>
                      <p className="text-xs text-gray-600 mb-0.5">Available Capacity</p>
                      <p className="text-xs font-bold text-green-600">{formatCurrency(metrics.availableCapacity)}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Activity className="text-blue-500" size={16} />
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Pledged Securities</p>
                      <p className="text-sm font-bold text-blue-600">{formatNumber(metrics.pledgedSecurities)}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="text-orange-500" size={16} />
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Recall Opportunities</p>
                      <p className="text-sm font-bold text-orange-600">{metrics.recallOpportunities}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart3 className="text-gray-500" size={16} />
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Total Accounts</p>
                      <p className="text-sm font-bold text-gray-700">{accounts.length}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Target className="text-indigo-500" size={16} />
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Credit Line</p>
                      <p className="text-sm font-bold text-indigo-600">{formatCurrency(metrics.totalCreditLine)}</p>
                    </div>
                  </div>
                </div>
                </div>
                )}
              </div>
            )}

            {/* Action Bar - Positioned Right Above Grid */}
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-50/50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {/* Tab Toggle */}
                <div className="flex bg-gray-100 rounded p-1">
                  <Button
                    variant={activeTab === 'account' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('account')}
                    className="h-8 px-3 text-sm"
                  >
                    By Account
                  </Button>
                  <Button
                    variant={activeTab === 'security' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('security')}
                    className="h-8 px-3 text-sm"
                  >
                    By Security
                  </Button>
                </div>

                {/* Enhanced Search with shadcn */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Search accounts, IDs, or names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 h-9 bg-background border-input focus:border-[#015B7E] focus:ring-[#015B7E]"
                  />
                </div>

                {/* Enhanced Filter Select */}
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-40 h-9 bg-background border-input focus:border-[#015B7E] focus:ring-[#015B7E]">
                    <SelectValue placeholder="Filter accounts" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span>All Accounts</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="risk">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-[#1B1B6F]" />
                        <span>High Risk</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="margin">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-[#285BC5]" />
                        <span>Margin Calls</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="customer">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-[#00a651]" />
                        <span>Customer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="firm">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-[#015B7E]" />
                        <span>Firm</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" className="h-8 bg-[#012834] hover:bg-[#011E28] text-white border-[#012834]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Collateral
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Data Table - Account or Security View */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                {activeTab === 'account' ? (
                  /* Account View Table */
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          <button onClick={() => handleSort('id')} className="flex items-center space-x-1 hover:text-gray-700">
                            <span>Account</span>
                            {sortColumn === 'id' && (sortDirection === 'asc' ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                          <button onClick={() => handleSort('loanBalance')} className="flex items-center justify-end space-x-1 hover:text-gray-700">
                            <span>Loan Balance</span>
                            {sortColumn === 'loanBalance' && (sortDirection === 'asc' ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Market Value</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Collateral</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Surplus / Deficit</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                          <button onClick={() => handleSort('utilizationRatio')} className="flex items-center justify-center space-x-1 hover:text-gray-700">
                            <span>Utilization</span>
                            {sortColumn === 'utilizationRatio' && (sortDirection === 'asc' ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Credit Line</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredAccounts.map((account) => (
                        <React.Fragment key={account.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleRowExpansion(account.id)}
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                  {expandedRows.has(account.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 flex-shrink-0">{account.id}</span>
                                  <span className="text-xs text-gray-500 truncate">{account.accountName}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs text-gray-700">{account.accountType}</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(account.loanBalance)}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(account.marketValue)}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-green-600">{formatCurrency(account.collateralValue)}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {(() => {
                                const status = getCollateralStatus(account);
                                const amountColor = status.status === 'over' ? 'text-[#00a651]' : status.status === 'under' ? 'text-[#1B1B6F]' : 'text-gray-700';
                                return (
                                  <div className={`flex items-center justify-center font-medium ${amountColor}`}>
                                    <span className="mr-1 text-sm">{status.icon}</span>
                                    {formatCurrency(status.amount)}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      account.utilizationRatio > 85 ? 'bg-[#1B1B6F]' :
                                      account.utilizationRatio > 70 ? 'bg-[#285BC5]' :
                                      account.utilizationRatio > 50 ? 'bg-[#015B7E]' : 'bg-[#00a651]'
                                    }`}
                                    style={{ width: `${Math.min(account.utilizationRatio, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-10 text-right">{account.utilizationRatio.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm text-gray-700">{formatCurrency(account.creditLine)}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Tooltip content="View Details">
                                  <button className="p-1 text-gray-400 hover:text-blue-600">
                                    <Eye size={14} />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Manage">
                                  <button className="p-1 text-gray-400 hover:text-green-600">
                                    <Edit size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row Details */}
                          {expandedRows.has(account.id) && (
                            <tr className="bg-sky-50 border-y-2 border-sky-200">
                              <td colSpan={9} className="px-3 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  
                                  {/* Financial Details */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Financial Details</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                      <div>
                                        <p className="text-gray-500">Market Value</p>
                                        <p className="font-medium text-blue-600">{formatCurrency(account.marketValue)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Haircut</p>
                                        <p className="font-medium text-gray-800">{account.haircut.toFixed(2)}%</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Avail. to Recall</p>
                                        <p className="font-medium text-green-600">{formatCurrency(account.availToRecall)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Max Pledge</p>
                                        <p className="font-medium text-gray-800">{formatCurrency(account.maxAvailToPledge)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Concentration</p>
                                        <p className="font-medium text-gray-800">{account.concentration.toFixed(1)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Collateral Status */}
                                  <div className="space-y-3">
                                      {(() => {
                                        const status = getCollateralStatus(account);
                                        return (
                                          <>
                                            <h4 className="font-medium text-gray-900">Collateral Status</h4>
                                            <div className={`p-3 rounded-lg border ${status.color}`}>
                                              <div className="flex items-center justify-between">
                                                <p className="font-semibold">{status.type}</p>
                                                <span className={`text-xl font-bold ${status.status === 'over' ? 'text-green-500' : status.status === 'under' ? 'text-red-500' : 'text-blue-500'}`}>
                                                  {status.icon}
                                                </span>
                                              </div>
                                              <p className="text-2xl font-bold">{formatCurrency(status.amount)}</p>
                                              <p className="text-xs text-gray-600">{status.percentage.toFixed(2)}% {status.status === 'over' ? 'Surplus' : 'Deficit'}</p>
                                            </div>
                                          </>
                                        );
                                      })()}
                                  </div>

                                  {/* Account Information */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Account Information</h4>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Last Activity:</span>
                                        <span className="font-medium">{account.lastActivity}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Last Updated:</span>
                                        <span className="font-medium">{account.balanceUpdated}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Updated By:</span>
                                        <span className="font-medium">{account.updatedBy}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Hypothetical:</span>
                                        <span className="font-medium">{account.hypothetical ? 'Yes' : 'No'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Security View Table */
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Security</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">CUSIP</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sector</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Current Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total Pledged Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total Market Value</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total Collateral Value</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Accounts</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredSecurities.map((security) => (
                        <React.Fragment key={security.symbol}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleRowExpansion(security.symbol)}
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                  {expandedRows.has(security.symbol) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">{security.symbol}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-48">{security.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-mono text-gray-700">{security.cusip}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs text-gray-700">{security.sector}</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(security.currentPrice)}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatNumber(security.totalPledgedQuantity)}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(security.totalMarketValue)}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-sm font-medium text-green-600">{formatCurrency(security.totalCollateralValue)}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {security.pledgedPositions.length} accounts
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Tooltip content="View Details">
                                  <button className="p-1 text-gray-400 hover:text-blue-600">
                                    <Eye size={14} />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Manage Pledges">
                                  <button className="p-1 text-gray-400 hover:text-green-600">
                                    <Edit size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row - Pledge Details */}
                          {expandedRows.has(security.symbol) && (
                            <tr className="bg-blue-50 border-y-2 border-blue-200">
                              <td colSpan={9} className="px-3 py-3">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-gray-900">Pledge Details by Account</h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead className="bg-white border border-gray-200">
                                        <tr>
                                          <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">Bank Loan #</th>
                                          <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">Account Name</th>
                                          <th className="px-2 py-1 text-right font-medium text-gray-700 border-r">Pledged Quantity</th>
                                          <th className="px-2 py-1 text-right font-medium text-gray-700 border-r">Market Value</th>
                                          <th className="px-2 py-1 text-right font-medium text-gray-700 border-r">Haircut %</th>
                                          <th className="px-2 py-1 text-right font-medium text-gray-700">Collateral Value</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-100">
                                        {security.pledgedPositions.map((position, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-2 py-1 border-r">
                                              <span className="font-medium text-gray-900">{position.accountId}</span>
                                            </td>
                                            <td className="px-2 py-1 border-r">
                                              <span className="text-gray-700">{position.accountName}</span>
                                            </td>
                                            <td className="px-2 py-1 text-right border-r">
                                              <span className="font-medium">{formatNumber(position.pledgedQuantity)}</span>
                                            </td>
                                            <td className="px-2 py-1 text-right border-r">
                                              <span className="font-medium">{formatCurrency(position.marketValue)}</span>
                                            </td>
                                            <td className="px-2 py-1 text-right border-r">
                                              <span className="text-gray-700">{position.haircut.toFixed(2)}%</span>
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                              <span className="font-medium text-green-600">{formatCurrency(position.collateralValue)}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {((activeTab === 'account' && filteredAccounts.length === 0) || 
              (activeTab === 'security' && filteredSecurities.length === 0)) && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Search className="mx-auto text-gray-300 mb-3" size={40} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'account' ? 'No accounts found' : 'No securities found'}
                </h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters</p>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

export default CollateralManager