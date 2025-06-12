import React, { useState } from 'react'
import { 
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  Clock,
  Shield,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ParametersPageProps {
  onNavigateToNeeds?: () => void
  onNavigateToCollateral?: () => void
}

const ParametersPageSimple: React.FC<ParametersPageProps> = ({ 
  onNavigateToNeeds, 
  onNavigateToCollateral 
}) => {
  const [lastUpdate] = useState(new Date())
  const [hasChanges, setHasChanges] = useState(false)

  const parameterSections = [
    {
      title: 'Risk Management',
      icon: Shield,
      description: 'Configure risk thresholds and limits',
      parameters: [
        { name: 'Maximum Exposure Limit', value: '$50,000,000', type: 'currency' },
        { name: 'Concentration Limit', value: '15%', type: 'percentage' },
        { name: 'Minimum Credit Rating', value: 'BBB-', type: 'rating' }
      ]
    },
    {
      title: 'Borrowing Parameters',
      icon: TrendingUp,
      description: 'Set borrowing rates and terms',
      parameters: [
        { name: 'Base Borrowing Rate', value: '2.5%', type: 'percentage' },
        { name: 'Rate Adjustment Factor', value: '0.25%', type: 'percentage' },
        { name: 'Maximum Term', value: '90 days', type: 'duration' }
      ]
    },
    {
      title: 'Collateral Settings',
      icon: Shield,
      description: 'Configure collateral requirements',
      parameters: [
        { name: 'Minimum Haircut', value: '5%', type: 'percentage' },
        { name: 'Maximum Haircut', value: '25%', type: 'percentage' },
        { name: 'Revaluation Frequency', value: 'Daily', type: 'frequency' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-fis-green to-fis-green-dark rounded-lg flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">System Parameters</h1>
              <p className="text-sm text-gray-600">Configure system settings and risk parameters</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-success-muted text-success border-success px-3 py-1">
              <Clock className="w-4 h-4 mr-1.5" />
              Updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            {hasChanges && (
              <Badge variant="destructive" className="px-3 py-1">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card 
            className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigateToNeeds?.()}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Go to</p>
                  <p className="text-lg font-bold text-gray-900">Needs Management</p>
                </div>
                <div className="w-8 h-8 bg-fis-green-muted rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-fis-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigateToCollateral?.()}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Go to</p>
                  <p className="text-lg font-bold text-gray-900">Collateral Management</p>
                </div>
                <div className="w-8 h-8 bg-info-muted rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Parameters Sections */}
      <div className="max-w-7xl mx-auto space-y-6">
        {parameterSections.map((section, index) => (
          <Card key={index} className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-fis-green-muted rounded-lg flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-fis-green" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.parameters.map((param, paramIndex) => (
                  <div key={paramIndex} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {param.name}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={param.value}
                        onChange={() => setHasChanges(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fis-green focus:border-fis-green text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Badge variant="secondary" className="text-xs">
                          {param.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setHasChanges(false)}
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Changes
          </Button>
          <Button 
            variant="success"
            onClick={() => setHasChanges(false)}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Parameters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ParametersPageSimple 