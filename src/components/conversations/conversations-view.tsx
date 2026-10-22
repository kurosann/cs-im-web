"use client"

import {
  ArrowUpRight,
  Search,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { ConversationStatus } from "@/models/conversation"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { readSession } from "@/lib/auth"
import { TablePagination } from "@/components/ui/table-pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  type Conversation,
  GatewayApiError,
  closeConversation,
  listConversations,
} from "@/lib/gateway"

const filters: Array<{ value: "all" | "open" | "closed"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "open", label: "进行中" },
  { value: "closed", label: "已关闭" },
]

const statusVariant = {
  human: "default",
  waiting: "destructive",
  ai: "secondary",
  closed: "ghost",
} as const

const replyVariant = {
  replied: "secondary",
  unreplied: "warning",
} as const

const replyLabel = {
  replied: "已回复",
  unreplied: "未回复",
} as const

const statusLabel = {
  human: "人工处理中",
  waiting: "待人工",
  ai: "AI 已处理",
  closed: "已关闭",
} as const

type WorkbenchConversation = Omit<Conversation, "status"> & {
  status: ConversationStatus
}

function conversationStatus(item: Conversation): ConversationStatus {
  if (item.status === "closed") return "closed"
  return item.assignee ? "human" : "waiting"
}

function formatTime(value: string) {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return time.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" })
}

export function ConversationsView() {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [conversations, setConversations] = useState<WorkbenchConversation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [closingId, setClosingId] = useState<string | null>(null)
  const reloadRef = useRef<(() => void) | null>(null)
  const reloadTimerRef = useRef<number | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listConversations({
        keyword: query,
        status: filter,
        page,
        pageSize,
      })
      setConversations(
        data.items.map((item) => ({ ...item, status: conversationStatus(item) })),
      )
      setTotal(data.total)
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "获取会话列表失败。"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [filter, page, pageSize, query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversations()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [loadConversations])

  useEffect(() => {
    reloadRef.current = () => void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const session = readSession()
    if (!session) return
    const token = session.token

    const controller = new AbortController()
    let buffer = ""

    async function connect() {
      try {
        const response = await fetch("/admin/v1/realtime", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok || !response.body) throw new Error(`realtime failed: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let boundary = buffer.indexOf("\n\n")
          while (boundary >= 0) {
            const frame = buffer.slice(0, boundary)
            buffer = buffer.slice(boundary + 2)
            boundary = buffer.indexOf("\n\n")
            const dataLine = frame.split("\n").find((line) => line.startsWith("data: "))
            if (!dataLine) continue
            try {
              const event = JSON.parse(dataLine.slice(6)) as { type?: string }
              if (["conversation.created", "conversation.closed"].includes(event.type ?? "")) {
                if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current)
                reloadTimerRef.current = window.setTimeout(() => {
                  reloadTimerRef.current = null
                  reloadRef.current?.()
                }, 200)
              }
            } catch {
              continue
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          toast.error("实时更新连接已断开")
        }
      }
    }

    void connect()
    return () => {
      controller.abort()
      if (reloadTimerRef.current) {
        window.clearTimeout(reloadTimerRef.current)
        reloadTimerRef.current = null
      }
    }
  }, [])

  const displayConversations = conversations

  const filteredConversations = useMemo(() => {
    return displayConversations.map((conversation) => ({
      ...conversation,
      channel: conversation.channel || "未知渠道",
      lastMessage: conversation.lastMessage || "暂无消息",
      updatedAt: formatTime(conversation.updatedAt),
    }))
  }, [displayConversations])

  async function handleCloseConversation(conversationId: string) {
    setClosingId(conversationId)
    try {
      await closeConversation(conversationId)
      setConversations((current) => current.filter(
        (item) => item.conversationId !== conversationId,
      ))
      setTotal((current) => Math.max(0, current - 1))
      toast.success("会话已关闭")
      void loadConversations()
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "关闭会话失败。"
      toast.error(message)
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">会话列表</CardTitle>
          <CardDescription>按状态和关键词定位客户会话。</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Table
            className="min-w-[900px]"
            loading={loading}
            loadingMode={filteredConversations.length === 0 ? "visible" : "silent"}
            loadingLabel="正在加载会话…"
            refreshing={loading}
            onRefresh={loadConversations}
            tableFilters={(
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={query}
                    onChange={(event) => {
                      setPage(1)
                      setQuery(event.target.value)
                    }}
                    placeholder="搜索客户、渠道或消息"
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={filter}
                  onValueChange={(value) => {
                    if (!value) return
                    setPage(1)
                    setFilter(value as typeof filter)
                  }}
                  variant="outline"
                  className="shrink-0"
                >
                  {filters.map((item) => (
                    <ToggleGroupItem key={item.value} value={item.value} className="text-xs">
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
            tableActionsRight={(
              <Button asChild>
                <Link href="/chat">
                  打开客服聊天
                </Link>
              </Button>
            )}
          >
              <TableHeader>
                <TableRow>
                  <TableHead>客户</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>最近消息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>回复</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <TableRow key={conversation.conversationId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar size="sm">
                          <AvatarFallback>{(conversation.customerName || "未知客户").slice(0, 1)}</AvatarFallback>
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
                        <div>
                          <p className="font-medium">{conversation.customerName || "未知客户"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{conversation.channel}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {conversation.lastMessage}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[conversation.status]}>
                        {statusLabel[conversation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={replyVariant[conversation.replyStatus ?? "unreplied"]}>
                        {replyLabel[conversation.replyStatus ?? "unreplied"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {conversation.assignee ?? "未分配"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {conversation.updatedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/chat?conversationId=${conversation.conversationId}`}>
                          查看
                          <ArrowUpRight data-icon="inline-end" className="size-3.5" />
                        </Link>
                      </Button>
                      {conversation.status === "closed" ? null : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={closingId === conversation.conversationId}
                          aria-label={`关闭 ${conversation.customerName || "未知客户"} 的会话`}
                          onClick={() => {
                            void handleCloseConversation(conversation.conversationId)
                          }}
                        >
                          关闭
                          <X data-icon="inline-end" className="size-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>

          <TablePagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1)
              setPageSize(size)
            }}
          />

          {!loading && filteredConversations.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Search className="size-5" />
              </span>
              <p className="mt-4 text-sm font-semibold">没有找到匹配会话</p>
              <p className="mt-1 text-xs text-muted-foreground">尝试调整状态筛选或搜索关键词。</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
