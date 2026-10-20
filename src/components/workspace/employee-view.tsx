"use client"

import {
  Bot,
  Check,
  CircleAlert,
  Copy,
  FlaskConical,
  History,
  Pause,
  Play,
  Save,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react"
import { useState } from "react"

import { knowledgeBases, knowledgeDocs, knowledgeGroups } from "@/data/mock/chat"
import { cn } from "@/lib/utils"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Mode = "basic" | "professional"
type EmployeeStatus = "未配置" | "已暂停" | "运行中"
type ReplyMode = "suggest" | "semi_auto" | "full_auto"

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
  replyMode: ReplyMode
  accountScope: "all" | "selected"
  accounts: string[]
  businessScope: string
  isDefault: boolean
  confidenceThreshold: number
  maxAutoTurns: number
  safetyRules: string
  selectedDocIds: string[]
  tools: string[]
  version: string
  updatedAt: string
}

const accountOptions = [
  { id: "WhatsApp · 售前 01", status: "在线", owner: "售前助手" },
  { id: "WhatsApp · 售后 02", status: "在线", owner: "售后专员" },
  { id: "WhatsApp · Global", status: "离线", owner: "未占用" },
  { id: "Telegram · 售后 Bot", status: "在线", owner: "售后专员" },
  { id: "Web Chat · 官网", status: "在线", owner: "售前助手" },
  { id: "Messenger · 品牌主页", status: "在线", owner: "未占用" },
]

const toolOptions = ["查询商品", "查询订单", "查询物流", "查询会员权益", "自动翻译", "创建提醒"]

const replyModeLabels: Record<ReplyMode, string> = {
  suggest: "仅建议",
  semi_auto: "半自动",
  full_auto: "全自动",
}

const statusVariant: Record<EmployeeStatus, "secondary" | "outline" | "ghost"> = {
  运行中: "secondary",
  已暂停: "outline",
  未配置: "ghost",
}

const initialEmployees: Employee[] = [
  {
    id: "1",
    name: "售前助手",
    persona: "热情简洁，擅长商品和活动介绍",
    status: "运行中",
    mode: "basic",
    prompt: "你是电商售前客服，用简洁中文回答商品、价格和优惠问题。不承诺库存和具体到货时间。",
    history: 10,
    autoReply: true,
    reporting: true,
    replyMode: "semi_auto",
    accountScope: "all",
    accounts: ["WhatsApp · 售前 01", "Web Chat · 官网"],
    businessScope: "售前咨询 / 商品活动",
    isDefault: true,
    confidenceThreshold: 0.78,
    maxAutoTurns: 5,
    safetyRules: "禁止承诺赔付；禁止承诺具体到货时间；不透露内部系统信息。",
    selectedDocIds: ["d1", "d2"],
    tools: ["查询商品"],
    version: "v1.4",
    updatedAt: "今天 10:20",
  },
  {
    id: "2",
    name: "售后专员",
    persona: "耐心安抚，严格遵守售后规则",
    status: "运行中",
    mode: "professional",
    prompt: "你是售后客服，只回答退款、退货和物流问题。涉及大额退款、投诉升级时立即转人工。",
    history: 15,
    autoReply: true,
    reporting: true,
    replyMode: "suggest",
    accountScope: "selected",
    accounts: ["WhatsApp · 售后 02", "Telegram · 售后 Bot"],
    businessScope: "退款 / 退货 / 物流",
    isDefault: false,
    confidenceThreshold: 0.82,
    maxAutoTurns: 3,
    safetyRules: "高风险会话禁止自动回复；禁止承诺赔付；转人工时附带摘要、命中知识和风险等级。",
    selectedDocIds: ["d3", "d4"],
    tools: ["查询订单", "查询物流"],
    version: "v2.1",
    updatedAt: "今天 09:48",
  },
  {
    id: "3",
    name: "海外客服",
    persona: "正式礼貌，支持英西双语",
    status: "已暂停",
    mode: "professional",
    prompt: "Answer in the customer's language. Keep replies short and professional. Escalate account security issues.",
    history: 12,
    autoReply: false,
    reporting: true,
    replyMode: "full_auto",
    accountScope: "selected",
    accounts: ["WhatsApp · Global"],
    businessScope: "海外售后 / English / Español",
    isDefault: false,
    confidenceThreshold: 0.8,
    maxAutoTurns: 4,
    safetyRules: "账号安全、支付异常、法律风险必须转人工；翻译失败时不自动发送。",
    selectedDocIds: ["d7", "d8"],
    tools: ["自动翻译", "查询订单"],
    version: "v1.0",
    updatedAt: "昨天 18:12",
  },
]

const executionLogs = [
  { id: "e1", employee: "售后专员", status: "已回复", message: "How long will my refund take?", reply: "退款正在财务复核，预计 1-2 个工作日到账。", tokens: 428, time: "12:34" },
  { id: "e2", employee: "售后专员", status: "已转人工", message: "Llevo esperando casi una semana.", reply: "高风险催办，转人工并附带摘要。", tokens: 512, time: "12:35" },
  { id: "e3", employee: "售前助手", status: "已建议", message: "有优惠券吗？", reply: "限时折扣与优惠券可叠加。", tokens: 286, time: "11:58" },
  { id: "e4", employee: "海外客服", status: "已暂停", message: "My account is locked.", reply: "账号安全风险，未自动回复。", tokens: 0, time: "11:50" },
]

export function EmployeeView() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [activeId, setActiveId] = useState(initialEmployees[0].id)
  const [notice, setNotice] = useState("")
  const [testOpen, setTestOpen] = useState(false)
  const [testMessage, setTestMessage] = useState("我的退款什么时候到账？")
  const [testResult, setTestResult] = useState<{ reply: string; knowledge: string; risk: string } | null>(null)
  const active = employees.find((item) => item.id === activeId) ?? employees[0]

  function update(patch: Partial<Employee>) {
    setEmployees((current) =>
      current.map((item) => (item.id === active.id ? { ...item, ...patch } : item))
    )
  }

  function toggleList(field: "selectedDocIds" | "tools" | "accounts", value: string) {
    const selected = active[field]
    update({
      [field]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    } as Partial<Employee>)
  }

  function toggleBase(baseId: string) {
    const docIds = knowledgeDocs.filter((doc) => doc.baseId === baseId).map((doc) => doc.id)
    const allSelected = docIds.every((id) => active.selectedDocIds.includes(id))
    update({
      selectedDocIds: allSelected
        ? active.selectedDocIds.filter((id) => !docIds.includes(id))
        : Array.from(new Set([...active.selectedDocIds, ...docIds])),
    })
  }

  function notify(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(""), 1800)
  }

  function save(published: boolean) {
    update({
      status: published ? "运行中" : active.status,
      updatedAt: published ? "刚刚" : active.updatedAt,
    })
    notify(published ? "配置已保存并发布" : "草稿已保存")
  }

  function createEmployee() {
    const id = String(Date.now())
    const created: Employee = {
      ...initialEmployees[0],
      id,
      name: "新 AI 客服员工",
      status: "未配置",
      isDefault: false,
      version: "v0.1",
      updatedAt: "刚刚",
    }
    setEmployees((current) => [...current, created])
    setActiveId(id)
    notify("已创建草稿配置")
  }

  function duplicateEmployee() {
    const id = String(Date.now())
    const copy: Employee = {
      ...active,
      id,
      name: `${active.name} 副本`,
      status: "已暂停",
      isDefault: false,
      version: "v0.1",
      updatedAt: "刚刚",
    }
    setEmployees((current) => [...current, copy])
    setActiveId(id)
    notify("已复制配置")
  }

  function deleteEmployee() {
    if (employees.length <= 1) {
      notify("至少保留一个 AI 客服员工")
      return
    }
    const remaining = employees.filter((item) => item.id !== active.id)
    setEmployees(remaining)
    setActiveId(remaining[0].id)
    notify("已删除配置")
  }

  function setDefault() {
    setEmployees((current) =>
      current.map((item) => ({
        ...item,
        isDefault: item.id === active.id,
      }))
    )
    notify("已设为默认 AI 客服员工")
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

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3">
        <Button onClick={createEmployee}>
          <Bot className="size-4" />
          创建 AI 客服员工
        </Button>

        {employees.map((employee) => (
          <Card
            key={employee.id}
            className={cn(
              "cursor-pointer transition",
              employee.id === active.id ? "border-primary" : "hover:border-muted-foreground"
            )}
            onClick={() => setActiveId(employee.id)}
          >
            <CardContent className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{employee.name}</p>
                  {employee.isDefault ? <Star className="size-3.5 fill-current text-amber-500" /> : null}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{employee.persona}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {replyModeLabels[employee.replyMode]} · {employee.accounts.length} 个账号 · {employee.version}
                </p>
              </div>
              <Badge variant={statusVariant[employee.status]}>{employee.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </aside>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl">{active.name}</CardTitle>
                  <Badge variant={statusVariant[active.status]}>{active.status}</Badge>
                  {active.isDefault ? <Badge variant="secondary">默认员工</Badge> : null}
                  <Badge variant="outline">{active.version}</Badge>
                </div>
                <CardDescription className="mt-2 max-w-3xl">
                  AI 客服员工是独立可分配对象。基础模式用于快速上线，专业模式开放知识库、工具、安全策略和发布流程。
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={active.status}
                  onValueChange={(value) => update({ status: value as EmployeeStatus })}
                >
                  <SelectTrigger size="sm" aria-label="运行状态">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未配置">未配置</SelectItem>
                    <SelectItem value="已暂停">已暂停</SelectItem>
                    <SelectItem value="运行中">运行中</SelectItem>
                  </SelectContent>
                </Select>
                <Tabs value={active.mode} onValueChange={(value) => update({ mode: value as Mode })}>
                  <TabsList>
                    <TabsTrigger value="basic">基础</TabsTrigger>
                    <TabsTrigger value="professional">专业</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={setDefault} disabled={active.isDefault}>
                <Star className="size-3.5" />
                设为默认
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>
                <FlaskConical className="size-3.5" />
                测试会话
              </Button>
              <Button variant="outline" size="sm" onClick={duplicateEmployee}>
                <Copy className="size-3.5" />
                复制配置
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => update({ status: active.status === "运行中" ? "已暂停" : "运行中" })}
              >
                {active.status === "运行中" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {active.status === "运行中" ? "暂停" : "启动"}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteEmployee}>
                <Trash2 className="size-3.5" />
                删除
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">最近更新：{active.updatedAt}</span>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
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

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="employee-business">负责业务</FieldLabel>
                  <Input
                    id="employee-business"
                    value={active.businessScope}
                    onChange={(event) => update({ businessScope: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="employee-history">历史消息读取条数</FieldLabel>
                  <Input
                    id="employee-history"
                    type="number"
                    min={1}
                    max={50}
                    value={active.history}
                    onChange={(event) => update({ history: Number(event.target.value) })}
                  />
                  <FieldDescription>保留最近 1 到 50 条上下文。</FieldDescription>
                </Field>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">账号绑定</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      可以绑定全部账号，也可以只绑定指定平台账号。被占用的账号会显示当前 AI 员工。
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={active.accountScope}
                    onValueChange={(value) => value && update({ accountScope: value as "all" | "selected" })}
                    size="sm"
                  >
                    <ToggleGroupItem value="all">全部账号</ToggleGroupItem>
                    <ToggleGroupItem value="selected">指定账号</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {active.accountScope === "selected" ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {accountOptions.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => toggleList("accounts", account.id)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left text-xs transition",
                          active.accounts.includes(account.id)
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full", account.status === "在线" ? "bg-emerald-500" : "bg-slate-300")} />
                            <span className="truncate">{account.id}</span>
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {account.status} · {account.owner}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {active.accounts.includes(account.id) ? "已绑定" : "可绑定"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    当前绑定全部账号。新接入账号会自动进入该 AI 员工的接待范围。
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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

                <div className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">回复模式</p>
                  <p className="mt-1 text-xs text-muted-foreground">仅建议 / 半自动 / 全自动。</p>
                  <ToggleGroup
                    type="single"
                    value={active.replyMode}
                    onValueChange={(value) => value && update({ replyMode: value as ReplyMode })}
                    size="sm"
                    className="mt-2"
                  >
                    {Object.entries(replyModeLabels).map(([value, label]) => (
                      <ToggleGroupItem key={value} value={value} className="flex-1 text-[11px]">
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </FieldGroup>

            {active.mode === "professional" ? (
              <div className="grid gap-4 rounded-2xl bg-muted/50 p-4 xl:grid-cols-[1.35fr_1fr]">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold">知识库文档</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      可按产品分组整库选择，也可以只勾选具体文档。知识库只对本 AI 员工生效。
                    </p>
                  </div>

                  {knowledgeGroups.map((group) => {
                    const bases = knowledgeBases.filter((base) => base.groupId === group.id)

                    return (
                      <div key={group.id} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {group.name}
                        </p>
                        <div className="mt-3 flex flex-col gap-3">
                          {bases.map((base) => {
                            const docs = knowledgeDocs.filter((doc) => doc.baseId === base.id)
                            const selectedCount = docs.filter((doc) => active.selectedDocIds.includes(doc.id)).length
                            const allSelected = docs.length > 0 && selectedCount === docs.length

                            return (
                              <div key={base.id} className="rounded-xl bg-muted/60 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium">{base.name}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {base.product} · 已选 {selectedCount}/{docs.length}
                                    </p>
                                  </div>
                                  <Button variant={allSelected ? "default" : "outline"} size="xs" onClick={() => toggleBase(base.id)}>
                                    {allSelected ? "取消整库" : "选择整库"}
                                  </Button>
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {docs.map((doc) => (
                                    <button
                                      type="button"
                                      key={doc.id}
                                      onClick={() => toggleList("selectedDocIds", doc.id)}
                                      className={cn(
                                        "rounded-lg border p-2 text-left text-xs",
                                        active.selectedDocIds.includes(doc.id)
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-card text-muted-foreground"
                                      )}
                                    >
                                      <span className="block truncate font-medium">{doc.title}</span>
                                      <span
                                        className={cn(
                                          "mt-0.5 block",
                                          active.selectedDocIds.includes(doc.id)
                                            ? "text-primary-foreground/70"
                                            : "text-muted-foreground"
                                        )}
                                      >
                                        {doc.language} · {doc.status}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold">工具调用</p>
                    <ToggleGroup
                      type="multiple"
                      value={active.tools}
                      onValueChange={(value) => update({ tools: value })}
                      variant="outline"
                      className="mt-3 flex-wrap"
                    >
                      {toolOptions.map((item) => (
                        <ToggleGroupItem key={item} value={item} className="text-xs">
                          {item}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="confidence-threshold">知识库置信度阈值</FieldLabel>
                      <Input
                        id="confidence-threshold"
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={active.confidenceThreshold}
                        onChange={(event) => update({ confidenceThreshold: Number(event.target.value) })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="max-auto-turns">最大自动回复轮数</FieldLabel>
                      <Input
                        id="max-auto-turns"
                        type="number"
                        min={1}
                        max={20}
                        value={active.maxAutoTurns}
                        onChange={(event) => update({ maxAutoTurns: Number(event.target.value) })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="safety-rules">安全策略</FieldLabel>
                    <Textarea
                      id="safety-rules"
                      value={active.safetyRules}
                      onChange={(event) => update({ safetyRules: event.target.value })}
                      className="min-h-24 text-xs leading-5"
                    />
                  </Field>

                  <div className="rounded-xl border p-3">
                    <p className="text-sm font-semibold">决策策略预览</p>
                    <div className="mt-2 grid gap-2 text-xs">
                      {[
                        ["普通退款咨询", "reply"],
                        ["会员权益问题", "suggest"],
                        ["客户情绪愤怒", "escalate"],
                        ["查询物流", "tool_call"],
                        ["账号安全", "escalate"],
                      ].map(([scene, strategy]) => (
                        <div key={scene} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-1.5">
                          <span className="text-muted-foreground">{scene}</span>
                          <Badge variant={strategy === "escalate" ? "destructive" : "outline"} className="text-[10px]">
                            {strategy}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="size-3.5" />
                      专业模式风险提示
                    </p>
                    <p className="mt-1">调整置信度、最大轮数和工具权限后，建议先运行测试会话再灰度发布。</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-primary/10 p-4 text-sm leading-6 text-primary">
                基础模式只保留名称、账号、提示词、上下文、自动回复和转人工规则。切到专业模式后，可以挂知识库、工具、安全策略和测试用例。
              </div>
            )}

            <div className="rounded-2xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <History className="size-4" />
                    最近执行记录
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">包含回复、转人工、忽略和失败记录。</p>
                </div>
                <Badge variant="outline">最近 24 小时</Badge>
              </div>
              <div className="divide-y">
                {executionLogs.map((log) => (
                  <div key={log.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[100px_1fr_1fr_70px]">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === "已转人工" ? "destructive" : log.status === "已暂停" ? "outline" : "secondary"} className="text-[10px]">
                        {log.status}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-muted-foreground">{log.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{log.employee}</p>
                    </div>
                    <p className="line-clamp-2 text-muted-foreground">{log.reply}</p>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground sm:justify-end">
                      <span>{log.tokens} tokens</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-wrap items-center justify-end gap-3">
            <span className="mr-auto flex items-center gap-1.5 text-xs text-primary">
              {notice ? <Check className="size-3.5" /> : null}
              {notice}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Settings2 className="size-3.5" />
              草稿与发布共用同一份配置
            </span>
            <Button variant="outline" onClick={() => save(false)}>
              保存草稿
            </Button>
            <Button onClick={() => save(true)}>
              <Save className="size-4" />
              保存并发布
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleAlert className="size-4" />
              配置检查
            </CardTitle>
            <CardDescription>发布前确认以下边界，避免 AI 在高风险场景越权回复。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              { title: "高风险转人工", value: active.reporting ? "已开启" : "未开启", ok: active.reporting },
              { title: "知识库置信度", value: active.confidenceThreshold >= 0.78 ? "合理" : "偏低", ok: active.confidenceThreshold >= 0.78 },
              { title: "自动回复边界", value: active.replyMode === "full_auto" ? "需重点测试" : "人工可控", ok: active.replyMode !== "full_auto" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">{item.title}</p>
                <p className={cn("mt-2 text-sm font-semibold", item.ok ? "text-emerald-600" : "text-amber-600")}>
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
