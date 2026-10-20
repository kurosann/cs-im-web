import { Loader2Icon } from "lucide-react"
import { cn } from "cn"

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="加载中"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
