export type ExecutionStatus =
  | "pending"
  | "analyzing"
  | "replying"
  | "reporting"
  | "ignored"
  | "replied"
  | "reported"
  | "not_reported"
  | "failed"
  | "cancelled"

export type HistoryDiagnostics = {
  status: "complete" | "empty" | "partial" | "unavailable"
  requestedCount: number
  readCount: number
  pages: number
  scannedCount: number
  error: string | null
}

export type EmployeeExecution = {
  id: string
  employeeId: string
  employeeName: string
  platform: string
  accountKey: string
  accountDisplayName: string | null
  profileId: string
  peerId: string
  conversationId: string
  peerDisplayName: string | null
  messageIds: string[]
  mergedText: string
  historyCount: number
  historyAvailable: boolean
  historyTruncated: boolean
  historyDiagnostics: HistoryDiagnostics | null
  status: ExecutionStatus
  action: string | null
  reasonCode: string | null
  reason: string | null
  replyText: string | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  result: string | null
  error: string | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
}

const platformNames: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  web: "Web Chat",
  messenger: "Messenger",
  test: "测试",
}

const statusLabels: Record<string, string> = {
  pending: "等待中",
  analyzing: "分析中",
  replying: "回复中",
  reporting: "上报中",
  ignored: "已忽略",
  replied: "已回复",
  reported: "已上报",
  not_reported: "未上报",
  failed: "回复失败",
  cancelled: "已取消",
}

const historyStatusLabels: Record<string, string> = {
  complete: "读取成功",
  empty: "无历史文本",
  partial: "仅获取部分",
  unavailable: "读取失败",
}

function normalizedPlatform(platform: string) {
  return platform.toLowerCase()
}

export function executionStatusLabel(status: string) {
  return statusLabels[status] ?? "未知状态"
}

export function executionParties(item: EmployeeExecution) {
  const platformName = platformNames[normalizedPlatform(item.platform)] ?? "未知平台"
  const account = item.accountDisplayName?.trim() || "账号名称不可用"
  const peerLabel = item.peerDisplayName?.trim() || ""
  const peer = peerLabel && peerLabel !== item.peerId && peerLabel !== item.conversationId ? peerLabel : "客户名称不可用"
  const summaryByStatus: Record<string, string> = {
    replied: `${account} → ${peer}`,
    reported: `${account}：${peer} 的对话已转交中控`,
    not_reported: `${account}：${peer} 的对话未上报，也未发送 AI 回复`,
    ignored: `${account}：${peer} 的消息无需回复`,
    cancelled: `${account}：${peer} 的处理已取消`,
  }
  const summary = item.status === "failed"
    ? item.result === "report_failed"
      ? `${account}：${peer} 的对话上报失败`
      : `${account} 给 ${peer} 的回复未发送成功`
    : summaryByStatus[item.status] ?? `${account}：正在处理 ${peer} 的消息`
  return { platformName, account, peer, summary }
}

export function executionResultText(item: EmployeeExecution) {
  if (item.status === "not_reported" && item.result === "control_center_reporting_disabled") {
    return "未进行上报：上报到中控已关闭。"
  }
  if (item.status === "reported") return "已转交中控，未向客户发送 AI 回复"
  if (item.status === "replied") return item.replyText?.trim() || "已回复"
  if (item.status === "failed") {
    if (item.reasonCode === "model_error") {
      return item.error?.trim() || item.reason?.trim() || "模型调用失败，未向客户发送回复"
    }
    return item.result === "report_failed" || item.action === "escalate" ? "上报中控失败，未向客户发送 AI 回复" : "回复失败"
  }
  return executionStatusLabel(item.status)
}

export function executionHistoryText(item: EmployeeExecution) {
  if (item.historyDiagnostics) {
    const status = historyStatusLabels[item.historyDiagnostics.status] ?? "未知状态"
    return `${status} · ${item.historyDiagnostics.readCount} / ${item.historyDiagnostics.requestedCount} 条`
  }
  const status = item.status === "pending" || item.status === "analyzing" ? "正在查阅聊天记录" : "已查阅聊天记录"
  return `${status} · ${item.historyCount} 条`
}

export function executionHistoryError(item: EmployeeExecution) {
  return item.historyDiagnostics?.error ? "部分历史消息未能读取" : ""
}

export function shortExecutionText(value: string | null, max = 72) {
  const text = (value || "").replace(/\s+/g, " ").trim()
  const chars = [...text]
  return chars.length > max ? `${chars.slice(0, max).join("")}…` : text
}

export function executionTimeLabel(value: number) {
  return value ? new Date(value).toLocaleString() : "—"
}
