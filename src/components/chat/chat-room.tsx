"use client"

import {
  Languages,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"

import {
  aiSuggestions,
  chatConversations,
  chatMessages,
  knowledgeBases,
  knowledgeDocs,
  quickReplies,
  quickTranslations,
  type ChatStatus,
} from "@/data/mock/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "customer" | "agent"
  text: string
  translated?: string
  time: string
}

type Tone = "正式" | "友好" | "简洁" | "安抚"
type TranslationDirection = "zh-en" | "en-zh"

const tones: Tone[] = ["正式", "友好", "简洁", "安抚"]

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

function translate(text: string, direction: TranslationDirection) {
  const item = quickTranslations[text]
  if (item) return direction === "zh-en" ? item.en : item.zh
  return text.trim() ? "暂未提供该句子的翻译" : ""
}

function ConversationList({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <Card className="h-full rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          会话
        </CardTitle>
        <CardDescription>按当前接入渠道聚合客户会话。</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ScrollArea className="h-80 sm:h-[560px] xl:h-full">
          <div className="px-3 pb-3">
            {chatConversations.map((conversation) => {
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
                      <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.app}</p>
                      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{conversation.preview}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={statusLabels[conversation.status].variant}>
                          {statusLabels[conversation.status].label}
                        </Badge>
                        {conversation.unreadCount > 0 ? (
                          <Badge>{conversation.unreadCount} 条未读</Badge>
                        ) : null}
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
  const [activeConversationId, setActiveConversationId] = useState("c1")
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages)
  const [draft, setDraft] = useState("")
  const [showTranslation, setShowTranslation] = useState(true)
  const [tone, setTone] = useState<Tone>("正式")
  const [direction, setDirection] = useState<TranslationDirection>("zh-en")
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)

  const conversation = chatConversations.find((item) => item.id === activeConversationId) ?? chatConversations[0]
  const activeKnowledgeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId)
  const activeDocs = knowledgeDocs.filter((item) => item.baseId === knowledgeBaseId)
  const draftTranslation = useMemo(() => translate(draft, direction), [draft, direction])

  function send(content: string) {
    const value = content.trim()
    if (!value) return
    setMessages((current) => [
      ...current,
      { id: `m_${Date.now()}`, role: "agent", text: value, time: "刚刚" },
    ])
    setDraft("")
  }

  return (
    <div className="grid gap-4 xl:h-[calc(100dvh-118px)] xl:min-h-[680px] xl:grid-cols-[310px_minmax(0,1fr)_340px]">
      <ConversationList activeId={activeConversationId} onSelect={setActiveConversationId} />

      <Card className="flex min-h-[680px] flex-col rounded-xl">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b">
          <div>
            <CardTitle>{conversation.name} · {conversation.app}</CardTitle>
            <CardDescription>客户语言：英语 · AI 客服员工：海外客服</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Toggle pressed={showTranslation} onPressedChange={setShowTranslation} aria-label="显示译文">
              <Languages className="size-4" />
              译文
            </Toggle>
            <Badge variant="outline">正常接入</Badge>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "agent" && "justify-end")}>
                  <div
                    className={cn(
                      "max-w-[78%] space-y-2 rounded-xl border p-3.5",
                      message.role === "agent"
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    {showTranslation && message.translated ? (
                      <p className="border-t border-current/15 pt-2 text-xs opacity-80">{message.translated}</p>
                    ) : null}
                    <p className="text-right text-[11px] opacity-70">{message.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <Separator />
        <CardContent className="space-y-3 py-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={direction === "zh-en" ? "输入中文回复..." : "Enter an English reply..."}
            className="min-h-24 resize-none"
          />
          {draftTranslation ? (
            <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium">译稿：</span>{draftTranslation}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup
              type="single"
              value={direction}
              onValueChange={(value) => value && setDirection(value as TranslationDirection)}
            >
              <ToggleGroupItem value="zh-en">中译英</ToggleGroupItem>
              <ToggleGroupItem value="en-zh">英译中</ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => send(draft)} disabled={!draft.trim()}>
              <Send className="size-4" />
              发送
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">辅助面板</CardTitle>
          <CardDescription>切换 AI 建议、快捷回复和知识库。</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ai" className="h-96 sm:h-[520px] xl:h-full">
            <TabsList className="w-full">
              <TabsTrigger value="ai" className="w-full">AI</TabsTrigger>
              <TabsTrigger value="quick" className="w-full">快捷</TabsTrigger>
              <TabsTrigger value="knowledge" className="w-full">知识</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <ToggleGroup type="single" value={tone} onValueChange={(value) => value && setTone(value as Tone)} className="w-full">
                {tones.map((item) => (
                  <ToggleGroupItem key={item} value={item} className="flex-1">{item}</ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="space-y-3">
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

            <TabsContent value="quick" className="mt-4 space-y-3">
              {quickReplies.map((item) => (
                <button
                  key={item.english}
                  type="button"
                  onClick={() => send(item.english)}
                  className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/60"
                >
                  <p className="text-sm font-medium">{item.english}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.chinese}</p>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="knowledge" className="mt-4 space-y-3">
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
