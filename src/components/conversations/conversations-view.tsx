"use client"

import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { mockConversations } from "@/data/mock/workspace"
import type { ConversationStatus } from "@/models/conversation"
import { cn } from "@/lib/utils"

const filters: Array<{ value: "all" | ConversationStatus; label: string }> = [
  { value: "all", label: "全部" },
  { value: "waiting", label: "待人工" },
  { value: "ai", label: "AI 已处理" },
  { value: "human", label: "人工处理中" },
  { value: "closed", label: "已关闭" },
]

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

export function ConversationsView() {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all")
  const [query, setQuery] = useState("")

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mockConversations.filter((conversation) => {
      const matchesFilter = filter === "all" || conversation.status === filter
      const matchesQuery =
        !normalizedQuery ||
        [conversation.customerName, conversation.customerId, conversation.channel, conversation.lastMessage]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [filter, query])

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748b]">
            共 <span className="font-semibold text-[#2563eb]">{mockConversations.length}</span> 条会话
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.16)] transition hover:bg-[#1d4ed8]"
        >
          <MessageCircle className="size-4" />
          打开聊天室
        </Link>
      </section>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 border-b border-[#edf1f5] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-[#64748b]" />
              <span className="text-sm font-semibold text-[#334155]">筛选会话</span>
            </div>
            <span className="text-xs text-[#94a3b8]">状态已更新</span>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
                    filter === item.value
                      ? "bg-[#eaf2ff] text-[#1d4ed8]"
                      : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
                  )}
                >
                  {filter === item.value ? <Check className="size-3.5" /> : null}
                  {item.label}
                </button>
              ))}
            </div>
            <label className="relative block w-full lg:max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索客户、渠道或消息"
                className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#fbfcfe] pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a4b0bd] focus:border-[#7fa8ff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
              />
            </label>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
              <tr>
                <th className="px-5 py-3.5">客户</th>
                <th className="px-5 py-3.5">渠道</th>
                <th className="px-5 py-3.5">最近消息</th>
                <th className="px-5 py-3.5">状态</th>
                <th className="px-5 py-3.5">负责人</th>
                <th className="px-5 py-3.5">更新时间</th>
                <th className="px-5 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f5] text-sm">
              {filteredConversations.map((conversation) => (
                <tr key={conversation.id} className="group transition hover:bg-[#fbfdff]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-xs font-semibold text-[#2563eb]">
                        {conversation.customerName.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#334155]">{conversation.customerName}</p>
                        <p className="mt-0.5 text-[11px] text-[#94a3b8]">{conversation.customerId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#475569]">{conversation.channel}</td>
                  <td className="max-w-[280px] px-5 py-4">
                    <p className="truncate text-[#475569]">{conversation.lastMessage}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-medium", statusClass[conversation.status])}>
                      {statusLabel[conversation.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#475569]">{conversation.assignee ?? "未分配"}</td>
                  <td className="px-5 py-4 text-xs text-[#94a3b8]">{conversation.updatedAt}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/chat?conversationId=${conversation.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                    >
                      查看
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#edf1f5] md:hidden">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat?conversationId=${conversation.id}`}
              className="block space-y-3 p-4 transition hover:bg-[#fbfdff]"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-xs font-semibold text-[#2563eb]">
                  {conversation.customerName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[#334155]">{conversation.customerName}</p>
                    <span className="shrink-0 text-[11px] text-[#94a3b8]">{conversation.updatedAt}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#94a3b8]">{conversation.channel} · {conversation.customerId}</p>
                </div>
              </div>
              <p className="truncate text-sm text-[#475569]">{conversation.lastMessage}</p>
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-medium", statusClass[conversation.status])}>
                  {statusLabel[conversation.status]}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb]">
                  查看会话
                  <ArrowUpRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredConversations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f1f5f9] text-[#64748b]">
              <Search className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#334155]">没有找到匹配会话</p>
            <p className="mt-1 text-xs text-[#94a3b8]">尝试调整状态筛选或搜索关键词。</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
