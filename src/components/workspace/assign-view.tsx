"use client"

import { Plus } from "lucide-react"
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
import { Input } from "@/components/ui/input"

type Rule = {
  id: string
  name: string
  condition: string
  target: string
  priority: number
  enabled: boolean
}

const initialRules: Rule[] = [
  { id: "1", name: "高风险客户", condition: "客户等级 = 高", target: "售后二组 · 任意在线坐席", priority: 1, enabled: true },
  { id: "2", name: "西语客服", condition: "客户语言 = 西班牙语", target: "Lucía / Sofía", priority: 2, enabled: true },
  { id: "3", name: "退款问题", condition: "意图包含退款或退货", target: "售后专员组", priority: 3, enabled: true },
  { id: "4", name: "普通售前", condition: "默认兜底规则", target: "先给 AI 售前助手", priority: 4, enabled: false },
]

export function AssignView() {
  const [rules, setRules] = useState(initialRules)
  const [notice, setNotice] = useState("")

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
        priority: current.length + 1,
        enabled: false,
      },
    ])
    setNotice("已新增一条规则")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">分配规则</CardTitle>
            <CardDescription>按优先级从上到下匹配。命中的第一条规则决定会话先给谁。</CardDescription>
          </div>
          <Button onClick={addRule}>
            <Plus className="size-4" />
            新增规则
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {rules.map((rule, index) => (
            <div key={rule.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
                  {rule.priority}
                </span>
                <div className="min-w-0 flex-1">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rule.condition} → {rule.target}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={rule.enabled ? "secondary" : "ghost"}>
                    {rule.enabled ? "启用" : "停用"}
                  </Badge>
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
          ))}
        </CardContent>

        <CardFooter>
          <p className="text-xs text-primary">{notice}</p>
        </CardFooter>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "负载均衡", value: "单坐席上限 18 会话", detail: "超出后进入候补队列。" },
          { title: "工作时间", value: "09:00 - 22:00", detail: "非工作时间优先 AI，高风险转值班。" },
          { title: "转人工保护", value: "连续 2 次低置信", detail: "自动转人工，并记录原因。" },
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
    </div>
  )
}
