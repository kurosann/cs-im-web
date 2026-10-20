"use client"

import {
  ArrowRightLeft,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Languages,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  StickyNote,
  UserRoundCheck,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import {
  chatConversations,
  chatMessagesByConversation,
  getAiSuggestions,
  knowledgeBases,
  knowledgeDocs,
  quickReplies,
  riskLabels,
  sentimentLabels,
  translateDraft,
  type AiSuggestion,
  type ChatConversation,
  type ChatMessage,
  type ChatStatus,
  type DraftTranslation,
  type SuggestionTone,
  type TranslationStatus,
} from "@/data/mock/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

type PanelTab = "customer" | "orders" | "history" | "ai"
type MessageFilter = "all" | "customer" | "agent" | "note"
type SuggestionToneOption = SuggestionTone
type Tones = Record<string, SuggestionToneOption>
type SuggestionEventAction = "filled" | "used" | "modified" | "ignored" | "expired"

type ConversationRuntime = Pick<
  ChatConversation,
  "assignedTo" | "ownerType" | "team" | "status" | "sentiment" | "riskLevel" | "priority" | "tags"
>

type DraftAssist = {
  source: "suggestion" | "quick" | "knowledge"
  id: string
  snapshot: string
  customerText: string | null
  suggestionId?: string
  tone?: SuggestionToneOption
}

type SuggestionEvent = {
  id: string
  conversationId: string
  suggestionId: string
  action: SuggestionEventAction
  tone?: SuggestionToneOption
  at: string
}

const tones: SuggestionToneOption[] = ["正式", "友好", "简洁", "安抚"]

const statusLabels: Record<ChatStatus, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
  waiting: { label: "待人工", variant: "destructive" },
  ai: { label: "AI 处理中", variant: "secondary" },
  human: { label: "人工处理中", variant: "outline" },
}

const priorityVariant: Record<ChatConversation["priority"], "destructive" | "outline" | "secondary" | "ghost"> = {
  紧急: "destructive",
  高: "destructive",
  普通: "outline",
  低: "secondary",
}

const actionLabels: Record<SuggestionEventAction, string> = {
  filled: "已填充",
  used: "直接使用",
  modified: "修改后使用",
  ignored: "已忽略",
  expired: "已过期",
}

function nowTime() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`
}

function firstLine(text: string) {
  return text.split("\n")[0] ?? text
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ChatConversation[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <Card className="h-full rounded-xl">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          会话
        </CardTitle>
        <CardDescription>按渠道聚合，优先处理高风险与超时会话。</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-80 sm:h-[620px] xl:h-full">
          <div className="px-3 pb-3">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/60",
                    active && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{conversation.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{conversation.name}</p>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{conversation.app}</span>
                        <span>·</span>
                        <span className="truncate">{conversation.languageLabel}</span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{conversation.preview}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusLabels[conversation.status].variant}>
                          {statusLabels[conversation.status].label}
                        </Badge>
                        <Badge variant={priorityVariant[conversation.priority]}>{conversation.priority}</Badge>
                        <Badge variant={riskLabels[conversation.riskLevel].tone}>
                          {riskLabels[conversation.riskLevel].label}
                        </Badge>
                        {conversation.unreadCount > 0 ? (
                          <Badge>{conversation.unreadCount} 条未读</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate text-[11px] text-muted-foreground">
                        负责人：{conversation.assignedTo} · {conversation.team}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function MessageBubble({
  message,
  showTranslation,
  onRetry,
}: {
  message: ChatMessage
  showTranslation: boolean
  onRetry: (id: string) => void
}) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.text}
        </span>
      </div>
    )
  }

  if (message.role === "note") {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Lock className="size-3.5" />
          内部备注 · 不会发送给客户
          <span className="ml-auto font-normal opacity-70">{message.time}</span>
        </div>
        <p className="mt-2 text-sm leading-6">{message.text}</p>
      </div>
    )
  }

  const isAgent = message.role === "agent"
  const failed = message.deliveryStatus === "failed"

  return (
    <div className={cn("flex", isAgent && "justify-end")}>
      <div
        className={cn(
          "max-w-[82%] space-y-2 rounded-xl border p-3.5",
          isAgent
            ? "border-primary/20 bg-primary text-primary-foreground"
            : "border-border bg-background"
        )}
      >
        <div className="flex items-center gap-2 text-[11px] opacity-70">
          <span>{isAgent ? "客服回复" : "客户消息"}</span>
          <span>·</span>
          <span>{message.time}</span>
          {message.riskLevel === "high" ? (
            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
              高风险
            </Badge>
          ) : null}
        </div>
        <p className="text-sm leading-6">{message.text}</p>

        {showTranslation && message.translated ? (
          <div className="border-t border-current/15 pt-2">
            <p className="text-[11px] opacity-60">
              {isAgent ? `客户收到 · ${message.targetLanguage ?? "目标语言"}` : `中文译文 · ${message.translationProvider ?? "AI 翻译"}`}
            </p>
            <p className="mt-1 text-xs leading-5 opacity-85">{message.translated}</p>
          </div>
        ) : null}

        {isAgent ? (
          <div className="flex items-center justify-end gap-2 text-[11px] opacity-75">
            {failed ? (
              <>
                <span>发送失败</span>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => onRetry(message.id)}
                  className="h-6 px-2 text-[11px]"
                >
                  重试
                </Button>
              </>
            ) : (
              <span>{message.deliveryStatus === "sending" ? "发送中..." : "已送达"}</span>
            )}
            {message.suggestionAction ? (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                AI {message.suggestionAction === "used" ? "直接使用" : "修改后使用"}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SuggestionCard({
  suggestion,
  onFill,
  onIgnore,
}: {
  suggestion: AiSuggestion
  onFill: (suggestion: AiSuggestion) => void
  onIgnore: (suggestion: AiSuggestion) => void
}) {
  return (
    <div className="flex h-[210px] flex-col rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          置信度 {Math.round(suggestion.confidence * 100)}%
        </Badge>
        <span className="text-[10px] text-muted-foreground">AI 建议</span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6">{suggestion.agentText}</p>
      <p className="mt-2 line-clamp-1 text-[11px] leading-5 text-muted-foreground">
        客户将看到：{suggestion.customerText}
      </p>
      <div className="mt-auto space-y-2 pt-3">
        <Progress value={suggestion.confidence * 100} className="h-1" />
        <div className="flex flex-wrap gap-1">
          {suggestion.sources.slice(0, 2).map((source) => (
            <Badge key={source} variant="outline" className="text-[10px]">
              {source}
            </Badge>
          ))}
        </div>
        {suggestion.riskNote ? (
          <p className="flex items-start gap-1 text-[10px] leading-4 text-destructive">
            <CircleAlert className="mt-0.5 size-3 shrink-0" />
            {suggestion.riskNote}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onFill(suggestion)}>
            <Sparkles className="size-3.5" />
            填充
          </Button>
          <Button size="sm" variant="outline" onClick={() => onIgnore(suggestion)}>
            <X className="size-3.5" />
            忽略
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ChatRoom() {
  const [activeConversationId, setActiveConversationId] = useState("c1")
  const [conversationStates, setConversationStates] = useState<Record<string, ConversationRuntime>>(
    () =>
      Object.fromEntries(
        chatConversations.map((conversation) => [
          conversation.id,
          {
            assignedTo: conversation.assignedTo,
            ownerType: conversation.ownerType,
            team: conversation.team,
            status: conversation.status,
            sentiment: conversation.sentiment,
            riskLevel: conversation.riskLevel,
            priority: conversation.priority,
            tags: conversation.tags,
          },
        ])
      )
  )
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(
    () => Object.fromEntries(Object.entries(chatMessagesByConversation).map(([id, list]) => [id, [...list]]))
  )
  const [summaries, setSummaries] = useState<Record<string, string>>(
    () => Object.fromEntries(chatConversations.map((conversation) => [conversation.id, conversation.summary]))
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [assists, setAssists] = useState<Record<string, DraftAssist | null>>({})
  const [rounds, setRounds] = useState<Record<string, number>>({})
  const [toneByConversation, setToneByConversation] = useState<Tones>({})
  const [ignored, setIgnored] = useState<Record<string, string[]>>({})
  const [suggestionEvents, setSuggestionEvents] = useState<SuggestionEvent[]>([])
  const [panelTab, setPanelTab] = useState<PanelTab>("ai")
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all")
  const [showTranslation, setShowTranslation] = useState(true)
  const [translationEnabled, setTranslationEnabled] = useState(true)
  const [internalMode, setInternalMode] = useState(false)
  const [forceOriginal, setForceOriginal] = useState(false)
  const [notice, setNotice] = useState("")
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState("")
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("kb2")
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState("售后一组 · 李然")
  const [transferReason, setTransferReason] = useState("")

  const messageListRef = useRef<HTMLDivElement>(null)

  const conversations = useMemo(
    () =>
      chatConversations.map((conversation) => ({
        ...conversation,
        ...conversationStates[conversation.id],
      })),
    [conversationStates]
  )
  const conversation = conversations.find((item) => item.id === activeConversationId) ?? conversations[0]
  const messages = messagesByConversation[conversation.id] ?? []
  const draft = drafts[conversation.id] ?? ""
  const activeAssist = assists[conversation.id] ?? null
  const tone = toneByConversation[conversation.id] ?? "正式"
  const round = rounds[conversation.id] ?? 0
  const ignoredIds = ignored[conversation.id] ?? []
  const events = suggestionEvents.filter((event) => event.conversationId === conversation.id)

  const suggestions = useMemo(() => {
    const penalty = Math.min(0.18, ignoredIds.length * 0.03)
    return getAiSuggestions(conversation, tone, round).map((suggestion) => ({
      ...suggestion,
      confidence: Math.max(0.4, suggestion.confidence - penalty),
    }))
  }, [conversation, tone, round, ignoredIds.length])
  const visibleSuggestions = suggestions.filter((suggestion) => !ignoredIds.includes(suggestion.id)).slice(0, 3)

  const translation = useMemo<DraftTranslation>(() => {
    const value = draft.trim()
    if (!value) return { text: "", status: "ready", provider: "AI 翻译" }
    if (activeAssist && value === activeAssist.snapshot) {
      return activeAssist.customerText
        ? { text: activeAssist.customerText, status: "ready", provider: "AI 翻译" }
        : { text: null, status: "failed", provider: "AI 翻译" }
    }
    if (!translationEnabled) return { text: value, status: "ready", provider: "原文" }

    return translateDraft(value, conversation.language)
  }, [activeAssist, conversation.language, draft, translationEnabled])

  const canSend = Boolean(draft.trim()) && (internalMode || translation.status !== "failed" || forceOriginal)
  const summary = summaries[conversation.id] ?? conversation.summary
  const activeKnowledgeBase = knowledgeBases.find((base) => base.id === knowledgeBaseId) ?? knowledgeBases[0]
  const activeDocs = knowledgeDocs.filter((doc) => doc.baseId === activeKnowledgeBase.id)
  const filteredQuickReplies = quickReplies.filter((reply) => {
    const keyword = quickSearch.trim().toLowerCase()
    if (!keyword) return true
    return `${reply.title}${reply.zh}${reply.shortcut}${reply.category}${reply.scope}`.toLowerCase().includes(keyword)
  })

  useEffect(() => {
    const element = messageListRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [conversation.id, messages.length])

  function notify(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(""), 2400)
  }

  function setDraft(value: string) {
    setDrafts((current) => ({ ...current, [conversation.id]: value }))
    window.localStorage.setItem(`cs-im-draft:${conversation.id}`, value)
    setForceOriginal(false)
  }

  function addSuggestionEvent(suggestionId: string, action: SuggestionEventAction, suggestionTone?: SuggestionToneOption) {
    setSuggestionEvents((current) => [
      {
        id: makeId("evt"),
        conversationId: conversation.id,
        suggestionId,
        action,
        tone: suggestionTone ?? tone,
        at: nowTime(),
      },
      ...current,
    ])
  }

  function updateConversation(patch: Partial<ConversationRuntime>) {
    setConversationStates((current) => ({
      ...current,
      [conversation.id]: { ...current[conversation.id], ...patch },
    }))
  }

  function appendMessage(message: ChatMessage) {
    setMessagesByConversation((current) => ({
      ...current,
      [conversation.id]: [...(current[conversation.id] ?? []), message],
    }))
  }

  function fillSuggestion(suggestion: AiSuggestion) {
    setDraft(suggestion.agentText)
    setAssists((current) => ({
      ...current,
      [conversation.id]: {
        source: "suggestion",
        id: suggestion.id,
        snapshot: suggestion.agentText,
        customerText: suggestion.customerText,
        suggestionId: suggestion.id,
        tone: suggestion.tone,
      },
    }))
    addSuggestionEvent(suggestion.id, "filled", suggestion.tone)
    notify("已填充到输入框，请人工确认后发送")
  }

  function ignoreSuggestion(suggestion: AiSuggestion) {
    setIgnored((current) => ({
      ...current,
      [conversation.id]: [...(current[conversation.id] ?? []), suggestion.id],
    }))
    addSuggestionEvent(suggestion.id, "ignored", suggestion.tone)
    notify("已忽略这条建议，连续忽略会降低同类建议权重")
  }

  function regenerateSuggestions() {
    setRounds((current) => ({ ...current, [conversation.id]: (current[conversation.id] ?? 0) + 1 }))
    notify("已重新生成建议回复")
  }

  function fillQuickReply(reply: (typeof quickReplies)[number]) {
    const customerText = conversation.language === "es" ? reply.es : reply.en
    setDraft(reply.zh)
    setAssists((current) => ({
      ...current,
      [conversation.id]: {
        source: "quick",
        id: reply.id,
        snapshot: reply.zh,
        customerText,
      },
    }))
    setQuickOpen(false)
    notify("已填充常用语，请确认后发送")
  }

  function fillKnowledgeDoc(doc: (typeof knowledgeDocs)[number]) {
    const translated = translateDraft(doc.answer, conversation.language)
    setDraft(doc.answer)
    setAssists((current) => ({
      ...current,
      [conversation.id]: {
        source: "knowledge",
        id: doc.id,
        snapshot: doc.answer,
        customerText: translated.text,
      },
    }))
    setKnowledgeOpen(false)
    notify(translated.status === "failed" ? "已填入知识答案，但翻译失败，可仅发送原文" : "已填入知识答案")
  }

  function openKnowledge() {
    setKnowledgeBaseId(conversation.language === "es" ? "kb4" : "kb2")
    setKnowledgeOpen(true)
  }

  function sendMessage() {
    const value = draft.trim()
    if (!value) return

    if (internalMode) {
      appendMessage({
        id: makeId("note"),
        role: "note",
        text: value,
        internalOnly: true,
        time: nowTime(),
      })
      setDraft("")
      setForceOriginal(false)
      notify("内部备注已记录，不会发送给客户")
      return
    }

    if (translation.status === "failed" && !forceOriginal) {
      setForceOriginal(true)
      notify("翻译失败，已切换为仅发送原文，请再次确认发送")
      return
    }

    const suggestionAction: "used" | "modified" | undefined =
      activeAssist?.source === "suggestion"
        ? draft === activeAssist.snapshot
          ? "used"
          : "modified"
        : undefined

    const translationStatus: TranslationStatus =
      !translationEnabled ? "not_needed" : translation.status === "failed" ? "failed" : "ready"

    appendMessage({
      id: makeId("msg"),
      role: "agent",
      text: value,
      translated: translation.status === "ready" ? translation.text ?? undefined : undefined,
      time: nowTime(),
      sourceLanguage: "中文",
      targetLanguage: conversation.language === "es" ? "Español" : conversation.language === "en" ? "English" : "中文",
      translationProvider: translation.provider,
      translationStatus,
      deliveryStatus: "sent",
      aiSuggestionId: activeAssist?.source === "suggestion" ? activeAssist.suggestionId : undefined,
      suggestionAction,
    })

    if (activeAssist?.source === "suggestion" && activeAssist.suggestionId) {
      addSuggestionEvent(activeAssist.suggestionId, suggestionAction === "modified" ? "modified" : "used", activeAssist.tone)
    }

    if (conversationStates[conversation.id].ownerType !== "human") {
      updateConversation({
        ownerType: "human",
        assignedTo: "我（当前坐席）",
        status: "human",
      })
    }

    setDraft("")
    setForceOriginal(false)
    notify(
      translationEnabled && translation.status === "ready" && conversation.language !== "zh"
        ? `消息已发送给客户（中文 → ${conversation.language === "es" ? "Español" : "English"}）`
        : "消息已发送"
    )
  }

  function retryMessage(messageId: string) {
    setMessagesByConversation((current) => ({
      ...current,
      [conversation.id]: (current[conversation.id] ?? []).map((message) =>
        message.id === messageId ? { ...message, deliveryStatus: "sent" } : message
      ),
    }))
    appendMessage({
      id: makeId("sys"),
      role: "system",
      text: "失败消息已重新发送成功。",
      time: nowTime(),
    })
    notify("消息已重新发送")
  }

  function takeover() {
    updateConversation({
      ownerType: "human",
      assignedTo: "我（当前坐席）",
      status: "human",
    })
    appendMessage({
      id: makeId("sys"),
      role: "system",
      text: "客服已接管会话，AI 自动回复已暂停。",
      time: nowTime(),
    })
    notify("已接管会话，AI 自动回复已暂停")
  }

  function confirmTransfer() {
    const isAi = transferTarget.startsWith("AI")
    updateConversation({
      ownerType: isAi ? "ai" : "human",
      assignedTo: transferTarget,
      team: isAi ? "AI 服务组" : transferTarget.split(" · ")[0],
      status: isAi ? "ai" : "human",
    })
    appendMessage({
      id: makeId("sys"),
      role: "system",
      text: `会话已转接给 ${transferTarget}。原因：${transferReason.trim() || "未填写"}。`,
      time: nowTime(),
    })
    setTransferOpen(false)
    setTransferReason("")
    notify(`已转接给 ${transferTarget}`)
  }

  function generateSummary() {
    const order = conversation.orders[0]
    const nextSummary = [
      `客户主要问题：${firstLine(conversation.preview)}`,
      `已处理事项：${conversation.history[0]?.resolution ?? "客服已确认当前处理状态"}`,
      `待处理事项：${conversation.riskLevel === "high" ? "需要人工复核并给出明确处理时间" : "持续跟进处理结果"}`,
      `涉及订单：${order ? `${order.id} · ${order.status}` : "无"}`,
      `客户情绪：${sentimentLabels[conversation.sentiment].label}`,
      `是否需要后续跟进：${conversation.riskLevel === "low" ? "视客户反馈" : "需要"}`,
    ].join("\n")

    setSummaries((current) => ({ ...current, [conversation.id]: nextSummary }))
    notify("AI 已生成会话摘要，可人工修改后保存")
  }

  function saveSummary() {
    notify("会话摘要已保存")
  }

  const visibleMessages = messages.filter((message) => {
    if (messageFilter === "all") return true
    return message.role === messageFilter
  })

  return (
    <div className="grid gap-4 xl:min-h-[900px] xl:grid-cols-[270px_minmax(0,1fr)_330px]">
      <ConversationList conversations={conversations} activeId={activeConversationId} onSelect={setActiveConversationId} />

      <Card className="flex min-h-[900px] min-w-0 flex-col rounded-xl">
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {conversation.name} · {conversation.app}
                <Badge variant={statusLabels[conversation.status].variant}>
                  {statusLabels[conversation.status].label}
                </Badge>
                <Badge variant={riskLabels[conversation.riskLevel].tone}>
                  {riskLabels[conversation.riskLevel].label}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>客户语言：{conversation.languageLabel}</span>
                <span>·</span>
                <span>情绪：{sentimentLabels[conversation.sentiment].label}</span>
                <span>·</span>
                <span>优先级：{conversation.priority}</span>
                <span>·</span>
                <span>SLA：{conversation.slaDueIn}</span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle pressed={showTranslation} onPressedChange={setShowTranslation} aria-label="显示译文">
                <Languages className="size-4" />
                译文
              </Toggle>
              <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="size-4" />
                转接
              </Button>
              <Button size="sm" onClick={takeover} disabled={conversation.ownerType === "human"}>
                <UserRoundCheck className="size-4" />
                {conversation.ownerType === "human" ? "已接管" : "人工接管"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">负责人：{conversation.assignedTo}</Badge>
            <Badge variant="outline">{conversation.team}</Badge>
            {conversation.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {ignoredIds.length >= 2 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                已连续忽略 {ignoredIds.length} 条建议，同类建议权重已下调。
              </p>
            ) : null}

            {conversation.riskLevel === "high" ? (
              <span className="flex items-center gap-1 text-destructive">
                <CircleAlert className="size-3.5" />
                AI 自动回复已暂停，需人工确认
              </span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup
              type="single"
              value={messageFilter}
              onValueChange={(value) => value && setMessageFilter(value as MessageFilter)}
              size="sm"
            >
              <ToggleGroupItem value="all">全部</ToggleGroupItem>
              <ToggleGroupItem value="customer">客户</ToggleGroupItem>
              <ToggleGroupItem value="agent">客服</ToggleGroupItem>
              <ToggleGroupItem value="note">内部备注</ToggleGroupItem>
            </ToggleGroup>
            <span className="text-[11px] text-muted-foreground">
              原文与译文都会保存，当前显示 {visibleMessages.length} 条消息
            </span>
          </div>

          <div ref={messageListRef} className="min-h-32 flex-1 space-y-4 overflow-y-auto rounded-xl bg-muted/20 p-3">
            {visibleMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                showTranslation={showTranslation}
                onRetry={retryMessage}
              />
            ))}
          </div>
        </CardContent>

        <CardContent className="shrink-0 py-3">
          <div className="rounded-xl border border-border bg-muted/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-semibold">AI 建议回复</p>
                <Badge variant="outline" className="text-[10px]">
                  只填充，不自动发送
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={tone}
                  onValueChange={(value) => {
                    if (!value) return
                    setToneByConversation((current) => ({ ...current, [conversation.id]: value as SuggestionToneOption }))
                  }}
                  size="sm"
                >
                  {tones.map((item) => (
                    <ToggleGroupItem key={item} value={item} className="text-xs">
                      {item}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button variant="outline" size="sm" onClick={regenerateSuggestions}>
                  <RefreshCw className="size-3.5" />
                  重新生成
                </Button>
              </div>
            </div>

            {conversation.riskLevel === "high" ? (
              <p className="mt-2 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-2 text-xs leading-5 text-destructive">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                高风险会话：AI 建议只作为草稿参考，客服必须核对账号安全与安抚话术后再发送。
              </p>
            ) : null}

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {visibleSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="w-[280px] shrink-0">
                  <SuggestionCard
                    suggestion={suggestion}
                    onFill={fillSuggestion}
                    onIgnore={ignoreSuggestion}
                  />
                </div>
              ))}
              {visibleSuggestions.length === 0 ? (
                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  <span>当前建议均已忽略。重新生成后会基于最新上下文给出新建议。</span>
                  <Button size="sm" variant="outline" onClick={regenerateSuggestions}>
                    <RefreshCw className="size-3.5" />
                    重新生成
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>

        <Separator />
        <CardContent className="space-y-3 border-t py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                value={internalMode ? "note" : "reply"}
                onValueChange={(value) => value && setInternalMode(value === "note")}
                size="sm"
              >
                <ToggleGroupItem value="reply">
                  <MessageSquare className="size-3.5" />
                  回复客户
                </ToggleGroupItem>
                <ToggleGroupItem value="note">
                  <StickyNote className="size-3.5" />
                  内部备注
                </ToggleGroupItem>
              </ToggleGroup>
              <Toggle pressed={translationEnabled} onPressedChange={setTranslationEnabled} aria-label="自动翻译">
                <Languages className="size-4" />
                自动翻译
              </Toggle>

              <Button variant="outline" size="sm" onClick={() => setQuickOpen(true)}>
                <BookOpen className="size-4" />
                快捷回复
              </Button>
              <Button variant="outline" size="sm" onClick={openKnowledge}>
                <FileText className="size-4" />
                知识库
              </Button>
            </div>
            <Badge variant={internalMode ? "destructive" : "outline"}>
              {internalMode ? "仅内部可见" : `发送语言：${conversation.language === "es" ? "Español" : conversation.language === "en" ? "English" : "中文"}`}
            </Badge>
          </div>

          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                if (canSend) sendMessage()
              }
            }}
            placeholder={internalMode ? "记录内部备注，不会发送给客户..." : "输入中文回复，发送前自动翻译..."}
            className="min-h-20 resize-none"
          />

          {!internalMode && draft.trim() ? (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                translation.status === "failed"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-dashed bg-muted/40 text-muted-foreground"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {translation.status === "failed" ? "翻译失败" : forceOriginal ? "仅发送原文" : "将发送给客户"}
                </span>
                <span className="text-[11px] opacity-75">
                  {translation.provider} · 中文 → {conversation.language === "es" ? "Español" : conversation.language === "en" ? "English" : "中文"}
                </span>
              </div>
              {translation.status === "failed" ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs leading-5">
                    翻译服务暂不可用。你可以重试，或选择仅发送原文；原文和译稿状态都会记录。
                  </p>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => setForceOriginal(true)}>
                      仅发送原文
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => notify("已重新尝试翻译")}>
                      <RefreshCw className="size-3" />
                      重试翻译
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs leading-5">{forceOriginal ? draft : translation.text}</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {internalMode ? "内部备注不发送给客户" : "发送前必须人工确认"}
              </Badge>
              {activeAssist ? (
                <Badge variant="secondary" className="text-[10px]">
                  {activeAssist.source === "suggestion" ? "已填充 AI 建议" : activeAssist.source === "quick" ? "已填充常用语" : "已引用知识库"}
                </Badge>
              ) : null}
              <span>{notice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft("")
                  setAssists((current) => ({ ...current, [conversation.id]: null }))
                }}
                disabled={!draft}
              >
                清空
              </Button>
              <Button onClick={sendMessage} disabled={!canSend}>
                <Send className="size-4" />
                {internalMode ? "保存备注" : forceOriginal ? "仅发送原文" : "发送"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full rounded-xl">
        <Tabs value={panelTab} onValueChange={(value) => setPanelTab(value as PanelTab)} className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">会话上下文</CardTitle>
            <CardDescription>客户、订单、历史与 AI 判断集中在这里。</CardDescription>
            <TabsList className="mt-2 w-full">
              <TabsTrigger value="customer" className="flex-1">客户</TabsTrigger>
              <TabsTrigger value="orders" className="flex-1">订单</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">历史</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">AI</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="h-[calc(100%-132px)] overflow-y-auto">
            <TabsContent value="customer" className="mt-0 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback>{conversation.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{conversation.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conversation.customer.customerId} · {conversation.customer.level}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                  <span className="text-muted-foreground">邮箱</span>
                  <span className="truncate">{conversation.customer.email}</span>
                </div>
                <div className="flex justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                  <span className="text-muted-foreground">电话</span>
                  <span>{conversation.customer.phone}</span>
                </div>
                <div className="flex justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                  <span className="text-muted-foreground">地区</span>
                  <span>{conversation.customer.region}</span>
                </div>
                <div className="flex justify-between gap-2 rounded-lg bg-muted/50 p-2.5">
                  <span className="text-muted-foreground">累计订单</span>
                  <span>{conversation.customer.totalOrders}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">风险标签</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {conversation.customer.riskTags.length ? (
                    conversation.customer.riskTags.map((tag) => (
                      <Badge key={tag} variant={tag.includes("安全") || tag.includes("投诉") ? "destructive" : "outline"}>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">暂无风险标签</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">当前访问上下文</p>
                <p>页面：{conversation.context.currentPage}</p>
                <p>设备：{conversation.context.device}</p>
                <p>来源：{conversation.context.source}</p>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-0 space-y-3">
              {conversation.orders.map((order) => (
                <div key={order.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{order.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{order.product}</p>
                    </div>
                    <Badge variant={order.status.includes("退款") ? "outline" : "secondary"}>{order.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.amount}</span>
                    <span>{order.updatedAt}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => notify("已打开业务系统订单详情（Mock）")}>
                <ShoppingBag className="size-4" />
                查询业务系统订单
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-3">
              {conversation.history.map((item) => (
                <div key={item.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{item.date}</span>
                    <Badge variant="outline">{item.channel}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.resolution}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="ai" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-muted-foreground">客户情绪</p>
                  <Badge variant={sentimentLabels[conversation.sentiment].tone} className="mt-2">
                    {sentimentLabels[conversation.sentiment].label}
                  </Badge>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-muted-foreground">风险等级</p>
                  <Badge variant={riskLabels[conversation.riskLevel].tone} className="mt-2">
                    {riskLabels[conversation.riskLevel].label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">会话摘要</p>
                  <Button size="xs" variant="outline" onClick={generateSummary}>
                    <Sparkles className="size-3" />
                    AI 生成
                  </Button>
                </div>
                <Textarea
                  value={summary}
                  onChange={(event) =>
                    setSummaries((current) => ({ ...current, [conversation.id]: event.target.value }))
                  }
                  className="min-h-40 text-xs leading-5"
                  aria-label="会话摘要"
                />
                <Button size="sm" variant="outline" className="w-full" onClick={saveSummary}>
                  <Check className="size-3.5" />
                  保存摘要
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">AI 建议记录</p>
                {events.length ? (
                  <div className="space-y-2">
                    {events.slice(0, 6).map((event) => (
                      <div key={event.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                        <span className="truncate">
                          {actionLabels[event.action]} · {event.tone ?? "正式"}
                        </span>
                        <span className="text-muted-foreground">{event.at}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    暂无记录。客服使用、修改或忽略建议后会自动记录。
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <Bot className="size-3.5" />
                  当前 AI 策略
                </p>
                <p className="mt-2">只建议，不自动发送；高风险会话禁止 AI 自动回复。</p>
                <p className="mt-1">建议结合知识库、订单和客户历史生成。</p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="border-t pt-3">
          <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {conversation.slaDueIn} 后触发超时提醒
            <ChevronRight className="ml-auto size-3.5" />
          </div>
        </CardFooter>
      </Card>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>常用语与快捷回复</DialogTitle>
            <DialogDescription>支持个人、团队和租户级常用语，可搜索快捷键和变量。</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="搜索 /refund、退款、安抚..."
              className="pl-8"
            />
          </div>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {filteredQuickReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => fillQuickReply(reply)}
                className="w-full rounded-xl border p-3 text-left transition hover:bg-muted/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{reply.title}</span>
                  <Badge variant="outline" className="text-[10px]">{reply.shortcut}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{reply.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">{reply.scope}</Badge>
                  {reply.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-[10px]">{variable}</Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{reply.zh}</p>
              </button>
            ))}
            {filteredQuickReplies.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">没有匹配的常用语。</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>知识库参考</DialogTitle>
            <DialogDescription>引用答案后会填充到输入框，客服仍需确认后再发送。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {knowledgeBases.map((base) => (
              <Button
                key={base.id}
                size="sm"
                variant={base.id === activeKnowledgeBase.id ? "default" : "outline"}
                onClick={() => setKnowledgeBaseId(base.id)}
              >
                {base.name}
              </Button>
            ))}
          </div>
          <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            {activeDocs.map((doc) => (
              <div key={doc.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{doc.title}</span>
                  <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{doc.language}</Badge>
                  <Badge variant={doc.status === "已发布" ? "secondary" : "outline"} className="text-[10px]">
                    {doc.status}
                  </Badge>
                  <span className="ml-auto text-[11px] text-muted-foreground">命中 {doc.hits} 次</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{doc.answer}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  {doc.channels?.map((channel) => <Badge key={channel} variant="outline" className="text-[10px]">{channel}</Badge>)}
                  {doc.effectiveAt ? <span>生效：{doc.effectiveAt}</span> : null}
                  <Button size="xs" variant="outline" className="ml-auto" onClick={() => fillKnowledgeDoc(doc)}>
                    填入回复
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转接会话</DialogTitle>
            <DialogDescription>转接时会带上会话摘要、客户情绪和风险等级。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="transfer-target">转接对象</label>
              <Select value={transferTarget} onValueChange={setTransferTarget}>
                <SelectTrigger id="transfer-target" className="w-full">
                  <SelectValue placeholder="选择团队或坐席" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="售后一组 · 李然">售后一组 · 李然</SelectItem>
                  <SelectItem value="售后二组 · 陈晓">售后二组 · 陈晓</SelectItem>
                  <SelectItem value="账号安全组 · 值班主管">账号安全组 · 值班主管</SelectItem>
                  <SelectItem value="AI 客服员工 · 售后专员">AI 客服员工 · 售后专员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="transfer-reason">转接原因</label>
              <Textarea
                id="transfer-reason"
                value={transferReason}
                onChange={(event) => setTransferReason(event.target.value)}
                placeholder="例如：需要账号安全团队复核身份"
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>取消</Button>
            <Button onClick={confirmTransfer}>
              <ArrowRightLeft className="size-4" />
              确认转接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
