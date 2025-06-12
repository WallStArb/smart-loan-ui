import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "info" | "critical"
  className?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ size = "md", variant = "default", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6", 
      lg: "w-8 h-8"
    }

    const variantClasses = {
      default: "text-primary",
      success: "text-success",
      warning: "text-warning",
      info: "text-info",
      critical: "text-critical"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Loading.displayName = "Loading"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "info" | "critical"
  className?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", variant = "default", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Loading size={size} variant={variant} />
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingDotsProps {
  variant?: "default" | "success" | "warning" | "info" | "critical"
  className?: string
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ variant = "default", className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning", 
      info: "bg-info",
      critical: "bg-critical"
    }

    return (
      <div
        ref={ref}
        className={cn("flex space-x-1", className)}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              variantClasses[variant]
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s"
            }}
          />
        ))}
      </div>
    )
  }
)
LoadingDots.displayName = "LoadingDots"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, lines = 1, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded animate-pulse"
            style={{
              width: `${Math.random() * 40 + 60}%`
            }}
          />
        ))}
      </div>
    )
  }
)
LoadingSkeleton.displayName = "LoadingSkeleton"

export { Loading, LoadingSpinner, LoadingDots, LoadingSkeleton } 