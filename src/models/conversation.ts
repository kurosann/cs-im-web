export type ConversationStatus = "waiting" | "ai" | "human" | "closed"
export type ConversationRisk = "low" | "medium" | "high"

export type Conversation = {
  id: string
  customerName: string
  customerId: string
  channel: string
  lastMessage: string
  updatedAt: string
  status: ConversationStatus
  assignee: string | null
  unreadCount: number
  risk: ConversationRisk
}

export type Message = {
  id: string
  conversationId: string
  role: "customer" | "agent" | "ai" | "system"
  text: string
  createdAt: string
  status: "received" | "sent" | "delivered" | "failed"
}
