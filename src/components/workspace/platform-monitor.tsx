import {
  CircleAlert,
  Database,
  Globe,
  HeartPulse,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const healthMetrics = [
  {
    label: "渠道健康度",
    value: "98.6%",
    hint: "近 24 小时平均可用性",
    valuePercent: 98.6,
    icon: HeartPulse,
  },
  {
    label: "接口成功率",
    value: "99.4%",
    hint: "最近 5 分钟 · 12,480 次请求",
    valuePercent: 99.4,
    icon: ShieldCheck,
  },
  {
    label: "平均响应",
    value: "86ms",
    hint: "P95 响应 214ms",
    valuePercent: 78,
    icon: Globe,
  },
  {
    label: "活跃告警",
    value: "2",
    hint: "1 条需处理 · 1 条观察中",
    valuePercent: 20,
    icon: CircleAlert,
  },
]

const resources = [
  { label: "入站消息速率", value: 72, display: "126 条/分钟", icon: Globe },
  { label: "投递成功率", value: 94, display: "99.2%", icon: ShieldCheck },
  { label: "转发队列占用", value: 35, display: "18 / 50", icon: Database },
]

const services = [
  {
    name: "网页渠道",
    status: "healthy",
    detail: "3 个实例全部在线",
    latency: "42ms",
    uptime: "99.98%",
  },
  {
    name: "Telegram",
    status: "healthy",
    detail: "队列积压 128 条",
    latency: "118ms",
    uptime: "99.92%",
  },
  {
    name: "WhatsApp",
    status: "warning",
    detail: "推理队列延迟升高",
    latency: "682ms",
    uptime: "99.61%",
  },
  {
    name: "平台转发",
    status: "healthy",
    detail: "2 个转发通道在线",
    latency: "96ms",
    uptime: "99.87%",
  },
] as const

const alerts = [
  {
    level: "warning",
    title: "AI 推理队列延迟超过 500ms",
    description: "建议检查推理实例负载，必要时扩容或降低并发。",
    time: "4 分钟前",
  },
  {
    level: "notice",
    title: "渠道 Webhook 重试率上升",
    description: "近 10 分钟重试 6 次，当前未影响消息可达性。",
    time: "18 分钟前",
  },
]

const serviceStatus: Record<(typeof services)[number]["status"], { label: string; variant: "secondary" | "outline" }> = {
  healthy: { label: "正常", variant: "secondary" },
  warning: { label: "需关注", variant: "outline" },
}

const alertStyle: Record<string, { icon: typeof CircleAlert; label: string; variant: "outline" | "destructive" }> = {
  warning: { icon: CircleAlert, label: "需处理", variant: "destructive" },
  notice: { icon: CircleAlert, label: "观察中", variant: "outline" },
}

export function PlatformMonitor() {
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 pt-0">
                <div className="text-3xl font-semibold tracking-[-0.03em]">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.hint}</div>
                <Progress value={item.valuePercent} className="mt-2" />
              </CardFooter>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>渠道吞吐</CardTitle>
            <CardDescription>最近一次采集时间：1 分钟前</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {resources.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="font-mono text-sm">{item.display}</span>
                  </div>
                  <Progress value={item.value} className="mt-3" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>渠道链路</CardTitle>
            <CardDescription>按渠道查看运行状态、投递延迟和可用性。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {services.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant={serviceStatus[item.status].variant}>
                      {serviceStatus[item.status].label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">延迟</p>
                    <p className="mt-1 font-mono">{item.latency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">可用性</p>
                    <p className="mt-1 font-mono">{item.uptime}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>监控告警</CardTitle>
          <CardDescription>展示当前需要关注或观察的风险。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {alerts.map((item) => {
            const style = alertStyle[item.level]
            const Icon = style.icon

            return (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant={style.variant}>{style.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <span className="text-xs whitespace-nowrap text-muted-foreground">{item.time}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
