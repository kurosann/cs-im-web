"use client"

import { BellRing, Check } from "lucide-react"
import { useState } from "react"

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

type Reminder = {
  id: string
  title: string
  detail: string
  level: "高" | "中" | "低"
  time: string
  done: boolean
}

const initialReminders: Reminder[] = [
  { id: "1", title: "会话 12 分钟未响应", detail: "客户：李然 · WhatsApp · 意图：退款", level: "高", time: "刚刚", done: false },
  { id: "2", title: "AI 连续 2 次回答失败", detail: "员工：售后专员 · 已自动转人工", level: "中", time: "2 分钟前", done: false },
  { id: "3", title: "WhatsApp 凭证失效", detail: "业务渠道离线，3 个账号停止接待", level: "高", time: "5 分钟前", done: false },
  { id: "4", title: "消息投递失败", detail: "Telegram · 第 2 次重试", level: "中", time: "8 分钟前", done: false },
  { id: "5", title: "客服切换为在线", detail: "Lucía 已开始值班", level: "低", time: "12 分钟前", done: true },
]

const levelVariant = { 高: "destructive", 中: "outline", 低: "secondary" } as const

export function RemindersView() {
  const [reminders, setReminders] = useState(initialReminders)
  const [showDone, setShowDone] = useState(true)
  const waiting = reminders.filter((item) => !item.done).length

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">待处理提醒</CardTitle>
            <CardDescription>当前还有 {waiting} 条提醒未完成。</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowDone((current) => !current)}>
            {showDone ? "隐藏已完成" : "显示已完成"}
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {reminders
            .filter((item) => showDone || !item.done)
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4",
                  item.done && "opacity-60"
                )}
              >
                <span className="grid size-11 place-items-center rounded-xl border border-border bg-primary/10 text-primary">
                  <BellRing className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm font-semibold", item.done && "line-through")}>
                      {item.title}
                    </span>
                    <Badge variant={levelVariant[item.level]}>{item.level}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setReminders((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, done: !entry.done } : entry
                        )
                      )
                    }
                  >
                    <Check className="size-3.5" />
                    {item.done ? "恢复" : "完成"}
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "超时提醒", value: "普通 10 分钟 / 高风险 3 分钟" },
          { title: "失败提醒", value: "投递失败自动重试 3 次" },
          { title: "转人工提醒", value: "客户主动要求立即提醒" },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
            <CardFooter>
              <p className="text-sm text-muted-foreground">{item.value}</p>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}
