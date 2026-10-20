"use client"

import {
  BellRing,
  Bot,
  Check,
  Clock3,
  Inbox,
  RotateCcw,
  Send,
  UserRoundCheck,
  WifiOff,
} from "lucide-react"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type ReminderLevel = "高" | "中" | "低"
type ReminderKind = "timeout" | "ai_failure" | "channel" | "delivery" | "presence"
type LevelFilter = "全部" | ReminderLevel

type Reminder = {
  id: string
  title: string
  detail: string
  level: ReminderLevel
  kind: ReminderKind
  time: string
  done: boolean
}

const initialReminders: Reminder[] = [
  { id: "1", title: "会话 12 分钟未响应", detail: "客户：李然 · WhatsApp · 意图：退款", level: "高", kind: "timeout", time: "刚刚", done: false },
  { id: "2", title: "AI 连续 2 次回答失败", detail: "员工：售后专员 · 已自动转人工", level: "中", kind: "ai_failure", time: "2 分钟前", done: false },
  { id: "3", title: "WhatsApp 凭证失效", detail: "业务渠道离线，3 个账号停止接待", level: "高", kind: "channel", time: "5 分钟前", done: false },
  { id: "4", title: "消息投递失败", detail: "Telegram · 第 2 次重试", level: "中", kind: "delivery", time: "8 分钟前", done: false },
  { id: "5", title: "客服切换为在线", detail: "Lucía 已开始值班", level: "低", kind: "presence", time: "12 分钟前", done: true },
]

const kindIcons: Record<ReminderKind, typeof BellRing> = {
  timeout: Clock3,
  ai_failure: Bot,
  channel: WifiOff,
  delivery: Send,
  presence: UserRoundCheck,
}

const levelStyles: Record<ReminderLevel, { icon: string; badge: "destructive" | "outline" | "secondary" }> = {
  高: { icon: "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/40", badge: "destructive" },
  中: { icon: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40", badge: "outline" },
  低: { icon: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-slate-800", badge: "secondary" },
}

const filters: LevelFilter[] = ["全部", "高", "中", "低"]

export function RemindersView() {
  const [reminders, setReminders] = useState(initialReminders)
  const [showDone, setShowDone] = useState(true)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("全部")
  const waiting = reminders.filter((item) => !item.done).length
  const highCount = reminders.filter((item) => !item.done && item.level === "高").length
  const mediumCount = reminders.filter((item) => !item.done && item.level === "中").length
  const lowCount = reminders.filter((item) => !item.done && item.level === "低").length

  const visibleReminders = reminders.filter((item) => {
    const levelMatches = levelFilter === "全部" || item.level === levelFilter
    return levelMatches && (showDone || !item.done)
  })

  function toggleDone(id: string) {
    setReminders((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, done: !entry.done } : entry))
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "高风险待处理", value: highCount, hint: "优先响应", tone: "text-rose-600" },
          { label: "中风险待处理", value: mediumCount, hint: "持续跟进", tone: "text-amber-600" },
          { label: "低风险待处理", value: lowCount, hint: "可稍后处理", tone: "text-slate-500" },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl">
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 pt-0">
              <p className={cn("text-2xl font-semibold", item.tone)}>{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="size-4" />
              待处理提醒
            </CardTitle>
            <CardDescription>当前还有 {waiting} 条提醒未完成。</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={levelFilter}
              onValueChange={(value) => value && setLevelFilter(value as LevelFilter)}
              size="sm"
            >
              {filters.map((filter) => (
                <ToggleGroupItem key={filter} value={filter} className="text-xs">
                  {filter}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={() => setShowDone((current) => !current)}>
              {showDone ? "隐藏已完成" : "显示已完成"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {visibleReminders.map((item) => {
            const Icon = kindIcons[item.kind]
            const style = levelStyles[item.level]

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30",
                  item.done && "opacity-55"
                )}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl ring-1", style.icon)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm font-semibold", item.done && "line-through")}>
                      {item.title}
                    </span>
                    <Badge variant={style.badge} className="text-[10px]">
                      {item.level}
                    </Badge>
                    {item.done ? (
                      <Badge variant="secondary" className="text-[10px]">
                        已完成
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <Button variant={item.done ? "ghost" : "outline"} size="sm" onClick={() => toggleDone(item.id)}>
                    {item.done ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
                    {item.done ? "恢复" : "完成"}
                  </Button>
                </div>
              </div>
            )
          })}

          {visibleReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-14 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" />
              </span>
              <p className="text-sm font-medium">当前筛选下没有提醒</p>
              <p className="text-xs text-muted-foreground">调整风险等级或显示已完成提醒后再查看。</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "超时提醒", value: "普通 10 分钟 / 高风险 3 分钟", detail: "无人响应时升级给团队负责人。" },
          { title: "失败提醒", value: "投递失败自动重试 3 次", detail: "仍失败后进入提醒中心。" },
          { title: "转人工提醒", value: "客户主动要求立即提醒", detail: "AI 低置信连续失败同样触发。" },
          { title: "提醒渠道", value: "站内 · 飞书 · Telegram", detail: "后续可扩展到企业微信和邮件。" },
        ].map((item) => (
          <Card key={item.title} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1">
              <p className="text-sm font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}
