import { readSession } from "@/lib/auth"

export type Conversation = {
  conversationId: string
  appId: string
  customerId: string
  customerName?: string
  channel?: string
  subject?: string
  status: "open" | "closed"
  assignee?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
  replyStatus?: "replied" | "unreplied"
  createdAt: string
  updatedAt: string
}

export type ConversationPage = {
  items: Conversation[]
  total: number
}

export type RelayMessage = {
  messageId: string
  seq: number
  conversationId: string
  customerId: string
  sender: { role: "customer" | "agent" | "ai" | "system"; id: string }
  type: "text" | "image" | "file" | "video"
  text?: string
  content?: { url: string; fileName?: string }
  status: string
  receivedAt: string
  source?: { sentAt?: string }
}

export type RelayMessagePage = {
  items: RelayMessage[]
  nextAfterSeq: number
  nextBeforeSeq: number
  hasMore: boolean
}

export type ChannelHistoryFilter = {
  afterSeq?: number
  beforeSeq?: number
  limit?: number
  order?: 'asc' | 'desc'
}

type ApiEnvelope<T> = {
  code: string
  message?: string
  data: T
}

export class GatewayApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "GatewayApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession()
  if (!session) {
    throw new GatewayApiError(401, "UNAUTHORIZED", "请先登录。")
  }

  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${session.token}` },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok || !payload || payload.code !== "OK") {
    throw new GatewayApiError(
      response.status,
      payload?.code ?? "UNKNOWN",
      payload?.message ?? "请求失败，请稍后重试。",
    )
  }
  return payload.data
}

export async function listConversations(input: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const params = new URLSearchParams()
  if (input.keyword) params.set("keyword", input.keyword)
  if (input.status && input.status !== "all") params.set("status", input.status)
  if (input.page) params.set("page", String(input.page))
  if (input.pageSize) params.set("pageSize", String(input.pageSize))
  const data = await request<ConversationPage | Conversation[] | null>(`/admin/v1/conversations?${params.toString()}`)
  if (Array.isArray(data)) return { items: data, total: data.length }
  const items = data?.items ?? []
  return { items, total: data?.total ?? items.length }
}

export function markConversationRead(conversationId: string) {
  return request<number>(`/admin/v1/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
  })
}

export function closeConversation(conversationId: string) {
  return request<Conversation>(`/admin/v1/conversations/${encodeURIComponent(conversationId)}/close`, {
    method: "POST",
    body: JSON.stringify({ reason: "客服手动关闭" }),
  })
}

async function relayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession()
  if (!session) throw new GatewayApiError(401, "UNAUTHORIZED", "请先登录。")

  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !payload || payload.code !== "OK") {
    throw new GatewayApiError(
      response.status,
      payload?.code ?? "UNKNOWN",
      payload?.message ?? "请求失败，请稍后重试。",
    )
  }
  return payload.data
}

export function listRelayMessages(conversationId: string, beforeSeq?: number) {
  const params = new URLSearchParams({ limit: "20" })
  if (beforeSeq) params.set("beforeSeq", String(beforeSeq))
  return relayRequest<RelayMessagePage>(
    `/api/workbench/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
  )
}

export function syncChannelHistory(conversationId: string, filter: ChannelHistoryFilter = {}) {
  const params = new URLSearchParams()
  if (filter.afterSeq) params.set("afterSeq", String(filter.afterSeq))
  if (filter.beforeSeq) params.set("beforeSeq", String(filter.beforeSeq))
  if (filter.limit) params.set("limit", String(filter.limit))
  if (filter.order) params.set("order", filter.order)
  const query = params.size ? `?${params.toString()}` : ''
  return request<{ page: RelayMessagePage; createdCount: number }>(
    `/admin/v1/conversations/${encodeURIComponent(conversationId)}/channel-history${query}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    },
  )
}

export function sendRelayMessage(input: {
  conversationId: string
  text: string
  type?: RelayMessage["type"]
  content?: RelayMessage["content"]
}) {
  return relayRequest<RelayMessage>("/api/workbench/messages", {
    method: "POST",
    body: JSON.stringify({
      conversationId: input.conversationId,
      type: input.type ?? "text",
      text: input.text,
      ...(input.content ? { content: input.content } : {}),
    }),
  })
}
