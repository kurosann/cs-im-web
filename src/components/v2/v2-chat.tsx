"use client"

import {
  ArrowDownUp,
  ChevronRight,
  Languages,
  MessageSquare,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"

import {
  knowledgeBases,
  knowledgeDocs,
  v2AiSuggestions,
  v2Conversations,
  v2Messages,
  v2QuickReplies,
  v2QuickTranslations,
  type V2ConversationStatus,
} from "@/data/mock/v2"
import { cn } from "@/lib/utils"

type Panel = "ai" | "quick" | "translate" | null
type Tone = "正式" | "友好" | "简洁" | "安抚"
type ChatMessage = {
  id: string
  role: "customer" | "agent"
  text: string
  translated?: string
  time: string
}

const tones: Tone[] = ["正式", "友好", "简洁", "安抚"]

const conversationStatusMeta: Record<V2ConversationStatus, { label: string; className: string }> = {
  waiting: { label: "待人工", className: "bg-[#fff1f2] text-[#ef4444]" },
  ai: { label: "AI 已处理", className: "bg-[#ecfdf5] text-[#059669]" },
  human: { label: "人工处理中", className: "bg-[#eff6ff] text-[#2563eb]" },
}

const channelMeta: Record<string, { icon: typeof MessageCircle; className: string }> = {
  WhatsApp: { icon: MessageCircle, className: "bg-[#25d366]" },
  Telegram: { icon: Send, className: "bg-[#229ed9]" },
  Messenger: { icon: MessageCircle, className: "bg-[#6d5dfc]" },
}

const toneSuggestions: Record<Tone, typeof v2AiSuggestions> = {
  正式: v2AiSuggestions,
  友好: [
    { english: "Good news - I have checked this and it should be resolved in 1-2 business days.", chinese: "好消息，我已经帮您确认，预计 1-2 个工作日解决。" },
    { english: "I will keep an eye on it and let you know as soon as there is an update.", chinese: "我会持续关注，一有进展就通知您。" },
    { english: "Would you like me to send over the latest progress screenshot?", chinese: "需要我把最新进度截图发给您吗？" },
  ],
  简洁: [
    { english: "Refund review: 1-2 business days.", chinese: "退款复核：1-2 个工作日。" },
    { english: "I have prioritized your case.", chinese: "已加急处理。" },
    { english: "Send progress screenshot?", chinese: "需要发进度截图吗？" },
  ],
  安抚: [
    { english: "I understand your concern and have prioritized this case.", chinese: "非常理解您的担忧，已经优先处理您的问题。" },
    { english: "The refund is under final review and should arrive in 1-2 business days.", chinese: "退款正在最后复核，预计 1-2 个工作日到账。" },
    { english: "I will continue following up until the result is confirmed.", chinese: "我会持续跟进，直到确认到账。" },
  ],
}

function translate(text: string, direction: "zh-en" | "en-zh") {
  const item = v2QuickTranslations[text]
  if (item) return direction === "zh-en" ? item.zh : item.en
  return text.trim() ? "暂未提供该句子的翻译" : ""
}

export function V2Chat() {
  const [activeConversation, setActiveConversation] = useState("c1")
  const [messages, setMessages] = useState<ChatMessage[]>(v2Messages)
  const [draft, setDraft] = useState("")
  const [showTranslation, setShowTranslation] = useState(true)
  const [panel, setPanel] = useState<Panel>(null)
  const [tone, setTone] = useState<Tone>("正式")
  const [direction, setDirection] = useState<"zh-en" | "en-zh">("zh-en")
  const [languageMapping, setLanguageMapping] = useState<"auto" | "zh" | "en">("auto")
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")

  const conversation = v2Conversations.find((item) => item.id === activeConversation) ?? v2Conversations[0]
  const activeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId)
  const activeDocs = knowledgeDocs.filter((item) => item.baseId === knowledgeBaseId)
  const effectiveDirection = languageMapping === "zh" ? "en-zh" : languageMapping === "en" ? "zh-en" : direction
  const draftTranslation = useMemo(() => translate(draft, effectiveDirection), [draft, effectiveDirection])

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((current) => (current === next ? null : next))
  }

  function send() {
    const content = draft.trim()
    if (!content) return
    setMessages((current) => [...current, { id: `m_${Date.now()}`, role: "agent", text: content, time: "刚刚" }])
    setDraft("")
    setNotice("消息已发送")
    window.setTimeout(() => setNotice(""), 1800)
  }

  return (
    <div className="grid gap-5 xl:h-[calc(100vh-142px)] xl:min-h-[720px] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
        <div className="flex h-14 items-center gap-2 border-b border-[#edf1f5] px-5">
          <MessageSquare className="size-4 text-[#64748b]" />
          <p className="text-sm font-semibold text-[#0f172a]">会话</p>
        </div>
        <div className="divide-y divide-[#edf1f5]">
          {v2Conversations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveConversation(item.id)}
              className={cn("w-full px-5 py-4 text-left transition hover:bg-[#f8fafc]", activeConversation === item.id && "bg-[#f1f5f9]")}
            >
              <div className="flex items-start gap-3">
                <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#f1f5f9] text-sm font-semibold text-[#475569]">
                  {item.name.slice(0, 1)}
                  {(() => {
                    const channel = channelMeta[item.app] ?? channelMeta.WhatsApp
                    const ChannelIcon = channel.icon
                    return (
                      <span
                        className={cn("absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full border-2 border-white text-white", channel.className)}
                        title={item.app}
                        aria-label={item.app}
                      >
                        <ChannelIcon className="size-2.5" strokeWidth={2.6} />
                      </span>
                    )
                  })()}
                </div>
                <div className="relative min-w-0 flex-1 pr-28">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">{item.name}</p>
                  <p className="mt-2 truncate text-xs text-[#64748b]">{item.preview}</p>
                  <div className="absolute right-0 top-0 flex shrink-0 items-center gap-2">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", conversationStatusMeta[item.status].className)}>
                      {conversationStatusMeta[item.status].label}
                    </span>
                    <span className="text-xs text-[#94a3b8]">{item.time}</span>
                  </div>
                  {item.unreadCount > 0 ? (
                    <span className="absolute right-0 top-7 grid size-5 place-items-center rounded-full bg-[#ef3340] text-[10px] font-bold text-white">
                      {item.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[720px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1f5] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">{conversation.name} · {conversation.app}</h2>
            <p className="mt-1 text-xs text-[#64748b]">客户语言：英语 · AI 客服员工：海外客服</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTranslation((current) => !current)}
              aria-label={showTranslation ? "隐藏译文" : "显示译文"}
              title={showTranslation ? "隐藏译文" : "显示译文"}
              className={cn("grid size-8 place-items-center rounded-full border text-xs transition", showTranslation ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] text-[#64748b]")}
            >
              <Languages className="size-4" />
            </button>
            <select
              value={languageMapping}
              onChange={(event) => setLanguageMapping(event.target.value as typeof languageMapping)}
              aria-label="目标语言"
              className="h-8 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs text-[#64748b] outline-none focus:border-[#94a3b8]"
            >
              <option value="auto">自动</option>
              <option value="zh">中文</option>
              <option value="en">英语</option>
            </select>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] px-5 py-6 sm:px-7">
          <div className="flex justify-center">
            <span className="rounded-full bg-[#eef2f6] px-3 py-1 text-[10px] text-[#94a3b8]">今天</span>
          </div>
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "customer" ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm", message.role === "customer" ? "rounded-bl-lg bg-white text-[#0f172a]" : "rounded-br-lg bg-[#020617] text-white")}>
                <p>{message.text}</p>
                {showTranslation && message.translated ? (
                  <p className={cn("mt-2 border-t border-dashed pt-2 text-xs", message.role === "customer" ? "border-[#e2e8f0] text-[#64748b]" : "border-white/20 text-white/70")}>
                    {message.translated}
                  </p>
                ) : null}
                <p className={cn("mt-1 text-[11px]", message.role === "customer" ? "text-[#94a3b8]" : "text-white/60")}>{message.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#edf1f5] bg-white p-4">
          {panel === "ai" ? (
            <div className="mb-3 space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">AI 辅助建议</span>
                <button type="button" onClick={() => setTone((current) => current)} className="grid size-7 place-items-center rounded-lg text-[#94a3b8] hover:bg-white hover:text-[#334155]" title="刷新建议">
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tones.map((item) => (
                  <button key={item} type="button" onClick={() => setTone(item)} className={cn("rounded-full border px-2.5 py-1 text-[11px]", tone === item ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{item}</button>
                ))}
              </div>
              {toneSuggestions[tone].map((item) => (
                <button key={item.english} type="button" onClick={() => setDraft(item.english)} className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-left text-sm hover:border-[#94a3b8]">
                  <p className="leading-6 text-[#334155]">{item.english}</p>
                  <div className="my-2 border-t border-dashed border-[#e2e8f0]" />
                  <p className="text-xs leading-5 text-[#64748b]">{item.chinese}</p>
                </button>
              ))}
            </div>
          ) : null}

          {panel === "quick" ? (
            <div className="mb-3 space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              {v2QuickReplies.map((item) => (
                <button key={item.english} type="button" onClick={() => setDraft(item.english)} className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-left text-sm hover:border-[#94a3b8]">
                  <p className="leading-6 text-[#334155]">{item.english}</p>
                  <div className="my-2 border-t border-dashed border-[#e2e8f0]" />
                  <p className="text-xs text-[#64748b]">{item.chinese}</p>
                </button>
              ))}
            </div>
          ) : null}

          {panel === "translate" ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <button type="button" disabled={!draftTranslation} onClick={() => setDraft(draftTranslation)} className="min-h-9 flex-1 text-left text-xs leading-5 text-[#64748b] disabled:opacity-50">
                {draftTranslation || "输入内容后查看翻译"}
              </button>
              <button type="button" onClick={() => setDirection((current) => current === "zh-en" ? "en-zh" : "zh-en")} className="grid size-7 place-items-center rounded-lg text-[#94a3b8] hover:bg-white hover:text-[#334155]" title="切换翻译方向">
                <ArrowDownUp className="size-3.5" />
              </button>
            </div>
          ) : null}

          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => togglePanel("ai")} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition", panel === "ai" ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]")}>
              <Sparkles className="size-3.5" /> AI 辅助
            </button>
            <button type="button" onClick={() => togglePanel("quick")} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition", panel === "quick" ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]")}>
              <MessageSquare className="size-3.5" /> 快捷回复
            </button>
            <button type="button" onClick={() => togglePanel("translate")} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition", panel === "translate" ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]")}>
              <Languages className="size-3.5" /> 快捷翻译
            </button>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            rows={3}
            placeholder="输入回复..."
            className="min-h-20 w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm leading-6 text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#94a3b8] focus:ring-4 focus:ring-[#0f172a]/5"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[#64748b]">{notice || "AI 建议和快捷回复均需人工确认后发送。"}</span>
            <button type="button" onClick={send} disabled={!draft.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#020617] px-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-40">
              <Send className="size-3.5" /> 发送
            </button>
          </div>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
        <div className="border-b border-[#edf1f5] p-5">
          <p className="text-sm font-semibold text-[#0f172a]">{conversation.name} · {conversation.app}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">客户档案</p>
          <div className="mt-4 rounded-xl border border-[#e2e8f0] p-4">
            <p className="text-sm font-medium text-[#0f172a]">当前 AI 客服员工</p>
            <p className="mt-1 text-xs text-[#64748b]">海外客服 · 运行中</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {knowledgeBases.slice(1, 3).map((base) => (
                <button key={base.id} type="button" onClick={() => setKnowledgeBaseId(base.id)} className="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs text-[#475569] hover:border-[#94a3b8]">
                  {base.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b border-[#edf1f5] p-5">
          <p className="text-sm font-semibold text-[#0f172a]">会话摘要</p>
          <p className="mt-3 text-xs leading-6 text-[#64748b]">客户咨询退款进度，AI 已解释到账时间。客户仍希望人工确认，建议尽快跟进。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] text-[#c2410c]">情绪：普通</span>
            <span className="rounded-full bg-[#fff1f2] px-2.5 py-1 text-[11px] text-[#dc2626]">风险：中等</span>
            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] text-[#64748b]">主题：退款</span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm font-semibold text-[#0f172a]">操作</p>
          <div className="mt-3 space-y-2">
            {["转人工 / 认领", "标记提醒", "重新生成摘要", "切换 AI 建议"].map((action) => (
              <button key={action} type="button" onClick={() => setNotice(`${action}已执行`)} className="flex h-10 w-full items-center justify-between rounded-xl border border-[#e2e8f0] px-3 text-sm text-[#475569] transition hover:bg-[#f8fafc]">
                {action}
                <ChevronRight className="size-4 text-[#c0cad4]" />
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1" aria-hidden="true" />
      </aside>

      {activeBase ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/35 px-5 py-8" role="dialog" aria-modal="true">
          <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf1f5] p-5">
              <div>
                <h3 className="text-base font-semibold text-[#0f172a]">{activeBase.name}</h3>
                <p className="mt-1 text-xs text-[#64748b]">{activeBase.description}</p>
              </div>
              <button type="button" onClick={() => setKnowledgeBaseId(null)} className="rounded-lg px-2 py-1 text-sm text-[#64748b] hover:bg-[#f1f5f9]" aria-label="关闭知识库">关闭</button>
            </div>
            <div className="min-h-0 space-y-3 overflow-y-auto bg-[#f8fafc] p-5">
              {activeDocs.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{doc.title}</p>
                      <p className="mt-1 text-xs text-[#64748b]">{doc.type} · {doc.language}</p>
                    </div>
                    <span className="rounded-full bg-[#ecfdf5] px-2 py-1 text-[11px] text-[#059669]">{doc.status}</span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#64748b]">{doc.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
