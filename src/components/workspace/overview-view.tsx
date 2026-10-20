import { ArrowRight, Bot, CheckCircle2, Languages, MessageSquareText, NotebookPen } from "lucide-react"
import Link from "next/link"

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

const metrics = [
  { label: "AI 自动接待", value: "1,286", hint: "今日 · 占比 68%", icon: Bot },
  { label: "人工辅助采纳", value: "312", hint: "建议回复采纳率 74%", icon: MessageSquareText },
  { label: "自动翻译", value: "568", hint: "覆盖 9 个语种", icon: Languages },
  { label: "知识命中", value: "82%", hint: "近 7 天平均命中率", icon: NotebookPen },
]

const scenarios = [
  { href: "/employee", title: "配置 AI 客服", description: "设置人设、自动回复、知识范围和工具权限。", action: "去配置" },
  { href: "/knowledge", title: "维护知识库", description: "维护 FAQ、政策、规则和多语言答案。", action: "去维护" },
  { href: "/reminders", title: "处理基础提醒", description: "集中处理超时、失败和转人工提醒。", action: "查看提醒" },
]

const runningEmployees = [
  { name: "售前助手", value: "负责 4 个 WhatsApp 账号" },
  { name: "售后专员", value: "命中退款政策 38 次" },
  { name: "海外客服", value: "已暂停 · 等待审核" },
]

export function OverviewView() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-5">
          <div>
            <Badge>智能工作台</Badge>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.02em] lg:text-3xl">
              让人工更省力，让 AI 接得住重复问题
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              将 AI 客服、知识库、智能分配和人工协作放在同一套工作流中，帮助团队更快响应每一条客户消息。
            </p>
            <Button asChild className="mt-5">
              <Link href="/employee">
                配置 AI 客服
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl bg-sidebar p-4 text-sidebar-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60">
              当前运行
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {runningEmployees.map((item) => (
                <div key={item.name} className="rounded-xl bg-sidebar-accent p-4">
                  <div className="text-sm font-medium text-sidebar-accent-foreground">{item.name}</div>
                  <div className="mt-1 text-xs text-sidebar-foreground/70">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1 pt-0">
                <div className="text-3xl font-semibold tracking-[-0.03em]">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.hint}</div>
              </CardFooter>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {scenarios.map((item) => (
          <Card key={item.href}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                下一步
              </span>
            </CardHeader>
            <CardTitle className="px-4">{item.title}</CardTitle>
            <CardDescription className="min-h-12 px-4">{item.description}</CardDescription>
            <CardFooter>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href={item.href}>
                  {item.action}
                  <ArrowRight data-icon="inline-end" className="size-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}
