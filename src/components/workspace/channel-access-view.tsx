"use client"

import {
  Copy,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type AccountToken,
  type RelayChannel as RelayChannelRecord,
  createRelayChannel,
  issueAccountToken,
  listAccountTokens,
  listRelayChannels,
  rotateAccountToken,
  setAccountTokenStatus,
  setRelayChannelStatus,
  testRelayChannel,
} from "@/lib/api/cs-im"

type BusinessChannelStatus = "active" | "expiring" | "disabled" | "revoked"
type RelayChannelStatus = "active" | "disabled"

type BusinessChannel = {
  id: string
  name: string
  appId: string
  status: BusinessChannelStatus
  scopes: string[]
  expiresAt: string
  lastUsedAt: string
}

type RelayChannel = {
  id: string
  name: string
  type: string
  target: string
  status: RelayChannelStatus
  lastTestedAt: string
}

const businessStatusLabels: Record<BusinessChannelStatus, string> = {
  active: "正常",
  expiring: "即将到期",
  disabled: "禁用",
  revoked: "已轮换",
}

const relayStatusLabels: Record<RelayChannelStatus, string> = {
  active: "正常",
  disabled: "禁用",
}

const initialBusinessChannels: BusinessChannel[] = [
  { id: "bc_1", name: "官网客服接入", appId: "app_7Kd92mQx", status: "active", scopes: ["channel:access"], expiresAt: "2027-01-18", lastUsedAt: "2 分钟前" },
  { id: "bc_2", name: "小程序客服接入", appId: "app_ZDlglSlV", status: "expiring", scopes: ["channel:access"], expiresAt: "2026-11-04", lastUsedAt: "1 小时前" },
  { id: "bc_3", name: "内部测试接入", appId: "app_Test0192", status: "disabled", scopes: ["channel:access"], expiresAt: "2027-03-01", lastUsedAt: "12 天前" },
]

const initialRelayChannels: RelayChannel[] = [
  { id: "rc_1", name: "Web / 手机", type: "webhook", target: "平台统一前端", status: "active", lastTestedAt: "刚刚" },
  { id: "rc_2", name: "Telegram", type: "telegram", target: "Bot API", status: "active", lastTestedAt: "35 秒前" },
  { id: "rc_3", name: "WhatsApp", type: "whatsapp", target: "Cloud API", status: "disabled", lastTestedAt: "6 小时前" },
]

type FilterSelect = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
}

function statusVariant(status: string): "secondary" | "outline" | "destructive" | "ghost" {
  if (["active", "success"].includes(status)) return "secondary"
  if (["expiring", "warning"].includes(status)) return "outline"
  if (["revoked", "denied"].includes(status)) return "destructive"
  if (status === "disabled") return "ghost"
  return "ghost"
}

function formatDate(value?: string | null) {
  if (!value) return "长期有效"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function formatRelative(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  const diff = date.getTime() - Date.now()
  const abs = Math.abs(diff)
  if (abs < 60_000) return "刚刚"
  const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" })
  if (abs < 3_600_000) return formatter.format(Math.round(diff / 60_000), "minute")
  if (abs < 86_400_000) return formatter.format(Math.round(diff / 3_600_000), "hour")
  if (abs < 2_592_000_000) return formatter.format(Math.round(diff / 86_400_000), "day")
  return formatDate(value)
}

function isExpiring(expiresAt?: string | null) {
  if (!expiresAt) return false
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return false
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  return date.getTime() - Date.now() <= thirtyDays
}

function tokenToBusinessChannel(token: AccountToken): BusinessChannel {
  const status: BusinessChannelStatus =
    token.status === "revoked"
      ? "revoked"
      : token.status === "disabled"
        ? "disabled"
        : isExpiring(token.expiresAt)
          ? "expiring"
          : "active"

  return {
    id: token.tokenKey,
    name: token.name || token.accountKey,
    appId: token.accountKey,
    status,
    scopes: token.scopes ?? [],
    expiresAt: formatDate(token.expiresAt),
    lastUsedAt: formatRelative(token.lastUsedAt, "从未使用"),
  }
}

function relayToChannel(channel: RelayChannelRecord): RelayChannel {
  return {
    id: channel.channelId,
    name: channel.name,
    type: channel.type,
    target: channel.endpoint || channel.type,
    status: channel.status === "active" ? "active" : "disabled",
    lastTestedAt: formatRelative(channel.lastTestedAt, "尚未测试"),
  }
}

function defaultExpiryDate() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function generateAccountKey() {
  return `app_${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`
}

function FilterBar({
  keyword,
  onKeywordChange,
  selects,
}: {
  keyword: string
  onKeywordChange: (value: string) => void
  selects: FilterSelect[]
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="搜索名称、AppID 或目标" />
      </div>
      <div className="flex flex-wrap gap-2">
        {selects.map((item) => (
          <Select key={item.placeholder} value={item.value} onValueChange={item.onChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={item.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}

function EmptyRows({ colSpan, title, description }: { colSpan: number; title: string; description: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </TableCell>
    </TableRow>
  )
}

export function ChannelAccessView({ notice }: { notice: (message: string) => void }) {
  const [businessChannels, setBusinessChannels] = useState(initialBusinessChannels)
  const [relayChannels, setRelayChannels] = useState(initialRelayChannels)
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("all")
  const [tab, setTab] = useState("business")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createBusinessOpen, setCreateBusinessOpen] = useState(false)
  const [createRelayOpen, setCreateRelayOpen] = useState(false)
  const [issuedCredential, setIssuedCredential] = useState<{ appId: string; secret: string } | null>(null)
  const [businessForm, setBusinessForm] = useState({ name: "", accountKey: "", expiresAt: "" })
  const [relayForm, setRelayForm] = useState({ name: "", type: "webhook", endpoint: "" })
  const [backendState, setBackendState] = useState<"loading" | "online" | "offline">("loading")
  const [backendError, setBackendError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadChannels = useCallback(async () => {
    try {
      const [tokens, relay] = await Promise.all([
        listAccountTokens(),
        listRelayChannels(),
      ])
      setBusinessChannels(
        tokens
          .filter((token) => token.kind === "business" || !token.kind)
          .map(tokenToBusinessChannel),
      )
      setRelayChannels(relay.map(relayToChannel))
      setBackendState("online")
    } catch (error) {
      setBackendState("offline")
      setBackendError(error instanceof Error ? error.message : "无法连接 cs-im-server")
    }
  }, [])

  async function refreshChannels() {
    setBackendState("loading")
    setBackendError("")
    await loadChannels()
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadChannels()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadChannels])

  const visibleBusiness = useMemo(() => businessChannels.filter((channel) => {
    const matchesKeyword = [channel.name, channel.appId, channel.scopes.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(keyword.trim().toLowerCase())
    const matchesStatus = status === "all" || channel.status === status
    return matchesKeyword && matchesStatus
  }), [businessChannels, keyword, status])

  const visibleRelay = useMemo(() => relayChannels.filter((channel) => {
    const matchesKeyword = [channel.name, channel.type, channel.target]
      .join(" ")
      .toLowerCase()
      .includes(keyword.trim().toLowerCase())
    const matchesStatus = status === "all" || channel.status === status
    return matchesKeyword && matchesStatus
  }), [relayChannels, keyword, status])

  const pagedBusiness = visibleBusiness.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const pagedRelay = visibleRelay.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  function openCreateBusiness() {
    setBusinessForm({
      name: "",
      accountKey: generateAccountKey(),
      expiresAt: defaultExpiryDate(),
    })
    setCreateBusinessOpen(true)
  }

  async function createBusinessChannel() {
    if (!businessForm.name.trim() || !businessForm.accountKey.trim()) {
      notice("请填写渠道名称和 AppID")
      return
    }

    setSubmitting(true)
    try {
      const result = await issueAccountToken({
        accountKey: businessForm.accountKey.trim(),
        name: businessForm.name.trim(),
        kind: "business",
        scopes: ["channel:access"],
        expiresAt: businessForm.expiresAt
          ? new Date(`${businessForm.expiresAt}T23:59:59Z`).toISOString()
          : undefined,
      })
      setCreateBusinessOpen(false)
      setIssuedCredential({
        appId: result.token.accountKey,
        secret: result.secret,
      })
      notice("业务渠道已创建，SecretKey 只显示一次")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `创建失败：${error.message}` : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  async function rotateBusinessSecret(id: string) {
    try {
      const result = await rotateAccountToken(id)
      setIssuedCredential({
        appId: result.token.accountKey,
        secret: result.secret,
      })
      notice("旧 SecretKey 已失效")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `轮换失败：${error.message}` : "轮换失败")
    }
  }

  async function toggleBusinessStatus(id: string, next: "active" | "disabled") {
    try {
      await setAccountTokenStatus(id, next)
      notice("业务凭证状态已更新")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `更新失败：${error.message}` : "更新失败")
    }
  }

  async function handleCreateRelayChannel() {
    if (!relayForm.name.trim() || !relayForm.type.trim()) {
      notice("请填写渠道名称和类型")
      return
    }

    setSubmitting(true)
    try {
      await createRelayChannel({
        name: relayForm.name.trim(),
        type: relayForm.type,
        endpoint: relayForm.endpoint.trim() || undefined,
        config: {},
      })
      setCreateRelayOpen(false)
      setRelayForm({ name: "", type: "webhook", endpoint: "" })
      notice("转发渠道已创建")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `创建失败：${error.message}` : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleRelayStatus(id: string) {
    const channel = relayChannels.find((item) => item.id === id)
    if (!channel) return
    try {
      await setRelayChannelStatus(id, channel.status !== "active")
      notice("转发渠道状态已更新")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `更新失败：${error.message}` : "更新失败")
    }
  }

  async function handleTestRelayChannel(id: string) {
    try {
      await testRelayChannel(id)
      notice("转发渠道测试完成")
      await loadChannels()
    } catch (error) {
      notice(error instanceof Error ? `测试失败：${error.message}` : "测试失败")
    }
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-end gap-2">
        <Badge variant={backendState === "online" ? "secondary" : "outline"}>
          {backendState === "loading" ? "连接中" : backendState === "online" ? "已连接 cs-im-server" : "示例数据"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => void refreshChannels()} disabled={backendState === "loading"}>
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </section>

      {backendState === "offline" ? (
        <p className="text-sm text-muted-foreground">
          cs-im-server 未连接，当前显示本地示例数据。{backendError ? ` ${backendError}` : ""}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>业务凭证</CardDescription><CardTitle className="text-2xl">{businessChannels.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>正常凭证</CardDescription><CardTitle className="text-2xl">{businessChannels.filter((item) => item.status === "active").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>即将到期</CardDescription><CardTitle className="text-2xl">{businessChannels.filter((item) => item.status === "expiring").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>转发渠道</CardDescription><CardTitle className="text-2xl">{relayChannels.length}</CardTitle></CardHeader></Card>
      </section>

      <Tabs value={tab} onValueChange={(value) => { setPage(1); setStatus("all"); setTab(value) }}>
        <TabsList><TabsTrigger value="business">业务渠道</TabsTrigger><TabsTrigger value="relay">转发渠道</TabsTrigger></TabsList>

        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>业务渠道凭证</CardTitle>
                <CardDescription>业务后端只能发送客户消息和接收客服消息。</CardDescription>
              </div>
              <Button onClick={openCreateBusiness}><Plus className="size-4" />创建业务渠道</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar
                keyword={keyword}
                onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
                selects={[{ value: status, onChange: (value) => { setPage(1); setStatus(value) }, placeholder: "状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(businessStatusLabels).map(([value, label]) => ({ value, label }))] }]}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>渠道</TableHead><TableHead>AppID</TableHead><TableHead>Scope</TableHead><TableHead>状态</TableHead><TableHead>到期时间</TableHead><TableHead>最近使用</TableHead><TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBusiness.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell className="font-mono text-xs">{channel.appId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{channel.scopes.join(" · ") || "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant(channel.status)}>{businessStatusLabels[channel.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{channel.expiresAt}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{channel.lastUsedAt}</TableCell>
                      <TableCell className="text-right">
                        {channel.status === "revoked" ? (
                          <span className="text-xs text-muted-foreground">已轮换</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`操作 ${channel.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void rotateBusinessSecret(channel.id)}><RotateCcw className="size-3.5" />轮换 SecretKey</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void toggleBusinessStatus(channel.id, channel.status === "disabled" ? "active" : "disabled")}>{channel.status === "disabled" ? "启用" : "禁用"}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagedBusiness.length === 0 ? <EmptyRows colSpan={7} title="没有匹配凭证" description="调整状态或搜索关键词。" /> : null}
                </TableBody>
              </Table>
              <TablePagination
                total={visibleBusiness.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPage(1); setPageSize(size) }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relay" className="mt-4">
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>平台转发渠道</CardTitle>
                <CardDescription>转发渠道由平台统一持有凭证，不对外签发。</CardDescription>
              </div>
              <Button onClick={() => { setRelayForm({ name: "", type: "webhook", endpoint: "" }); setCreateRelayOpen(true) }}><Plus className="size-4" />添加转发渠道</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar
                keyword={keyword}
                onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
                selects={[{ value: status, onChange: (value) => { setPage(1); setStatus(value) }, placeholder: "状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(relayStatusLabels).map(([value, label]) => ({ value, label }))] }]}
              />
              <Table>
                <TableHeader>
                  <TableRow><TableHead>渠道</TableHead><TableHead>类型</TableHead><TableHead>投递目标</TableHead><TableHead>状态</TableHead><TableHead>最近测试</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRelay.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{channel.type}</TableCell>
                      <TableCell className="text-muted-foreground">{channel.target}</TableCell>
                      <TableCell><Badge variant={statusVariant(channel.status)}>{relayStatusLabels[channel.status]}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{channel.lastTestedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => void handleTestRelayChannel(channel.id)}>测试</Button>
                          <Button variant="ghost" size="sm" onClick={() => void toggleRelayStatus(channel.id)}>{channel.status === "active" ? "禁用" : "启用"}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagedRelay.length === 0 ? <EmptyRows colSpan={6} title="没有匹配转发渠道" description="调整状态或搜索关键词。" /> : null}
                </TableBody>
              </Table>
              <TablePagination
                total={visibleRelay.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPage(1); setPageSize(size) }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createBusinessOpen} onOpenChange={setCreateBusinessOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>创建业务渠道</DialogTitle><DialogDescription>创建后仅返回一次 SecretKey 明文；Scope 固定为 channel:access。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <FieldGroup>
            <Field><FieldLabel>渠道名称</FieldLabel><Input value={businessForm.name} onChange={(event) => setBusinessForm({ ...businessForm, name: event.target.value })} placeholder="例如：官网客服接入" /></Field>
            <Field><FieldLabel>AppID</FieldLabel><Input value={businessForm.accountKey} onChange={(event) => setBusinessForm({ ...businessForm, accountKey: event.target.value })} placeholder="app_..." /><FieldDescription>AppID 即 IAM accountKey，创建后不可修改。</FieldDescription></Field>
            <Field><FieldLabel>到期时间</FieldLabel><Input type="date" value={businessForm.expiresAt} onChange={(event) => setBusinessForm({ ...businessForm, expiresAt: event.target.value })} /><FieldDescription>留空表示长期有效；建议设置最大生命周期。</FieldDescription></Field>
            </FieldGroup>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateBusinessOpen(false)}>取消</Button><Button onClick={() => void createBusinessChannel()} disabled={submitting}>{submitting ? "创建中…" : "创建并签发"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createRelayOpen} onOpenChange={setCreateRelayOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>添加转发渠道</DialogTitle><DialogDescription>连接配置和凭证由平台保存。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <FieldGroup>
            <Field><FieldLabel>渠道名称</FieldLabel><Input value={relayForm.name} onChange={(event) => setRelayForm({ ...relayForm, name: event.target.value })} placeholder="例如：飞书" /></Field>
            <Field>
              <FieldLabel>类型</FieldLabel>
              <Select value={relayForm.type} onValueChange={(value) => setRelayForm({ ...relayForm, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="feishu">飞书</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field><FieldLabel>投递目标</FieldLabel><Input value={relayForm.endpoint} onChange={(event) => setRelayForm({ ...relayForm, endpoint: event.target.value })} placeholder="例如：Bot API / Webhook 地址" /></Field>
            </FieldGroup>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateRelayOpen(false)}>取消</Button><Button onClick={() => void handleCreateRelayChannel()} disabled={submitting}>{submitting ? "添加中…" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(issuedCredential)} onOpenChange={(open) => !open && setIssuedCredential(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>SecretKey 只显示一次</DialogTitle><DialogDescription>请立即复制并保存到业务后端的密钥管理服务。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{issuedCredential?.appId}</div>
            <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{issuedCredential?.secret}</div>
            <Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(issuedCredential?.secret ?? ""); notice("SecretKey 已复制") }}>
              <Copy className="size-4" />复制 SecretKey
            </Button>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setIssuedCredential(null)}>我已保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
