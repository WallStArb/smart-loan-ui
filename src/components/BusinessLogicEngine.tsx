import React, { useState } from 'react';
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Activity,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DecisionRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
  category: 'Rate' | 'Revenue' | 'Availability' | 'Composite';
  createdDate: string;
  lastModified: string;
}

interface CompatibilityMatrix {
  id: string;
  name: string;
  rateVarianceTier: string;
  revenueThresholdTier: string;
  availabilityHaircutTier: string;
  recommendation: 'Approve' | 'Review' | 'Reject';
  businessJustification: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  isActive: boolean;
}

interface OverrideWorkflow {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  approvalLevel: 'Manager' | 'Director' | 'VP' | 'C-Level';
  maxOverrideAmount: number;
  timeLimit: number; // hours
  requiredJustification: boolean;
  isActive: boolean;
  createdDate: string;
  lastModified: string;
}

interface LoanDecision {
  id: string;
  loanRequestId: string;
  counterpartyId: string;
  templateId: string;
  decision: 'Approved' | 'Rejected' | 'Override Required';
  decisionReason: string;
  appliedRules: string[];
  overrideWorkflow?: string;
  timestamp: string;
  processingTime: number; // milliseconds
  revenueImpact: number;
  riskScore: number;
}

type ViewType = 'rules' | 'compatibility' | 'overrides' | 'decisions';
type CategoryType = 'Rate' | 'Revenue' | 'Availability' | 'Composite';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BusinessLogicEngine: React.FC = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [activeView, setActiveView] = useState<ViewType>('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [showNewMatrixForm, setShowNewMatrixForm] = useState(false);
  const [showNewOverrideForm, setShowNewOverrideForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'rule' | 'matrix' | 'override' | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});

  // ============================================================================
  // DATA STATE
  // ============================================================================

  // Decision Rules
  const [decisionRules, setDecisionRules] = useState<DecisionRule[]>([
    {
      id: 'rule-rate-variance-check',
      name: 'Rate Variance Tolerance Check',
      description: 'Check if rate variance is within acceptable limits',
      condition: 'rate_variance <= absolute_bps OR rate_variance <= percentage_rate',
      action: 'approve_if_within_tolerance',
      priority: 1,
      isActive: true,
      category: 'Rate',
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rule-revenue-impact-check',
      name: 'Revenue Threshold Check',
      description: 'Verify revenue threshold amount is within acceptable limits',
      condition: 'revenue_threshold <= max_dollar_amount',
      action: 'approve_if_within_threshold',
      priority: 2,
      isActive: true,
      category: 'Revenue',
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rule-availability-allocation',
      name: 'Availability Haircut Check',
      description: 'Ensure availability haircut is within acceptable limits',
      condition: 'current_allocation + requested_amount <= haircut_limit',
      action: 'approve_if_haircut_acceptable',
      priority: 3,
      isActive: true,
      category: 'Availability',
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rule-volume-discount',
      name: 'Volume-Based Rate Tolerance',
      description: 'Apply volume-based rate tolerance for large loans',
      condition: 'loan_amount > 50M AND rate_variance <= 75_bps',
      action: 'approve_with_volume_discount',
      priority: 4,
      isActive: true,
      category: 'Composite',
      createdDate: '2024-01-20',
      lastModified: '2024-02-28'
    },
    {
      id: 'rule-relationship-strength',
      name: 'Relationship Strength Adjustment',
      description: 'Adjust tolerances based on relationship strength',
      condition: 'relationship_strength >= 80 AND rate_variance <= 100_bps',
      action: 'approve_with_relationship_benefit',
      priority: 5,
      isActive: true,
      category: 'Composite',
      createdDate: '2024-01-25',
      lastModified: '2024-02-25'
    }
  ]);

  // Compatibility Matrix
  const [compatibilityMatrix, setCompatibilityMatrix] = useState<CompatibilityMatrix[]>([
    {
      id: 'matrix-ultra-conservative-minimal-conservative',
      name: 'Ultra-Conservative + Minimal + Conservative Haircut',
      rateVarianceTier: 'Ultra-Conservative',
      revenueThresholdTier: 'Minimal Threshold',
      availabilityHaircutTier: 'Conservative',
      recommendation: 'Approve',
      businessJustification: 'Cautious profitability approach with minimal risk',
      riskLevel: 'Low',
      isActive: true
    },
    {
      id: 'matrix-aggressive-high-strategic',
      name: 'Aggressive + High + Strategic Haircut',
      rateVarianceTier: 'Aggressive',
      revenueThresholdTier: 'High Threshold',
      availabilityHaircutTier: 'Strategic',
      recommendation: 'Review',
      businessJustification: 'High volume strategy requiring careful consideration',
      riskLevel: 'High',
      isActive: true
    },
    {
      id: 'matrix-conservative-moderate-preferred',
      name: 'Conservative + Moderate + Preferred Haircut',
      rateVarianceTier: 'Conservative',
      revenueThresholdTier: 'Moderate Threshold',
      availabilityHaircutTier: 'Preferred',
      recommendation: 'Approve',
      businessJustification: 'Balanced growth approach with moderate risk',
      riskLevel: 'Medium',
      isActive: true
    },
    {
      id: 'matrix-moderate-low-standard',
      name: 'Moderate + Low + Standard Haircut',
      rateVarianceTier: 'Moderate',
      revenueThresholdTier: 'Low Threshold',
      availabilityHaircutTier: 'Standard',
      recommendation: 'Approve',
      businessJustification: 'Standard operations with proven track record',
      riskLevel: 'Low',
      isActive: true
    }
  ]);

  // Override Workflows
  const [overrideWorkflows, setOverrideWorkflows] = useState<OverrideWorkflow[]>([
    {
      id: 'override-rate-variance',
      name: 'Rate Variance Override',
      description: 'Allow rate variance up to 50 bps with approval',
      triggerCondition: 'rate_variance > 25_bps AND rate_variance <= 50_bps',
      approvalLevel: 'Manager',
      maxOverrideAmount: 50,
      timeLimit: 24,
      requiredJustification: true,
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'override-revenue-impact',
      name: 'Revenue Threshold Override',
      description: 'Allow higher revenue threshold amounts for strategic deals',
      triggerCondition: 'revenue_threshold > 5000 AND revenue_threshold <= 15000',
      approvalLevel: 'Director',
      maxOverrideAmount: 15000,
      timeLimit: 48,
      requiredJustification: true,
      isActive: true,
      createdDate: '2024-01-20',
      lastModified: '2024-02-28'
    },
    {
      id: 'override-availability-allocation',
      name: 'Availability Haircut Override',
      description: 'Allow haircut beyond standard limits for key relationships',
      triggerCondition: 'requested_allocation > haircut_limit AND requested_allocation <= override_capability',
      approvalLevel: 'VP',
      maxOverrideAmount: 60,
      timeLimit: 72,
      requiredJustification: true,
      isActive: true,
      createdDate: '2024-01-25',
      lastModified: '2024-02-25'
    }
  ]);

  // Loan Decisions (for analytics)
  const [loanDecisions, setLoanDecisions] = useState<LoanDecision[]>([
    {
      id: 'decision-1',
      loanRequestId: 'loan-001',
      counterpartyId: '0079',
      templateId: 'template-tier1-standard',
      decision: 'Approved',
      decisionReason: 'All parameters within acceptable limits',
      appliedRules: ['Rate Variance Tolerance Check', 'Revenue Threshold Check', 'Availability Haircut Check'],
      timestamp: '2024-03-01T10:30:00Z',
      processingTime: 1500,
              revenueImpact: 8500,
      riskScore: 0.15
    },
    {
      id: 'decision-2',
      loanRequestId: 'loan-002',
      counterpartyId: '0002',
      templateId: 'template-tier1-standard',
      decision: 'Override Required',
      decisionReason: 'Rate variance exceeds standard limits',
      appliedRules: ['Rate Variance Tolerance Check'],
      overrideWorkflow: 'override-rate-variance',
      timestamp: '2024-03-01T11:15:00Z',
      processingTime: 2300,
      revenueImpact: 12500,
      riskScore: 0.35
    },
    {
      id: 'decision-3',
      loanRequestId: 'loan-003',
      counterpartyId: '0187',
      templateId: 'template-tier1-standard',
      decision: 'Approved',
      decisionReason: 'Volume-based rate tolerance applied',
      appliedRules: ['Rate Variance Tolerance Check', 'Volume-Based Rate Tolerance', 'Revenue Threshold Check'],
      timestamp: '2024-03-01T12:00:00Z',
      processingTime: 1800,
      revenueImpact: 18500,
      riskScore: 0.25
    }
  ]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Approve': return 'text-green-600 bg-green-100';
      case 'Review': return 'text-yellow-600 bg-yellow-100';
      case 'Reject': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getApprovalLevelColor = (level: string) => {
    switch (level) {
      case 'Manager': return 'text-blue-600 bg-blue-100';
      case 'Director': return 'text-purple-600 bg-purple-100';
      case 'VP': return 'text-orange-600 bg-orange-100';
      case 'C-Level': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Approved': return 'text-green-600';
      case 'Override Required': return 'text-yellow-600';
      case 'Rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case 'Rate': return 'bg-blue-500';
      case 'Revenue': return 'bg-green-500';
      case 'Availability': return 'bg-purple-500';
      case 'Composite': return 'bg-orange-500';
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createRule = (ruleData: Partial<DecisionRule>) => {
    const newRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    } as DecisionRule;
    setDecisionRules(prev => [...prev, newRule]);
  };

  const updateRule = (id: string, updateData: Partial<DecisionRule>) => {
    const updatedData = {
      ...updateData,
      lastModified: new Date().toISOString().split('T')[0]
    };
    setDecisionRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updatedData } : rule
    ));
  };

  const deleteRule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      setDecisionRules(prev => prev.filter(rule => rule.id !== id));
    }
  };

  const startEditing = (id: string, type: 'rule' | 'matrix' | 'override') => {
    setEditingItem(id);
    setEditingType(type);
    
    // Load current data into form
    let currentData = {};
    if (type === 'rule') {
      currentData = decisionRules.find(r => r.id === id) || {};
    } else if (type === 'matrix') {
      currentData = compatibilityMatrix.find(m => m.id === id) || {};
    } else if (type === 'override') {
      currentData = overrideWorkflows.find(o => o.id === id) || {};
    }
    
    setEditFormData(currentData);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingType(null);
    setEditFormData({});
  };

  const saveEdit = () => {
    if (!editingItem || !editingType) return;
    
    if (editingType === 'rule') {
      updateRule(editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    } else if (editingType === 'matrix') {
      updateMatrix(editingItem, editFormData);
    } else if (editingType === 'override') {
      updateOverride(editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    }
    
    cancelEditing();
  };

  const updateMatrix = (id: string, updateData: Partial<CompatibilityMatrix>) => {
    setCompatibilityMatrix(prev => prev.map(matrix => 
      matrix.id === id ? { ...matrix, ...updateData } : matrix
    ));
  };

  const updateOverride = (id: string, updateData: Partial<OverrideWorkflow>) => {
    const updatedData = {
      ...updateData,
      lastModified: new Date().toISOString().split('T')[0]
    };
    setOverrideWorkflows(prev => prev.map(override => 
      override.id === id ? { ...override, ...updatedData } : override
    ));
  };

  const deleteMatrix = (id: string) => {
    if (window.confirm('Are you sure you want to delete this matrix entry?')) {
      setCompatibilityMatrix(prev => prev.filter(matrix => matrix.id !== id));
    }
  };

  const deleteOverride = (id: string) => {
    if (window.confirm('Are you sure you want to delete this override workflow?')) {
      setOverrideWorkflows(prev => prev.filter(override => override.id !== id));
    }
  };

  // ============================================================================
  // COMPONENT RENDERING
  // ============================================================================

  const RuleCard: React.FC<{ rule: DecisionRule }> = ({ rule }) => (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn("w-4 h-4 rounded-full", getCategoryIcon(rule.category))}></div>
            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={rule.isActive ? "default" : "secondary"} className="text-xs">
              {rule.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Priority {rule.priority}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => startEditing(rule.id, 'rule')} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)} className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Condition:</span>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-2 font-mono">
              {rule.condition}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Action:</span>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-2 font-mono">
              {rule.action}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{rule.category}</span>
            <span>Modified {new Date(rule.lastModified).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MatrixCard: React.FC<{ matrix: CompatibilityMatrix }> = ({ matrix }) => (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{matrix.name}</h3>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", getRecommendationColor(matrix.recommendation))}>
              {matrix.recommendation}
            </Badge>
            <Badge className={cn("text-xs", getRiskColor(matrix.riskLevel))}>
              {matrix.riskLevel} Risk
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => startEditing(matrix.id, 'matrix')} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteMatrix(matrix.id)} className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700 mb-4">
          <div className="flex justify-between">
            <span className="font-medium">Rate Variance:</span> 
            <span>{matrix.rateVarianceTier}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Revenue Threshold:</span> 
            <span>{matrix.revenueThresholdTier}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Availability Haircut:</span> 
            <span>{matrix.availabilityHaircutTier}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <span className="font-medium">Business Justification:</span> {matrix.businessJustification}
        </div>
      </CardContent>
    </Card>
  );

  const OverrideCard: React.FC<{ override: OverrideWorkflow }> = ({ override }) => (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{override.name}</h3>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", getApprovalLevelColor(override.approvalLevel))}>
              {override.approvalLevel}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => startEditing(override.id, 'override')} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteOverride(override.id)} className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{override.description}</p>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Max Override:</span> 
            <span>${override.maxOverrideAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Time Limit:</span> 
            <span>{override.timeLimit} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Justification Required:</span> 
            <span>{override.requiredJustification ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Modified {new Date(override.lastModified).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DecisionCard: React.FC<{ decision: LoanDecision }> = ({ decision }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">Decision #{decision.id.split('-')[1]}</h4>
          <p className="text-xs text-gray-500">{new Date(decision.timestamp).toLocaleString()}</p>
        </div>
        <Badge className={cn("text-xs", getDecisionColor(decision.decision))}>
          {decision.decision}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span className="font-medium">Processing Time:</span> 
          <span>{decision.processingTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Revenue Threshold:</span> 
          <span>${decision.revenueImpact.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Risk Score:</span> 
          <span>{(decision.riskScore * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Reason:</span> {decision.decisionReason}
        </div>
        {decision.appliedRules.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Applied Rules:</span> {decision.appliedRules.join(', ')}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Logic Engine</h1>
            <p className="text-gray-600 mt-1">Automated decision rules and analytics for securities lending</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Summary cards */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-xs text-green-600">+12% this week</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Override Required</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-yellow-600">5% of total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
                <p className="text-xs text-red-600">-3% this week</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">1.8s</p>
                <p className="text-xs text-blue-600">0.3s faster</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loanDecisions.map(decision => (
                  <DecisionCard key={decision.id} decision={decision} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Rule Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {decisionRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-600">{rule.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">94.2%</div>
                      <div className="text-xs text-gray-600">success rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Editing Modal - fully restored */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit {editingType === 'rule' ? 'Decision Rule' : 
                      editingType === 'matrix' ? 'Compatibility Matrix' : 
                      'Override Workflow'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                  />
                </div>
                {editingType === 'rule' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Select value={editFormData.category || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Rate">Rate</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Availability">Availability</SelectItem>
                          <SelectItem value="Composite">Composite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <Input
                        type="number"
                        value={editFormData.priority || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        placeholder="Enter priority"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                      <Input
                        value={editFormData.condition || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, condition: e.target.value }))}
                        placeholder="Enter condition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                      <Input
                        value={editFormData.action || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, action: e.target.value }))}
                        placeholder="Enter action"
                      />
                    </div>
                  </>
                )}
                {editingType === 'matrix' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate Variance Tier</label>
                      <Input
                        value={editFormData.rateVarianceTier || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, rateVarianceTier: e.target.value }))}
                        placeholder="Enter rate variance tier"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Threshold Tier</label>
                      <Input
                        value={editFormData.revenueThresholdTier || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, revenueThresholdTier: e.target.value }))}
                        placeholder="Enter revenue threshold tier"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Availability Haircut Tier</label>
                      <Input
                        value={editFormData.availabilityHaircutTier || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, availabilityHaircutTier: e.target.value }))}
                        placeholder="Enter availability haircut tier"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                      <Select value={editFormData.recommendation || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, recommendation: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recommendation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Approve">Approve</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Reject">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                      <Select value={editFormData.riskLevel || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, riskLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Justification</label>
                      <Input
                        value={editFormData.businessJustification || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, businessJustification: e.target.value }))}
                        placeholder="Enter business justification"
                      />
                    </div>
                  </>
                )}
                {editingType === 'override' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Condition</label>
                      <Input
                        value={editFormData.triggerCondition || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, triggerCondition: e.target.value }))}
                        placeholder="Enter trigger condition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approval Level</label>
                      <Select value={editFormData.approvalLevel || ''} onValueChange={(value) => setEditFormData(prev => ({ ...prev, approvalLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select approval level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="VP">VP</SelectItem>
                          <SelectItem value="C-Level">C-Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Override Amount</label>
                      <Input
                        type="number"
                        value={editFormData.maxOverrideAmount || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, maxOverrideAmount: parseInt(e.target.value) }))}
                        placeholder="Enter max override amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (hours)</label>
                      <Input
                        type="number"
                        value={editFormData.timeLimit || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                        placeholder="Enter time limit"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700 text-white">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Overview section moved to bottom */}
      <div className="bg-white border-t border-gray-200 p-6 mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Logic Engine Overview</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-4">
              The Business Logic Engine serves as the sophisticated decision-making core of the automated securities lending platform. 
              It processes loan requests in real-time by evaluating multiple criteria against predefined rules and thresholds, 
              ensuring consistent and compliant lending decisions while maximizing revenue opportunities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Decision Rules</h3>
                <p className="text-sm text-blue-800">
                  Automated rules that evaluate rate variance, revenue thresholds, and availability haircuts. 
                  These rules work in conjunction with the Parameter System tiers to make instant lending decisions 
                  based on counterparty-specific templates and market conditions.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Compatibility Matrix</h3>
                <p className="text-sm text-green-800">
                  Defines how different tier combinations from the Parameter System work together. 
                  This matrix ensures that aggressive rate variance tiers are properly balanced with 
                  appropriate revenue thresholds and availability haircuts for optimal risk management.
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Override Workflows</h3>
                <p className="text-sm text-yellow-800">
                  Manages exception handling when loan requests exceed standard parameters. 
                  Provides structured approval hierarchies (Manager → Director → VP → C-Level) 
                  with time limits and justification requirements for risk control.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Decision Analytics</h3>
                <p className="text-sm text-purple-800">
                  Real-time monitoring of lending decisions, processing times, and rule performance. 
                  Provides insights into approval rates, override frequency, and system efficiency 
                  to enable continuous optimization of the lending process.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Integration with Parameter System</h3>
              <p className="text-sm text-gray-700">
                The Business Logic Engine works seamlessly with the Parameter System by consuming the tier definitions 
                (Rate Variance, Revenue Threshold, Availability Haircut) and template assignments created in the Parameter System. 
                When a loan request arrives, the engine identifies the counterparty's assigned template, retrieves the associated 
                tier parameters, and applies the appropriate business rules to make an automated lending decision. This integration 
                enables sophisticated, customizable lending strategies while maintaining consistent risk management across all counterparties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogicEngine; 