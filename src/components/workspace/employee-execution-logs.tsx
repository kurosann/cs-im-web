"use client"

import { RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  executionHistoryError,
  executionHistoryText,
  executionParties,
  executionResultText,
  executionStatusLabel,
  executionTimeLabel,
  shortExecutionText,
  type EmployeeExecution,
} from "@/lib/ai-execution-display"

export function EmployeeExecutionLogs({
  logs,
  loading,
  error,
  onRefresh,
}: {
  logs: EmployeeExecution[]
  loading: boolean
  error: string
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">最近执行</h3>
          <p className="mt-1 text-xs text-muted-foreground">最近一次自动接待的处理记录，点开可看完整内容。</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRefresh}>
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          刷新
        </Button>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      {!logs.length && !loading && !error ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">暂无 AI 客服执行记录</p>
      ) : null}
      {loading && !logs.length ? (
        <p className="px-1 py-6 text-sm text-muted-foreground">正在加载执行记录。</p>
      ) : null}
      {logs.map((item) => {
        const parties = executionParties(item)
        const result = executionResultText(item)
        const historyError = executionHistoryError(item)
        return (
          <article key={item.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{executionStatusLabel(item.status)}</Badge>
              <span className="font-medium">{item.employeeName || "原 AI 客服"}</span>
              <span className="text-xs text-muted-foreground">{executionTimeLabel(item.createdAt)}</span>
            </div>
            <p className="mt-1 font-medium break-words">{parties.platformName} · {parties.summary}</p>
            {shortExecutionText(item.mergedText) ? <p className="mt-1 truncate">{shortExecutionText(item.mergedText)}</p> : null}
            <p className={item.status === "failed" ? "mt-1 truncate text-xs text-destructive" : "mt-1 truncate text-xs text-muted-foreground"}>
              {shortExecutionText(result)}
            </p>
            <details className="mt-2 border-t pt-2">
              <summary className="w-fit cursor-pointer rounded px-1 py-1 text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                查看完整内容
              </summary>
              <dl className="mt-2 grid gap-3 rounded-md bg-muted/60 p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">来源平台</dt>
                  <dd className="mt-0.5 break-words">{parties.platformName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">客服账号 / 客户</dt>
                  <dd className="mt-0.5 break-words">{parties.account} · {parties.peer}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">客户消息</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words">{item.mergedText || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">原因</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words">{item.reason?.trim() || "本次未记录判断原因"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">回复 / 上报结果</dt>
                  <dd className={item.status === "failed" ? "mt-0.5 whitespace-pre-wrap break-words text-destructive" : "mt-0.5 whitespace-pre-wrap break-words"}>{result}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">历史</dt>
                  <dd className="mt-0.5">
                    <p>{executionHistoryText(item)}</p>
                    {historyError ? <p className="mt-0.5 text-muted-foreground">{historyError}</p> : null}
                  </dd>
                </div>
                {item.totalTokens ? (
                  <div>
                    <dt className="text-muted-foreground">用量</dt>
                    <dd className="mt-0.5">{item.totalTokens} tokens</dd>
                  </div>
                ) : null}
              </dl>
            </details>
          </article>
        )
      })}
    </div>
  )
}
