"use client"

import {
  Copy,
  MoreHorizontal,
  Plus,
  Search,
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
import { copyText, selectElementText } from "@/lib/copy-text"
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
import { ChannelAccessView as ServerChannelAccessView } from "@/components/workspace/channel-access-view"
import { readSession } from "@/lib/auth"
import {
  type AuditLog,
  IamApiError,
  createStaff,
  forceStaffLogout,
  resetStaffPassword,
  listAuditLogs,
  listStaff,
  listRoles,
  setStaffStatus,
  updateStaff,
  type Role,
} from "@/lib/iam"

type ManagementKind = "team" | "channel-access" | "audit"
type EmployeeRole = string
type EmployeeStatus = "active" | "disabled"
type AuditResult = "success" | "denied" | "warning"

type Employee = {
  id: string
  name: string
  email: string
  role: EmployeeRole
  status: EmployeeStatus
  online: boolean
  device: string
  ip: string
  lastLoginAt: string
  lastActiveAt: string
}

const roleLabels: Record<string, string> = {
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

const auditResultLabels: Record<AuditResult, string> = {
  success: "成功",
  denied: "已拒绝",
  warning: "需关注",
}

function copyShownValue(value: string, button: HTMLButtonElement, success: string) {
  const source = button.parentElement?.querySelector<HTMLElement>("[data-copy-source]")
  void copyText(value).then(
    () => toast.success(success),
    () => {
      if (source) selectElementText(source)
      toast.error("自动复制被浏览器拦截，内容已选中，请按 ⌘C 复制")
    },
  )
}

function auditResultLabel(value: AuditResult) {
  return auditResultLabels[value] ?? value
}

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

function formatDevice(value?: string | null) {
  const userAgent = value ?? ""
  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("iPhone") || userAgent.includes("iPad")
        ? "iOS"
        : userAgent.includes("Mac OS X") || userAgent.includes("Macintosh")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : ""
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("OPR/") || userAgent.includes("Opera")
      ? "Opera"
      : userAgent.includes("Chrome") && !userAgent.includes("Edg/")
        ? "Chrome"
        : userAgent.includes("Firefox")
          ? "Firefox"
          : userAgent.includes("Safari") && !userAgent.includes("Chrome")
            ? "Safari"
            : ""
  return [browser, os].filter(Boolean).join(" · ") || "未知设备"
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full lg:w-72">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="搜索名称、ID 或对象" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState({ name: "", email: "", role: "agent" })
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "agent" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [createdStaff, setCreatedStaff] = useState<{ email: string; password: string } | null>(null)
  const [resetPassword, setResetPassword] = useState<{ email: string; password: string } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])

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
        online: Boolean(item.online),
        device: item.device ? formatDevice(item.device) : "—",
        ip: item.ip || "—",
        lastLoginAt: formatTime(item.lastLoginAt),
        lastActiveAt: item.online ? formatTime(item.lastActiveAt) : "—",
      })))
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await listRoles())
    } catch (error) {
      showError(error)
    }
  }, [showError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEmployees()
      void loadRoles()
      setCurrentUserId(readSession()?.userId ?? null)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadEmployees, loadRoles])

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

  async function logoutEmployee(id: string) {
    if (isSaving) return
    setIsSaving(true)
    try {
      await forceStaffLogout(id)
      await loadEmployees()
      toast.success("员工会话已下线")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function resetPasswordFor(id: string) {
    if (isSaving) return
    setIsSaving(true)
    try {
      const result = await resetStaffPassword(id)
      await loadEmployees()
      setResetPassword({ email: result.user.email, password: result.initialPassword })
      toast.success("员工密码已重置")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  function openEditEmployee(employee: Employee) {
    setEditingEmployee(employee)
    setEditForm({ name: employee.name, email: employee.email, role: employee.role })
  }

  async function updateEmployee() {
    if (!editingEmployee || !editForm.name.trim() || !editForm.email.trim()) return
    if (isSaving) return
    setIsSaving(true)
    try {
      await updateStaff(editingEmployee.id, {
        displayName: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
      })
      await loadEmployees()
      setEditingEmployee(null)
      toast.success("员工已更新")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>员工总数</CardDescription><CardTitle className="text-2xl">{employees.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>启用中</CardDescription><CardTitle className="text-2xl">{employees.filter((item) => item.status === "active").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>管理员</CardDescription><CardTitle className="text-2xl">{employees.filter((item) => item.role === "admin").length}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>员工账号</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table
            loading={isLoading}
            loadingMode={pagedEmployees.length === 0 ? "visible" : "silent"}
            loadingLabel="正在加载员工…"
            refreshing={isLoading}
            onRefresh={loadEmployees}
            tableFilters={(
              <FilterBar
                keyword={keyword}
                onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
                selects={[
                  { value: role, onChange: (value) => { setPage(1); setRole(value) }, placeholder: "角色", options: [{ value: "all", label: "全部角色" }, ...roles.map((item) => ({ value: item.roleKey, label: item.name }))] },
                  { value: status, onChange: (value) => { setPage(1); setStatus(value) }, placeholder: "状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(employeeStatusLabels).map(([value, label]) => ({ value, label }))] },
                ]}
              />
            )}
            tableActionsRight={(
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                创建员工
              </Button>
            )}
          >
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>在线</TableHead>
                <TableHead>设备 / 来源</TableHead>
                <TableHead>最近登录</TableHead>
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
                        <p className="font-medium">
                          {employee.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{roleLabels[employee.role] ?? employee.role}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(employee.status)}>{employeeStatusLabels[employee.status]}</Badge></TableCell>
                  <TableCell><Badge variant={employee.online ? "secondary" : "ghost"}>{employee.online ? "在线" : "离线"}</Badge></TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">{employee.device}</p>
                    <p className="font-mono text-xs text-muted-foreground">{employee.ip}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{employee.lastLoginAt}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{employee.lastActiveAt}</TableCell>
                  <TableCell className="text-right">
                    {employee.id === currentUserId ? (
                      <span className="text-xs text-muted-foreground">当前账号</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditEmployee(employee)}>
                          编辑
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`操作 ${employee.name}`} disabled={isSaving}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-36">
                            <DropdownMenuItem
                              disabled={!employee.online || isSaving}
                              onClick={() => void logoutEmployee(employee.id)}
                            >
                              强制下线
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isSaving}
                              onClick={() => void resetPasswordFor(employee.id)}
                            >
                              重置密码
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant={employee.status === "active" ? "destructive" : "default"}
                              disabled={isSaving}
                              onClick={() => void toggleEmployee(employee.id, employee.status === "active" ? "disabled" : "active")}
                            >
                              {employee.status === "active" ? "禁用账号" : "启用账号"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {pagedEmployees.length === 0 ? <EmptyRows colSpan={8} title="没有匹配员工" description="调整筛选条件或搜索关键词。" /> : null}
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
              <SelectContent>{roles.map((item) => <SelectItem key={item.roleKey} value={item.roleKey}>{item.name}</SelectItem>)}</SelectContent>
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

      <Dialog open={Boolean(resetPassword)} onOpenChange={(open) => !open && setResetPassword(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新密码只显示一次</DialogTitle>
            <DialogDescription>旧密码已失效，请立即发给员工并提醒登录后修改。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">{resetPassword?.email}</div>
              <div data-copy-source className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap">{resetPassword?.password}</div>
              <Button variant="outline" type="button" onClick={(event) => copyShownValue(resetPassword?.password ?? "", event.currentTarget, "新密码已复制")}>
                <Copy className="size-4" />复制新密码
              </Button>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setResetPassword(null)}>我已保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingEmployee)} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑员工</DialogTitle>
            <DialogDescription>更新员工资料和角色。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 py-3">
            <FieldGroup>
              <Field>
                <FieldLabel>姓名</FieldLabel>
                <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>邮箱</FieldLabel>
                <Input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>角色</FieldLabel>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((item) => <SelectItem key={item.roleKey} value={item.roleKey}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>取消</Button>
            <Button onClick={() => void updateEmployee()}>保存</Button>
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
              <div data-copy-source className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap">{createdStaff?.password}</div>
              <Button variant="outline" type="button" onClick={(event) => copyShownValue(createdStaff?.password ?? "", event.currentTarget, "初始密码已复制")}>
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

function AuditView() {
  const [keyword, setKeyword] = useState("")
  const [result, setResult] = useState("all")
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listAuditLogs({ keyword, result, page, pageSize })
      setLogs(data.items)
      setTotal(data.total)
    } catch (error) {
      const message = error instanceof IamApiError ? error.message : "获取审计日志失败。"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [keyword, result, page, pageSize])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadLogs])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>审计事件</CardTitle>
          <CardDescription>所有敏感操作都会保留操作人、对象、IP 和结果。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table
            loading={loading}
            loadingMode={logs.length === 0 ? "visible" : "silent"}
            loadingLabel="正在加载审计日志…"
            refreshing={loading}
            onRefresh={loadLogs}
            tableFilters={(
              <FilterBar
                keyword={keyword}
                onKeywordChange={(value) => { setPage(1); setKeyword(value) }}
                selects={[{ value: result, onChange: (value) => { setPage(1); setResult(value) }, placeholder: "结果", options: [{ value: "all", label: "全部结果" }, ...Object.entries(auditResultLabels).map(([value, label]) => ({ value, label }))] }]}
              />
            )}
          >
            <TableHeader>
              <TableRow><TableHead>事件</TableHead><TableHead>操作</TableHead><TableHead>操作人</TableHead><TableHead>对象</TableHead><TableHead>结果</TableHead><TableHead>IP</TableHead><TableHead>时间</TableHead><TableHead className="text-right">详情</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.event}</TableCell>
                  <TableCell className="font-mono text-xs">{event.action}</TableCell>
                  <TableCell className="text-muted-foreground">{event.operator}</TableCell>
                  <TableCell className="font-mono text-xs">{event.object}</TableCell>
                  <TableCell><Badge variant={statusVariant(event.result)}>{auditResultLabel(event.result)}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{event.ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{event.createdAt}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(event)}>查看</Button></TableCell>
                </TableRow>
              ))}
              {logs.length === 0 ? <EmptyRows colSpan={8} title={loading ? "正在获取审计日志" : "没有匹配审计事件"} description={loading ? "请稍候。" : "执行敏感操作后会记录在这里。"} /> : null}
            </TableBody>
          </Table>
          <TablePagination
            total={total}
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
            {[["操作", selected?.action], ["操作人", selected?.operator], ["对象", selected?.object], ["结果", selected ? auditResultLabel(selected.result) : ""], ["IP", selected?.ip], ["设备", selected ? formatDevice(selected.device) : ""], ["时间", selected?.createdAt]].map(([label, value]) => (
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
  return (
    <div className="space-y-4">
      {kind === "team" ? <TeamView /> : null}
      {kind === "channel-access" ? <ServerChannelAccessView notice={(message) => toast.success(message)} /> : null}
      {kind === "audit" ? <AuditView /> : null}
    </div>
  )
}
