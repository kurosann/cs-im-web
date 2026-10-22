"use client"

import {
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  IamApiError,
  createRole,
  deleteRole,
  listRoles,
  updateRole,
} from "@/lib/iam"

type RoleKind = "system" | "custom"
type RoleStatus = "active" | "disabled"

type Permission = {
  id: string
  label: string
  description: string
}

type PermissionGroup = {
  id: string
  title: string
  permissions: Permission[]
}

type Role = {
  roleKey: string
  name: string
  description: string
  kind: RoleKind
  status: RoleStatus
  members: number
  scopes: string[]
}

const permissionGroups: PermissionGroup[] = [
  {
    id: "platform",
    title: "平台与团队",
    permissions: [
      { id: "*", label: "全部权限", description: "拥有当前授权体系内的全部能力。" },
      { id: "gateway:admin", label: "管理网关", description: "管理租户下的网关数据。" },
      { id: "iam:token:manage", label: "管理凭证", description: "创建、轮换和禁用接入凭证。" },
      { id: "iam:user:manage", label: "管理员工", description: "创建、禁用和重置员工账号。" },
      { id: "iam:role:manage", label: "管理角色", description: "维护角色模板和权限组合。" },
      { id: "relay:access", label: "转发渠道接入", description: "通过平台转发通道收发消息。" },
    ],
  },
  {
    id: "conversation",
    title: "会话处理",
    permissions: [
      { id: "conversation:read", label: "查看会话", description: "查看当前租户内的客户会话。" },
      { id: "conversation:manage", label: "管理会话", description: "分配、接管和关闭客户会话。" },
      { id: "message:send:agent", label: "发送客服消息", description: "以客服身份回复客户。" },
    ],
  },
  {
    id: "channel",
    title: "渠道接入",
    permissions: [
      { id: "business-channel:manage", label: "管理业务渠道", description: "创建、禁用和轮换业务凭证。" },
      { id: "channel:access", label: "业务渠道接入", description: "通过业务渠道上报客户消息和获取客服回复。" },
      { id: "relay-channel:manage", label: "管理转发渠道", description: "维护平台私有转发渠道。" },
      { id: "webhook:manage", label: "管理 Webhook", description: "配置事件订阅和回调地址。" },
    ],
  },
  {
    id: "customer",
    title: "客户数据",
    permissions: [
      { id: "customer:profile:read", label: "查看客户信息", description: "查看客户基础资料、标签和历史会话。" },
      { id: "customer:order:read", label: "查看订单", description: "查看会话关联的订单和业务状态。" },
      { id: "conversation:note:read", label: "查看内部备注", description: "查看仅内部可见的备注和评论。" },
      { id: "data:export", label: "导出数据", description: "导出会话、客户和统计报表。" },
    ],
  },
  {
    id: "ai",
    title: "AI 配置",
    permissions: [
      { id: "ai:employee:manage", label: "管理 AI 客服", description: "配置 AI 客服、知识库和策略。" },
      { id: "ai:employee:publish", label: "保存并启动 AI 客服", description: "将草稿测试并启动到指定渠道。" },
      { id: "ai:knowledge:manage", label: "管理知识库", description: "维护 FAQ、政策和答案。" },
      { id: "translation:configure", label: "配置翻译", description: "配置默认语言、术语库和渠道语言限制。" },
    ],
  },
  {
    id: "audit",
    title: "审计与日志",
    permissions: [
      { id: "audit:read", label: "查看审计日志", description: "只读查看敏感操作和访问记录。" },
      { id: "message-log:read", label: "查看消息日志", description: "只读查看消息投递链路。" },
    ],
  },
]

const defaultRoleScopes = ["conversation:read", "message:send:agent"]

function roleVariant(kind: RoleKind) {
  return kind === "system" ? "secondary" : "outline"
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [keyword, setKeyword] = useState("")
  const [kind, setKind] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editorRole, setEditorRole] = useState<Role | null>(null)
  const [editorPermissions, setEditorPermissions] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", status: "active" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const showError = useCallback((error: unknown) => {
    toast.error(error instanceof IamApiError ? error.message : "请求失败，请稍后重试。")
  }, [])

  const loadRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      setRoles(await listRoles())
    } catch (error) {
      showError(error)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoles()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadRoles])

  const visibleRoles = useMemo(() => roles.filter((role) => {
    const matchesKeyword = [role.name, role.description, role.roleKey].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    const matchesKind = kind === "all" || role.kind === kind
    const matchesStatus = status === "all" || role.status === status
    return matchesKeyword && matchesKind && matchesStatus
  }), [roles, keyword, kind, status])

  const pagedRoles = visibleRoles.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  function openRole(role: Role) {
    setEditorRole(role)
    setEditorPermissions([...role.scopes])
  }

  function togglePermission(permissionId: string, checked: boolean) {
    setEditorPermissions((current) => checked ? [...current, permissionId] : current.filter((item) => item !== permissionId))
  }

  async function saveRole() {
    if (!editorRole || isSaving) return
    setIsSaving(true)
    try {
      const updated = await updateRole(editorRole.roleKey, {
        name: editorRole.name,
        description: editorRole.description,
        status: editorRole.status,
        scopes: editorPermissions,
      })
      setRoles((current) => current.map((role) => role.roleKey === updated.roleKey ? updated : role))
      setEditorRole(null)
      toast.success("角色权限已保存")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function submitCreateRole() {
    if (!form.name.trim() || isSaving) return
    setIsSaving(true)
    try {
      const created = await createRole({
        name: form.name.trim(),
        description: form.description.trim() || "暂未填写角色说明。",
        status: form.status as RoleStatus,
        scopes: defaultRoleScopes,
      })
      setRoles((current) => [created, ...current])
      setCreateOpen(false)
      setForm({ name: "", description: "", status: "active" })
      toast.success("角色已创建")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function duplicateRole(role: Role) {
    if (isSaving) return
    setIsSaving(true)
    try {
      const created = await createRole({
        name: `${role.name} 副本`,
        description: role.description,
        status: "disabled",
        scopes: role.scopes,
      })
      setRoles((current) => [created, ...current])
      toast.success("角色副本已创建")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleRoleStatus(role: Role) {
    if (isSaving) return
    const status = role.status === "active" ? "disabled" : "active"
    setIsSaving(true)
    try {
      const updated = await updateRole(role.roleKey, {
        name: role.name,
        description: role.description,
        status,
        scopes: role.scopes,
      })
      setRoles((current) => current.map((item) => item.roleKey === updated.roleKey ? updated : item))
      toast.success("角色状态已更新")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeRole(role: Role) {
    if (isSaving) return
    setIsSaving(true)
    try {
      await deleteRole(role.roleKey)
      setRoles((current) => current.filter((item) => item.roleKey !== role.roleKey))
      toast.success("角色已删除")
    } catch (error) {
      showError(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">角色管理</h2>
          <p className="text-sm text-muted-foreground">用角色模板管理系统权限，避免向用户直接暴露权限项。</p>
        </div>
        <Button disabled={isSaving} onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          创建角色
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardDescription>角色总数</CardDescription><CardTitle className="text-2xl">{roles.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>自定义角色</CardDescription><CardTitle className="text-2xl">{roles.filter((role) => role.kind === "custom").length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>已分配员工</CardDescription><CardTitle className="text-2xl">{roles.reduce((total, role) => total + role.members, 0)}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>系统角色用于保持默认权限一致，自定义角色可按团队调整。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={keyword} onChange={(event) => { setPage(1); setKeyword(event.target.value) }} placeholder="搜索角色或说明" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={kind} onValueChange={(value) => { setPage(1); setKind(value) }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="system">系统角色</SelectItem>
                  <SelectItem value="custom">自定义角色</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value) }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="disabled">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>员工</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRoles.map((role) => (
                <TableRow key={role.roleKey}>
                  <TableCell>
                    <p className="font-medium">{role.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{role.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(role.kind)}>{role.kind === "system" ? "系统角色" : "自定义"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{role.scopes.length}</span>
                      <span className="text-xs text-muted-foreground">项能力</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{role.members}</TableCell>
                  <TableCell>
                    <Badge variant={role.status === "active" ? "secondary" : "ghost"}>
                      {role.status === "active" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button disabled={isSaving} variant="ghost" size="sm" onClick={() => openRole(role)}>编辑权限</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`操作 ${role.name}`}><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => void duplicateRole(role)}><Copy className="size-3.5" />复制角色</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void toggleRoleStatus(role)}>{role.status === "active" ? "禁用角色" : "启用角色"}</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => void removeRole(role)}>
                            <Trash2 className="size-3.5" />删除角色
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pagedRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center">
                    <p className="text-sm font-medium">没有匹配角色</p>
                    <p className="mt-1 text-xs text-muted-foreground">调整类型、状态或搜索关键词。</p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            total={visibleRoles.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPage(1); setPageSize(size) }}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(editorRole)} onOpenChange={(open) => !open && setEditorRole(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑角色权限</DialogTitle>
            <DialogDescription>{editorRole?.name} · 权限会在下一次请求校验时生效。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <FieldGroup className="gap-4">
            {permissionGroups.map((group) => (
              <div key={group.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{group.title}</p>
                  <Badge variant="outline">
                    {group.permissions.filter((permission) => editorPermissions.includes(permission.id)).length}
                    /
                    {group.permissions.length}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3">
                  {group.permissions.map((permission) => (
                    <Field key={permission.id} orientation="horizontal">
                      <Checkbox
                        id={permission.id}
                        checked={editorPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => togglePermission(permission.id, checked === true)}
                      />
                      <FieldLabel htmlFor={permission.id} className="flex-col items-start gap-1">
                        <span>{permission.label}</span>
                        <FieldDescription>{permission.description}</FieldDescription>
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
              </div>
            ))}
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorRole(null)}>取消</Button>
            <Button disabled={isSaving} onClick={() => void saveRole()}>保存权限</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建角色</DialogTitle>
            <DialogDescription>创建后可以继续选择这个角色包含的能力。</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <FieldGroup>
            <Field><FieldLabel>角色名称</FieldLabel><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：海外客服组长" /></Field>
            <Field><FieldLabel>角色说明</FieldLabel><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="说明这个角色适合谁使用" /></Field>
            <Field orientation="horizontal">
              <FieldLabel>启用角色</FieldLabel>
              <Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm({ ...form, status: checked ? "active" : "disabled" })} />
            </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button disabled={isSaving} onClick={() => void submitCreateRole()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? <p aria-live="polite" className="text-center text-sm text-muted-foreground">正在加载角色</p> : null}
    </div>
  )
}
