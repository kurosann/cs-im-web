"use client"

import {
  ArrowUpRight,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { mockConversations } from "@/data/mock/workspace"
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
import { TablePagination } from "@/components/ui/table-pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const filters: Array<{ value: "all" | ConversationStatus; label: string }> = [
  { value: "all", label: "全部" },
  { value: "waiting", label: "待人工" },
  { value: "ai", label: "AI 已处理" },
  { value: "human", label: "人工处理中" },
  { value: "closed", label: "已关闭" },
]

const statusVariant = {
  human: "default",
  waiting: "destructive",
  ai: "secondary",
  closed: "ghost",
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mockConversations.filter((conversation) => {
      const matchesFilter = filter === "all" || conversation.status === filter
      const matchesQuery =
        !normalizedQuery ||
        [
          conversation.customerName,
          conversation.customerId,
          conversation.channel,
          conversation.lastMessage,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesFilter && matchesQuery
    })
  }, [filter, query])

  const pagedConversations = filteredConversations.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-primary">{mockConversations.length}</span> 条会话
        </p>
        <Button asChild size="lg">
          <Link href="/chat">
            <MessageCircle className="size-4" />
            打开聊天室
          </Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">筛选会话</CardTitle>
          </div>
          <CardDescription>按状态和关键词快速定位客户会话。</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(value) => {
                if (!value) return
                setPage(1)
                setFilter(value as typeof filter)
              }}
              variant="outline"
              className="flex-wrap"
            >
              {filters.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value} className="text-xs">
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="relative w-full lg:max-w-[320px]">
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
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>客户</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>最近消息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{conversation.customerName.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{conversation.customerName}</p>
                          <p className="text-xs text-muted-foreground">{conversation.customerId}</p>
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
                    <TableCell className="text-muted-foreground">
                      {conversation.assignee ?? "未分配"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {conversation.updatedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/chat?conversationId=${conversation.id}`}>
                          查看
                          <ArrowUpRight data-icon="inline-end" className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            total={filteredConversations.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1)
              setPageSize(size)
            }}
          />

          {filteredConversations.length === 0 ? (
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
