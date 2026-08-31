import { Loader2 } from "lucide-react"

import { cn } from "@shared/lib/utils"

export type LoadingStateSize = "sm" | "md" | "lg"

export interface LoadingStateProps extends React.ComponentProps<"div"> {
  /** Visible label announced to assistive tech. Defaults to "Đang tải". */
  label?: string
  size?: LoadingStateSize
  /** Use a calm, single-line variant for inline loading indicators. */
  inline?: boolean
}

const containerClasses: Record<LoadingStateSize, string> = {
  sm: "min-h-[160px] py-10",
  md: "min-h-[280px] py-16",
  lg: "min-h-[400px] py-24",
}

const iconSizeClasses: Record<LoadingStateSize, string> = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

function LoadingState({
  label = "Đang tải",
  size = "md",
  inline = false,
  className,
  ...props
}: LoadingStateProps) {
  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center gap-2 text-muted-foreground", className)}
        {...props}
      >
        <Loader2 className={cn("animate-spin text-primary", iconSizeClasses[size])} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        containerClasses[size],
        className,
      )}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", iconSizeClasses[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export { LoadingState }
