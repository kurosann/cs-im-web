"use client"

import {
  ArrowLeft,
  CheckCheck,
  Forward,
  MoreHorizontal,
  Paperclip,
  Send,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import { mockConversations, mockMessages } from "@/data/mock/workspace"
import type { ConversationStatus, Message } from "@/models/conversation"
import { cn } from "@/lib/utils"

const statusMeta: Record<ConversationStatus, { label: string; className: string }> = {
  waiting: {
    label: "待人工",
    className: "bg-[#fff1f2] text-[#ef4444]",
  },
  ai: {
    label: "AI 已处理",
    className: "bg-[#ecfdf5] text-[#059669]",
  },
  human: {
    label: "人工处理中",
    className: "bg-[#eff6ff] text-[#2563eb]",
  },
  closed: {
    label: "已关闭",
    className: "bg-[#f1f5f9] text-[#64748b]",
  },
}

const forwardTargets = ["Telegram", "飞书", "业务系统"]
const chatConversations = [...mockConversations].sort((left, right) => {
  if (left.id === "conv_221901") return -1
  if (right.id === "conv_221901") return 1
  return 0
})

function StatusBadge({ status }: { status: ConversationStatus }) {
  const meta = statusMeta[status]

  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}

export function ChatView() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId") ?? "conv_221901"
  const conversation = useMemo(
    () => chatConversations.find((item) => item.id === conversationId) ?? chatConversations[0],
    [conversationId]
  )
  const [additionalMessages, setAdditionalMessages] = useState<Record<string, Message[]>>({})
  const [draft, setDraft] = useState("")
  const assigned = Boolean(conversation.assignee)

  const conversationMessages = useMemo(
    () => mockMessages.filter((message) => message.conversationId === conversation.id),
    [conversation.id]
  )

  const messages = useMemo(
    () => [...conversationMessages, ...(additionalMessages[conversation.id] ?? [])],
    [additionalMessages, conversation.id, conversationMessages]
  )

  function handleSend() {
    const text = draft.trim()
    if (!text) {
      return
    }

    setAdditionalMessages((current) => ({
      ...current,
      [conversation.id]: [
        ...(current[conversation.id] ?? []),
        {
          id: `msg_${conversation.id}_${(current[conversation.id]?.length ?? 0) + 1}`,
          conversationId: conversation.id,
          role: "agent",
          text,
          createdAt: "刚刚",
          status: "delivered",
        },
      ],
    }))
    setDraft("")
  }

  return (
    <div className="grid h-[calc(100vh-142px)] min-h-[650px] overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] xl:grid-cols-[330px_minmax(0,1fr)_360px]">
      <aside className="hidden min-w-0 border-r border-[#e2e8f0] bg-white xl:flex xl:flex-col">
        <div className="flex h-14 shrink-0 items-center border-b border-[#e2e8f0] px-5">
          <p className="text-base font-semibold text-[#0f172a]">会话</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {chatConversations.slice(0, 4).map((item) => {
            const active = item.id === conversation.id

            return (
              <Link
                key={item.id}
                href={`/chat?conversationId=${item.id}`}
                className={cn(
                  "block border-b border-[#e2e8f0] px-5 py-4 text-left transition-colors",
                  active ? "bg-[#f3f4f6]" : "hover:bg-[#f8fafc]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f1f5f9] text-sm font-medium text-[#334155]">
                    {item.customerName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#0f172a]">{item.customerName}</p>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-[11px] text-[#64748b]">{item.updatedAt}</span>
                        {item.unreadCount > 0 ? (
                          <span className="grid size-5 place-items-center rounded-full bg-[#ef3340] text-[10px] font-bold text-white">
                            {item.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#64748b]">{item.lastMessage}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col bg-white">
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#e2e8f0] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/conversations"
              aria-label="返回会话列表"
              title="返回会话列表"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[#64748b] transition hover:bg-[#f1f5f9] xl:hidden"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f1f5f9] text-sm font-medium text-[#334155]">
              {conversation.customerName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0f172a]">{conversation.customerName}</p>
              <p className="mt-0.5 truncate text-xs text-[#64748b]">{conversation.channel}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="更多会话操作"
            title="更多会话操作"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#334155]"
          >
            <MoreHorizontal className="size-4.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#f8fafc] px-5 py-7 sm:px-8">
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-[#eef2f6] px-3 py-1 text-[10px] font-medium text-[#94a3b8]">
              今天
            </span>
          </div>
          {messages.map((message) => {
            const isCustomer = message.role === "customer"
            const isAi = message.role === "ai"
            const isAgent = message.role === "agent"

            return (
              <div
                key={message.id}
                className={cn("flex gap-3", isCustomer ? "justify-start" : "justify-end")}
              >
                {isCustomer ? (
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f1f5f9] text-sm font-medium text-[#334155]">
                    {conversation.customerName.slice(0, 1)}
                  </div>
                ) : null}
                <div className={cn("max-w-[78%] space-y-1", isCustomer ? "items-start" : "items-end")}>
                  <div
                    className={cn(
                      "rounded-3xl px-5 py-3.5 text-sm leading-6",
                      isCustomer &&
                        "rounded-bl-lg border border-[#e2e8f0] bg-white text-[#0f172a] shadow-[0_8px_24px_-24px_rgba(15,23,42,0.4)]",
                      isAi && "rounded-br-lg bg-[#dff2ff] text-[#075985]",
                      isAgent && "rounded-br-lg bg-[#2563eb] text-white"
                    )}
                  >
                    <div className="mb-1 text-[11px] opacity-65">
                      {isCustomer
                        ? `客户 · ${message.createdAt}`
                        : isAi
                          ? `AI · ${message.createdAt}`
                          : `坐席 · ${message.createdAt}`}
                    </div>
                    {message.text}
                  </div>
                  {isAgent ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8]">
                      <span>{message.createdAt}</span>
                      <CheckCheck className="size-3 text-[#38b86b]" />
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-[#e2e8f0] bg-white p-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 transition focus-within:border-[#94a3b8] focus-within:ring-4 focus-within:ring-[#0f172a]/5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              rows={3}
              placeholder="回复客户..."
              className="min-h-16 w-full resize-none bg-transparent text-sm leading-6 text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-[#64748b]">
                <button
                  type="button"
                  aria-label="添加附件"
                  title="添加附件"
                  className="grid size-8 place-items-center rounded-lg transition hover:bg-white hover:text-[#0f172a]"
                >
                  <Paperclip className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="转发消息"
                  title="转发消息"
                  className="grid size-8 place-items-center rounded-lg transition hover:bg-white hover:text-[#0f172a]"
                >
                  <Forward className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-medium text-[#334155] transition hover:bg-[#f1f5f9]"
                >
                  <Forward className="size-3.5" />
                  转发
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  aria-label="发送消息"
                  title="发送消息"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#020617] px-3 text-sm font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!draft.trim()}
                >
                  <Send className="size-3.5" />
                  发送
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#94a3b8]">Enter 发送 · Shift + Enter 换行</p>
        </div>
      </section>

      <aside className="hidden min-w-0 border-l border-[#e2e8f0] bg-white xl:block">
        <div className="border-b border-[#e2e8f0] px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-[#0f172a]">客户信息</p>
            <UserRound className="size-4 text-[#94a3b8]" />
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-base font-medium text-[#475569]">
              {conversation.customerName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0f172a]">{conversation.customerName}</p>
              <p className="mt-1 truncate text-xs text-[#64748b]">{conversation.channel}</p>
            </div>
          </div>

          <div className="my-6 h-px bg-[#e2e8f0]" />

          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#64748b]">业务渠道</dt>
              <dd className="font-medium text-[#0f172a]">{conversation.channel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#64748b]">当前状态</dt>
              <dd>
                <StatusBadge status={conversation.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#64748b]">负责人</dt>
              <dd className="font-medium text-[#0f172a]">
                {assigned ? conversation.assignee ?? "客服专员" : "未认领"}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-[#0f172a]">转发去向</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {forwardTargets.map((target) => (
                <span
                  key={target}
                  className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs text-[#334155]"
                >
                  {target}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
