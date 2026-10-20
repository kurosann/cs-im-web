import * as React from "react"
import { cn } from "cn"

function Marker({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-icon"
      className={cn("flex size-4 shrink-0 items-center justify-center", className)}
      {...props}
    />
  )
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="marker-content" className={cn(className)} {...props} />
}

export { Marker, MarkerContent, MarkerIcon }
