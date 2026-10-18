"use client"

import { BellRing, Check } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

type Reminder = { id: string; title: string; detail: string; level: "高" | "中" | "低"; time: string; done: boolean }

const initialReminders: Reminder[] = [
  { id: "1", title: "会话 12 分钟未响应", detail: "客户：李然 · WhatsApp · 意图：退款", level: "高", time: "刚刚", done: false },
  { id: "2", title: "AI 连续 2 次回答失败", detail: "员工：售后专员 · 已自动转人工", level: "中", time: "2 分钟前", done: false },
  { id: "3", title: "WhatsApp 凭证失效", detail: "业务渠道离线，3 个账号停止接待", level: "高", time: "5 分钟前", done: false },
  { id: "4", title: "消息投递失败", detail: "Telegram · 第 2 次重试", level: "中", time: "8 分钟前", done: false },
  { id: "5", title: "客服切换为在线", detail: "Lucía 已开始值班", level: "低", time: "12 分钟前", done: true },
]

const levelClass = { 高: "bg-[#fff1f2] text-[#dc2626] border-[#fecdd3]", 中: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]", 低: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]" }

export function V2Reminders() {
  const [reminders, setReminders] = useState(initialReminders)
  const [showDone, setShowDone] = useState(true)
  const waiting = reminders.filter((item) => !item.done).length
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf1f5] p-6">
          <div><h2 className="text-lg font-semibold text-[#0f172a]">待处理提醒</h2><p className="mt-2 text-sm text-[#64748b]">当前还有 {waiting} 条提醒未完成。</p></div>
          <button type="button" onClick={() => setShowDone((current) => !current)} className="h-9 rounded-lg border border-[#e2e8f0] px-3 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]">{showDone ? "隐藏已完成" : "显示已完成"}</button>
        </div>
        <div className="space-y-3 p-6">
          {reminders.filter((item) => showDone || !item.done).map((item) => <div key={item.id} className={cn("flex flex-wrap items-center gap-4 rounded-2xl border p-4", item.done ? "border-[#edf1f5] opacity-60" : "border-[#e2e8f0] hover:border-[#94a3b8]")}><div className={cn("grid size-11 place-items-center rounded-xl border", levelClass[item.level])}><BellRing className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={cn("text-sm font-semibold text-[#0f172a]", item.done && "line-through")}>{item.title}</span><span className={cn("rounded-full border px-2 py-1 text-[11px]", levelClass[item.level])}>{item.level}</span></div><p className="mt-1 text-xs text-[#64748b]">{item.detail}</p></div><div className="flex items-center gap-3"><span className="text-xs text-[#94a3b8]">{item.time}</span><button type="button" onClick={() => setReminders((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-2.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"><Check className="size-3.5" />{item.done ? "恢复" : "完成"}</button></div></div>)}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">{[{ title: "超时提醒", value: "普通 10 分钟 / 高风险 3 分钟" }, { title: "失败提醒", value: "投递失败自动重试 3 次" }, { title: "转人工提醒", value: "客户主动要求立即提醒" }].map((item) => <div key={item.title} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"><p className="text-sm font-semibold text-[#0f172a]">{item.title}</p><p className="mt-4 text-sm text-[#64748b]">{item.value}</p></div>)}</section>
    </div>
  )
}
