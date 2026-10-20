"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"

type TableLoadingMode = "visible" | "silent"

type TableRefreshPosition = "filter" | "action"

type TableProps = React.ComponentProps<"table"> & {
  loading?: boolean
  loadingMode?: TableLoadingMode
  loadingLabel?: string
  refreshing?: boolean
  onRefresh?: () => void | Promise<void>
  refreshPosition?: TableRefreshPosition
  refreshLabel?: string
  tableActions?: React.ReactNode
  tableActionsRight?: React.ReactNode
  tableFilters?: React.ReactNode
}

function Table({
  className,
  loading = false,
  loadingMode = "visible",
  loadingLabel = "正在加载…",
  refreshing = false,
  onRefresh,
  refreshPosition = "action",
  refreshLabel = "刷新",
  tableActions,
  tableActionsRight,
  tableFilters,
  ...props
}: TableProps) {
  const refreshButton = onRefresh ? (
    <Button
      aria-label={refreshLabel}
      disabled={refreshing}
      size="icon"
      variant="outline"
      onClick={() => void onRefresh()}
    >
      <RefreshCw aria-hidden="true" className={cn("size-4", refreshing && "animate-spin")} />
    </Button>
  ) : null

  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
      data-loading={loading || undefined}
      data-loading-mode={loading ? loadingMode : undefined}
    >
      {tableFilters || onRefresh || tableActions || tableActionsRight ? (
        <div
          data-slot="table-toolbar"
          className={cn(
            "mb-2 flex flex-wrap items-center gap-2",
            tableFilters ? "justify-between" : "justify-end",
          )}
        >
          {tableFilters || refreshPosition === "filter" ? (
            <div className="flex flex-wrap items-center gap-2">
              {tableFilters}
              {refreshPosition === "filter" ? refreshButton : null}
            </div>
          ) : null}
          {onRefresh || tableActions || tableActionsRight ? (
            <div className="flex flex-wrap items-center gap-2">
              {tableActions}
              {refreshPosition === "action" ? refreshButton : null}
              {tableActionsRight}
            </div>
          ) : null}
        </div>
      ) : null}
      <table
        data-slot="table"
        aria-busy={loading || undefined}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
      {loading && loadingMode === "visible" ? (
        <div
          data-slot="table-loading-overlay"
          className="absolute inset-0 z-10 grid place-items-center bg-background/70 backdrop-blur-[1px]"
        >
          <Marker role="status" aria-live="polite" className="rounded-full bg-background/95 px-3 py-1.5 shadow-sm">
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent className="shimmer">{loadingLabel}</MarkerContent>
          </Marker>
        </div>
      ) : null}
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
