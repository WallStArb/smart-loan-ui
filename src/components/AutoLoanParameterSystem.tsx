import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  FileText,
  Settings,
  BarChart3,
  Activity,
  Clock,
  Target,
  Zap,
  Move,
  X,
  Filter,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RateVarianceTier {
  id: string;
  name: string;
  description: string;
  absoluteBps: number;
  percentageRate: number;
  standardDeviation: number;
  color: string;
  isActive: boolean;
  createdDate: string;
  lastModified: string;
}

interface RevenueImpactTier {
  id: string;
  name: string;
  description: string;
  absoluteDollar: number;
  percentageLoan: number;
  percentageDailyRevenue: number;
  loanAmountBuckets: {
    under10M: number;
    under50M: number;
    over50M: number;
  };
  color: string;
  isActive: boolean;
  createdDate: string;
  lastModified: string;
}

interface AvailabilityStrategyTier {
  id: string;
  name: string;
  description: string;
  baseAllocation: number;
  surgeCapacity: number;
  softLimit: number;
  overrideCapability: number;
  color: string;
  isActive: boolean;
  createdDate: string;
  lastModified: string;
}

interface BusinessLogicRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

interface OverrideCapability {
  id: string;
  name: string;
  description: string;
  approvalLevel: 'Manager' | 'Director' | 'VP' | 'C-Level';
  maxOverrideAmount: number;
  timeLimit: number; // hours
  isActive: boolean;
}

interface TemplatePerformanceMetrics {
  totalLoans: number;
  approvalRate: number;
  averageRevenue: number;
  revenueVariance: number;
  overrideRate: number;
  decisionSpeed: number; // minutes
  lastUpdated: string;
}

interface CompositeTemplate {
  id: string;
  name: string;
  description: string;
  rateVarianceTier: string;
  revenueImpactTier: string;
  availabilityStrategyTier: string;
  businessLogicRules: BusinessLogicRule[];
  overrideCapabilities: OverrideCapability[];
  assignedCounterparties: string[];
  isActive: boolean;
  createdDate: string;
  lastModified: string;
  performanceMetrics: TemplatePerformanceMetrics;
}

interface CounterpartyPerformanceMetrics {
  hitRate: number;
  responseTime: number; // minutes
  volumeConsistency: number;
  rateSensitivity: number;
  availabilityUtilization: number;
  lifetimeValue: number;
  relationshipTenure: number; // months
}

interface Counterparty {
  id: string;
  name: string;
  dtcNumber: string;
  tier: 'Bulge Bracket' | 'Major' | 'Regional' | 'Boutique';
  creditRating: string;
  exposureAmount: string;
  relationshipStrength: number;
  assignedTemplate: string | null;
  active: boolean;
  lastActivity: string;
  region: string;
  type: string;
  performanceMetrics: CounterpartyPerformanceMetrics;
}

type TierType = 'rate' | 'revenue' | 'availability';
type ViewType = 'tiers' | 'templates' | 'counterparties' | 'analytics' | 'assignments';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AutoLoanDecisionEngine: React.FC = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [activeView, setActiveView] = useState<ViewType>('tiers');
  const [activeTierType, setActiveTierType] = useState<TierType>('rate');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTierForm, setShowNewTierForm] = useState(false);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<TierType | 'template' | 'counterparty' | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<string | null>(null);
  
  // Drag and Drop state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [counterpartyFilter, setCounterpartyFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [showAssignmentView, setShowAssignmentView] = useState(false);
  
  // Form state for editing
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ============================================================================
  // DATA STATE
  // ============================================================================

  // Rate Variance Tiers
  const [rateVarianceTiers, setRateVarianceTiers] = useState<RateVarianceTier[]>([
    {
      id: 'rate-tightest',
      name: 'Tightest',
      description: 'Strictest rate variance requirements. Only counterparties meeting the exact target rate are auto-filled. Maximizes control, minimizes risk.',
      absoluteBps: 15,
      percentageRate: 1,
      standardDeviation: 1,
      color: 'border-green-500 bg-green-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rate-tight',
      name: 'Tight',
      description: 'Tight rate variance requirements. Most counterparties must closely match the target rate for auto-fill.',
      absoluteBps: 25,
      percentageRate: 2,
      standardDeviation: 1.5,
      color: 'border-blue-500 bg-blue-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rate-loose',
      name: 'Loose',
      description: 'Looser rate variance requirements. More counterparties are eligible for auto-fill, increasing fill rates.',
      absoluteBps: 50,
      percentageRate: 5,
      standardDeviation: 2,
      color: 'border-yellow-500 bg-yellow-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'rate-loosest',
      name: 'Loosest',
      description: 'Most flexible rate variance requirements. The system will auto-fill the broadest range of requests, maximizing fill rates.',
      absoluteBps: 100,
      percentageRate: 10,
      standardDeviation: 3,
      color: 'border-red-500 bg-red-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    }
  ]);

  // Revenue Impact Tiers
  const [revenueImpactTiers, setRevenueImpactTiers] = useState<RevenueImpactTier[]>([
    {
      id: 'revenue-minimal',
      name: 'Minimal Impact',
      description: 'Very low revenue impact tolerance for premium relationships',
      absoluteDollar: 250,
      percentageLoan: 0.05,
      percentageDailyRevenue: 0.5,
      loanAmountBuckets: { under10M: 250, under50M: 500, over50M: 1000 },
      color: 'border-green-500 bg-green-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'revenue-low',
      name: 'Low Impact',
      description: 'Low revenue impact tolerance for standard relationships',
      absoluteDollar: 1000,
      percentageLoan: 0.1,
      percentageDailyRevenue: 1,
      loanAmountBuckets: { under10M: 1000, under50M: 2000, over50M: 5000 },
      color: 'border-blue-500 bg-blue-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'revenue-moderate',
      name: 'Moderate Impact',
      description: 'Moderate revenue impact tolerance for growth relationships',
      absoluteDollar: 5000,
      percentageLoan: 0.25,
      percentageDailyRevenue: 2,
      loanAmountBuckets: { under10M: 5000, under50M: 10000, over50M: 25000 },
      color: 'border-yellow-500 bg-yellow-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'revenue-high',
      name: 'High Impact',
      description: 'High revenue impact tolerance for strategic opportunities',
      absoluteDollar: 15000,
      percentageLoan: 0.5,
      percentageDailyRevenue: 5,
      loanAmountBuckets: { under10M: 15000, under50M: 30000, over50M: 75000 },
      color: 'border-red-500 bg-red-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    }
  ]);

  // Availability Strategy Tiers
  const [availabilityStrategyTiers, setAvailabilityStrategyTiers] = useState<AvailabilityStrategyTier[]>([
    {
      id: 'availability-conservative',
      name: 'Conservative',
      description: 'Low availability allocation with strict limits',
      baseAllocation: 5,
      surgeCapacity: 2,
      softLimit: 7,
      overrideCapability: 10,
      color: 'border-green-500 bg-green-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'availability-standard',
      name: 'Standard',
      description: 'Standard availability allocation for typical relationships',
      baseAllocation: 10,
      surgeCapacity: 5,
      softLimit: 15,
      overrideCapability: 20,
      color: 'border-blue-500 bg-blue-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'availability-preferred',
      name: 'Preferred',
      description: 'Enhanced availability allocation for preferred relationships',
      baseAllocation: 20,
      surgeCapacity: 10,
      softLimit: 30,
      overrideCapability: 40,
      color: 'border-yellow-500 bg-yellow-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    },
    {
      id: 'availability-strategic',
      name: 'Strategic',
      description: 'Maximum availability allocation for strategic partners',
      baseAllocation: 35,
      surgeCapacity: 15,
      softLimit: 50,
      overrideCapability: 60,
      color: 'border-red-500 bg-red-50',
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01'
    }
  ]);

  // Composite Templates
  const [compositeTemplates, setCompositeTemplates] = useState<CompositeTemplate[]>([
    {
      id: 'template-tier1-standard',
      name: 'Tier 1 Bank Standard',
      description: 'Conservative template for top-tier investment banks',
      rateVarianceTier: 'rate-conservative',
      revenueImpactTier: 'revenue-low',
      availabilityStrategyTier: 'availability-preferred',
      businessLogicRules: [
        {
          id: 'rule-1',
          name: 'Rate Variance Check',
          condition: 'rate_variance <= 25_bps OR rate_variance <= 2%',
          action: 'approve_if_within_tolerance',
          priority: 1,
          isActive: true
        },
        {
          id: 'rule-2',
          name: 'Revenue Impact Check',
          condition: 'revenue_impact <= 1000_dollars OR revenue_impact <= 0.1%_loan',
          action: 'approve_if_within_threshold',
          priority: 2,
          isActive: true
        }
      ],
      overrideCapabilities: [
        {
          id: 'override-1',
          name: 'Rate Variance Override',
          description: 'Allow rate variance up to 50 bps with approval',
          approvalLevel: 'Manager',
          maxOverrideAmount: 50,
          timeLimit: 24,
          isActive: true
        }
      ],
      assignedCounterparties: ['cp-0079', 'cp-0002', 'cp-0187'],
      isActive: true,
      createdDate: '2024-01-15',
      lastModified: '2024-03-01',
      performanceMetrics: {
        totalLoans: 1250,
        approvalRate: 94.2,
        averageRevenue: 8500,
        revenueVariance: 12.5,
        overrideRate: 3.8,
        decisionSpeed: 2.3,
        lastUpdated: '2024-03-01'
      }
    },
    {
      id: 'template-midmarket-aggressive',
      name: 'Mid-Market Aggressive',
      description: 'Growth-focused template for mid-market institutions',
      rateVarianceTier: 'rate-moderate',
      revenueImpactTier: 'revenue-moderate',
      availabilityStrategyTier: 'availability-standard',
      businessLogicRules: [
        {
          id: 'rule-3',
          name: 'Volume-Based Rate Tolerance',
          condition: 'loan_amount > 50M AND rate_variance <= 75_bps',
          action: 'approve_with_volume_discount',
          priority: 1,
          isActive: true
        }
      ],
      overrideCapabilities: [
        {
          id: 'override-2',
          name: 'Revenue Impact Override',
          description: 'Allow higher revenue impact for strategic deals',
          approvalLevel: 'Director',
          maxOverrideAmount: 10000,
          timeLimit: 48,
          isActive: true
        }
      ],
      assignedCounterparties: ['2236', '7263', '2165'],
      isActive: true,
      createdDate: '2024-01-20',
      lastModified: '2024-02-28',
      performanceMetrics: {
        totalLoans: 890,
        approvalRate: 87.6,
        averageRevenue: 12000,
        revenueVariance: 18.3,
        overrideRate: 8.2,
        decisionSpeed: 4.1,
        lastUpdated: '2024-03-01'
      }
    }
  ]);

  // Real DTC Counterparties Data
  const [counterparties, setCounterparties] = useState<Counterparty[]>([
    // Bulge Bracket Tier 1 (Top 10)
    { id: 'cp-0902', name: 'J.P. MORGAN SECURITIES LLC', dtcNumber: '0902', tier: 'Bulge Bracket', creditRating: 'A+', exposureAmount: '$2.5B', relationshipStrength: 95, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 98, responseTime: 2.5, volumeConsistency: 95, rateSensitivity: 88, availabilityUtilization: 92, lifetimeValue: 45000000, relationshipTenure: 84 } },
    { id: 'cp-0005', name: 'GOLDMAN SACHS & CO. LLC', dtcNumber: '0005', tier: 'Bulge Bracket', creditRating: 'A+', exposureAmount: '$2.2B', relationshipStrength: 94, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 97, responseTime: 2.8, volumeConsistency: 94, rateSensitivity: 90, availabilityUtilization: 89, lifetimeValue: 42000000, relationshipTenure: 78 } },
    { id: 'cp-0418', name: 'MORGAN STANLEY & CO. LLC', dtcNumber: '0418', tier: 'Bulge Bracket', creditRating: 'A+', exposureAmount: '$2.1B', relationshipStrength: 93, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 96, responseTime: 3.1, volumeConsistency: 93, rateSensitivity: 87, availabilityUtilization: 91, lifetimeValue: 38000000, relationshipTenure: 72 } },
    { id: 'cp-0092', name: 'BANK OF AMERICA, NATIONAL ASSOCIATION', dtcNumber: '0092', tier: 'Bulge Bracket', creditRating: 'A+', exposureAmount: '$1.9B', relationshipStrength: 92, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Commercial Bank', performanceMetrics: { hitRate: 95, responseTime: 3.5, volumeConsistency: 92, rateSensitivity: 85, availabilityUtilization: 88, lifetimeValue: 35000000, relationshipTenure: 96 } },
    { id: 'cp-0573', name: 'DEUTSCHE BANK SECURITIES INC.', dtcNumber: '0573', tier: 'Bulge Bracket', creditRating: 'A', exposureAmount: '$1.8B', relationshipStrength: 89, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 94, responseTime: 4.2, volumeConsistency: 89, rateSensitivity: 82, availabilityUtilization: 85, lifetimeValue: 32000000, relationshipTenure: 65 } },
    { id: 'cp-0019', name: 'JEFFERIES LLC', dtcNumber: '0019', tier: 'Bulge Bracket', creditRating: 'A-', exposureAmount: '$1.7B', relationshipStrength: 88, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 93, responseTime: 3.8, volumeConsistency: 88, rateSensitivity: 84, availabilityUtilization: 87, lifetimeValue: 28000000, relationshipTenure: 45 } },
    { id: 'cp-0630', name: 'BNP PARIBAS SECURITIES CORP.', dtcNumber: '0630', tier: 'Bulge Bracket', creditRating: 'A', exposureAmount: '$1.6B', relationshipStrength: 87, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 92, responseTime: 4.5, volumeConsistency: 87, rateSensitivity: 81, availabilityUtilization: 84, lifetimeValue: 26000000, relationshipTenure: 58 } },
    { id: 'cp-7263', name: 'BARCLAYS BANK PLC NEW YORK BRANCH', dtcNumber: '7263', tier: 'Bulge Bracket', creditRating: 'A', exposureAmount: '$1.5B', relationshipStrength: 86, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Commercial Bank', performanceMetrics: { hitRate: 91, responseTime: 4.8, volumeConsistency: 86, rateSensitivity: 80, availabilityUtilization: 83, lifetimeValue: 24000000, relationshipTenure: 62 } },
    { id: 'cp-2333', name: 'CITIBANK, N.A./ETF', dtcNumber: '2333', tier: 'Bulge Bracket', creditRating: 'A+', exposureAmount: '$1.4B', relationshipStrength: 85, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Commercial Bank', performanceMetrics: { hitRate: 90, responseTime: 5.2, volumeConsistency: 85, rateSensitivity: 78, availabilityUtilization: 82, lifetimeValue: 22000000, relationshipTenure: 88 } },
    { id: 'cp-2165', name: 'HSBC BANK USA, NATIONAL ASSOCIATION', dtcNumber: '2165', tier: 'Bulge Bracket', creditRating: 'A', exposureAmount: '$1.3B', relationshipStrength: 84, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Commercial Bank', performanceMetrics: { hitRate: 89, responseTime: 5.5, volumeConsistency: 84, rateSensitivity: 76, availabilityUtilization: 81, lifetimeValue: 20000000, relationshipTenure: 74 } },

    // Major Tier 2 (15 firms)
    { id: 'cp-0187', name: 'J.P. MORGAN SECURITIES LLC', dtcNumber: '0187', tier: 'Major', creditRating: 'A-', exposureAmount: '$800M', relationshipStrength: 78, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 85, responseTime: 6.2, volumeConsistency: 78, rateSensitivity: 72, availabilityUtilization: 75, lifetimeValue: 15000000, relationshipTenure: 56 } },
    { id: 'cp-0536', name: 'JEFFERIES LLC/JEFFERIES EXECUTION SERVICES, INC./SERVICE BUREAU', dtcNumber: '0536', tier: 'Major', creditRating: 'A-', exposureAmount: '$750M', relationshipStrength: 77, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 84, responseTime: 6.5, volumeConsistency: 77, rateSensitivity: 71, availabilityUtilization: 74, lifetimeValue: 14000000, relationshipTenure: 42 } },
    { id: 'cp-0388', name: 'INDUSTRIAL AND COMMERCIAL BANK OF CHINA FINANCIAL SERVICES, LLC', dtcNumber: '0388', tier: 'Major', creditRating: 'A-', exposureAmount: '$700M', relationshipStrength: 76, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Asia', type: 'Commercial Bank', performanceMetrics: { hitRate: 83, responseTime: 7.2, volumeConsistency: 76, rateSensitivity: 69, availabilityUtilization: 72, lifetimeValue: 13000000, relationshipTenure: 28 } },
    { id: 'cp-0274', name: 'CITIGROUP GLOBAL MARKETS INC./SALOMON BROTHERS', dtcNumber: '0274', tier: 'Major', creditRating: 'A', exposureAmount: '$650M', relationshipStrength: 75, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 82, responseTime: 7.5, volumeConsistency: 75, rateSensitivity: 68, availabilityUtilization: 71, lifetimeValue: 12000000, relationshipTenure: 82 } },
    { id: 'cp-0124', name: 'INGALLS & SNYDER, LLC', dtcNumber: '0124', tier: 'Major', creditRating: 'BBB+', exposureAmount: '$600M', relationshipStrength: 74, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 81, responseTime: 8.1, volumeConsistency: 74, rateSensitivity: 66, availabilityUtilization: 69, lifetimeValue: 11000000, relationshipTenure: 38 } },
    { id: 'cp-0270', name: 'ING FINANCIAL MARKETS LLC', dtcNumber: '0270', tier: 'Major', creditRating: 'A-', exposureAmount: '$550M', relationshipStrength: 73, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 80, responseTime: 8.5, volumeConsistency: 73, rateSensitivity: 65, availabilityUtilization: 68, lifetimeValue: 10000000, relationshipTenure: 48 } },
    { id: 'cp-0816', name: 'HSBC SECURITIES (USA) INC.', dtcNumber: '0816', tier: 'Major', creditRating: 'A', exposureAmount: '$500M', relationshipStrength: 72, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 79, responseTime: 9.2, volumeConsistency: 72, rateSensitivity: 63, availabilityUtilization: 66, lifetimeValue: 9500000, relationshipTenure: 65 } },
    { id: 'cp-0651', name: 'CREDIT AGRICOLE SECURITIES (USA) INC', dtcNumber: '0651', tier: 'Major', creditRating: 'A-', exposureAmount: '$450M', relationshipStrength: 71, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 78, responseTime: 9.8, volumeConsistency: 71, rateSensitivity: 62, availabilityUtilization: 65, lifetimeValue: 9000000, relationshipTenure: 52 } },
    { id: 'cp-0361', name: 'D. A. DAVIDSON & CO.', dtcNumber: '0361', tier: 'Major', creditRating: 'BBB+', exposureAmount: '$400M', relationshipStrength: 70, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 77, responseTime: 10.5, volumeConsistency: 70, rateSensitivity: 60, availabilityUtilization: 63, lifetimeValue: 8500000, relationshipTenure: 45 } },
    { id: 'cp-0627', name: 'DASH FINANCIAL TECHNOLOGIES LLC', dtcNumber: '0627', tier: 'Major', creditRating: 'BBB', exposureAmount: '$350M', relationshipStrength: 69, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Fintech', performanceMetrics: { hitRate: 76, responseTime: 11.2, volumeConsistency: 69, rateSensitivity: 58, availabilityUtilization: 62, lifetimeValue: 8000000, relationshipTenure: 18 } },
    { id: 'cp-0647', name: 'DAIWA CAPITAL MARKETS AMERICA INC.', dtcNumber: '0647', tier: 'Major', creditRating: 'A-', exposureAmount: '$300M', relationshipStrength: 68, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Asia', type: 'Investment Bank', performanceMetrics: { hitRate: 75, responseTime: 11.8, volumeConsistency: 68, rateSensitivity: 56, availabilityUtilization: 60, lifetimeValue: 7500000, relationshipTenure: 35 } },
    { id: 'cp-0534', name: 'INTERACTIVE BROKERS LLC/RETAIL', dtcNumber: '0534', tier: 'Major', creditRating: 'BBB+', exposureAmount: '$250M', relationshipStrength: 67, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Retail Broker', performanceMetrics: { hitRate: 74, responseTime: 12.5, volumeConsistency: 67, rateSensitivity: 54, availabilityUtilization: 58, lifetimeValue: 7000000, relationshipTenure: 28 } },
    { id: 'cp-0019', name: 'JEFFERIES LLC', dtcNumber: '0019', tier: 'Major', creditRating: 'A-', exposureAmount: '$200M', relationshipStrength: 66, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 73, responseTime: 13.2, volumeConsistency: 66, rateSensitivity: 52, availabilityUtilization: 56, lifetimeValue: 6500000, relationshipTenure: 41 } },
    { id: 'cp-2000', name: 'CLEARSTREAM BANKING AG', dtcNumber: '2000', tier: 'Major', creditRating: 'A', exposureAmount: '$150M', relationshipStrength: 65, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Custodian', performanceMetrics: { hitRate: 72, responseTime: 14.1, volumeConsistency: 65, rateSensitivity: 50, availabilityUtilization: 54, lifetimeValue: 6000000, relationshipTenure: 62 } },
    { id: 'cp-0067', name: 'INSTINET, LLC', dtcNumber: '0067', tier: 'Major', creditRating: 'BBB+', exposureAmount: '$100M', relationshipStrength: 64, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'ECN', performanceMetrics: { hitRate: 71, responseTime: 15.2, volumeConsistency: 64, rateSensitivity: 48, availabilityUtilization: 52, lifetimeValue: 5500000, relationshipTenure: 55 } },

    // Regional Tier 3 (10 firms)
    { id: 'cp-0537', name: 'BGC FINANCIAL, L.P.', dtcNumber: '0537', tier: 'Regional', creditRating: 'BBB', exposureAmount: '$80M', relationshipStrength: 58, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Broker-Dealer', performanceMetrics: { hitRate: 65, responseTime: 18.5, volumeConsistency: 58, rateSensitivity: 42, availabilityUtilization: 45, lifetimeValue: 4000000, relationshipTenure: 32 } },
    { id: 'cp-0773', name: 'BOFA SECURITIES, INC. / FIXED INCOME', dtcNumber: '0773', tier: 'Regional', creditRating: 'A', exposureAmount: '$70M', relationshipStrength: 57, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Investment Bank', performanceMetrics: { hitRate: 64, responseTime: 19.2, volumeConsistency: 57, rateSensitivity: 40, availabilityUtilization: 43, lifetimeValue: 3800000, relationshipTenure: 48 } },
    { id: 'cp-0958', name: 'DESERET TRUST COMPANY', dtcNumber: '0958', tier: 'Regional', creditRating: 'BBB', exposureAmount: '$60M', relationshipStrength: 56, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Trust Company', performanceMetrics: { hitRate: 63, responseTime: 20.8, volumeConsistency: 56, rateSensitivity: 38, availabilityUtilization: 41, lifetimeValue: 3500000, relationshipTenure: 28 } },
    { id: 'cp-0010', name: 'BROWN BROTHERS HARRIMAN & CO.', dtcNumber: '0010', tier: 'Regional', creditRating: 'A-', exposureAmount: '$50M', relationshipStrength: 55, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Private Bank', performanceMetrics: { hitRate: 62, responseTime: 22.5, volumeConsistency: 55, rateSensitivity: 36, availabilityUtilization: 39, lifetimeValue: 3200000, relationshipTenure: 85 } },
    { id: 'cp-0057', name: 'EDWARD D. JONES & CO.', dtcNumber: '0057', tier: 'Regional', creditRating: 'BBB+', exposureAmount: '$40M', relationshipStrength: 54, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Retail Broker', performanceMetrics: { hitRate: 61, responseTime: 24.2, volumeConsistency: 54, rateSensitivity: 34, availabilityUtilization: 37, lifetimeValue: 2800000, relationshipTenure: 52 } },
    { id: 'cp-0156', name: 'INTESA SANPAOLO IMI SECURITIES CORP.', dtcNumber: '0156', tier: 'Regional', creditRating: 'A-', exposureAmount: '$30M', relationshipStrength: 53, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Investment Bank', performanceMetrics: { hitRate: 60, responseTime: 26.8, volumeConsistency: 53, rateSensitivity: 32, availabilityUtilization: 35, lifetimeValue: 2500000, relationshipTenure: 38 } },
    { id: 'cp-0692', name: 'INVESCO CAPITAL MARKETS, INC.', dtcNumber: '0692', tier: 'Regional', creditRating: 'BBB+', exposureAmount: '$25M', relationshipStrength: 52, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Asset Manager', performanceMetrics: { hitRate: 59, responseTime: 28.5, volumeConsistency: 52, rateSensitivity: 30, availabilityUtilization: 33, lifetimeValue: 2200000, relationshipTenure: 45 } },
    { id: 'cp-8113', name: 'ITAU BBA USA SECURITIES, INC.', dtcNumber: '8113', tier: 'Regional', creditRating: 'BBB', exposureAmount: '$20M', relationshipStrength: 51, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'South America', type: 'Investment Bank', performanceMetrics: { hitRate: 58, responseTime: 30.2, volumeConsistency: 51, rateSensitivity: 28, availabilityUtilization: 31, lifetimeValue: 1800000, relationshipTenure: 22 } },
    { id: 'cp-0374', name: 'JANNEY MONTGOMERY SCOTT LLC', dtcNumber: '0374', tier: 'Regional', creditRating: 'BBB', exposureAmount: '$15M', relationshipStrength: 50, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Regional Broker', performanceMetrics: { hitRate: 57, responseTime: 32.8, volumeConsistency: 50, rateSensitivity: 26, availabilityUtilization: 29, lifetimeValue: 1500000, relationshipTenure: 35 } },
    { id: 'cp-8497', name: 'JANE STREET CAPITAL, LLC', dtcNumber: '8497', tier: 'Regional', creditRating: 'BBB+', exposureAmount: '$12M', relationshipStrength: 49, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Prop Trading', performanceMetrics: { hitRate: 56, responseTime: 35.5, volumeConsistency: 49, rateSensitivity: 24, availabilityUtilization: 27, lifetimeValue: 1200000, relationshipTenure: 18 } },

    // Boutique Tier 4 (5 firms)
    { id: 'cp-0109', name: 'BROWN BROTHERS HARRIMAN & CO./ETF', dtcNumber: '0109', tier: 'Boutique', creditRating: 'BBB', exposureAmount: '$8M', relationshipStrength: 42, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Specialty', performanceMetrics: { hitRate: 48, responseTime: 42.2, volumeConsistency: 42, rateSensitivity: 18, availabilityUtilization: 22, lifetimeValue: 800000, relationshipTenure: 28 } },
    { id: 'cp-3505', name: 'ETC BROKERAGE SERVICES, LLC', dtcNumber: '3505', tier: 'Boutique', creditRating: 'BB+', exposureAmount: '$5M', relationshipStrength: 41, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Specialty', performanceMetrics: { hitRate: 47, responseTime: 45.8, volumeConsistency: 41, rateSensitivity: 16, availabilityUtilization: 20, lifetimeValue: 650000, relationshipTenure: 15 } },
    { id: 'cp-0170', name: 'EUROCLEAR BANK SA/NV', dtcNumber: '0170', tier: 'Boutique', creditRating: 'A-', exposureAmount: '$3M', relationshipStrength: 40, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Europe', type: 'Custodian', performanceMetrics: { hitRate: 46, responseTime: 48.5, volumeConsistency: 40, rateSensitivity: 14, availabilityUtilization: 18, lifetimeValue: 450000, relationshipTenure: 42 } },
    { id: 'cp-2402', name: 'DRIVEWEALTH, LLC', dtcNumber: '2402', tier: 'Boutique', creditRating: 'BB', exposureAmount: '$2M', relationshipStrength: 39, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Fintech', performanceMetrics: { hitRate: 45, responseTime: 52.2, volumeConsistency: 39, rateSensitivity: 12, availabilityUtilization: 16, lifetimeValue: 280000, relationshipTenure: 8 } },
    { id: 'cp-2108', name: 'COMERICA BANK', dtcNumber: '2108', tier: 'Boutique', creditRating: 'BBB-', exposureAmount: '$1M', relationshipStrength: 38, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Regional Bank', performanceMetrics: { hitRate: 44, responseTime: 55.8, volumeConsistency: 38, rateSensitivity: 10, availabilityUtilization: 14, lifetimeValue: 150000, relationshipTenure: 25 } },
    { id: 'cp-2338', name: 'HONG KONG SECURITIES CLEARING COMPANY LIMITED', dtcNumber: '2338', tier: 'Major', creditRating: 'A', exposureAmount: '$1.1B', relationshipStrength: 80, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'Asia', type: 'Clearing', performanceMetrics: { hitRate: 85, responseTime: 6.0, volumeConsistency: 80, rateSensitivity: 70, availabilityUtilization: 75, lifetimeValue: 10000000, relationshipTenure: 30 } },
    { id: 'cp-0369', name: 'HRT FINANCIAL LP', dtcNumber: '0369', tier: 'Major', creditRating: 'A-', exposureAmount: '$900M', relationshipStrength: 78, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Prop Trading', performanceMetrics: { hitRate: 82, responseTime: 7.0, volumeConsistency: 78, rateSensitivity: 68, availabilityUtilization: 72, lifetimeValue: 9000000, relationshipTenure: 20 } },
    { id: 'cp-4264', name: 'ICE SECURITIES EXECUTION & CLEARING, LLC', dtcNumber: '4264', tier: 'Major', creditRating: 'A-', exposureAmount: '$850M', relationshipStrength: 76, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Clearing', performanceMetrics: { hitRate: 80, responseTime: 8.0, volumeConsistency: 76, rateSensitivity: 66, availabilityUtilization: 70, lifetimeValue: 8500000, relationshipTenure: 18 } },
    { id: 'cp-0813', name: 'BANKERS\' BANK', dtcNumber: '2557', tier: 'Regional', creditRating: 'BBB+', exposureAmount: '$600M', relationshipStrength: 70, assignedTemplate: null, active: true, lastActivity: '2024-07-12', region: 'North America', type: 'Bank', performanceMetrics: { hitRate: 75, responseTime: 9.0, volumeConsistency: 70, rateSensitivity: 60, availabilityUtilization: 65, lifetimeValue: 6000000, relationshipTenure: 15 } },
  ]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getCurrentTiers = () => {
    switch (activeTierType) {
      case 'rate': return rateVarianceTiers;
      case 'revenue': return revenueImpactTiers;
      case 'availability': return availabilityStrategyTiers;
      default: return [];
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bulge Bracket': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Major': return 'bg-green-100 text-green-800 border-green-200';
      case 'Regional': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Boutique': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    return value >= threshold ? 'text-green-600' : 'text-red-600';
  };

  const getTierTypeIcon = (type: TierType) => {
    switch (type) {
      case 'rate': return TrendingUp;
      case 'revenue': return DollarSign;
      case 'availability': return Shield;
    }
  };

  const getTierTypeLabel = (type: TierType) => {
    switch (type) {
      case 'rate': return 'Rate Variance Tiers';
      case 'revenue': return 'Revenue Impact Tiers';
      case 'availability': return 'Availability Strategy Tiers';
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const startEditing = (id: string, type: TierType | 'template' | 'counterparty') => {
    setEditingItem(id);
    setEditingType(type);
    
    // Load current data into form
    let currentData = {};
    if (type === 'rate') {
      currentData = rateVarianceTiers.find(t => t.id === id) || {};
    } else if (type === 'revenue') {
      currentData = revenueImpactTiers.find(t => t.id === id) || {};
    } else if (type === 'availability') {
      currentData = availabilityStrategyTiers.find(t => t.id === id) || {};
    } else if (type === 'template') {
      currentData = compositeTemplates.find(t => t.id === id) || {};
    } else if (type === 'counterparty') {
      currentData = counterparties.find(c => c.id === id) || {};
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
    
    if (editingType === 'rate') {
      updateTier('rate', editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    } else if (editingType === 'revenue') {
      updateTier('revenue', editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    } else if (editingType === 'availability') {
      updateTier('availability', editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    } else if (editingType === 'template') {
      updateTemplate(editingItem, { ...editFormData, lastModified: new Date().toISOString().split('T')[0] });
    } else if (editingType === 'counterparty') {
      updateCounterparty(editingItem, editFormData);
    }
    
    cancelEditing();
  };

  const assignTemplateToCounterparty = (counterpartyId: string, templateId: string) => {
    setCounterparties(prev => prev.map(cp => 
      cp.id === counterpartyId 
        ? { ...cp, assignedTemplate: templateId }
        : cp
    ));
    
    setCompositeTemplates(prev => prev.map(template => 
      template.id === templateId
        ? { 
            ...template, 
            assignedCounterparties: [...template.assignedCounterparties.filter(id => id !== counterpartyId), counterpartyId]
          }
        : { 
            ...template, 
            assignedCounterparties: template.assignedCounterparties.filter(id => id !== counterpartyId)
          }
    ));
    
    setShowAssignmentModal(false);
    setSelectedCounterparty(null);
  };

  const createTier = (type: TierType, tierData: Partial<RateVarianceTier | RevenueImpactTier | AvailabilityStrategyTier>) => {
    const newTier = {
      ...tierData,
      id: `${type}-${Date.now()}`,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0]
    };

    switch (type) {
      case 'rate':
        setRateVarianceTiers(prev => [...prev, newTier as RateVarianceTier]);
        break;
      case 'revenue':
        setRevenueImpactTiers(prev => [...prev, newTier as RevenueImpactTier]);
        break;
      case 'availability':
        setAvailabilityStrategyTiers(prev => [...prev, newTier as AvailabilityStrategyTier]);
        break;
    }
  };

  const updateTier = (type: TierType, id: string, updateData: Partial<RateVarianceTier | RevenueImpactTier | AvailabilityStrategyTier>) => {
    const updatedData = {
      ...updateData,
      lastModified: new Date().toISOString().split('T')[0]
    };

    switch (type) {
      case 'rate':
        setRateVarianceTiers(prev => prev.map(tier => 
          tier.id === id ? { ...tier, ...updatedData } : tier
        ));
        break;
      case 'revenue':
        setRevenueImpactTiers(prev => prev.map(tier => 
          tier.id === id ? { ...tier, ...updatedData } : tier
        ));
        break;
      case 'availability':
        setAvailabilityStrategyTiers(prev => prev.map(tier => 
          tier.id === id ? { ...tier, ...updatedData } : tier
        ));
        break;
    }
  };

  const deleteTier = (type: TierType, id: string) => {
    if (window.confirm('Are you sure you want to delete this tier?')) {
      switch (type) {
        case 'rate':
          setRateVarianceTiers(prev => prev.filter(tier => tier.id !== id));
          break;
        case 'revenue':
          setRevenueImpactTiers(prev => prev.filter(tier => tier.id !== id));
          break;
        case 'availability':
          setAvailabilityStrategyTiers(prev => prev.filter(tier => tier.id !== id));
          break;
      }
    }
  };

  const updateTemplate = (id: string, updateData: Partial<CompositeTemplate>) => {
    setCompositeTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updateData } : template
    ));
  };

  const updateCounterparty = (id: string, updateData: Partial<Counterparty>) => {
    setCounterparties(prev => prev.map(cp => 
      cp.id === id ? { ...cp, ...updateData } : cp
    ));
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveDragId(null);
      return;
    }

    const counterpartyId = active.id as string;
    const templateId = over.id as string;

    // Check if dropping on a template
    if (compositeTemplates.some(t => t.id === templateId)) {
      assignTemplateToCounterparty(counterpartyId, templateId);
    } else if (templateId === 'unassigned') {
      // Remove template assignment
      setCounterparties(prev => prev.map(cp => 
        cp.id === counterpartyId ? { ...cp, assignedTemplate: null } : cp
      ));
    }

    setActiveDragId(null);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  // ============================================================================
  // ENHANCED ASSIGNMENT FUNCTIONS
  // ============================================================================

  const getCounterpartiesByTemplate = (templateId: string | null) => {
    return counterparties.filter(cp => cp.assignedTemplate === templateId);
  };

  const getUnassignedCounterparties = () => {
    return counterparties.filter(cp => cp.assignedTemplate === null);
  };

  const getFilteredCounterparties = () => {
    return counterparties.filter(cp => {
      const matchesSearch = cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cp.dtcNumber.includes(searchTerm);
      const matchesTier = counterpartyFilter === 'all' || cp.tier === counterpartyFilter;
      const matchesTemplate = templateFilter === 'all' || 
                             (templateFilter === 'unassigned' && cp.assignedTemplate === null) ||
                             cp.assignedTemplate === templateFilter;
      return matchesSearch && matchesTier && matchesTemplate;
    });
  };

  // ============================================================================
  // SORTABLE COUNTERPARTY COMPONENT
  // ============================================================================

  const SortableCounterparty: React.FC<{ counterparty: Counterparty; isInTemplate?: boolean }> = ({ 
    counterparty, 
    isInTemplate = false 
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: counterparty.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-white border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow",
          isDragging && "ring-2 ring-blue-500 ring-opacity-50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-gray-100 rounded">
              <Move className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">{counterparty.name}</div>
              <div className="text-xs text-gray-500">DTC #{counterparty.dtcNumber}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", getTierColor(counterparty.tier))}>
              {counterparty.tier}
            </Badge>
            <div className="text-xs text-gray-500">{counterparty.exposureAmount}</div>
            {isInTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCounterparties(prev => prev.map(cp => 
                    cp.id === counterparty.id ? { ...cp, assignedTemplate: null } : cp
                  ));
                }}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // DROPPABLE TEMPLATE COMPONENT
  // ============================================================================

  const DroppableTemplate: React.FC<{ template: CompositeTemplate }> = ({ template }) => {
    const { setNodeRef, isOver } = useDroppable({ id: template.id });
    const assignedCounterparties = getCounterpartiesByTemplate(template.id);
    
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "bg-white border-2 border-dashed rounded-lg p-4 hover:border-blue-400 transition-colors min-h-[200px]",
          isOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {assignedCounterparties.length} CPs
          </Badge>
        </div>
        
        <div className="space-y-2">
          <SortableContext items={assignedCounterparties.map(cp => cp.id)} strategy={verticalListSortingStrategy}>
            {assignedCounterparties.map(cp => (
              <SortableCounterparty key={cp.id} counterparty={cp} isInTemplate={true} />
            ))}
          </SortableContext>
          
          {assignedCounterparties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Drag counterparties here to assign</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // COMPONENT RENDERING
  // ============================================================================

  const TierCard: React.FC<{ 
    tier: RateVarianceTier | RevenueImpactTier | AvailabilityStrategyTier; 
    type: TierType; 
  }> = ({ tier, type }) => (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn("w-4 h-4 rounded-full", 
              tier.color.includes('green') ? 'bg-green-500' : 
              tier.color.includes('blue') ? 'bg-blue-500' : 
              tier.color.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
            )}></div>
            <h3 className="font-semibold text-gray-900">{tier.name}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={tier.isActive ? "default" : "secondary"} className="text-xs">
              {tier.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => startEditing(tier.id, type)} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteTier(type, tier.id)} className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
        
        <div className="space-y-3 text-sm text-gray-700">
          {type === 'rate' && 'absoluteBps' in tier && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">Absolute BPS:</span> 
                <span>±{tier.absoluteBps} bps</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Percentage Rate:</span> 
                <span>±{tier.percentageRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Standard Deviation:</span> 
                <span>{tier.standardDeviation}σ</span>
              </div>
            </>
          )}
          {type === 'revenue' && 'absoluteDollar' in tier && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">Absolute Dollar:</span> 
                <span>${tier.absoluteDollar.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Percentage Loan:</span> 
                <span>{tier.percentageLoan}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Daily Revenue:</span> 
                <span>{tier.percentageDailyRevenue}%</span>
              </div>
            </>
          )}
          {type === 'availability' && 'baseAllocation' in tier && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">Base Allocation:</span> 
                <span>{tier.baseAllocation}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Surge Capacity:</span> 
                <span>+{tier.surgeCapacity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Soft Limit:</span> 
                <span>{tier.softLimit}%</span>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Modified {new Date(tier.lastModified).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TemplateCard: React.FC<{ template: CompositeTemplate }> = ({ template }) => {
    const rateTier = rateVarianceTiers.find(t => t.id === template.rateVarianceTier);
    const revenueTier = revenueImpactTiers.find(t => t.id === template.revenueImpactTier);
    const availabilityTier = availabilityStrategyTiers.find(t => t.id === template.availabilityStrategyTier);
    
    return (
      <Card className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{template.description}</p>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Rate Variance</div>
                <div className="text-sm font-medium">{rateTier?.name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Revenue Impact</div>
                <div className="text-sm font-medium">{revenueTier?.name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Availability Strategy</div>
                <div className="text-sm font-medium">{availabilityTier?.name}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-500">Total Loans</div>
              <div className="font-semibold text-gray-900">{template.performanceMetrics.totalLoans.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Approval Rate</div>
              <div className={cn("font-semibold", getPerformanceColor(template.performanceMetrics.approvalRate, 90))}>
                {template.performanceMetrics.approvalRate}%
              </div>
            </div>
            <div>
              <div className="text-gray-500">Avg Revenue</div>
              <div className="font-semibold text-gray-900">${template.performanceMetrics.averageRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Override Rate</div>
              <div className="font-semibold text-gray-900">{template.performanceMetrics.overrideRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // COUNTERPARTY CARD COMPONENT
  // ============================================================================

  const CounterpartyCard: React.FC<{ counterparty: Counterparty }> = ({ counterparty }) => {
    const assignedTemplate = compositeTemplates.find(t => t.id === counterparty.assignedTemplate);
    
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{counterparty.name}</h3>
                <p className="text-sm text-gray-600">DTC #{counterparty.dtcNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => startEditing(counterparty.id, 'counterparty')} className="h-8 w-8 p-0">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedCounterparty(counterparty.id);
                setShowAssignmentModal(true);
              }} className="h-8 w-8 p-0">
                <Target className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Tier:</span>
              <Badge className={cn("ml-2 text-xs", getTierColor(counterparty.tier))}>
                {counterparty.tier}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Region:</span>
              <span className="ml-2 font-medium">{counterparty.region}</span>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium">{counterparty.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Rating:</span>
              <span className="ml-2 font-medium">{counterparty.creditRating}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <span className="text-gray-500">Hit Rate:</span>
              <span className={cn("ml-1 font-medium", getPerformanceColor(counterparty.performanceMetrics.hitRate, 90))}>
                {counterparty.performanceMetrics.hitRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Response:</span>
              <span className="ml-1 font-medium">{counterparty.performanceMetrics.responseTime}m</span>
            </div>
            <div>
              <span className="text-gray-500">LTV:</span>
              <span className="ml-1 font-medium">${(counterparty.performanceMetrics.lifetimeValue / 1000000).toFixed(1)}M</span>
            </div>
            <div>
              <span className="text-gray-500">Tenure:</span>
              <span className="ml-1 font-medium">{counterparty.performanceMetrics.relationshipTenure}m</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">Template:</span>
                {assignedTemplate ? (
                  <Badge variant="default" className="ml-2 text-xs">
                    {assignedTemplate.name}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 text-xs">Unassigned</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {counterparty.exposureAmount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Wrap the entire return in a gradient background and max-width container
  return (
    <div className="fis-page-gradient min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header and Navigation */}
        <div className="mb-4 px-2 pt-6">
          <div className="flex justify-between items-center p-4 bg-white rounded shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Auto-Loan Decision Engine</h1>
              <p className="text-gray-600 mt-1">Sophisticated automated securities lending decision parameters and logic</p>
            </div>
            <div className="flex space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeView === 'tiers' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('tiers')}
                  className="px-4"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Tiers
                </Button>
                <Button
                  variant={activeView === 'templates' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('templates')}
                  className="px-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button
                  variant={activeView === 'counterparties' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('counterparties')}
                  className="px-4"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Counterparties
                </Button>
                <Button
                  variant={activeView === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('analytics')}
                  className="px-4"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section (Tiers, Templates, Counterparties, Analytics) */}
        <div className="mb-8 px-2">
          {/* Tiers Management */}
          {activeView === 'tiers' && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                {/* Tier Type Selector */}
                <div className="mb-6">
                  <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                    {(['rate', 'revenue', 'availability'] as TierType[]).map((type) => {
                      const Icon = getTierTypeIcon(type);
                      return (
                        <Button
                          key={type}
                          variant={activeTierType === type ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setActiveTierType(type)}
                          className="px-4"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {getTierTypeLabel(type)}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Tier Actions */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search tiers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowNewTierForm(true)}
                    className="bg-fis-green hover:bg-fis-green-dark"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New {getTierTypeLabel(activeTierType).split(' ')[0]} Tier
                  </Button>
                </div>

                {/* Tier Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getCurrentTiers()
                    .filter(tier => tier.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(tier => (
                      <TierCard key={tier.id} tier={tier} type={activeTierType} />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Templates Management */}
          {activeView === 'templates' && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Composite Templates</h2>
                  <Button 
                    onClick={() => setShowNewTemplateForm(true)}
                    className="bg-fis-green hover:bg-fis-green-dark"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {compositeTemplates.map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Counterparties */}
          {activeView === 'counterparties' && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Counterparties</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage counterparty assignments and performance</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant={showAssignmentView ? 'default' : 'outline'}
                      onClick={() => setShowAssignmentView(!showAssignmentView)}
                      className="flex items-center space-x-2"
                    >
                      <Move className="w-4 h-4" />
                      <span>Assignment View</span>
                    </Button>
                    <Button 
                      onClick={() => setShowNewTemplateForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Counterparty
                    </Button>
                  </div>
                </div>

                {/* Conditional rendering for assignment view toggle */}
                {!showAssignmentView ? (
                  // Traditional Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {counterparties.map(counterparty => (
                      <CounterpartyCard key={counterparty.id} counterparty={counterparty} />
                    ))}
                  </div>
                ) : (
                  // Drag-and-drop Assignment View
                  <>
                    <div className="bg-white border rounded-lg p-6 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Assignment Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{counterparties.length}</div>
                          <div className="text-sm text-gray-600">Total Counterparties</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{counterparties.filter(cp => cp.assignedTemplate).length}</div>
                          <div className="text-sm text-gray-600">Assigned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{getUnassignedCounterparties().length}</div>
                          <div className="text-sm text-gray-600">Unassigned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{compositeTemplates.length}</div>
                          <div className="text-sm text-gray-600">Active Templates</div>
                        </div>
                      </div>
                    </div>
                    <DndContext
                      sensors={sensors}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                    >
                      <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="Search counterparties..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by tier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Tiers</SelectItem>
                                <SelectItem value="Bulge Bracket">Bulge Bracket</SelectItem>
                                <SelectItem value="Major">Major</SelectItem>
                                <SelectItem value="Regional">Regional</SelectItem>
                                <SelectItem value="Boutique">Boutique</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={templateFilter} onValueChange={setTemplateFilter}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Templates</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {compositeTemplates.map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          {/* Unassigned Counterparties */}
                          <div className="lg:col-span-1">
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[600px]">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Unassigned</h3>
                                <Badge className="bg-gray-100 text-gray-800">
                                  {getUnassignedCounterparties().length} CPs
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <SortableContext items={getUnassignedCounterparties().map(cp => cp.id)} strategy={verticalListSortingStrategy}>
                                  {getUnassignedCounterparties()
                                    .filter(cp => {
                                      const matchesSearch = cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        cp.dtcNumber.includes(searchTerm);
                                      const matchesTier = counterpartyFilter === 'all' || cp.tier === counterpartyFilter;
                                      return matchesSearch && matchesTier;
                                    })
                                    .map(cp => (
                                      <SortableCounterparty key={cp.id} counterparty={cp} />
                                    ))}
                                </SortableContext>
                              </div>
                            </div>
                          </div>
                          {/* Template Assignment Areas */}
                          <div className="lg:col-span-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {compositeTemplates.map(template => (
                                <DroppableTemplate key={template.id} template={template} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <DragOverlay>
                        {activeDragId ? (
                          <div className="bg-white border rounded-lg p-3 shadow-lg transform rotate-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-1 bg-gray-100 rounded">
                                <Move className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {counterparties.find(cp => cp.id === activeDragId)?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  DTC #{counterparties.find(cp => cp.id === activeDragId)?.dtcNumber}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Analytics Dashboard */}
          {activeView === 'analytics' && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Loans</p>
                          <p className="text-2xl font-bold text-gray-900">2,847</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Approval Rate</p>
                          <p className="text-2xl font-bold text-gray-900">91.2%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Zap className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">$9,847</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Override Rate</p>
                          <p className="text-2xl font-bold text-gray-900">5.8%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Template Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {compositeTemplates.map(template => (
                          <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{template.name}</div>
                              <div className="text-sm text-gray-600">{template.performanceMetrics.totalLoans} loans</div>
                            </div>
                            <div className="text-right">
                              <div className={cn("font-medium", getPerformanceColor(template.performanceMetrics.approvalRate, 90))}>
                                {template.performanceMetrics.approvalRate}%
                              </div>
                              <div className="text-sm text-gray-600">approval rate</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Loan approved for Goldman Sachs</div>
                            <div className="text-xs text-gray-500">AAPL - $2.5M at -0.3%</div>
                          </div>
                          <div className="text-xs text-gray-500">2 min ago</div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Override required for Morgan Stanley</div>
                            <div className="text-xs text-gray-500">TSLA - $5.2M at -2.1%</div>
                          </div>
                          <div className="text-xs text-gray-500">5 min ago</div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Loan approved for JP Morgan</div>
                            <div className="text-xs text-gray-500">MSFT - $1.8M at -0.2%</div>
                          </div>
                          <div className="text-xs text-gray-500">8 min ago</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contextual Summary for Each View - visually aligned */}
        <div className="bg-white border-t border-gray-200 p-6 mt-8">
          {(() => {
            switch (activeView) {
              case 'tiers':
                return (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">About Tiers</h3>
                    <p className="text-blue-800 mb-2">Tiers are the building blocks of the parameter system. Each tier defines a set of tolerances or thresholds for rate variance, revenue impact, or availability strategy. By grouping counterparties with similar risk or business profiles into tiers, you can manage and update lending parameters at scale, ensuring consistency and rapid response to market changes.</p>
                    <ul className="text-sm text-blue-700 list-disc pl-5">
                      <li>Rate Tiers: Control rate variance tolerances by group</li>
                      <li>Revenue Tiers: Set minimum profitability thresholds</li>
                      <li>Availability Tiers: Limit inventory access by relationship</li>
                    </ul>
                  </div>
                );
              case 'templates':
                return (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">About Templates</h3>
                    <p className="text-green-800 mb-2">Templates combine multiple tiers into a single, reusable parameter set. This allows you to quickly assign complex rule sets to counterparties, and to update many assignments at once by editing a template. Templates are the key to scalable, rules-based management of your lending program.</p>
                    <ul className="text-sm text-green-700 list-disc pl-5">
                      <li>Mix and match tiers for flexible strategies</li>
                      <li>Assign templates to counterparties for instant parameterization</li>
                      <li>Update templates to propagate changes to all assigned counterparties</li>
                    </ul>
                  </div>
                );
              case 'counterparties':
                return (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">About Counterparty Assignment</h3>
                    <p className="text-purple-800 mb-2">This screen lets you assign DTC counterparties to parameter templates using a drag-and-drop interface. Assignments determine which rules and tolerances apply to each counterparty, enabling tailored risk management and operational efficiency.</p>
                    <ul className="text-sm text-purple-700 list-disc pl-5">
                      <li>Drag counterparties to templates for instant assignment</li>
                      <li>Filter and search to quickly find and manage assignments</li>
                      <li>See assignment summaries and performance metrics</li>
                    </ul>
                  </div>
                );
              case 'analytics':
                return (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">About Analytics</h3>
                    <p className="text-indigo-800 mb-2">The analytics view provides real-time insights into template usage, assignment distribution, and parameter performance. Use these metrics to identify trends, optimize strategies, and demonstrate the value of your automated lending program to stakeholders.</p>
                    <ul className="text-sm text-indigo-700 list-disc pl-5">
                      <li>Track template and tier usage across counterparties</li>
                      <li>Monitor approval rates, overrides, and revenue impact</li>
                      <li>Identify opportunities for optimization and risk control</li>
                    </ul>
                  </div>
                );
              case 'assignments':
                return (
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">About Assignments</h3>
                    <p className="text-orange-800 mb-2">The assignments view summarizes all current counterparty-to-template mappings, making it easy to audit, review, and update your parameterization strategy. This is your control center for ensuring every counterparty is governed by the right set of rules.</p>
                    <ul className="text-sm text-orange-700 list-disc pl-5">
                      <li>Review all assignments at a glance</li>
                      <li>Quickly reassign or update as business needs change</li>
                      <li>Maintain a clear audit trail for compliance and reporting</li>
                    </ul>
                  </div>
                );
              default:
                return null;
            }
          })()}
        </div>

        {/* System Description and Summaries - visually aligned */}
        <div className="bg-white border-t border-gray-200 p-6 mt-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Auto-Loan Business Logic Engine & Parameter Management System</h2>
            {/* Executive Summary */}
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">System Purpose & Business Value</h3>
              <p className="text-blue-800 leading-relaxed">
                The Auto-Loan Decision Engine enables scalable, rules-based management of loan parameters for all counterparties. By grouping rate, revenue, and availability tolerances into reusable templates, it eliminates manual, counterparty-specific rule maintenance and enables mass updates in seconds. This empowers trading desks to respond rapidly to market changes and client needs, while ensuring consistent, auditable application of lending parameters.
              </p>
            </div>
            {/* User Workflow - visually aligned */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Workflow</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2">Create Tiers</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Define rate, revenue, and availability tolerances for different risk/relationship profiles</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2">Build Templates</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Combine tiers into templates for easy mass assignment and management</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2">Assign Counterparties</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Drag and drop DTC participants to templates for instant parameterization</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-900 mb-2">Automated Processing</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• All loan requests are evaluated using assigned templates and rules</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Key Features - visually aligned */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-5 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Tiered Parameterization</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Group rate, revenue, and availability logic into reusable tiers for easy management and mass updates.
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Rate Tiers:</strong> Control rate variance tolerances by counterparty group</div>
                  <div><strong>Revenue Tiers:</strong> Set minimum profitability thresholds</div>
                  <div><strong>Availability Tiers:</strong> Limit inventory access by relationship</div>
                </div>
              </div>
              <div className="bg-green-50 p-5 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Drag & Drop Assignment</h3>
                <p className="text-sm text-green-800 mb-3">
                  Intuitive interface for mapping counterparties to templates, with real-time updates and visual feedback.
                </p>
                <div className="text-xs text-green-700 space-y-1">
                  <div><strong>Unassigned Pool:</strong> Easily see and assign unassigned counterparties</div>
                  <div><strong>Template Drop Zones:</strong> Drag to assign, click to remove</div>
                  <div><strong>Assignment Summary:</strong> Track total, assigned, and unassigned at a glance</div>
                </div>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3">Real-Time Updates & Analytics</h3>
                <p className="text-sm text-purple-800 mb-3">
                  Changes to tiers or templates instantly affect all assigned counterparties, with full auditability.
                </p>
                <div className="text-xs text-purple-700 space-y-1">
                  <div><strong>Instant Propagation:</strong> Parameter changes flow to all assignments</div>
                  <div><strong>Audit Trail:</strong> Track who changed what, when</div>
                  <div><strong>Performance Metrics:</strong> Analyze template usage and counterparty distribution</div>
                </div>
              </div>
            </div>
            {/* Integration Flow - visually aligned */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Flow</h3>
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg text-center flex-1">
                  <div className="font-semibold text-blue-900">LCOR System</div>
                  <div className="text-xs text-blue-800">Loan requests from counterparties</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-green-100 p-3 rounded-lg text-center flex-1">
                  <div className="font-semibold text-green-900">Decision Engine</div>
                  <div className="text-xs text-green-800">Template & tier definitions</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-purple-100 p-3 rounded-lg text-center flex-1">
                  <div className="font-semibold text-purple-900">Auto-Loan Business Logic Engine</div>
                  <div className="text-xs text-purple-800">Real-time decision processing</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-orange-100 p-3 rounded-lg text-center flex-1">
                  <div className="font-semibold text-orange-900">Automated Response</div>
                  <div className="text-xs text-orange-800">Approve/Reject/Override decision</div>
                </div>
              </div>
            </div>
            {/* Operational Benefits - visually aligned */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Mass Updates & Strategic Flexibility</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Mass Updates:</strong> Change one tier, update hundreds of counterparties instantly</li>
                    <li>• <strong>Strategic Flexibility:</strong> Instantly reassign counterparties as relationships evolve</li>
                    <li>• <strong>Consistent Application:</strong> No more manual errors in rule application</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Risk Control & Auditability</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Risk Control:</strong> Consistent, auditable application of lending parameters</li>
                    <li>• <strong>Audit Trail:</strong> Full history of parameter and assignment changes</li>
                    <li>• <strong>Performance Analytics:</strong> Analyze template and counterparty performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLoanDecisionEngine; 