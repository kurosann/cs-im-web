import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  MessageSquareText,
  RadioTower,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

import { mockChannelHealth, mockConversations, overviewStats } from "@/data/mock/workspace"
import { cn } from "@/lib/utils"

const statToneClass = {
  blue: "bg-[#eff6ff] text-[#2563eb]",
  sky: "bg-[#ecfeff] text-[#0891b2]",
  green: "bg-[#f0fdf4] text-[#16a34a]",
  amber: "bg-[#fffbeb] text-[#d97706]",
} as const

const statusClass = {
  human: "bg-[#eff6ff] text-[#2563eb]",
  waiting: "bg-[#fff1f2] text-[#ef4444]",
  ai: "bg-[#ecfdf5] text-[#059669]",
  closed: "bg-[#f1f5f9] text-[#64748b]",
} as const

const statusLabel = {
  human: "人工处理中",
  waiting: "待人工",
  ai: "AI 已处理",
  closed: "已关闭",
} as const

export function Overview() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-[#64748b]">{stat.label}</p>
              <span className={cn("grid size-9 place-items-center rounded-xl", statToneClass[stat.tone])}>
                {stat.tone === "blue" ? (
                  <MessageSquareText className="size-4.5" />
                ) : stat.tone === "sky" ? (
                  <Bot className="size-4.5" />
                ) : stat.tone === "green" ? (
                  <UsersRound className="size-4.5" />
                ) : (
                  <CheckCircle2 className="size-4.5" />
                )}
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-[#0f172a]">{stat.value}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">{stat.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1f5] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#0f172a]">待处理会话</h2>
              <p className="mt-1 text-xs text-[#94a3b8]">优先关注高风险和长时间未响应的客户。</p>
            </div>
            <Link
              href="/conversations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
            >
              查看全部
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[#edf1f5]">
            {mockConversations.slice(0, 4).map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat?conversationId=${conversation.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#f8fafc]"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-sm font-semibold text-[#2563eb]">
                  {conversation.customerName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate text-sm font-semibold text-[#334155]">{conversation.customerName}</p>
                    <span className="text-[11px] text-[#94a3b8]">{conversation.channel}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#64748b]">{conversation.lastMessage}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-medium", statusClass[conversation.status])}>
                    {statusLabel[conversation.status]}
                  </span>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">{conversation.updatedAt}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[#c0cad4]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#0f172a]">渠道健康度</h2>
                <p className="mt-1 text-xs text-[#94a3b8]">最近 24 小时消息流转状态。</p>
              </div>
              <RadioTower className="size-5 text-[#64748b]" />
            </div>
            <div className="mt-5 space-y-4">
              {mockChannelHealth.map((channel) => (
                <div key={channel.name} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      channel.tone === "green" ? "bg-[#38b86b]" : "bg-[#f59e0b]"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#334155]">{channel.name}</p>
                    <p className="mt-0.5 text-xs text-[#94a3b8]">{channel.value}</p>
                  </div>
                  <span className={cn("text-xs font-medium", channel.tone === "green" ? "text-[#16a34a]" : "text-[#d97706]")}>
                    {channel.status}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/channels"
              className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] py-2.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
            >
              管理转发渠道
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#fed7aa] bg-[#fffaf3] p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ffedd5] text-[#ea580c]">
                <CircleAlert className="size-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#9a3412]">有 1 个渠道需要关注</h2>
                <p className="mt-1 text-xs leading-5 text-[#c2410c]">
                  WhatsApp 凭证最近出现失败投递，建议尽快检查配置。
                </p>
                <Link
                  href="/channels"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c2410c] hover:text-[#9a3412]"
                >
                  去处理
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <Clock3 className="size-4 text-[#94a3b8]" />
            <p className="text-xs text-[#64748b]">
              数据更新时间：<span className="font-medium text-[#334155]">刚刚</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
