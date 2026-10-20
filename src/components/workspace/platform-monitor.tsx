"use client"

import { RefreshCw, WifiOff } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { listChannelMonitor, type ChannelMonitorResult } from "@/lib/iam"

const healthLabels: Record<string, string> = {
  online: "在线",
  warning: "积压",
  offline: "离线",
  disabled: "已禁用",
}

function healthVariant(value: string) {
  if (value === "online") return "secondary"
  if (value === "warning") return "outline"
  if (value === "offline") return "destructive"
  return "ghost"
}

function formatTime(value?: string | null) {
  if (!value) return "从未"
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return "从未"
  return time.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "medium" })
}

export function PlatformMonitor() {
  const [data, setData] = useState<ChannelMonitorResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      setData(await listChannelMonitor())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载渠道监控失败，请稍后重试。")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void load(), 0)
    const refreshTimer = window.setInterval(() => void load(true), 30000)

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(refreshTimer)
    }
  }, [load])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-28 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <WifiOff className="size-5" />
          </span>
          <div>
            <p className="font-medium">{error ?? "暂无监控数据"}</p>
            <p className="mt-1 text-sm text-muted-foreground">确认后端服务可用后重新加载。</p>
          </div>
          <Button onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            重新加载
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onlinePercent = data.summary.totalChannels
    ? Math.round((data.summary.online / data.summary.totalChannels) * 100)
    : 0
  const deliveryTotal = data.channels.reduce((total, item) => total + item.delivery.total, 0)
  const deliveryDelivered = data.channels.reduce((total, item) => total + item.delivery.delivered, 0)
  const deliverySuccessPercent = deliveryTotal ? Math.round((deliveryDelivered / deliveryTotal) * 100) : 100

  const summary = [
    {
      label: "转发渠道",
      value: String(data.summary.totalChannels),
      hint: `${data.summary.online} 个在线 · ${data.summary.disabled} 个禁用`,
      percent: onlinePercent,
    },
    {
      label: "业务应用",
      value: String(data.apps.length),
      hint: `${data.apps.filter((item) => item.health === "online").length} 个在线`,
      percent: data.apps.length
        ? Math.round((data.apps.filter((item) => item.health === "online").length / data.apps.length) * 100)
        : 0,
    },
    {
      label: "投递成功",
      value: `${deliverySuccessPercent}%`,
      hint: deliveryTotal ? `共 ${deliveryTotal} 条投递记录` : "暂无投递记录",
      percent: deliverySuccessPercent,
    },
    {
      label: "排队投递",
      value: String(data.summary.queuedItems),
      hint: data.summary.queuedItems > 0 ? "需要关注转发链路" : "当前队列为空",
      percent: deliveryTotal ? Math.round((data.summary.queuedItems / deliveryTotal) * 100) : 0,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          采集时间：{formatTime(data.generatedAt)} · 每 30 秒自动刷新
        </p>
        <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>
          <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
          刷新
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="text-sm text-muted-foreground">{item.label}</CardContent>
            <CardFooter className="flex-col items-start gap-2 pt-0">
              <div className="text-3xl font-semibold tracking-[-0.03em]">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.hint}</div>
              <Progress value={item.percent} className="mt-2" />
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>转发渠道</CardTitle>
          <CardDescription>展示渠道状态、最近测试时间和投递队列统计。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.channels.map((item) => (
            <div key={item.channelId} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant={healthVariant(item.health)}>{healthLabels[item.health]}</Badge>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {item.channelId} · {item.endpoint || "未配置端点"}
                  </p>
                </div>
                <p className="text-xs whitespace-nowrap text-muted-foreground">
                  最近测试：{formatTime(item.lastTestedAt)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">总数</p><p className="mt-1 font-mono">{item.delivery.total}</p></div>
                <div><p className="text-xs text-muted-foreground">排队</p><p className="mt-1 font-mono">{item.delivery.queued}</p></div>
                <div><p className="text-xs text-muted-foreground">已投递</p><p className="mt-1 font-mono">{item.delivery.delivered}</p></div>
                <div><p className="text-xs text-muted-foreground">失败</p><p className="mt-1 font-mono">{item.delivery.failed}</p></div>
              </div>
            </div>
          ))}
          {data.channels.length === 0 ? (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">暂无转发渠道。</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>业务应用</CardTitle>
          <CardDescription>基于应用状态、租约过期时间和最近心跳判断在线情况。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.apps.map((item) => (
            <div key={item.appId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.displayName}</p>
                  <Badge variant={healthVariant(item.health)}>{healthLabels[item.health]}</Badge>
                  {item.version ? <Badge variant="outline">{item.version}</Badge> : null}
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{item.appId} · {item.serviceKey}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs text-muted-foreground">最近心跳</p>
                <p className="mt-1">{formatTime(item.lastHeartbeatAt)}</p>
                <p className="mt-1 text-xs text-muted-foreground">会话 {item.conversationCount}</p>
              </div>
            </div>
          ))}
          {data.apps.length === 0 ? (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">暂无业务应用。</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
