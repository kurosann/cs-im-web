"use client"

import {
  Bot,
  CircleAlert,
  Copy,
  Ellipsis,
  FlaskConical,
  Library,
  Pause,
  Play,
  Save,
  Star,
  Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { knowledgeBases, knowledgeDocs, knowledgeGroups } from "@/data/mock/chat"
import { EmployeeExecutionLogs } from "@/components/workspace/employee-execution-logs"
import {
  createEmployee as createEmployeeRequest,
  deleteEmployee as deleteEmployeeRequest,
  listEmployeeChannels,
  listEmployeeExecutions,
  listEmployees,
  updateEmployee,
  type AIEmployee,
  type ChannelBinding,
} from "@/lib/ai-employees"
import type { EmployeeExecution } from "@/lib/ai-execution-display"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Mode = "basic" | "professional"
type DetailPanel = "config" | "logs"
type EmployeeStatus = "未配置" | "已暂停" | "运行中"
type Employee = {
  id: string
  name: string
  persona: string
  status: EmployeeStatus
  mode: Mode
  prompt: string
  history: number
  autoReply: boolean
  reporting: boolean
  channelScope: "all" | "selected"
  channels: string[]
  isDefault: boolean
  selectedDocIds: string[]
  tools: string[]
  version: string
  updatedAt: string
}

const toolOptions = ["查询商品", "查询订单", "查询物流", "查询会员权益", "自动翻译", "创建提醒"]

type ChannelOption = ChannelBinding

const statusTone: Record<EmployeeStatus, string> = {
  运行中: "bg-emerald-500",
  已暂停: "bg-amber-500",
  未配置: "bg-muted-foreground/50",
}

function blankEmployee(): Omit<Employee, "id" | "name" | "status"> {
  return {
    persona: "",
    mode: "basic",
    prompt: "",
    history: 10,
    autoReply: true,
    reporting: true,
    channelScope: "selected",
    channels: [],
    isDefault: false,
    selectedDocIds: [],
    tools: [],
    version: "已同步",
    updatedAt: "已同步",
  }
}

function toEmployee(item: AIEmployee, options: ChannelOption[]): Employee {
  const channels = (item.channels ?? []).map((binding) => binding.platform)
  const coversAll = options.length > 0 && options.every((option) => channels.includes(option.platform))
  return {
    ...blankEmployee(),
    id: item.employeeId,
    name: item.name,
    persona: item.persona ?? "",
    status: item.status === "running" ? "运行中" : "已暂停",
    mode: item.mode === "professional" ? "professional" : "basic",
    prompt: item.prompt ?? "",
    history: item.history || 10,
    autoReply: item.autoReply,
    channelScope: coversAll ? "all" : "selected",
    channels,
    selectedDocIds: item.selectedDocIds ?? [],
    tools: item.tools ?? [],
  }
}

function nextEmployeeName(items: Employee[]) {
  const names = new Set(items.map((item) => item.name))
  const base = "新 AI 客服"
  if (!names.has(base)) return base
  for (let index = 2; index < 100; index += 1) {
    const name = `${base} ${index}`
    if (!names.has(name)) return name
  }
  return `${base} ${Date.now()}`
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败"
}

function boundedNumber(value: string, min: number, max: number) {
  if (value.trim() === "") return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.min(max, Math.max(min, parsed))
}

function apiStatus(status: EmployeeStatus, published: boolean): "running" | "paused" {
  if (published || status === "运行中") return "running"
  return "paused"
}

function EmployeeRail({
  employees,
  activeId,
  loading,
  saving,
  emptyMessage,
  onCreate,
  onSelect,
}: {
  employees: Employee[]
  activeId: string
  loading: boolean
  saving: boolean
  emptyMessage: string
  onCreate: () => void
  onSelect: (id: string) => void
}) {
  return (
    <aside className="flex max-h-72 flex-col overflow-hidden rounded-xl border bg-card xl:sticky xl:top-14 xl:max-h-[calc(100dvh-5.5rem)]">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-sm font-semibold">客服</p>
        <Button type="button" variant="outline" size="sm" onClick={onCreate} disabled={saving || loading}>
          <Bot />
          创建
        </Button>
      </div>
      {employees.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {employees.map((employee) => {
            const selected = employee.id === activeId
            return (
              <li key={employee.id}>
                <button
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onSelect(employee.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/70 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    selected && "bg-muted"
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-foreground ring-1 ring-border">
                    <Bot className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{employee.name}</span>
                      {employee.isDefault ? (
                        <>
                          <Star className="size-3 shrink-0 fill-current text-amber-500" aria-hidden />
                          <span className="sr-only">默认员工</span>
                        </>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {employee.persona || "未设置人设"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-2 rounded-full", statusTone[employee.status])} aria-hidden />
                    {employee.status}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

export function EmployeeView() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([])
  const [activeId, setActiveId] = useState("")
  const [notice, setNotice] = useState("")
  const [noticeIsError, setNoticeIsError] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const [draftDocIds, setDraftDocIds] = useState<string[]>([])
  const [draftTools, setDraftTools] = useState<string[]>([])
  const [logs, setLogs] = useState<EmployeeExecution[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState("")
  const [logsAttempt, setLogsAttempt] = useState(0)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [testMessage, setTestMessage] = useState("我的退款什么时候到账？")
  const [testResult, setTestResult] = useState<{ reply: string; knowledge: string; risk: string } | null>(null)
  const [panel, setPanel] = useState<DetailPanel>("config")
  const active = employees.find((item) => item.id === activeId)

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([listEmployees(), listEmployeeChannels()])
      .then(([items, channels]) => {
        if (cancelled) return
        const views = items.map((item) => toEmployee(item, channels))
        setChannelOptions(channels)
        setEmployees(views)
        setActiveId((current) => views.some((item) => item.id === current) ? current : views[0]?.id ?? "")
        setLoadError("")
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  useEffect(() => {
    if (!activeId) {
      setLogs([])
      return
    }
    let cancelled = false
    setLogsLoading(true)
    listEmployeeExecutions(activeId)
      .then((items) => {
        if (cancelled) return
        setLogs(items)
        setLogsError("")
      })
      .catch((error) => {
        if (!cancelled) setLogsError(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeId, logsAttempt])

  function update(patch: Partial<Employee>) {
    if (!active) return
    setEmployees((current) =>
      current.map((item) => (item.id === active.id ? { ...item, ...patch } : item))
    )
  }

  function toggleList(field: "selectedDocIds" | "tools" | "channels", value: string) {
    if (!active) return
    const selected = active[field]
    update({
      [field]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    } as Partial<Employee>)
  }

  function openKnowledge() {
    if (!active) return
    setDraftDocIds(active.selectedDocIds)
    setDraftTools(active.tools)
    setKnowledgeOpen(true)
  }

  function toggleDraftDoc(docId: string) {
    setDraftDocIds((current) => current.includes(docId) ? current.filter((id) => id !== docId) : [...current, docId])
  }

  function toggleDraftBase(baseId: string) {
    const docIds = knowledgeDocs.filter((doc) => doc.baseId === baseId).map((doc) => doc.id)
    setDraftDocIds((current) => {
      const allSelected = docIds.every((id) => current.includes(id))
      return allSelected ? current.filter((id) => !docIds.includes(id)) : Array.from(new Set([...current, ...docIds]))
    })
  }

  function toggleDraftTool(tool: string) {
    setDraftTools((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool])
  }

  function applyKnowledge() {
    update({ selectedDocIds: draftDocIds, tools: draftTools })
    setKnowledgeOpen(false)
  }

  function notify(text: string, isError = false) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    setNotice(text)
    setNoticeIsError(isError)
    if (!isError) {
      noticeTimer.current = setTimeout(() => setNotice(""), 4000)
    }
  }

  function bindingsFor(employee: Employee): ChannelBinding[] {
    const chosen = employee.channelScope === "all"
      ? channelOptions
      : channelOptions.filter((option) => employee.channels.includes(option.platform))
    return chosen.map(({ platform, label }) => ({ platform, label }))
  }

  function replaceEmployee(saved: AIEmployee, previous?: Employee) {
    const next = {
      ...toEmployee(saved, channelOptions),
      reporting: previous?.reporting ?? true,
      isDefault: previous?.isDefault ?? false,
      channelScope: previous?.channelScope ?? "selected",
    }
    setEmployees((current) => {
      const exists = current.some((item) => item.id === next.id)
      return exists ? current.map((item) => (item.id === next.id ? next : item)) : [...current, next]
    })
    setActiveId(next.id)
  }

  async function save(published: boolean) {
    if (!active || saving) return
    setSaving(true)
    try {
      const saved = await updateEmployee(active.id, {
        name: active.name,
        persona: active.persona,
        status: apiStatus(active.status, published),
        mode: active.mode,
        prompt: active.prompt,
        history: boundedNumber(String(active.history), 1, 50) ?? 10,
        autoReply: active.autoReply,
        selectedDocIds: active.selectedDocIds,
        tools: active.tools,
        channels: bindingsFor(active),
      })
      replaceEmployee(saved, active)
      notify(
        published
          ? "已保存并启动"
          : active.status === "运行中"
            ? "草稿已保存，运行状态保持不变"
            : active.status === "未配置"
              ? "草稿已保存，未配置会按暂停保存"
              : "草稿已保存"
      )
    } catch (error) {
      notify(errorMessage(error), true)
    } finally {
      setSaving(false)
    }
  }

  async function createEmployee() {
    if (saving) return
    setSaving(true)
    try {
      const saved = await createEmployeeRequest(nextEmployeeName(employees))
      replaceEmployee(saved)
      notify("已创建 AI 客服")
    } catch (error) {
      notify(errorMessage(error), true)
    } finally {
      setSaving(false)
    }
  }

  async function duplicateEmployee() {
    if (!active || saving) return
    setSaving(true)
    try {
      const copyName = employees.some((item) => item.name === `${active.name} 副本`)
        ? nextEmployeeName(employees)
        : `${active.name} 副本`
      const created = await createEmployeeRequest(copyName)
      const saved = await updateEmployee(created.employeeId, {
        name: created.name,
        persona: active.persona,
        status: "paused",
        mode: active.mode,
        prompt: active.prompt,
        history: active.history,
        autoReply: active.autoReply,
        selectedDocIds: active.selectedDocIds,
        tools: active.tools,
        channels: [],
      })
      replaceEmployee(saved, { ...active, isDefault: false, name: saved.name, channelScope: "selected", channels: [] })
      notify("已复制配置")
    } catch (error) {
      notify(errorMessage(error), true)
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee() {
    if (!active || saving) return
    setSaving(true)
    try {
      await deleteEmployeeRequest(active.id)
      const remaining = employees.filter((item) => item.id !== active.id)
      setEmployees(remaining)
      setActiveId(remaining[0]?.id ?? "")
      notify("已删除配置")
    } catch (error) {
      notify(errorMessage(error), true)
    } finally {
      setSaving(false)
    }
  }

  function setDefault() {
    if (!active) return
    setEmployees((current) =>
      current.map((item) => ({
        ...item,
        isDefault: item.id === active.id,
      }))
    )
    notify("已在当前页面设为默认，刷新后不会保留")
  }

  function runTest() {
    const value = testMessage.trim()
    if (!value) return
    if (/账号|锁定|登录/.test(value)) {
      setTestResult({ reply: "检测到账号安全风险，AI 不会自动回复，已转人工并附带会话摘要。", knowledge: "账号安全流程", risk: "高" })
    } else if (/退款|退货/.test(value)) {
      setTestResult({ reply: "退款正在财务复核中，预计 1-2 个工作日到账，我会继续跟进。", knowledge: "退款多久到账？", risk: "中" })
    } else if (/物流|快递/.test(value)) {
      setTestResult({ reply: "我先为您查询最新物流状态，请稍等。", knowledge: "物流查询工具", risk: "低" })
    } else {
      setTestResult({ reply: "已收到您的问题，我会结合知识库为您核实。", knowledge: "通用问答", risk: "低" })
    }
  }

  if (!active) {
    const title = loading ? "正在加载" : loadError ? "列表加载失败" : "还没有 AI 客服"
    const body = loading
      ? "正在加载当前账号的 AI 客服。"
      : loadError || "创建后，保存草稿和保存并启动会写入当前登录账号。"
    return (
      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <EmployeeRail
          employees={employees}
          activeId=""
          loading={loading}
          saving={saving}
          emptyMessage={loading ? "正在加载当前账号的 AI 客服…" : loadError || "当前账号还没有 AI 客服。"}
          onCreate={createEmployee}
          onSelect={setActiveId}
        />
        <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card px-6 text-center">
          <div className="max-w-sm">
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
            {loadError ? (
              <Button
                type="button"
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setLoading(true)
                  setLoadError("")
                  setLoadAttempt((current) => current + 1)
                }}
              >
                重试
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const checks = [
    { title: "高风险转人工", value: active.reporting ? "已开启" : "未开启", ok: active.reporting },
  ]
  const knowledgeSummary = active.selectedDocIds.length === 0 && active.tools.length === 0
    ? "未选择知识库或工具"
    : `已选 ${active.selectedDocIds.length} 篇 · ${active.tools.length} 个工具`

  return (
    <>
    <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <EmployeeRail
        employees={employees}
        activeId={active.id}
        loading={loading}
        saving={saving}
        emptyMessage="当前账号还没有 AI 客服。"
        onCreate={createEmployee}
        onSelect={setActiveId}
      />

      <Tabs
        value={panel}
        onValueChange={(value) => setPanel(value as DetailPanel)}
        className="min-w-0 gap-0 rounded-xl border bg-card"
      >
        <div className="sticky top-14 z-10 flex flex-col gap-3 border-b bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="flex items-center gap-1.5 text-base font-semibold">
              {active.name}
              {active.isDefault ? (
                <>
                  <Star className="size-3.5 fill-current text-amber-500" aria-hidden />
                  <span className="sr-only">默认员工</span>
                </>
              ) : null}
            </h2>
            <Select
              value={active.status}
              onValueChange={(value) => update({ status: value as EmployeeStatus })}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="运行状态">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="未配置">未配置</SelectItem>
                <SelectItem value="已暂停">已暂停</SelectItem>
                <SelectItem value="运行中">运行中</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {active.version}
              <span className="px-1.5" aria-hidden>·</span>
              {active.channelScope === "all" ? "全部渠道" : `${active.channels.length} 个渠道`}
              <span className="px-1.5" aria-hidden>·</span>
              最近更新 {active.updatedAt}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <TabsList aria-label="详情">
                <TabsTrigger value="config">配置</TabsTrigger>
                <TabsTrigger value="logs">
                  日志
                  <span className="tabular-nums text-muted-foreground">{logs.length}</span>
                </TabsTrigger>
              </TabsList>

            <div className="flex flex-wrap items-center justify-end gap-2" aria-busy={saving}>
              {active.status === "运行中" ? (
                <Button type="button" variant="outline" disabled={saving} onClick={() => update({ status: "已暂停" })}>
                  <Pause />
                  暂停
                </Button>
              ) : null}
              {panel === "config" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => save(false)} disabled={saving}>
                    保存草稿
                  </Button>
                  <Button type="button" onClick={() => save(true)} disabled={saving}>
                    <Save />
                    保存并启动
                  </Button>
                </>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" aria-label="更多操作">
                    <Ellipsis />
                    更多
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={saving} onClick={() => setTestOpen(true)}>
                    <FlaskConical />
                    测试会话
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={saving || active.isDefault} onClick={setDefault}>
                    <Star />
                    设为默认
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={saving} onClick={duplicateEmployee}>
                    <Copy />
                    复制配置
                  </DropdownMenuItem>
                  {active.status === "运行中" ? null : (
                    <DropdownMenuItem disabled={saving} onClick={() => update({ status: "运行中" })}>
                      <Play />
                      启动
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={saving} onClick={() => setConfirmDelete(true)}>
                    <Trash2 />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {notice ? (
            <p role={noticeIsError ? "alert" : "status"} className={cn("text-xs leading-5", noticeIsError ? "text-destructive" : "text-muted-foreground")}>
              {notice}
            </p>
          ) : null}
        </div>

          <TabsContent value="config" className="scroll-mt-40 outline-none">
          <div className="flex flex-col gap-6 p-4 sm:p-5 [&_button]:scroll-mt-48 [&_input]:scroll-mt-48 [&_textarea]:scroll-mt-48">
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold">基础信息</h3>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="employee-name">员工名称</FieldLabel>
                  <Input
                    id="employee-name"
                    value={active.name}
                    onChange={(event) => update({ name: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="employee-persona">人设 / 语气</FieldLabel>
                  <Input
                    id="employee-persona"
                    value={active.persona}
                    onChange={(event) => update({ persona: event.target.value })}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="employee-prompt">系统提示词</FieldLabel>
                <Textarea
                  id="employee-prompt"
                  className="min-h-28"
                  value={active.prompt}
                  onChange={(event) => update({ prompt: event.target.value })}
                />
              </Field>

              <Field className="max-w-sm">
                <FieldLabel htmlFor="employee-history">历史消息读取条数</FieldLabel>
                <Input
                  id="employee-history"
                  type="number"
                  min={1}
                  max={50}
                  value={active.history}
                  onChange={(event) => {
                    const next = boundedNumber(event.target.value, 1, 50)
                    if (next !== undefined) update({ history: next })
                  }}
                />
                <FieldDescription>保留最近 1 到 50 条上下文。</FieldDescription>
              </Field>
            </FieldGroup>
            </section>

            <section className="flex flex-col gap-3 border-t pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">渠道绑定</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      可以选择全部渠道，或只选指定渠道。
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={active.channelScope}
                    onValueChange={(value) => value && update({ channelScope: value as "all" | "selected" })}
                    size="sm"
                  >
                    <ToggleGroupItem value="all">全部渠道</ToggleGroupItem>
                    <ToggleGroupItem value="selected">指定渠道</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {active.channelScope === "selected" ? (
                  channelOptions.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      暂无可选渠道。员工本身仍可以保存。
                    </p>
                  ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {channelOptions.map((channel) => (
                      <button
                        key={channel.platform}
                        type="button"
                        onClick={() => toggleList("channels", channel.platform)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active.channels.includes(channel.platform)
                            ? "border-foreground bg-muted"
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        <span className="min-w-0 truncate">{channel.label || channel.platform}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {active.channels.includes(channel.platform) ? "已绑定" : "可绑定"}
                        </span>
                      </button>
                    ))}
                  </div>
                  )
                ) : (
                  <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    当前绑定全部渠道。
                  </p>
                )}
            </section>

            <section className="flex flex-col gap-3 border-t pt-5">
              <div>
                <h3 className="text-sm font-semibold">回复策略</h3>
                <p className="mt-1 text-xs text-muted-foreground">自动回复会保存。转人工只留在当前页面。</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">自动回复</p>
                  <p className="mt-1 text-xs text-muted-foreground">关闭后只生成建议，不自动发送。</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{active.autoReply ? "已开启" : "已关闭"}</span>
                    <Switch
                      checked={active.autoReply}
                      onCheckedChange={(checked) => update({ autoReply: checked })}
                      aria-label="自动回复"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">转人工 / 转中控</p>
                  <p className="mt-1 text-xs text-muted-foreground">低置信、高风险或客户要求时触发。</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{active.reporting ? "已开启" : "已关闭"}</span>
                    <Switch
                      checked={active.reporting}
                      onCheckedChange={(checked) => update({ reporting: checked })}
                      aria-label="转人工"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">知识库与工具</h3>
                <p className="mt-1 text-xs text-muted-foreground">{knowledgeSummary}</p>
              </div>
              <Button type="button" variant="outline" onClick={openKnowledge}>
                <Library />
                选择
              </Button>
            </section>

            <section className="flex flex-col gap-3 border-t pt-5">
              <div>
                <h3 className="text-sm font-semibold">配置检查</h3>
                <p className="mt-1 text-xs text-muted-foreground">发布前确认以下边界，避免 AI 在高风险场景越权回复。</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {checks.map((item) => (
                  <div key={item.title} className="rounded-lg border px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{item.title}</p>
                    <p className={cn("mt-1 text-sm font-medium", item.ok ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          </TabsContent>
          <TabsContent value="logs" className="min-h-80 outline-none">
            <EmployeeExecutionLogs
              logs={logs}
              loading={logsLoading}
              error={logsError}
              onRefresh={() => setLogsAttempt((current) => current + 1)}
            />
          </TabsContent>
      </Tabs>
    </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>删除 {active.name}？</DialogTitle>
            <DialogDescription>删除后无法恢复，绑定和当前页面上的配置都会一起去掉。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>取消</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => {
                setConfirmDelete(false)
                void deleteEmployee()
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
        <DialogContent className="flex max-h-[min(40rem,calc(100dvh-2rem))] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-4 py-4">
            <DialogTitle>知识库与工具</DialogTitle>
            <DialogDescription>按产品分组选择文档，并勾选这个客服可以调用的工具。</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {knowledgeGroups.map((group) => {
              const bases = knowledgeBases.filter((base) => base.groupId === group.id)
              return (
                <section key={group.id} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground">{group.name}</p>
                  {bases.map((base) => {
                    const docs = knowledgeDocs.filter((doc) => doc.baseId === base.id)
                    const selectedCount = docs.filter((doc) => draftDocIds.includes(doc.id)).length
                    const allSelected = docs.length > 0 && selectedCount === docs.length
                    return (
                      <div key={base.id} className="rounded-xl border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{base.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {base.product} · 已选 {selectedCount}/{docs.length}
                            </p>
                          </div>
                          <Button type="button" variant={allSelected ? "secondary" : "outline"} size="xs" onClick={() => toggleDraftBase(base.id)}>
                            {allSelected ? "取消整库" : "选择整库"}
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {docs.map((doc) => {
                            const selected = draftDocIds.includes(doc.id)
                            return (
                              <button
                                type="button"
                                key={doc.id}
                                aria-pressed={selected}
                                onClick={() => toggleDraftDoc(doc.id)}
                                className={cn(
                                  "cursor-pointer rounded-lg border p-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  selected ? "border-foreground bg-muted text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/60"
                                )}
                              >
                                <span className="block truncate font-medium">{doc.title}</span>
                                <span className="mt-0.5 block">{doc.language} · {doc.status}{selected ? " · 已选" : ""}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </section>
              )
            })}
            <section>
              <p className="text-sm font-semibold">工具调用</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {toolOptions.map((tool) => (
                  <Button
                    key={tool}
                    type="button"
                    size="sm"
                    variant={draftTools.includes(tool) ? "default" : "outline"}
                    aria-pressed={draftTools.includes(tool)}
                    onClick={() => toggleDraftTool(tool)}
                  >
                    {tool}
                  </Button>
                ))}
              </div>
            </section>
          </div>
          <DialogFooter className="border-t px-4 py-3">
            <Button type="button" variant="outline" onClick={() => setKnowledgeOpen(false)}>取消</Button>
            <Button type="button" onClick={applyKnowledge}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>测试会话</DialogTitle>
            <DialogDescription>使用当前配置模拟一条客户消息，检查知识命中、风险和回复边界。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel htmlFor="test-message">客户消息</FieldLabel>
              <Textarea
                id="test-message"
                value={testMessage}
                onChange={(event) => setTestMessage(event.target.value)}
                className="min-h-20"
                placeholder="例如：我的退款什么时候到账？"
              />
            </Field>
            {testResult ? (
              <div className="space-y-3 rounded-xl border border-dashed bg-muted/40 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={testResult.risk === "高" ? "destructive" : testResult.risk === "中" ? "outline" : "secondary"}>
                    风险：{testResult.risk}
                  </Badge>
                  <Badge variant="outline">命中：{testResult.knowledge}</Badge>
                  <Badge variant={active.status === "运行中" ? "secondary" : "ghost"}>
                    配置：{active.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">AI 将回复</p>
                  <p className="mt-1 rounded-lg bg-background p-3 text-sm leading-6">{testResult.reply}</p>
                </div>
                {testResult.risk === "高" ? (
                  <p className="flex items-start gap-1.5 text-xs text-destructive">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                    高风险命中：当前配置下不会自动发送，必须人工确认。
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>关闭</Button>
            <Button onClick={runTest} disabled={!testMessage.trim()}>
              <Play className="size-4" />
              运行测试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
