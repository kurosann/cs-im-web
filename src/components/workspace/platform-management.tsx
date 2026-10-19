"use client"

import {
  Copy,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  ChannelCredential,
  IamApiError,
  issueChannelCredential,
  listBusinessApps,
  listChannelCredentials,
  registerBusinessApp,
  rotateChannelCredential,
  setChannelCredentialStatus,
  createStaff,
  listStaff,
  setStaffRole,
  setStaffStatus,
} from "@/lib/iam"

type ManagementKind = "team" | "channel-access" | "audit"
type EmployeeRole = "admin" | "supervisor" | "agent" | "auditor" | "developer"
type EmployeeStatus = "active" | "disabled"
type BusinessChannelStatus = "active" | "expiring" | "disabled" | "revoked"
type RelayChannelStatus = "active" | "disabled"
type AuditResult = "success" | "denied" | "warning"

type Employee = {
  id: string
  name: string
  email: string
  role: EmployeeRole
  status: EmployeeStatus
  lastActiveAt: string
}

type BusinessChannel = {
  id: string
  name: string
  appId: string
  status: BusinessChannelStatus
  expiresAt: string
  lastUsedAt: string
}

type RelayChannel = {
  id: string
  name: string
  target: string
  status: RelayChannelStatus
  lastDeliveredAt: string
}

type AuditEvent = {
  id: string
  event: string
  action: string
  operator: string
  object: string
  result: AuditResult
  ip: string
  time: string
}

const meta = {
  team: {
    title: "团队管理",
    description: "管理员工账号和角色。",
    icon: UsersRound,
  },
  "channel-access": {
    title: "渠道接入",
    description: "管理业务渠道凭证和平台私有转发渠道。",
    icon: KeyRound,
  },
  audit: {
    title: "审计日志",
    description: "追踪登录、凭证、权限和越权访问事件。",
    icon: ShieldCheck,
  },
} as const

const roleLabels: Record<EmployeeRole, string> = {
  admin: "管理员",
  supervisor: "主管",
  agent: "客服",
  auditor: "审计员",
  developer: "开发者",
}

const employeeStatusLabels: Record<EmployeeStatus, string> = {
  active: "启用",
  disabled: "禁用",
}

const businessStatusLabels: Record<BusinessChannelStatus, string> = {
  active: "正常",
  expiring: "即将到期",
  disabled: "禁用",
  revoked: "已撤销",
}

const relayStatusLabels: Record<RelayChannelStatus, string> = {
  active: "正常",
  disabled: "禁用",
}

const auditResultLabels: Record<AuditResult, string> = {
  success: "成功",
  denied: "已拒绝",
  warning: "需关注",
}

const initialRelayChannels: RelayChannel[] = [
  { id: "rc_1", name: "Web / 手机", target: "平台统一前端", status: "active", lastDeliveredAt: "刚刚" },
  { id: "rc_2", name: "Telegram", target: "Bot API", status: "active", lastDeliveredAt: "35 秒前" },
  { id: "rc_3", name: "WhatsApp", target: "Cloud API", status: "disabled", lastDeliveredAt: "6 小时前" },
]

const initialAuditEvents: AuditEvent[] = [
  { id: "evt_9d20fa", event: "员工登录", action: "password_login", operator: "admin@cs-im.local", object: "Web 工作台", result: "success", ip: "192.168.1.24", time: "刚刚" },
  { id: "evt_8c11be", event: "业务凭证轮换", action: "rotate_secret", operator: "wufan@cs-im.local", object: "app_7Kd92mQx", result: "success", ip: "192.168.1.31", time: "12 分钟前" },
  { id: "evt_7a09d2", event: "越权访问", action: "list_business_channels", operator: "app_ZDlglSlV", object: "tenant_tenant_b", result: "denied", ip: "203.0.113.18", time: "31 分钟前" },
  { id: "evt_6b77c4", event: "权限变更", action: "update_role", operator: "admin@cs-im.local", object: "emp_developer", result: "warning", ip: "192.168.1.24", time: "2 小时前" },
  { id: "evt_5e32aa", event: "员工登录", action: "password_login", operator: "xiaodong@cs-im.local", object: "Web 工作台", result: "success", ip: "192.168.1.42", time: "4 小时前" },
]

function statusVariant(status: string) {
  if (["active", "success"].includes(status)) return "secondary"
  if (["expiring", "warning"].includes(status)) return "outline"
  if (["revoked", "denied"].includes(status)) return "destructive"
  return "ghost"
}

function formatTime(value?: string | null) {
  if (!value) return "从未使用"
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return "从未使用"
  return time.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" })
}

function FilterBar({
  keyword,
  onKeywordChange,
  selects,
}: {
  keyword: string
  onKeywordChange: (value: string) => void
  selects: Array<{ value: string; onChange: (value: string) => void; placeholder: string; options: Array<{ value: string; label: string }> }>
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="搜索名称、ID 或对象" />
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

function TeamView() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [keyword, setKeyword] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState({ name: "", email: "", role: "agent" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [createdStaff, setCreatedStaff] = useState<{ email: string; password: string } | null>(null)

  const showError = useCallback((error: unknown) => {
    toast.error(error instanceof IamApiError ? error.message : "请求失败，请稍后重试。")
  }, [])

  const loadEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const staff = await listStaff()
      setEmployees(staff.map((item) => ({
        id: item.userKey,
        name: item.displayName,
        email: item.email,
        role: item.role as EmployeeRole,
        status: item.status as EmployeeStatus,
        lastActiveAt: formatTime(item.lastLoginAt),
      })))
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEmployees()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadEmployees])

  const visibleEmployees = useMemo(() => employees.filter((employee) => {
    const matchesKeyword = [employee.name, employee.email].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    const matchesRole = role === "all" || employee.role === role
    const matchesStatus = status === "all" || employee.status === status
    return matchesKeyword && matchesRole && matchesStatus
  }), [employees, keyword, role, status])

  const pagedEmployees = visibleEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  async function createEmployee() {
    if (!form.name.trim() || !form.email.trim()) return
    if (isSaving) return
    setIsSaving(true)
    try {
      const result = await createStaff({
        displayName: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      })
      await loadEmployees()
      setCreateOpen(false)
      setForm({ name: "", email: "", role: "agent" })
      setCreatedStaff({ email: result.user.email, password: result.initialPassword })
      toast.success("员工已创建")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleEmployee(id: string, status: EmployeeStatus) {
    if (isSaving) return
    setIsSaving(true)
    try {
      await setStaffStatus(id, status)
      await loadEmployees()
      toast.success("员工状态已更新")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function updateEmployeeRole(id: string, nextRole: EmployeeRole) {
    if (isSaving) return
    setIsSaving(true)
    try {
      await setStaffRole(id, nextRole)
      await loadEmployees()
      toast.success("角色已更新，下一次请求即时生效")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">员工管理</h2>
          <p className="text-sm text-muted-foreground">维护员工账号、角色和状态。</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          创建员工
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>员工总数</CardDescription><CardTitle className="text-2xl">{employees.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>启用中</CardDescription><CardTitle className="text-2xl">{employees.filter((item) => item.status === "active").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>管理员</CardDescription><CardTitle className="text-2xl">{employees.filter((item) => item.role === "admin").length}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>员工账号</CardTitle>
            <CardDescription>员工通过角色获得权限，不直接操作权限项。</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            keyword={keyword}
            onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
            selects={[
              { value: role, onChange: (value) => { setPage(1); setRole(value) }, placeholder: "角色", options: [{ value: "all", label: "全部角色" }, ...Object.entries(roleLabels).map(([value, label]) => ({ value, label }))] },
              { value: status, onChange: (value) => { setPage(1); setStatus(value) }, placeholder: "状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(employeeStatusLabels).map(([value, label]) => ({ value, label }))] },
            ]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最近活跃</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm"><AvatarFallback>{employee.name.slice(0, 1)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{roleLabels[employee.role]}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(employee.status)}>{employeeStatusLabels[employee.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{employee.lastActiveAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`操作 ${employee.name}`}><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <DropdownMenuItem key={value} onClick={() => updateEmployeeRole(employee.id, value as EmployeeRole)}>
                            设为{label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem onClick={() => toggleEmployee(employee.id, employee.status === "active" ? "disabled" : "active")}>
                          {employee.status === "active" ? "禁用账号" : "启用账号"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">正在加载员工…</TableCell></TableRow> : null}
              {!isLoading && pagedEmployees.length === 0 ? <EmptyRows colSpan={5} title="没有匹配员工" description="调整角色、状态或搜索关键词。" /> : null}
            </TableBody>
          </Table>
          <TablePagination
            total={visibleEmployees.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPage(1); setPageSize(size) }}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建员工</DialogTitle>
            <DialogDescription>创建后可以按资源范围绑定团队和业务应用。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <FieldGroup>
            <Field><FieldLabel>姓名</FieldLabel><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：李清" /></Field>
            <Field><FieldLabel>邮箱</FieldLabel><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@company.com" /></Field>
            <Field>
              <FieldLabel>角色</FieldLabel>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
              <FieldDescription>角色是权限模板，系统会自动展开为受控能力。</FieldDescription>
            </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={createEmployee}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(createdStaff)} onOpenChange={(open) => !open && setCreatedStaff(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>初始密码只显示一次</DialogTitle>
            <DialogDescription>请立即发给员工并提醒登录后修改。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">{createdStaff?.email}</div>
              <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{createdStaff?.password}</div>
              <Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(createdStaff?.password ?? ""); toast.success("初始密码已复制") }}>
                <Copy className="size-4" />复制初始密码
              </Button>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setCreatedStaff(null)}>我已保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChannelAccessView() {
  const [businessChannels, setBusinessChannels] = useState<BusinessChannel[]>([])
  const [relayChannels, setRelayChannels] = useState(initialRelayChannels)
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("all")
  const [tab, setTab] = useState("business")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createBusinessOpen, setCreateBusinessOpen] = useState(false)
  const [createRelayOpen, setCreateRelayOpen] = useState(false)
  const [issuedCredential, setIssuedCredential] = useState<{ appId: string; secret: string } | null>(null)
  const [form, setForm] = useState({ name: "", target: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const showError = useCallback((error: unknown) => {
    toast.error(error instanceof IamApiError ? error.message : "请求失败，请稍后重试。")
  }, [])

  const loadBusinessChannels = useCallback(async () => {
    setIsLoading(true)
    try {
      const [apps, credentials] = await Promise.all([listBusinessApps(), listChannelCredentials()])
      const credentialMap = new Map<string, ChannelCredential>(
        credentials.map((credential) => [credential.appId, credential])
      )
      setBusinessChannels(
        apps
          .filter((app) => credentialMap.has(app.appId))
          .map((app) => {
            const credential = credentialMap.get(app.appId)
            const expiresAt = credential?.expiresAt ?? null
            const expiringSoon = expiresAt
              ? new Date(expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
              : false
            const status = credential?.status === "active" && expiringSoon ? "expiring" : credential?.status
            return {
              id: app.appId,
              appId: app.appId,
              name: credential?.name ?? app.displayName,
              status: (status ?? "active") as BusinessChannelStatus,
              expiresAt: expiresAt ?? "",
              lastUsedAt: formatTime(credential?.lastUsedAt),
            }
          }),
      )
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBusinessChannels()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBusinessChannels])

  const visibleBusiness = useMemo(() => businessChannels.filter((channel) => {
    const matchesKeyword = [channel.name, channel.appId].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    const matchesStatus = status === "all" || channel.status === status
    return matchesKeyword && matchesStatus
  }), [businessChannels, keyword, status])

  const visibleRelay = useMemo(() => relayChannels.filter((channel) => {
    const matchesKeyword = [channel.name, channel.target].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
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

  async function createBusinessChannel() {
    const name = form.name.trim()
    if (!name || isSaving) return
    setIsSaving(true)
    try {
      const app = await registerBusinessApp({ displayName: name, serviceKey: name })
      const credential = await issueChannelCredential({ appId: app.appId, name })
      await loadBusinessChannels()
      setCreateBusinessOpen(false)
      setIssuedCredential({ appId: credential.credential.appId, secret: credential.secret })
      setForm({ name: "", target: "" })
      toast.success("业务渠道已创建")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  function createRelayChannel() {
    if (!form.name.trim() || !form.target.trim()) return
    setRelayChannels((current) => [{ id: `rc_${Date.now()}`, name: form.name.trim(), target: form.target.trim(), status: "active", lastDeliveredAt: "从未投递" }, ...current])
    setCreateRelayOpen(false)
    setForm({ name: "", target: "" })
    toast.success("转发渠道已创建")
  }

  async function rotateBusinessSecret(id: string) {
    if (isSaving) return
    setIsSaving(true)
    try {
      const credential = await rotateChannelCredential(id)
      await loadBusinessChannels()
      setIssuedCredential({ appId: credential.credential.appId, secret: credential.secret })
      toast.success("旧 SecretKey 已失效")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleBusinessStatus(id: string, next: Exclude<BusinessChannelStatus, "expiring">) {
    if (isSaving) return
    setIsSaving(true)
    try {
      await setChannelCredentialStatus(id, next)
      await loadBusinessChannels()
      toast.success("业务凭证状态已更新")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  function toggleRelayStatus(id: string) {
    setRelayChannels((current) => current.map((channel) => channel.id === id ? { ...channel, status: channel.status === "active" ? "disabled" : "active" } : channel))
    toast.success("转发渠道状态已更新")
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>业务渠道</CardDescription><CardTitle className="text-2xl">{businessChannels.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>正常凭证</CardDescription><CardTitle className="text-2xl">{businessChannels.filter((item) => item.status === "active").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>即将到期</CardDescription><CardTitle className="text-2xl">{businessChannels.filter((item) => item.status === "expiring").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>转发渠道</CardDescription><CardTitle className="text-2xl">{relayChannels.length}</CardTitle></CardHeader></Card>
      </section>

      <Tabs value={tab} onValueChange={(value) => { setPage(1); setTab(value) }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList><TabsTrigger value="business">业务渠道</TabsTrigger><TabsTrigger value="relay">转发渠道</TabsTrigger></TabsList>
          {tab === "business" ? (
            <Button onClick={() => setCreateBusinessOpen(true)}>
              <Plus className="size-4" />
              创建业务渠道
            </Button>
          ) : null}
          {tab === "relay" ? (
            <Button onClick={() => setCreateRelayOpen(true)}>
              <Plus className="size-4" />
              添加转发渠道
            </Button>
          ) : null}
        </div>

        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>业务渠道凭证</CardTitle>
              <CardDescription>业务后端只能发送客户消息和接收客服消息。</CardDescription>
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
                    <TableHead>渠道</TableHead><TableHead>AppID</TableHead><TableHead>状态</TableHead><TableHead>到期时间</TableHead><TableHead>最近使用</TableHead><TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBusiness.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell className="font-mono text-xs">{channel.appId}</TableCell>
                      <TableCell><Badge variant={statusVariant(channel.status)}>{businessStatusLabels[channel.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{channel.expiresAt}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{channel.lastUsedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`操作 ${channel.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="whitespace-nowrap" onClick={() => rotateBusinessSecret(channel.id)}>更新密钥</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleBusinessStatus(channel.id, channel.status === "disabled" ? "active" : "disabled")}>{channel.status === "disabled" ? "启用" : "禁用"}</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => toggleBusinessStatus(channel.id, "revoked")}>撤销凭证</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">正在加载业务渠道…</TableCell></TableRow>
                  ) : null}
                  {!isLoading && pagedBusiness.length === 0 ? <EmptyRows colSpan={6} title="没有匹配凭证" description="调整状态或搜索关键词。" /> : null}
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
            <CardHeader>
              <CardTitle>平台转发渠道</CardTitle>
              <CardDescription>转发渠道由平台统一持有凭证，不对外签发。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar
                keyword={keyword}
                onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
                selects={[{ value: status, onChange: (value) => { setPage(1); setStatus(value) }, placeholder: "状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(relayStatusLabels).map(([value, label]) => ({ value, label }))] }]}
              />
              <Table>
                <TableHeader>
                  <TableRow><TableHead>渠道</TableHead><TableHead>投递目标</TableHead><TableHead>状态</TableHead><TableHead>最近投递</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRelay.map((channel) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell className="text-muted-foreground">{channel.target}</TableCell>
                      <TableCell><Badge variant={statusVariant(channel.status)}>{relayStatusLabels[channel.status]}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{channel.lastDeliveredAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleRelayStatus(channel.id)}>{channel.status === "active" ? "禁用" : "启用"}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagedRelay.length === 0 ? <EmptyRows colSpan={5} title="没有匹配转发渠道" description="调整状态或搜索关键词。" /> : null}
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
          <DialogHeader><DialogTitle>创建业务渠道</DialogTitle><DialogDescription>创建后仅返回一次 SecretKey 明文。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <FieldGroup>
            <Field><FieldLabel>渠道名称</FieldLabel><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：官网客服接入" /></Field>
            </FieldGroup>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateBusinessOpen(false)}>取消</Button><Button onClick={createBusinessChannel}>创建并签发</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createRelayOpen} onOpenChange={setCreateRelayOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>添加转发渠道</DialogTitle><DialogDescription>连接配置和凭证由平台保存。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <FieldGroup>
            <Field><FieldLabel>渠道名称</FieldLabel><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：飞书" /></Field>
            <Field><FieldLabel>投递目标</FieldLabel><Input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} placeholder="例如：Bot API / Webhook 地址" /></Field>
            </FieldGroup>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateRelayOpen(false)}>取消</Button><Button onClick={createRelayChannel}>添加</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(issuedCredential)} onOpenChange={(open) => !open && setIssuedCredential(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>SecretKey 只显示一次</DialogTitle><DialogDescription>请立即复制并保存到业务后端的密钥管理服务。</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
            <div className="space-y-1"><p className="text-xs text-muted-foreground">AppID</p><div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all">{issuedCredential?.appId}</div></div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">SecretKey</p><div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all">{issuedCredential?.secret}</div></div>
            <Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(issuedCredential?.secret ?? ""); toast.success("SecretKey 已复制") }}>
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

function AuditView() {
  const [keyword, setKeyword] = useState("")
  const [result, setResult] = useState("all")
  const [selected, setSelected] = useState<AuditEvent | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const visibleEvents = useMemo(() => initialAuditEvents.filter((event) => {
    const matchesKeyword = [event.event, event.action, event.operator, event.object, event.id].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    const matchesResult = result === "all" || event.result === result
    return matchesKeyword && matchesResult
  }), [keyword, result])

  const pagedEvents = visibleEvents.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>事件总数</CardDescription><CardTitle className="text-2xl">{initialAuditEvents.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>成功事件</CardDescription><CardTitle className="text-2xl">{initialAuditEvents.filter((item) => item.result === "success").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>拒绝事件</CardDescription><CardTitle className="text-2xl">{initialAuditEvents.filter((item) => item.result === "denied").length}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>审计事件</CardTitle>
          <CardDescription>所有敏感操作都会保留操作人、对象、IP 和结果。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            keyword={keyword}
            onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
            selects={[{ value: result, onChange: (value) => { setPage(1); setResult(value) }, placeholder: "结果", options: [{ value: "all", label: "全部结果" }, ...Object.entries(auditResultLabels).map(([value, label]) => ({ value, label }))] }]}
          />
          <Table>
            <TableHeader>
              <TableRow><TableHead>事件</TableHead><TableHead>操作</TableHead><TableHead>操作人</TableHead><TableHead>对象</TableHead><TableHead>结果</TableHead><TableHead>IP</TableHead><TableHead>时间</TableHead><TableHead className="text-right">详情</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pagedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.event}</TableCell>
                  <TableCell className="font-mono text-xs">{event.action}</TableCell>
                  <TableCell className="text-muted-foreground">{event.operator}</TableCell>
                  <TableCell className="font-mono text-xs">{event.object}</TableCell>
                  <TableCell><Badge variant={statusVariant(event.result)}>{auditResultLabels[event.result]}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{event.ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{event.time}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(event)}>查看</Button></TableCell>
                </TableRow>
              ))}
              {pagedEvents.length === 0 ? <EmptyRows colSpan={8} title="没有匹配审计事件" description="调整结果或搜索关键词。" /> : null}
            </TableBody>
          </Table>
          <TablePagination
            total={visibleEvents.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPage(1); setPageSize(size) }}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selected?.event}</DialogTitle><DialogDescription>{selected?.id}</DialogDescription></DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-2 rounded-lg border p-4 text-sm">
            {[["操作", selected?.action], ["操作人", selected?.operator], ["对象", selected?.object], ["结果", selected ? auditResultLabels[selected.result] : ""], ["IP", selected?.ip], ["时间", selected?.time]].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>
            ))}
            </div>
          </div>
          <DialogFooter><Button onClick={() => setSelected(null)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PlatformManagement({ kind }: { kind: ManagementKind }) {
  const { title, description, icon: Icon } = meta[kind]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {kind === "team" ? <TeamView /> : null}
      {kind === "channel-access" ? <ChannelAccessView /> : null}
      {kind === "audit" ? <AuditView /> : null}
    </div>
  )
}
