"use client"

import {
  Activity,
  Copy,
  ExternalLink,
  FileClock,
  Globe2,
  KeyRound,
  MessageCircle,
  RadioTower,
  Search,
  Send,
  Settings2,
  Webhook,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"

type ManagementKind = "apps" | "channels" | "ai" | "webhook" | "logs" | "settings"

const managementMeta: Record<ManagementKind, { title: string; description: string; icon: typeof Activity }> = {
  apps: { title: "业务渠道", description: "管理接入工作台的业务应用和运行状态。", icon: Globe2 },
  channels: { title: "转发渠道", description: "配置客服消息需要投递到的后端目标。", icon: RadioTower },
  ai: { title: "AI 客服", description: "管理自动回复、忽略和转人工策略。", icon: Activity },
  webhook: { title: "Webhook", description: "管理事件回调、订阅范围和投递状态。", icon: Webhook },
  logs: { title: "消息日志", description: "追踪消息在各个渠道的投递链路。", icon: FileClock },
  settings: { title: "设置", description: "管理工作区信息、会话偏好和角色权限。", icon: Settings2 },
}

const platformMeta: Record<string, { icon: typeof MessageCircle }> = {
  WhatsApp: { icon: MessageCircle },
  Telegram: { icon: Send },
  Messenger: { icon: MessageCircle },
}

type ManagementItem = {
  name: string
  detail: string
  status: string
  tone: "green" | "amber" | "gray"
  enabled: boolean
}

const initialData: Record<"apps" | "channels" | "ai", ManagementItem[]> = {
  apps: [
    { name: "WhatsApp", detail: "4 个账号 · 最近心跳 20 秒前", status: "在线", tone: "green", enabled: true },
    { name: "Telegram", detail: "2 个账号 · 最近心跳 32 秒前", status: "在线", tone: "green", enabled: true },
    { name: "Messenger", detail: "1 个账号 · 凭证即将到期", status: "需关注", tone: "amber", enabled: true },
  ],
  channels: [
    { name: "客服通知中心", detail: "https://notify.example.com/customer", status: "正常", tone: "green", enabled: true },
    { name: "订单服务", detail: "https://order.example.com/events", status: "正常", tone: "green", enabled: true },
    { name: "数据仓库", detail: "https://warehouse.example.com/messages", status: "未启用", tone: "gray", enabled: false },
  ],
  ai: [
    { name: "退款与售后", detail: "自动回复 · 置信度低于 0.72 时转人工", status: "正常", tone: "green", enabled: true },
    { name: "账号安全", detail: "仅识别意图 · 不自动执行敏感操作", status: "正常", tone: "green", enabled: true },
    { name: "营销咨询", detail: "工作时间外暂停自动回复", status: "未启用", tone: "gray", enabled: false },
  ],
}

const logRows = [
  { id: "msg_7d31a4", channel: "WhatsApp", event: "客户消息", target: "客服工作台", status: "已送达", time: "刚刚" },
  { id: "msg_8f21ad", channel: "Messenger", event: "AI 回复", target: "客户会话", status: "已送达", time: "2 分钟前" },
  { id: "msg_73bc02", channel: "Telegram", event: "转发消息", target: "订单服务", status: "重试中", time: "8 分钟前" },
  { id: "msg_61d0a8", channel: "WhatsApp", event: "状态回执", target: "客服工作台", status: "失败", time: "12 分钟前" },
]

function statusVariant(tone: string) {
  return tone === "green" ? "secondary" : tone === "amber" ? "outline" : "ghost"
}

function logVariant(status: string) {
  return status === "已送达" ? "secondary" : status === "失败" ? "destructive" : "outline"
}

export function ManagementView({ kind }: { kind: ManagementKind }) {
  const meta = managementMeta[kind]
  const [items, setItems] = useState(initialData)
  const [keyword, setKeyword] = useState("")
  const [notice, setNotice] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const visibleItems = useMemo(
    () =>
      (items[kind as keyof typeof items] ?? []).filter((item) =>
        `${item.name} ${item.detail}`.toLowerCase().includes(keyword.trim().toLowerCase())
      ),
    [items, kind, keyword]
  )

  const pagedItems = visibleItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const pagedLogRows = logRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  useEffect(() => {
    if (!notice) return

    const timer = window.setTimeout(() => setNotice(""), 1800)
    return () => window.clearTimeout(timer)
  }, [notice])

  function toggleItem(name: string, enabled: boolean) {
    if (!items[kind as keyof typeof items]) return

    setItems((current) => ({
      ...current,
      [kind]: current[kind as keyof typeof items].map((item) =>
        item.name === name ? { ...item, enabled } : item
      ),
    }))
    setNotice(enabled ? `${name} 已启用` : `${name} 已停用`)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{meta.title}</CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </div>
            {items[kind as keyof typeof items] ? (
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="搜索配置"
                  value={keyword}
                  onChange={(event) => {
                    setPage(1)
                    setKeyword(event.target.value)
                  }}
                />
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {kind === "logs" ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>消息 ID</TableHead>
                    <TableHead>渠道</TableHead>
                    <TableHead>事件</TableHead>
                    <TableHead>目标</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedLogRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell>{row.channel}</TableCell>
                      <TableCell className="text-muted-foreground">{row.event}</TableCell>
                      <TableCell className="text-muted-foreground">{row.target}</TableCell>
                      <TableCell>
                        <Badge variant={logVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                total={logRows.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPage(1)
                  setPageSize(size)
                }}
              />
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>详情</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedItems.map((item) => {
                      const Icon = platformMeta[item.name]?.icon ?? managementMeta[kind].icon

                      return (
                        <TableRow key={item.name}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="size-4" />
                              </span>
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.detail}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(item.tone)}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={item.enabled}
                              onCheckedChange={(checked) => toggleItem(item.name, checked)}
                              aria-label={item.enabled ? `停用 ${item.name}` : `启用 ${item.name}`}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {!pagedItems.length ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">没有找到匹配的配置。</p>
                ) : null}
              </div>
              <TablePagination
                total={visibleItems.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPage(1)
                  setPageSize(size)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {kind === "webhook" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <KeyRound className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">签名密钥</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                <span>sk_live_••••••••••</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="复制签名密钥"
                  onClick={() => setNotice("签名密钥已复制")}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <ExternalLink className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">事件文档</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                查看可订阅事件、重试策略和签名校验说明。
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-3 h-auto p-0"
                onClick={() => setNotice("文档入口已打开")}
              >
                查看文档
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {notice ? (
        <p className={cn("text-center text-sm text-muted-foreground")} aria-live="polite">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
