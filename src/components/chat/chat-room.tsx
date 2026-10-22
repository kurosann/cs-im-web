"use client"

import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileText,
  Headphones,
  Languages,
  MessageSquare,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { copyText } from "@/lib/copy-text"

import {
  aiSuggestions,
  knowledgeBases,
  knowledgeDocs,
  quickReplies,
  quickTranslations,
  translateDraft,
  type ChatStatus,
} from "@/data/mock/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller"
import { ReadMore } from "@/components/ui/read-more"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { readSession } from "@/lib/auth"
import {
  type Conversation,
  closeConversation,
  GatewayApiError,
  listConversations,
  listRelayMessages,
  markConversationRead,
  sendRelayMessage,
  type RelayMessage,
} from "@/lib/gateway"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: RelayMessage["sender"]["role"]
  type: RelayMessage["type"]
  text: string
  content?: RelayMessage["content"]
  translated?: string
  time: string
  seq: number
  senderName?: string
}

type Tone = "正式" | "友好" | "简洁" | "安抚"
type TranslationLanguage = "en" | "es" | "zh"
type SendMode = "original" | "translated"

const tones: Tone[] = ["正式", "友好", "简洁", "安抚"]
const sendModeLabels: Record<SendMode, string> = {
  original: "发送原文",
  translated: "发送译文",
}
const translationLanguages: Record<TranslationLanguage, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
}
const READ_POSITIONS_KEY = "cs-im-web.read-positions"

function getReadPosition(userId: string | undefined, conversationId: string) {
  if (!userId || !conversationId || typeof window === "undefined") return null

  try {
    const positions = JSON.parse(window.localStorage.getItem(READ_POSITIONS_KEY) ?? "{}") as Record<string, number>
    const position = positions[`${userId}:${conversationId}`]
    return typeof position === "number" ? position : null
  } catch {
    return null
  }
}

function saveReadPosition(userId: string, conversationId: string, seq: number) {
  if (!userId || !conversationId || !seq || typeof window === "undefined") return

  try {
    const positions = JSON.parse(window.localStorage.getItem(READ_POSITIONS_KEY) ?? "{}") as Record<string, number>
    const key = `${userId}:${conversationId}`
    if ((positions[key] ?? 0) >= seq) return

    positions[key] = seq
    window.localStorage.setItem(READ_POSITIONS_KEY, JSON.stringify(positions))
  } catch {
    return
  }
}

function ReadDivider() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span className="rounded-full border px-2 py-0.5">上次已读</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function ReadPositionTracker({
  conversationId,
  messages,
  onRead,
}: {
  conversationId: string
  messages: ChatMessage[]
  onRead: (conversationId: string) => void
}) {
  const { visibleMessageIds } = useMessageScrollerVisibility()
  const readConversationIdRef = useRef<string | null>(null)
  const lastReadPositionRef = useRef<{ conversationId: string; seq: number } | null>(null)

  useEffect(() => {
    if (!conversationId || visibleMessageIds.length === 0) return

    const session = readSession()
    if (!session) return

    const visibleMessageIdsSet = new Set(visibleMessageIds)
    const readSeq = messages.reduce((latest, message) => (
      visibleMessageIdsSet.has(message.id) && message.seq > latest ? message.seq : latest
    ), 0)
    saveReadPosition(session.userId, conversationId, readSeq)
    const lastReadPosition = lastReadPositionRef.current
    if (readSeq > 0 && (
      lastReadPosition?.conversationId !== conversationId ||
      readSeq > lastReadPosition.seq
    )) {
      readConversationIdRef.current = conversationId
      lastReadPositionRef.current = { conversationId, seq: readSeq }
      onRead(conversationId)
    }
  }, [conversationId, messages, onRead, visibleMessageIds])

  return null
}

function formatChatTime(value: string, includeSeconds = true) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString("zh-CN", { hour12: false })

  return date.toLocaleString("zh-CN", {
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: date.getFullYear() === now.getFullYear() ? undefined : "2-digit",
    minute: date.getFullYear() === now.getFullYear() ? undefined : "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  })
}

const statusLabels: Record<ChatStatus, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
  waiting: { label: "待人工", variant: "destructive" },
  ai: { label: "AI 已处理", variant: "secondary" },
  human: { label: "人工处理中", variant: "outline" },
}

const toneSuggestions: Record<Tone, typeof aiSuggestions> = {
  正式: aiSuggestions,
  友好: [
    {
      english: "Good news - I have checked this and it should be resolved in 1-2 business days.",
      chinese: "好消息，我已经帮您确认，预计 1-2 个工作日解决。",
    },
    {
      english: "I will keep an eye on it and let you know as soon as there is an update.",
      chinese: "我会持续关注，一有进展就通知您。",
    },
    {
      english: "Would you like me to send over the latest progress screenshot?",
      chinese: "需要我把最新进度截图发给您吗？",
    },
  ],
  简洁: [
    { english: "Refund review: 1-2 business days.", chinese: "退款复核：1-2 个工作日。" },
    { english: "I have prioritized your case.", chinese: "已加急处理。" },
    { english: "Send progress screenshot?", chinese: "需要发进度截图吗？" },
  ],
  安抚: [
    {
      english: "I understand your concern and have prioritized this case.",
      chinese: "非常理解您的担忧，已经优先处理您的问题。",
    },
    {
      english: "The refund is under final review and should arrive in 1-2 business days.",
      chinese: "退款正在最后复核，预计 1-2 个工作日到账。",
    },
    {
      english: "I will continue following up until the result is confirmed.",
      chinese: "我会持续跟进，直到确认到账。",
    },
  ],
}

function ConversationList({
  activeId,
  onSelect,
  items,
}: {
  activeId: string
  onSelect: (id: string) => void
  items: Conversation[]
}) {
  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftTime = Date.parse(left.lastMessageAt ?? "")
      const rightTime = Date.parse(right.lastMessageAt ?? "")
      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0
      if (Number.isNaN(leftTime)) return 1
      if (Number.isNaN(rightTime)) return -1
      return rightTime - leftTime
    })
  }, [items])

  return (
    <Card className="flex h-full flex-col rounded-xl">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          会话
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-0 pb-0">
        <ScrollArea className="h-80 sm:h-[560px] xl:h-full">
          <div className="px-3 pb-3">
            {sortedItems.map((conversation) => {
              const active = conversation.conversationId === activeId
              const status = conversation.status === "closed"
                ? { label: "已关闭", variant: "outline" as const }
                : statusLabels[conversation.assignee ? "human" : "waiting"]

              return (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => onSelect(conversation.conversationId)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/60",
                    active && "bg-sidebar-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="size-10">
                        <AvatarFallback>{(conversation.customerName || conversation.customerId).slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      {(conversation.unreadCount ?? 0) > 0 ? (
                        <span
                          aria-label={`未读 ${conversation.unreadCount} 条`}
                          className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white"
                        >
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{conversation.customerName || conversation.customerId}</p>
                        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                          {formatChatTime(conversation.updatedAt, false)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.channel || "未知渠道"}</p>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">{conversation.lastMessage || "暂无消息"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant={(conversation.replyStatus ?? "unreplied") === "unreplied" ? "warning" : "outline"}>
                          {(conversation.replyStatus ?? "unreplied") === "unreplied" ? "未回复" : "已回复"}
                        </Badge>
                      </div>
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

export function ChatRoom() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState("")
  const [messages, setMessages] = useState<RelayMessage[]>([])
  const [draft, setDraft] = useState("")
  const [showTranslation, setShowTranslation] = useState(false)
  const [tone, setTone] = useState<Tone>("正式")
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>("en")
  const [sendMode, setSendMode] = useState<SendMode>("original")
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [closingConversation, setClosingConversation] = useState(false)
  const realtimeControllerRef = useRef<AbortController | null>(null)
  const activeConversationIdRef = useRef("")
  const pendingMessagesRef = useRef(new Map<string, RelayMessage[]>())
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const conversation = conversations.find((item) => item.conversationId === activeConversationId)
  const activeKnowledgeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId)
  const activeDocs = knowledgeDocs.filter((item) => item.baseId === knowledgeBaseId)
  const session = readSession()
  const operatorName = session?.displayName || session?.email || ""
  const initialReadSeq = useMemo(
    () => getReadPosition(session?.userId, activeConversationId),
    [activeConversationId, session?.userId],
  )

  const selectConversation = useCallback((conversationId: string) => {
    if (activeConversationIdRef.current === conversationId) return

    activeConversationIdRef.current = conversationId
    setActiveConversationId(conversationId)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("conversationId", conversationId)
      window.history.replaceState(history.state, "", url.pathname + url.search)
    }
    setMessages([])
    setHasMore(false)
    setLoadingMessages(true)
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const page = await listConversations({ page: 1, pageSize: 50, status: "open" })
      setConversations(page.items.filter((item) => item.status === "open"))
      const requestedId = new URLSearchParams(window.location.search).get("conversationId")
      if (requestedId && page.items.some((item) => item.conversationId === requestedId)) {
        selectConversation(requestedId)
        return
      }
      setActiveConversationId((current) => (
        page.items.some((item) => item.conversationId === current)
          ? current
          : page.items[0]?.conversationId ?? ""
      ))
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "获取会话列表失败。"
      toast.error(message)
    }
  }, [selectConversation])

  const clearUnread = useCallback(async (conversationId: string) => {
    if (!conversationId) return

    try {
      await markConversationRead(conversationId)
      setConversations((current) => current.map((item) => (
        item.conversationId === conversationId ? { ...item, unreadCount: 0 } : item
      )))
      window.dispatchEvent(new CustomEvent("cs-im:unread-changed"))
    } catch {
      return
    }
  }, [])

  const upsertMessages = useCallback((incoming: RelayMessage[]) => {
    setMessages((current) => {
      const messageMap = new Map(current.map((item) => [item.messageId, item]))
      incoming.forEach((item) => {
        if (item.messageId) messageMap.set(item.messageId, item)
      })
      return [...messageMap.values()].sort((left, right) => left.seq - right.seq)
    })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversations()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadConversations])

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    const textarea = draftTextareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [draft])

  useEffect(() => {
    const session = readSession()
    if (!session) return

    const controller = new AbortController()
    realtimeControllerRef.current = controller

    async function connectRealtime() {
      const response = await fetch("/api/workbench/realtime", {
        headers: { Authorization: `Bearer ${session?.token}` },
        signal: controller.signal,
      })
      if (!response.ok || !response.body) throw new Error(`realtime failed: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let boundary = buffer.indexOf("\n\n")
        while (boundary >= 0) {
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          boundary = buffer.indexOf("\n\n")
          const line = frame.split("\n").find((item) => item.startsWith("data: "))
          if (!line) continue

          try {
            const event = JSON.parse(line.slice(6)) as {
              type?: string
              data?: RelayMessage | Conversation
            }
            if (event.type === "conversation.created" && event.data && "conversationId" in event.data) {
              selectConversation(event.data.conversationId)
              void loadConversations()
              continue
            }
            if (event.type === "message.created" && event.data && "messageId" in event.data) {
              if (event.data.conversationId === activeConversationIdRef.current) {
                upsertMessages([event.data])
              } else {
                const pendingMessages = pendingMessagesRef.current.get(event.data.conversationId) ?? []
                pendingMessagesRef.current.set(event.data.conversationId, [...pendingMessages, event.data])
                selectConversation(event.data.conversationId)
              }
              void loadConversations()
            }
            if (event.type === "conversation.closed") {
              void loadConversations()
            }
          } catch {
            continue
          }
        }
      }
    }

    async function runRealtime() {
      while (!controller.signal.aborted) {
        try {
          await connectRealtime()
        } catch {
          if (controller.signal.aborted) return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 3000))
      }
    }

    void runRealtime()

    return () => {
      controller.abort()
      realtimeControllerRef.current = null
    }
  }, [loadConversations, selectConversation, upsertMessages])

  useEffect(() => {
    if (!activeConversationId) return
    let cancelled = false

    async function initialize() {
      setLoadingMessages(true)
      setMessages([])
      setHasMore(false)

      try {
        const page = await listRelayMessages(activeConversationId)
        if (cancelled) return
        const pendingMessages = pendingMessagesRef.current.get(activeConversationId) ?? []
        pendingMessagesRef.current.delete(activeConversationId)
        upsertMessages([...page.items, ...pendingMessages])
        setHasMore(page.hasMore)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof GatewayApiError ? error.message : "获取历史消息失败。"
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [activeConversationId, selectConversation, upsertMessages])

  const displayMessages = useMemo<ChatMessage[]>(() => {
    return messages.map((message) => ({
      id: message.messageId,
      role: message.sender?.role ?? "system",
      type: message.type,
      text: message.text ?? "",
      content: message.content,
      translated: quickTranslations[message.text ?? ""]?.[translationLanguage],
      time: formatChatTime(message.source?.sentAt ?? message.receivedAt ?? ""),
      seq: message.seq,
      senderName:
        message.sender?.role === "agent"
          ? operatorName || message.sender.id
          : message.sender?.role === "ai"
            ? "AI 客服"
            : undefined,
    }))
  }, [messages, operatorName, translationLanguage])

  const firstUnreadIndex = initialReadSeq === null
    ? -1
    : displayMessages.findIndex((message) => message.seq > initialReadSeq)
  const readDividerId = firstUnreadIndex >= 0
    ? `read-divider-${activeConversationId}`
    : null
  const draftTranslation = useMemo(
    () => translateDraft(draft, translationLanguage),
    [draft, translationLanguage],
  )
  const outboundDraft = sendMode === "translated" ? draftTranslation.text?.trim() : draft.trim()

  async function send(content: string) {
    const value = content.trim()
    if (!value || sending || !activeConversationId) return
    setSending(true)
    try {
      const message = await sendRelayMessage({
        conversationId: activeConversationId,
        text: value,
      })
      upsertMessages([message])
      void loadConversations()
      setDraft("")
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "发送客服消息失败。"
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  async function copyMessage(message: ChatMessage) {
    if (!message.text) return

    try {
      await copyText(message.text)
      setCopiedMessageId(message.id)
      toast.success("已复制消息")
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current))
      }, 1600)
    } catch {
      toast.error("复制消息失败。")
    }
  }

  async function closeActiveConversation() {
    if (!activeConversationId || closingConversation) return
    setClosingConversation(true)
    try {
      await closeConversation(activeConversationId)
      setConversations((current) => current.filter(
        (item) => item.conversationId !== activeConversationId && item.status === "open",
      ))
      toast.success("会话已关闭")
      void loadConversations()
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "关闭会话失败。"
      toast.error(message)
    } finally {
      setClosingConversation(false)
    }
  }

  function sendOutbound() {
    if (outboundDraft) void send(outboundDraft)
  }

  async function loadOlder() {
    const oldestSeq = messages[0]?.seq ?? 0
    if (!hasMore || !oldestSeq || loadingMessages || !activeConversationId) return
    setLoadingMessages(true)
    try {
      const page = await listRelayMessages(activeConversationId, oldestSeq)
      upsertMessages(page.items)
      setHasMore(page.hasMore)
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "加载历史消息失败。"
      toast.error(message)
    } finally {
      setLoadingMessages(false)
    }
  }

  return (
    <div className="grid gap-4 min-h-0 xl:h-[calc(100dvh-118px)] xl:min-h-[620px] xl:grid-cols-[300px_minmax(0,1fr)_322px]">
      <ConversationList
        activeId={activeConversationId}
        onSelect={selectConversation}
        items={conversations}
      />

      <Card className="flex min-h-[620px] flex-col gap-0 rounded-xl py-0">
        <CardHeader className="border-b pb-0 pt-3">
          <div>
            <CardTitle>{conversation ? conversation.customerName || conversation.customerId : "选择会话"}</CardTitle>
            <CardDescription>{conversation ? conversation.channel || "未知渠道" : null}</CardDescription>
          </div>
          <CardAction className="flex items-center gap-2">
            <div className="relative flex items-center">
              <div
                aria-hidden={!showTranslation}
                className={cn(
                  "absolute top-0 right-full transition-[clip-path] duration-200 ease-out",
                  !showTranslation && "pointer-events-none"
                )}
                style={{
                  clipPath: showTranslation ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
                }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      tabIndex={showTranslation ? 0 : -1}
                      aria-label={`选择翻译语言，当前 ${translationLanguages[translationLanguage]}`}
                      className="h-7 rounded-l-lg rounded-r-none border-r-0 px-2.5 text-xs"
                    >
                      {translationLanguages[translationLanguage]}
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuLabel>翻译语言</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {Object.entries(translationLanguages).map(([value, label]) => (
                        <DropdownMenuItem
                          key={value}
                          onSelect={() => {
                            setTranslationLanguage(value as TranslationLanguage)
                            setShowTranslation(true)
                          }}
                        >
                          {translationLanguage === value ? <CheckIcon /> : null}
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                variant={showTranslation ? "default" : "outline"}
                aria-pressed={showTranslation}
                aria-label={showTranslation ? "关闭翻译" : "开启翻译"}
                onClick={() => setShowTranslation(!showTranslation)}
                className={cn(
                  "h-7 rounded-lg px-2.5 text-xs transition-[border-radius] duration-300 ease-out",
                  showTranslation && "rounded-l-none border-l-0"
                )}
              >
                <Languages className="size-3.5" />
                翻译
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!activeConversationId || closingConversation}
                aria-label="关闭当前会话"
                onClick={() => {
                  void closeActiveConversation()
                }}
              >
                关闭会话
                <X className="size-3.5" />
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 px-0 py-0">
          <MessageScrollerProvider autoScroll defaultScrollPosition={readDividerId ? "last-anchor" : "end"}>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-3 px-3 py-3">
                  {loadingMessages ? (
                    <MessageScrollerItem className="flex justify-center py-8">
                      <Marker role="status" aria-live="polite">
                        <MarkerIcon>
                          <Spinner />
                        </MarkerIcon>
                        <MarkerContent className="shimmer">
                          {displayMessages.length === 0 ? "正在加载消息..." : "加载中..."}
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>
                  ) : hasMore ? (
                    <MessageScrollerItem className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="加载更早消息"
                        onClick={() => void loadOlder()}
                      >
                        加载更早消息
                      </Button>
                    </MessageScrollerItem>
                  ) : null}
                  {!loadingMessages && displayMessages.length === 0 ? (
                    <MessageScrollerItem>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        等待客户消息…
                      </p>
                    </MessageScrollerItem>
                  ) : null}
                  {displayMessages.map((message, index) => {
                    const isAgent = message.role === "agent" || message.role === "ai"
                    const showReadDivider = index === firstUnreadIndex

                    return (
                      <Fragment key={message.id}>
                        {showReadDivider ? (
                          <MessageScrollerItem messageId={readDividerId ?? undefined} scrollAnchor>
                            <ReadDivider />
                          </MessageScrollerItem>
                        ) : null}
                        <MessageScrollerItem messageId={message.id}>
                          <Message align={isAgent ? "end" : "start"}>
                            <MessageAvatar className="self-end">
                              <Avatar className="size-8">
                                <AvatarFallback
                                  className={cn(isAgent ? "bg-primary text-primary-foreground" : "bg-muted")}
                                >
                                  {isAgent ? <Headphones className="size-4" /> : <User className="size-4" />}
                                </AvatarFallback>
                              </Avatar>
                            </MessageAvatar>
                            <MessageContent>
                              {isAgent ? <MessageHeader>{message.senderName}</MessageHeader> : null}
                              <Bubble
                                variant={isAgent ? "default" : "secondary"}
                                align={isAgent ? "end" : "start"}
                                className="max-w-[min(80%,640px)]"
                              >
                                <BubbleContent className="flex flex-col gap-1.5 px-3 py-2.5">
                                  {message.type === "image" && message.content?.url ? (
                                    <img
                                      src={message.content.url}
                                      alt={message.content.fileName || (isAgent ? "客服图片" : "客户图片")}
                                      className="size-auto max-h-64 max-w-full rounded-lg object-contain"
                                    />
                                  ) : message.type === "video" && message.content?.url ? (
                                    <video
                                      src={message.content.url}
                                      controls
                                      preload="metadata"
                                      className="size-auto max-h-64 max-w-full rounded-lg"
                                    />
                                  ) : message.type === "file" && message.content?.url ? (
                                    <a
                                      href={message.content.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex w-fit max-w-full items-center gap-2 rounded-md bg-background/60 px-2 py-1 transition hover:bg-background"
                                    >
                                      <FileText className="size-4 shrink-0" />
                                      <span className="truncate">{message.content.fileName || "查看附件"}</span>
                                    </a>
                                  ) : null}
                                  {message.text ? (
                                    <ReadMore lines={8} moreLabel="展开" lessLabel="收起">
                                      <p className="whitespace-pre-wrap">{message.text}</p>
                                    </ReadMore>
                                  ) : null}
                                  {showTranslation && message.translated ? (
                                    <ReadMore lines={4} moreLabel="展开" lessLabel="收起" className="opacity-80">
                                      <p className="border-t border-current/15 pt-1.5 text-xs leading-5">
                                        {message.translated}
                                      </p>
                                    </ReadMore>
                                  ) : null}
                                </BubbleContent>
                              </Bubble>
                              <MessageFooter className="gap-1.5">
                                <span>{message.time}</span>
                                {message.text ? (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={copiedMessageId === message.id ? "已复制" : "复制消息"}
                                    title={copiedMessageId === message.id ? "已复制" : "复制消息"}
                                    onClick={() => void copyMessage(message)}
                                    className="size-6 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <CheckIcon className="size-3" />
                                    ) : (
                                      <CopyIcon className="size-3" />
                                    )}
                                  </Button>
                                ) : null}
                              </MessageFooter>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      </Fragment>
                    )
                  })}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
            <ReadPositionTracker
              conversationId={activeConversationId}
              messages={displayMessages}
              onRead={clearUnread}
            />
          </MessageScrollerProvider>
        </CardContent>

        <CardContent className="px-3 pb-3 pt-0">
          {draft.trim() ? (
            <div className="mb-1.5 flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground">
              <Languages className="mt-0.5 size-3.5 shrink-0" />
              <p className="min-w-0 flex-1 line-clamp-2">
                <span className="font-medium">{translationLanguages[translationLanguage]}</span>
                <span className="mx-1.5">·</span>
                {draftTranslation.text ?? "暂无可用翻译"}
              </p>
            </div>
          ) : null}
          <InputGroup className="min-h-[96px] flex-col items-stretch rounded-2xl shadow-sm transition-shadow focus-within:shadow-md dark:bg-input/20">
            <InputGroupTextarea
              ref={draftTextareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  sendOutbound()
                }
              }}
              placeholder="输入回复..."
              aria-label="输入回复"
              disabled={!activeConversationId || sending}
              rows={1}
              className="max-h-40 min-h-11 resize-none overflow-y-auto px-4 py-3 text-sm leading-6"
            />
            <InputGroupAddon
              align="block-end"
              className="items-center justify-between gap-3 px-2 pb-2 pt-0"
            >
              <span className="text-xs text-muted-foreground">
                Enter 发送 · Shift + Enter 换行
              </span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton
                      size="sm"
                      variant="ghost"
                      aria-label="选择发送内容"
                      className="h-8 rounded-full px-3"
                    >
                      {sendModeLabels[sendMode]}
                      <ChevronDownIcon />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => setSendMode("original")}
                      >
                        <MessageSquare />
                        发送原文
                        {sendMode === "original" ? <CheckIcon className="ml-auto" /> : null}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setSendMode("translated")}
                      >
                        <Languages />
                        发送译文
                        {sendMode === "translated" ? <CheckIcon className="ml-auto" /> : null}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  size="icon-sm"
                  variant="default"
                  aria-label="发送回复"
                  onClick={sendOutbound}
                  disabled={!outboundDraft || sending || !activeConversationId}
                  className="size-9 rounded-full"
                >
                  {sending ? <Spinner className="size-4" /> : <ArrowUpIcon className="size-4" />}
                </InputGroupButton>
              </div>
            </InputGroupAddon>
          </InputGroup>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col rounded-xl">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">辅助面板</CardTitle>
          <CardDescription>切换 AI 建议、快捷回复和知识库。</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 px-3 pb-0">
          <Tabs defaultValue="ai" className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="ai" className="w-full">AI</TabsTrigger>
              <TabsTrigger value="quick" className="w-full">快捷</TabsTrigger>
              <TabsTrigger value="knowledge" className="w-full">知识</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 pb-3">
              <ToggleGroup type="single" value={tone} onValueChange={(value) => value && setTone(value as Tone)} className="w-full">
                {tones.map((item) => (
                  <ToggleGroupItem key={item} value={item} className="flex-1">{item}</ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="space-y-2.5">
                {toneSuggestions[tone].map((item) => (
                  <button
                    key={item.english}
                    type="button"
                    onClick={() => send(item.english)}
                    className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/60"
                  >
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="size-4 text-muted-foreground" />
                      {item.english}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.chinese}</p>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quick" className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 pb-3">
              {quickReplies.map((item) => (
                <button
                  key={item.en}
                  type="button"
                  onClick={() => send(item.en)}
                  className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/60"
                >
                  <p className="text-sm font-medium">{item.en}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.zh}</p>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="knowledge" className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 pb-3">
              {knowledgeBases.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="h-auto w-full justify-start p-3 text-left"
                  onClick={() => setKnowledgeBaseId(item.id)}
                >
                  <div>
                    <p>{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product}</p>
                  </div>
                </Button>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeKnowledgeBase)} onOpenChange={(open) => !open && setKnowledgeBaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeKnowledgeBase?.name}</DialogTitle>
            <DialogDescription>{activeKnowledgeBase?.description}</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            <div className="space-y-3">
              {activeDocs.map((doc) => (
                <div key={doc.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {doc.type} · {doc.language}
                      </p>
                    </div>
                    <Badge variant={doc.status === "已发布" ? "secondary" : "outline"}>{doc.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{doc.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
