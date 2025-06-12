import React from 'react'
import { Checkbox } from './checkbox'

interface CustomCheckboxProps {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ 
  checked, 
  disabled = false, 
  onChange, 
  children 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        checked={checked}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(checked as boolean)}
      />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

export default CustomCheckbox 