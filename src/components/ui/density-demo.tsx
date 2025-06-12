import React, { useState, useEffect } from 'react'
import { AlertCircle, X, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDensityMode, DensityMode } from '@/components/ui/density-toggle'

export const DensityDemo: React.FC = () => {
  const { density } = useDensityMode()
  const [showDemo, setShowDemo] = useState(false)
  const [previousDensity, setPreviousDensity] = useState<DensityMode>(density)

  useEffect(() => {
    if (density !== previousDensity) {
      setShowDemo(true)
      setPreviousDensity(density)
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setShowDemo(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [density, previousDensity])

  const getDensityDescription = (mode: DensityMode) => {
    switch (mode) {
      case 'compact':
        return 'Showing more data with tighter spacing and smaller text'
      case 'normal':
        return 'Standard spacing and sizing for comfortable viewing'
      case 'comfortable':
        return 'Generous spacing and larger elements for easier reading'
    }
  }

  const getDensityColor = (mode: DensityMode) => {
    switch (mode) {
      case 'compact':
        return 'border-blue-200 bg-blue-50'
      case 'normal':
        return 'border-green-200 bg-green-50'
      case 'comfortable':
        return 'border-purple-200 bg-purple-50'
    }
  }

  if (!showDemo) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
      <Card className={`w-80 border-2 shadow-lg ${getDensityColor(density)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Density Mode: {density.charAt(0).toUpperCase() + density.slice(1)}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {getDensityDescription(density)}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDemo(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component to show the current density effect on sample content
export const DensityPreview: React.FC = () => {
  const { density } = useDensityMode()

  return (
    <div className="space-y-4 max-w-md">
      <div className="text-sm font-medium text-gray-700">
        Current density: <span className="capitalize font-semibold">{density}</span>
      </div>
      
      <Card className="card">
        <CardContent className="space-y-2">
          <div className="text-sm font-medium">Sample Data</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Account</th>
                <th className="text-right py-1">Balance</th>
                <th className="text-right py-1">Status</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              <tr>
                <td className="py-1">ACC-001</td>
                <td className="text-right py-1">$1,250,000</td>
                <td className="text-right py-1">Active</td>
              </tr>
              <tr>
                <td className="py-1">ACC-002</td>
                <td className="text-right py-1">$875,500</td>
                <td className="text-right py-1">Review</td>
              </tr>
              <tr>
                <td className="py-1">ACC-003</td>
                <td className="text-right py-1">$2,100,000</td>
                <td className="text-right py-1">Warning</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
} 