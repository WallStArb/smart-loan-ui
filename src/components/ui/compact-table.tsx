import React from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

interface CompactTableProps<T> {
  data: T[]
  columns: Column<T>[]
  sortColumn?: keyof T
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void
  maxHeight?: string
  className?: string
  striped?: boolean
  hover?: boolean
  compact?: boolean
  stickyHeader?: boolean
}

export function CompactTable<T extends { id: string | number }>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  maxHeight = '600px',
  className,
  striped = true,
  hover = true,
  compact = false,
  stickyHeader = true
}: CompactTableProps<T>) {
  const handleSort = (column: keyof T) => {
    if (!onSort) return
    
    const newDirection = 
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column, newDirection)
  }

  const getSortIcon = (column: keyof T) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />
  }

  return (
    <div 
      className={cn(
        "w-full overflow-auto border border-gray-200 rounded-lg bg-white",
        compact && "text-sm",
        className
      )}
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse">
        <thead 
          className={cn(
            "bg-gray-50/80 border-b border-gray-200",
            stickyHeader && "sticky top-0 z-10"
          )}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 last:border-r-0",
                  compact ? "px-2 py-2" : "px-4 py-3",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                  column.className
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.label}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr
              key={row.id}
              className={cn(
                "transition-colors",
                hover && "hover:bg-gray-50",
                striped && index % 2 === 1 && "bg-gray-25"
              )}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={cn(
                    "border-r border-gray-100 last:border-r-0 text-gray-900",
                    compact ? "px-2 py-1.5 text-xs" : "px-4 py-2 text-sm",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.className
                  )}
                >
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No data available</p>
        </div>
      )}
    </div>
  )
}

// Utility components for common table cells
export const TableBadge: React.FC<{ 
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'xs'
}> = ({ children, variant = 'default', size = 'xs' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-sm'
  }

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-medium",
      variantClasses[variant],
      sizeClasses[size]
    )}>
      {children}
    </span>
  )
}

export const TableCurrency: React.FC<{ value: number; compact?: boolean }> = ({ 
  value, 
  compact = false 
}) => {
  const formatValue = (val: number) => {
    if (compact && Math.abs(val) >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`
    }
    if (compact && Math.abs(val) >= 1000) {
      return `$${(val / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <span className={cn(
      "font-mono tabular-nums",
      value < 0 ? "text-red-600" : "text-gray-900"
    )}>
      {formatValue(value)}
    </span>
  )
}

export const TablePercent: React.FC<{ value: number; precision?: number }> = ({ 
  value, 
  precision = 1 
}) => (
  <span className={cn(
    "font-mono tabular-nums",
    value > 80 ? "text-red-600" : value > 60 ? "text-yellow-600" : "text-gray-900"
  )}>
    {value.toFixed(precision)}%
  </span>
) 