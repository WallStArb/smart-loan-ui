import * as React from "react"
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow
} from "@floating-ui/react"
import { cn } from "@/lib/utils"

/**
 * Modern Tooltip Component using Floating UI
 * 
 * Simple Usage:
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * Advanced Usage:
 * <Tooltip 
 *   content="Custom tooltip" 
 *   side="right" 
 *   sideOffset={10}
 *   delayDuration={500}
 *   className="bg-blue-900"
 * >
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * Legacy Compatibility (for existing code):
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <button>Hover me</button>
 *     </TooltipTrigger>
 *     <TooltipContent>
 *       <p>Tooltip content</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 */

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  delayDuration?: number
  className?: string
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = "top", sideOffset = 4, delayDuration = 700, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const arrowRef = React.useRef(null)

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: side,
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(sideOffset),
        flip({
          fallbackAxisSideDirection: "start",
        }),
        shift({ padding: 5 }),
        arrow({
          element: arrowRef,
        }),
      ],
    })

    const hover = useHover(context, {
      move: false,
      delay: { open: delayDuration },
    })
    const focus = useFocus(context)
    const dismiss = useDismiss(context)
    const role = useRole(context, { role: "tooltip" })

    const { getReferenceProps, getFloatingProps } = useInteractions([
      hover,
      focus,
      dismiss,
      role,
    ])

    return (
      <>
        {React.cloneElement(children as React.ReactElement, {
          ref: refs.setReference,
          ...getReferenceProps(),
        })}
        {isOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className={cn(
                "z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                "shadow-md border border-gray-200",
                className
              )}
            >
              {content}
              <FloatingArrow
                ref={arrowRef}
                context={context}
                className="fill-gray-900"
                width={11}
                height={5}
              />
            </div>
          </FloatingPortal>
        )}
      </>
    )
  }
)

Tooltip.displayName = "Tooltip"

// Legacy compatibility components for easy migration
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, { ref, ...props })
  }
  return (
    <span ref={ref} {...props}>
      {children}
    </span>
  )
})

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ children, className, sideOffset = 4, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

TooltipTrigger.displayName = "TooltipTrigger"
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent }
