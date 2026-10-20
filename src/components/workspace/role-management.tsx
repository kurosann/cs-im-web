"use client"

import {
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"

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
  id: string
  name: string
  description: string
  kind: RoleKind
  status: RoleStatus
  members: number
  permissions: string[]
}

const permissionGroups: PermissionGroup[] = [
  {
    id: "conversation",
    title: "会话处理",
    permissions: [
      { id: "conversation:assigned", label: "处理分配给我的会话", description: "查看并回复分配给自己的客户会话。" },
      { id: "conversation:tenant", label: "查看租户会话", description: "查看当前租户内全部会话。" },
      { id: "conversation:assign", label: "分配和转接会话", description: "将会话分配给员工或 AI。" },
      { id: "message:customer", label: "发送客户消息", description: "通过受限渠道上报客户消息。" },
      { id: "message:agent", label: "发送客服消息", description: "以客服身份回复客户。" },
    ],
  },
  {
    id: "platform",
    title: "团队与平台",
    permissions: [
      { id: "iam:user:manage", label: "管理员工", description: "创建、禁用和重置员工账号。" },
      { id: "iam:role:manage", label: "管理角色", description: "维护角色模板和权限组合。" },
      { id: "settings:manage", label: "管理系统设置", description: "修改工作区和通知设置。" },
    ],
  },
  {
    id: "channel",
    title: "渠道接入",
    permissions: [
      { id: "business-channel:manage", label: "管理业务渠道", description: "创建、禁用和轮换业务凭证。" },
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
      { id: "ai:employee:manage", label: "管理 AI 员工", description: "配置 AI 员工、知识库和策略。" },
      { id: "ai:employee:publish", label: "发布 AI 客服员工配置", description: "将草稿测试并发布到指定渠道。" },
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

const allPermissionIds = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id))

const initialRoles: Role[] = [
  {
    id: "role_admin",
    name: "管理员",
    description: "拥有租户配置、员工、渠道、会话和审计的完整管理能力。",
    kind: "system",
    status: "active",
    members: 1,
    permissions: allPermissionIds,
  },
  {
    id: "role_supervisor",
    name: "主管",
    description: "查看租户会话，分配和接管会话，查看运营状态。",
    kind: "system",
    status: "active",
    members: 2,
    permissions: [
      "conversation:assigned",
      "conversation:tenant",
      "conversation:assign",
      "message:agent",
      "message-log:read",
    ],
  },
  {
    id: "role_agent",
    name: "客服",
    description: "处理分配给自己的会话并发送人工回复。",
    kind: "system",
    status: "active",
    members: 8,
    permissions: ["conversation:assigned", "message:agent"],
  },
  {
    id: "role_auditor",
    name: "审计员",
    description: "只读查看审计日志、消息日志和投递记录。",
    kind: "system",
    status: "active",
    members: 1,
    permissions: ["audit:read", "message-log:read"],
  },
  {
    id: "role_developer",
    name: "开发者",
    description: "管理业务渠道、转发渠道、Webhook 和日志。",
    kind: "system",
    status: "active",
    members: 1,
    permissions: ["business-channel:manage", "relay-channel:manage", "webhook:manage", "message-log:read"],
  },
  {
    id: "role_overseas_lead",
    name: "海外客服组长",
    description: "面向海外客服一组的受限主管模板。",
    kind: "custom",
    status: "active",
    members: 3,
    permissions: ["conversation:assigned", "conversation:assign", "message:agent", "message-log:read"],
  },
]

function roleVariant(kind: RoleKind) {
  return kind === "system" ? "secondary" : "outline"
}

export function RoleManagement() {
  const [roles, setRoles] = useState(initialRoles)
  const [keyword, setKeyword] = useState("")
  const [kind, setKind] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editorRole, setEditorRole] = useState<Role | null>(null)
  const [editorPermissions, setEditorPermissions] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", status: "active" })
  const [notice, setNotice] = useState("")

  const visibleRoles = useMemo(() => roles.filter((role) => {
    const matchesKeyword = [role.name, role.description, role.id].join(" ").toLowerCase().includes(keyword.trim().toLowerCase())
    const matchesKind = kind === "all" || role.kind === kind
    const matchesStatus = status === "all" || role.status === status
    return matchesKeyword && matchesKind && matchesStatus
  }), [roles, keyword, kind, status])

  const pagedRoles = visibleRoles.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2200)
  }

  function openRole(role: Role) {
    setEditorRole(role)
    setEditorPermissions([...role.permissions])
  }

  function togglePermission(permissionId: string, checked: boolean) {
    setEditorPermissions((current) => checked ? [...current, permissionId] : current.filter((item) => item !== permissionId))
  }

  function saveRole() {
    if (!editorRole) return
    setRoles((current) => current.map((role) => role.id === editorRole.id ? {
      ...role,
      permissions: editorPermissions,
    } : role))
    setEditorRole(null)
    showNotice("角色权限已保存")
  }

  function createRole() {
    if (!form.name.trim()) return
    setRoles((current) => [{
      id: `role_${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim() || "暂未填写角色说明。",
      kind: "custom",
      status: form.status as RoleStatus,
      members: 0,
      permissions: ["conversation:assigned", "message:agent"],
    }, ...current])
    setCreateOpen(false)
    setForm({ name: "", description: "", status: "active" })
    showNotice("角色已创建")
  }

  function duplicateRole(role: Role) {
    setRoles((current) => [{
      ...role,
      id: `role_${Date.now()}`,
      name: `${role.name} 副本`,
      description: role.description,
      kind: "custom",
      status: "disabled",
      members: 0,
      permissions: [...role.permissions],
    }, ...current])
    showNotice("角色副本已创建")
  }

  function toggleRoleStatus(id: string) {
    setRoles((current) => current.map((role) => role.id === id ? {
      ...role,
      status: role.status === "active" ? "disabled" : "active",
    } : role))
    showNotice("角色状态已更新")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">角色管理</h2>
          <p className="text-sm text-muted-foreground">用角色模板管理系统权限，避免向用户直接暴露权限项。</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
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
                <TableRow key={role.id}>
                  <TableCell>
                    <p className="font-medium">{role.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{role.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(role.kind)}>{role.kind === "system" ? "系统角色" : "自定义"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{role.permissions.length}</span>
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
                      <Button variant="ghost" size="sm" onClick={() => openRole(role)}>编辑权限</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`操作 ${role.name}`}><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => duplicateRole(role)}><Copy className="size-3.5" />复制角色</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleRoleStatus(role.id)}>{role.status === "active" ? "禁用角色" : "启用角色"}</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setRoles((current) => current.filter((item) => item.id !== role.id)); showNotice("角色已删除") }}>
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
            <Button onClick={saveRole}>保存权限</Button>
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
            <Button onClick={createRole}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notice ? <p aria-live="polite" className="text-center text-sm text-muted-foreground">{notice}</p> : null}
    </div>
  )
}
