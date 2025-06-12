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
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        {/* Modern Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Collateral Management</h1>
                <p className="text-sm text-gray-600">Manage and monitor collateral positions across all accounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                <Clock className="w-4 h-4 mr-1.5" />
                Updated: {lastUpdate.toLocaleTimeString()}
              </Badge>
              <Tooltip content="Configure collateral management settings">
                <Button variant="outline" size="sm" className="h-9 px-4">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
              {/* Sub Navigation */}
              <div className="flex items-center justify-between mb-4">
                <nav className="flex space-x-6">
                  {subNavItems.map(item => (
                    <Button
                      key={item}
                      variant="ghost"
                      onClick={() => setActiveSubNav(item)}
                      className={cn(
                        "pb-2 px-1 border-b-2 font-medium text-sm transition-colors h-auto",
                        item === activeSubNav
                          ? 'border-blue-500 text-blue-600 bg-transparent hover:bg-transparent'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-transparent'
                      )}
                    >
                      {item}
                    </Button>
                  ))}
                </nav>
              </div>

              {/* Compact Action Bar */}
              <div className="flex items-center justify-between">
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

                  {/* Compact Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 pr-3 py-1.5 w-48 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Accounts</option>
                    <option value="risk">High Risk</option>
                    <option value="margin">Margin Calls</option>
                    <option value="customer">Customer</option>
                    <option value="firm">Firm</option>
                  </select>

                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button size="sm" className="h-8">
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
            </CardHeader>
            <CardContent className="p-4">
            {/* Enhanced Analytics Dashboard */}
            {metrics && (
              <div className="mb-6 space-y-4">
                {/* Primary Metrics Cards - Improved Design */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Total Collateral Value Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Shield className="text-blue-500" size={16} />
                          <p className="text-sm font-medium text-gray-600">Total Collateral Value</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalCollateralValue)}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingUp className="text-green-500" size={12} />
                          <span className="text-xs text-green-600 font-medium">+2.5% vs last month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="text-blue-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Loan Balance Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="text-green-500" size={16} />
                          <p className="text-sm font-medium text-gray-600">Total Loan Balance</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalLoanBalance)}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingDown className="text-red-500" size={12} />
                          <span className="text-xs text-red-600 font-medium">-1.2% vs last month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-green-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Utilization Card with Progress Bar */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="text-purple-500" size={16} />
                          <p className="text-sm font-medium text-gray-600">Overall Utilization</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{metrics.overallUtilization.toFixed(1)}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              metrics.overallUtilization > 85 ? 'bg-red-500' :
                              metrics.overallUtilization > 70 ? 'bg-orange-500' :
                              metrics.overallUtilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(metrics.overallUtilization, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="text-purple-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="text-red-500" size={16} />
                          <p className="text-sm font-medium text-gray-600">Accounts at Risk</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{metrics.accountsAtRisk}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingDown className="text-green-500" size={12} />
                          <span className="text-xs text-green-600 font-medium">-5.5% improvement</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="text-red-600" size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Secondary Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle className="text-green-500" size={16} />
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Available Capacity</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(metrics.availableCapacity)}</p>
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

                {/* Side-by-Side Collateral Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  
                  {/* Pledged Collateral (Left) */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Pledged Collateral</h3>
                      <span className="text-sm font-semibold text-gray-700">{formatCurrency(metrics.totalCollateralValue)}</span>
                    </div>
                    
                    {/* Pledged Stacked Bar */}
                    <div className="mb-3">
                      <div className="relative w-full bg-gray-100 rounded h-6 overflow-hidden shadow-inner">
                        {[
                          { type: 'Equity', percentage: 42, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
                          { type: 'Corp Bonds', percentage: 28, color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
                          { type: 'ETFs', percentage: 15, color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
                          { type: 'Gov Bonds', percentage: 8, color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' },
                          { type: 'ADRs', percentage: 5, color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
                          { type: 'Muni', percentage: 2, color: 'bg-teal-500', hoverColor: 'hover:bg-teal-600' }
                        ].map((segment, index) => (
                          <div 
                            key={index}
                            className={`h-6 ${segment.color} ${segment.hoverColor} inline-block transition-all duration-200 cursor-pointer relative group`}
                            style={{ width: `${segment.percentage}%` }}
                            title={`${segment.type}: ${segment.percentage}%`}
                          >
                            {segment.percentage > 12 && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                                {segment.percentage}%
                              </span>
                            )}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              {segment.type}: {formatCurrency(metrics.totalCollateralValue * (segment.percentage / 100))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pledged Legend */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'Equity', amount: metrics.totalCollateralValue * 0.42, percentage: 42, color: 'bg-blue-500' },
                        { type: 'Corp Bonds', amount: metrics.totalCollateralValue * 0.28, percentage: 28, color: 'bg-green-500' },
                        { type: 'ETFs', amount: metrics.totalCollateralValue * 0.15, percentage: 15, color: 'bg-purple-500' },
                        { type: 'Gov Bonds', amount: metrics.totalCollateralValue * 0.08, percentage: 8, color: 'bg-indigo-500' },
                        { type: 'ADRs', amount: metrics.totalCollateralValue * 0.05, percentage: 5, color: 'bg-orange-500' },
                        { type: 'Muni', amount: metrics.totalCollateralValue * 0.02, percentage: 2, color: 'bg-teal-500' }
                      ].map((security) => (
                        <div key={security.type} className="flex items-center space-x-2 py-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${security.color} flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-gray-900 truncate">{security.type}</p>
                              <span className="text-xs font-bold text-gray-700">{security.percentage}%</span>
                            </div>
                            <p className="text-xs text-gray-500">{formatCurrency(security.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available to Pledge (Right) */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Available to Pledge</h3>
                      <span className="text-sm font-semibold text-green-700">{formatCurrency(metrics.availableCapacity * 1.8)}</span>
                    </div>
                    
                    {/* Available Stacked Bar */}
                    <div className="mb-3">
                      <div className="relative w-full bg-gray-100 rounded h-6 overflow-hidden shadow-inner">
                        {[
                          { type: 'Equity', percentage: 38, color: 'bg-blue-400', hoverColor: 'hover:bg-blue-500' },
                          { type: 'Corp Bonds', percentage: 32, color: 'bg-green-400', hoverColor: 'hover:bg-green-500' },
                          { type: 'ETFs', percentage: 12, color: 'bg-purple-400', hoverColor: 'hover:bg-purple-500' },
                          { type: 'Gov Bonds', percentage: 10, color: 'bg-indigo-400', hoverColor: 'hover:bg-indigo-500' },
                          { type: 'REITs', percentage: 5, color: 'bg-pink-400', hoverColor: 'hover:bg-pink-500' },
                          { type: 'Cash', percentage: 3, color: 'bg-gray-400', hoverColor: 'hover:bg-gray-500' }
                        ].map((segment, index) => (
                          <div 
                            key={index}
                            className={`h-6 ${segment.color} ${segment.hoverColor} inline-block transition-all duration-200 cursor-pointer relative group`}
                            style={{ width: `${segment.percentage}%` }}
                            title={`${segment.type}: ${segment.percentage}%`}
                          >
                            {segment.percentage > 12 && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                                {segment.percentage}%
                              </span>
                            )}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              {segment.type}: {formatCurrency((metrics.availableCapacity * 1.8) * (segment.percentage / 100))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Available Legend */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'Equity', amount: (metrics.availableCapacity * 1.8) * 0.38, percentage: 38, color: 'bg-blue-400' },
                        { type: 'Corp Bonds', amount: (metrics.availableCapacity * 1.8) * 0.32, percentage: 32, color: 'bg-green-400' },
                        { type: 'ETFs', amount: (metrics.availableCapacity * 1.8) * 0.12, percentage: 12, color: 'bg-purple-400' },
                        { type: 'Gov Bonds', amount: (metrics.availableCapacity * 1.8) * 0.10, percentage: 10, color: 'bg-indigo-400' },
                        { type: 'REITs', amount: (metrics.availableCapacity * 1.8) * 0.05, percentage: 5, color: 'bg-pink-400' },
                        { type: 'Cash', amount: (metrics.availableCapacity * 1.8) * 0.03, percentage: 3, color: 'bg-gray-400' }
                      ].map((security) => (
                        <div key={security.type} className="flex items-center space-x-2 py-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${security.color} flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-gray-900 truncate">{security.type}</p>
                              <span className="text-xs font-bold text-gray-700">{security.percentage}%</span>
                            </div>
                            <p className="text-xs text-gray-500">{formatCurrency(security.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Data Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        <button onClick={() => handleSort('riskLevel')} className="flex items-center space-x-1 hover:text-gray-700">
                          <span>Risk</span>
                          {sortColumn === 'riskLevel' && (sortDirection === 'asc' ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                        </button>
                      </th>
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
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {expandedRows.has(account.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{account.id}</div>
                                <div className="text-xs text-gray-500 truncate max-w-32">{account.accountName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-xs text-gray-700">{account.accountType}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(account.riskLevel)}`}>
                              {account.riskLevel}
                            </span>
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
                              const amountColor = status.status === 'over' ? 'text-green-600' : status.status === 'under' ? 'text-red-600' : 'text-gray-700';
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
                                    account.utilizationRatio > 85 ? 'bg-red-500' :
                                    account.utilizationRatio > 70 ? 'bg-orange-500' :
                                    account.utilizationRatio > 50 ? 'bg-yellow-500' : 'bg-green-500'
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
                              <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                                <Eye size={14} />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-green-600" title="Manage">
                                <Edit size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row Details */}
                        {expandedRows.has(account.id) && (
                          <tr className="bg-sky-50 border-y-2 border-sky-200">
                            <td colSpan={11} className="px-3 py-3">
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
              </div>
            </div>

            {filteredAccounts.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Search className="mx-auto text-gray-300 mb-3" size={40} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
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