"use client"

import { Bot, Save } from "lucide-react"
import { useState } from "react"

import { knowledgeBases, knowledgeDocs, knowledgeGroups } from "@/data/mock/chat"
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
import { CardFooter } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Mode = "basic" | "professional"

type Employee = {
  id: string
  name: string
  persona: string
  status: "运行中" | "已暂停"
  mode: Mode
  prompt: string
  history: number
  autoReply: boolean
  selectedDocIds: string[]
  tools: string[]
}

const initialEmployees: Employee[] = [
  {
    id: "1",
    name: "售前助手",
    persona: "热情简洁，擅长商品和活动介绍",
    status: "运行中",
    mode: "basic",
    prompt: "你是电商售前客服，用简洁中文回答商品、价格和优惠问题。",
    history: 10,
    autoReply: true,
    selectedDocIds: ["d1", "d2"],
    tools: ["查询商品"],
  },
  {
    id: "2",
    name: "售后专员",
    persona: "耐心安抚，严格遵守售后规则",
    status: "运行中",
    mode: "professional",
    prompt: "你是售后客服，只回答退款、退货和物流问题，不承诺赔付。",
    history: 15,
    autoReply: true,
    selectedDocIds: ["d3", "d4"],
    tools: ["查询订单", "查询物流"],
  },
  {
    id: "3",
    name: "海外客服",
    persona: "正式礼貌，支持英西双语",
    status: "已暂停",
    mode: "professional",
    prompt: "Answer in the customer's language. Keep replies short and professional.",
    history: 12,
    autoReply: false,
    selectedDocIds: ["d7", "d8"],
    tools: ["自动翻译", "查询订单"],
  },
]

const toolOptions = ["查询商品", "查询订单", "查询物流", "自动翻译"]

export function EmployeeView() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [activeId, setActiveId] = useState(initialEmployees[0].id)
  const [notice, setNotice] = useState("")
  const active = employees.find((item) => item.id === activeId) ?? employees[0]

  function update(patch: Partial<Employee>) {
    setEmployees((current) =>
      current.map((item) => (item.id === active.id ? { ...item, ...patch } : item))
    )
  }

  function toggleList(field: "selectedDocIds" | "tools", value: string) {
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

  function save(published: boolean) {
    setNotice(published ? "配置已保存并发布" : "草稿已保存")
    window.setTimeout(() => setNotice(""), 1800)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3">
        <Button
          onClick={() => {
            const id = String(Date.now())
            setEmployees((current) => [
              ...current,
              { ...initialEmployees[0], id, name: "新 AI 客服员工", status: "已暂停" },
            ])
            setActiveId(id)
          }}
        >
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
                <p className="truncate text-sm font-semibold">{employee.name}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{employee.persona}</p>
              </div>
              <Badge variant={employee.status === "运行中" ? "secondary" : "ghost"}>
                {employee.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </aside>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{active.name}</CardTitle>
            <CardDescription className="max-w-3xl">
              AI 客服员工是独立配置对象。基础模式用于快速上线，专业模式用于接入知识库、工具和发布流程。
            </CardDescription>
          </div>
          <Tabs value={active.mode} onValueChange={(value) => update({ mode: value as Mode })}>
            <TabsList>
              <TabsTrigger value="basic">基础</TabsTrigger>
              <TabsTrigger value="professional">专业</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
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
                <FieldLabel htmlFor="employee-persona">人设</FieldLabel>
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
                <FieldLabel htmlFor="employee-history">上下文条数</FieldLabel>
                <Input
                  id="employee-history"
                  type="number"
                  value={active.history}
                  onChange={(event) => update({ history: Number(event.target.value) })}
                />
                <FieldDescription>保留最近的 1 到 50 条上下文。</FieldDescription>
              </Field>

              <div className="flex flex-col justify-end gap-4">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <FieldLabel htmlFor="auto-reply">自动回复</FieldLabel>
                  <Switch
                    id="auto-reply"
                    checked={active.autoReply}
                    onCheckedChange={(checked) => update({ autoReply: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <FieldLabel htmlFor="running-status">运行状态</FieldLabel>
                  <Switch
                    id="running-status"
                    checked={active.status === "运行中"}
                    onCheckedChange={(checked) => update({ status: checked ? "运行中" : "已暂停" })}
                  />
                </div>
              </div>
            </div>
          </FieldGroup>

          {active.mode === "professional" ? (
            <div className="grid gap-4 rounded-2xl bg-muted/50 p-4 xl:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold">知识库文档</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    可按产品分组整库选择，也可以只勾选具体文档。
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
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-primary/10 p-4 text-sm leading-6 text-primary">
              基础模式只保留最容易上手的配置。切到专业模式后，可以挂知识库、工具、测试用例和发布流程。
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-wrap justify-end gap-3">
          <span className="mr-auto text-xs text-primary">{notice}</span>
          <Button variant="outline" onClick={() => save(false)}>
            保存草稿
          </Button>
          <Button onClick={() => save(true)}>
            <Save className="size-4" />
            保存并发布
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
