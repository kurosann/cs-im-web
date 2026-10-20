"use client"

import { ArrowDownUp, Bot, Pencil, Plus, UserRound, UsersRound } from "lucide-react"
import { useState } from "react"

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type TargetType = "ai" | "team" | "human"

type Rule = {
  id: string
  name: string
  condition: string
  target: string
  targetType: TargetType
  priority: number
  enabled: boolean
}

type ServiceProvider = {
  id: string
  name: string
  type: TargetType
  online: boolean
  languages: string[]
  skills: string[]
  load: number
  capacity: number
}

const initialRules: Rule[] = [
  { id: "1", name: "高风险客户优先人工", condition: "风险等级 = 高 或 客户等级 = 黑卡", target: "售后二组 · 陈晓", targetType: "human", priority: 1, enabled: true },
  { id: "2", name: "西语客户分配", condition: "客户语言 = Español", target: "Lucía / Sofía（支持自动翻译兜底）", targetType: "human", priority: 2, enabled: true },
  { id: "3", name: "退款问题分配", condition: "意图包含退款或退货", target: "售后专员组", targetType: "team", priority: 3, enabled: true },
  { id: "4", name: "普通售前", condition: "默认兜底规则", target: "AI 客服员工 · 售前助手", targetType: "ai", priority: 4, enabled: false },
]

const providers: ServiceProvider[] = [
  { id: "p1", name: "售前助手", type: "ai", online: true, languages: ["中文", "English"], skills: ["商品", "活动", "库存"], load: 14, capacity: 30 },
  { id: "p2", name: "售后专员", type: "ai", online: true, languages: ["中文", "English"], skills: ["退款", "退货", "物流"], load: 9, capacity: 20 },
  { id: "p3", name: "陈晓", type: "human", online: true, languages: ["中文", "English"], skills: ["账号安全", "投诉升级"], load: 7, capacity: 10 },
  { id: "p4", name: "Lucía", type: "human", online: true, languages: ["Español", "English"], skills: ["退款", "海外售后"], load: 5, capacity: 10 },
  { id: "p5", name: "售后二组", type: "team", online: true, languages: ["中文", "English"], skills: ["退款", "投诉"], load: 18, capacity: 32 },
  { id: "p6", name: "夜班值守", type: "team", online: false, languages: ["中文"], skills: ["常见问题"], load: 0, capacity: 8 },
]

const typeLabels: Record<TargetType, string> = { ai: "AI 员工", team: "坐席组", human: "人工坐席" }
const typeIcons = { ai: Bot, team: UsersRound, human: UserRound }
const typeVariants: Record<TargetType, "secondary" | "outline" | "ghost"> = { ai: "secondary", team: "outline", human: "ghost" }

export function AssignView() {
  const [rules, setRules] = useState(initialRules)
  const [notice, setNotice] = useState("")
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  function move(id: string, direction: -1 | 1) {
    setRules((current) => {
      const index = current.findIndex((item) => item.id === id)
      const next = index + direction
      if (index < 0 || next < 0 || next >= current.length) return current
      const cloned = [...current]
      ;[cloned[index], cloned[next]] = [cloned[next], cloned[index]]

      return cloned.map((item, itemIndex) => ({ ...item, priority: itemIndex + 1 }))
    })
  }

  function addRule() {
    const id = String(Date.now())
    setRules((current) => [
      ...current,
      {
        id,
        name: "新分配规则",
        condition: "请设置匹配条件",
        target: "请选择处理对象",
        targetType: "team",
        priority: current.length + 1,
        enabled: false,
      },
    ])
    setNotice("已新增一条规则")
    window.setTimeout(() => setNotice(""), 1800)
  }

  function saveRule() {
    if (!editingRule?.name.trim() || !editingRule.condition.trim() || !editingRule.target.trim()) return
    setRules((current) =>
      current.map((item) => (item.id === editingRule.id ? editingRule : item))
    )
    setEditingRule(null)
    setNotice("分配规则已保存")
    window.setTimeout(() => setNotice(""), 1800)
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "在线人工坐席", value: "6", hint: "2 人支持西班牙语" },
          { label: "运行中 AI 员工", value: "2", hint: "1 个暂停待审核" },
          { label: "待分配会话", value: "12", hint: "3 条高风险" },
          { label: "平均分配耗时", value: "1.4s", hint: "规则 + 负载计算" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 pt-0">
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">分配规则</CardTitle>
            <CardDescription>按优先级从上到下匹配。AI 员工、人工坐席和坐席组共用同一套路由规则。</CardDescription>
          </div>
          <Button onClick={addRule}>
            <Plus className="size-4" />
            新增规则
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {rules.map((rule, index) => {
            const Icon = typeIcons[rule.targetType]

            return (
              <div key={rule.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
                    {rule.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={rule.name}
                        onChange={(event) =>
                          setRules((current) =>
                            current.map((item) =>
                              item.id === rule.id ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="max-w-sm border-0 bg-transparent px-0 font-semibold focus-visible:ring-0"
                      />
                      <Badge variant={typeVariants[rule.targetType]}>
                        <Icon className="size-3" />
                        {typeLabels[rule.targetType]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rule.condition} → {rule.target}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={rule.enabled ? "secondary" : "ghost"}>
                      {rule.enabled ? "启用" : "停用"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditingRule({ ...rule })}>
                      <Pencil className="size-3.5" />
                      编辑
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => move(rule.id, -1)} disabled={index === 0}>
                      上移
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => move(rule.id, 1)}
                      disabled={index === rules.length - 1}
                    >
                      下移
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRules((current) =>
                          current.map((item) =>
                            item.id === rule.id ? { ...item, enabled: !item.enabled } : item
                          )
                        )
                      }
                    >
                      {rule.enabled ? "停用" : "启用"}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>

        <CardFooter>
          <p className="text-xs text-primary">{notice}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowDownUp className="size-4" />
            服务者池
          </CardTitle>
          <CardDescription>分配时综合在线状态、语言、技能和当前负载。超出上限进入候补队列。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {providers.map((provider) => {
            const Icon = typeIcons[provider.type]
            const loadPercent = Math.round((provider.load / provider.capacity) * 100)

            return (
              <div key={provider.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{provider.name}</p>
                    <Badge variant={typeVariants[provider.type]}>{typeLabels[provider.type]}</Badge>
                    <Badge variant={provider.online ? "secondary" : "ghost"}>{provider.online ? "在线" : "离线"}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>语言：{provider.languages.join(" / ")}</span>
                    <span>·</span>
                    <span>技能：{provider.skills.join(" / ")}</span>
                  </div>
                </div>
                <div className="min-w-32">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>负载</span>
                    <span>{provider.load}/{provider.capacity}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={loadPercent >= 80 ? "h-full bg-destructive" : "h-full bg-primary"}
                      style={{ width: `${Math.min(loadPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "负载均衡", value: "单坐席上限 10 会话", detail: "超出后进入候补队列，高风险会话优先。" },
          { title: "工作时间", value: "09:00 - 22:00", detail: "非工作时间优先 AI，高风险转值班。" },
          { title: "转人工保护", value: "连续 2 次低置信", detail: "自动转人工，并附带摘要和命中知识。" },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1">
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Dialog open={Boolean(editingRule)} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>编辑分配规则</DialogTitle>
            <DialogDescription>调整匹配条件、分配对象和启用状态。优先级通过上移/下移调整。</DialogDescription>
          </DialogHeader>
          {editingRule ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rule-name">规则名称</FieldLabel>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(event) => setEditingRule({ ...editingRule, name: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-condition">匹配条件</FieldLabel>
                <Textarea
                  id="rule-condition"
                  value={editingRule.condition}
                  onChange={(event) => setEditingRule({ ...editingRule, condition: event.target.value })}
                  placeholder="例如：风险等级 = 高 或 客户等级 = 黑卡"
                  className="min-h-20"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-target">分配对象</FieldLabel>
                <Input
                  id="rule-target"
                  value={editingRule.target}
                  onChange={(event) => setEditingRule({ ...editingRule, target: event.target.value })}
                  placeholder="例如：售后二组 · 陈晓"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>对象类型</FieldLabel>
                  <Select
                    value={editingRule.targetType}
                    onValueChange={(value) =>
                      setEditingRule({ ...editingRule, targetType: value as TargetType })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex items-end justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="text-sm font-medium">启用规则</p>
                    <p className="mt-1 text-xs text-muted-foreground">停用后跳过此条规则。</p>
                  </div>
                  <Switch
                    checked={editingRule.enabled}
                    onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                    aria-label="启用规则"
                  />
                </div>
              </div>
            </FieldGroup>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>取消</Button>
            <Button onClick={saveRule} disabled={!editingRule?.name.trim() || !editingRule.condition.trim() || !editingRule.target.trim()}>
              保存规则
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
