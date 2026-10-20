import { readSession } from "@/lib/auth"
import type { EmployeeExecution } from "@/lib/ai-execution-display"

export type ChannelBinding = {
  platform: string
  label?: string
}

export type AIEmployee = {
  employeeId: string
  name: string
  persona: string
  status: "running" | "paused"
  mode: "basic" | "professional"
  prompt: string
  history: number
  autoReply: boolean
  selectedDocIds: string[]
  tools: string[]
  channels: ChannelBinding[]
}

export type EmployeeDraft = {
  name: string
  persona: string
  status: "running" | "paused"
  mode: "basic" | "professional"
  prompt: string
  history: number
  autoReply: boolean
  selectedDocIds: string[]
  tools: string[]
  channels: ChannelBinding[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession()
  if (!session) {
    throw new Error("请先登录")
  }
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.code !== "OK") {
    throw new Error(payload?.message ?? "请求失败")
  }
  return payload.data as T
}

function normalizeEmployee(item: AIEmployee): AIEmployee {
  return {
    ...item,
    selectedDocIds: item.selectedDocIds ?? [],
    tools: item.tools ?? [],
    channels: item.channels ?? [],
  }
}

export function listEmployees() {
  return request<AIEmployee[]>("/api/v1/ai/employees").then((items) => (items ?? []).map(normalizeEmployee))
}

export function listEmployeeChannels() {
  return request<ChannelBinding[]>("/api/v1/ai/employee-channels").then((items) => items ?? [])
}

export function createEmployee(name: string) {
  return request<AIEmployee>("/api/v1/ai/employees", {
    method: "POST",
    body: JSON.stringify({ name }),
  }).then(normalizeEmployee)
}

export function updateEmployee(id: string, draft: EmployeeDraft) {
  return request<AIEmployee>(`/api/v1/ai/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(draft),
  }).then(normalizeEmployee)
}

export function deleteEmployee(id: string) {
  return request<{ employeeId: string }>(`/api/v1/ai/employees/${id}`, { method: "DELETE" })
}

export function listEmployeeExecutions(id: string) {
  return request<EmployeeExecution[]>(`/api/v1/ai/employees/${id}/executions?limit=200`).then((items) => items ?? [])
}
