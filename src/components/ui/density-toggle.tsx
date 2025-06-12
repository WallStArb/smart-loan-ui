import React from 'react'
import { LayoutGrid, Layers, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DensityMode = 'compact' | 'normal' | 'comfortable'

interface DensityToggleProps {
  density: DensityMode
  onDensityChange: (density: DensityMode) => void
  className?: string
}

export const DensityToggle: React.FC<DensityToggleProps> = ({
  density,
  onDensityChange,
  className
}) => {
  const densityOptions: { mode: DensityMode; icon: React.ComponentType<any>; label: string }[] = [
    { mode: 'compact', icon: Layers, label: 'Compact' },
    { mode: 'normal', icon: LayoutGrid, label: 'Normal' },
    { mode: 'comfortable', icon: Square, label: 'Comfortable' }
  ]

  return (
    <div className={cn("flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-md p-1", className)}>
      {densityOptions.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          onClick={() => onDensityChange(mode)}
          className={cn(
            "h-7 px-2.5 text-xs font-medium transition-all border",
            density === mode 
              ? "bg-white text-gray-900 border-white shadow-sm hover:bg-white" 
              : "text-white border-transparent hover:bg-white/20 hover:border-white/40"
          )}
          title={`${label} density - Click to change view density`}
        >
          <Icon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{label.charAt(0)}</span>
        </Button>
      ))}
    </div>
  )
}

// Hook for managing density mode
export const useDensityMode = () => {
  const [density, setDensity] = React.useState<DensityMode>(() => {
    // Check for saved preference or default to normal
    const saved = localStorage.getItem('density-mode') as DensityMode
    return saved || 'normal'
  })

  const changeDensity = React.useCallback((newDensity: DensityMode) => {
    setDensity(newDensity)
    localStorage.setItem('density-mode', newDensity)
    
    // Apply density class to body
    document.body.className = document.body.className
      .replace(/density-(compact|normal|comfortable)/g, '')
      .trim()
    document.body.classList.add(`density-${newDensity}`)
  }, [])

  // Apply initial density class
  React.useEffect(() => {
    document.body.classList.add(`density-${density}`)
    
    return () => {
      document.body.className = document.body.className
        .replace(/density-(compact|normal|comfortable)/g, '')
        .trim()
    }
  }, [density])

  return { density, changeDensity }
} 