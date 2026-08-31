import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@shared/lib/utils"

type EmptyStateTone = "default" | "soft" | "muted"

export interface EmptyStateProps
  extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  tone?: EmptyStateTone
  /** When true, the icon sits inside a soft circular badge. */
  withBadge?: boolean
  /** Container padding scale. */
  size?: "sm" | "md" | "lg"
}

const toneClasses: Record<EmptyStateTone, string> = {
  default: "border-dashed border-border bg-surface-default",
  soft: "border-dashed border-border/50 bg-card/60",
  muted: "border-dashed border-border/40 bg-muted/20",
}

const sizeClasses = {
  sm: "rounded-[20px] px-5 py-8",
  md: "rounded-[28px] px-6 py-12",
  lg: "rounded-[40px] px-8 py-20",
} as const

const titleSizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
} as const

const descriptionSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
} as const

const badgeSizeClasses = {
  sm: "h-12 w-12 [&_svg]:h-5 [&_svg]:w-5",
  md: "h-16 w-16 [&_svg]:h-7 [&_svg]:w-7",
  lg: "h-20 w-20 [&_svg]:h-8 [&_svg]:w-8",
} as const

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  withBadge = true,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {Icon ? (
        withBadge ? (
          <div
            className={cn(
              "mb-4 flex items-center justify-center rounded-full bg-primary/10 text-primary",
              badgeSizeClasses[size],
            )}
            aria-hidden="true"
          >
            <Icon className="text-primary/80" />
          </div>
        ) : (
          <Icon
            aria-hidden="true"
            className={cn(
              "mb-4 text-muted-foreground/40",
              size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-10 w-10",
            )}
          />
        )
      ) : null}
      <p
        className={cn(
          "font-black uppercase italic tracking-tight text-foreground",
          titleSizeClasses[size],
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            "mt-2 max-w-md text-muted-foreground",
            descriptionSizeClasses[size],
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
