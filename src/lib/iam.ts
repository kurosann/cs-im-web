import { readSession } from "@/lib/auth"

export type ChannelCredentialStatus = "active" | "disabled" | "revoked"

export type BusinessApp = {
  appId: string
  name: string
  displayName: string
  status: string
}

export type ChannelCredential = {
  appId: string
  name: string
  status: ChannelCredentialStatus
  expiresAt?: string | null
  lastUsedAt?: string | null
}

export type IssuedCredential = {
  appId: string
  secret: string
}

export type Staff = {
  userKey: string
  account: string
  email: string
  displayName: string
  tenantId: string
  role: string
  status: string
  lastLoginAt?: string | null
  online?: boolean
  device?: string | null
  ip?: string | null
  lastActiveAt?: string | null
}

export type CreatedStaff = {
  user: Staff
  initialPassword: string
}

export type Role = {
  roleKey: string
  name: string
  description: string
  kind: "system" | "custom"
  status: "active" | "disabled"
  scopes: string[]
  members: number
}

export type AuditLog = {
  id: number
  event: string
  action: string
  operator: string
  object: string
  result: "success" | "denied" | "warning"
  ip: string
  device: string
  createdAt: string
}

export type AuditLogPage = {
  items: AuditLog[]
  total: number
}

export type ChannelDeliveryStats = {
  total: number
  queued: number
  delivered: number
  failed: number
  lastEventAt?: string | null
}

export type ChannelMonitorChannel = {
  channelId: string
  name: string
  type: string
  endpoint?: string
  status: string
  health: "online" | "warning" | "offline" | "disabled"
  lastTestedAt?: string | null
  delivery: ChannelDeliveryStats
}

export type ChannelMonitorApp = {
  appId: string
  displayName: string
  serviceKey: string
  kind?: string
  version?: string
  status: string
  health: "online" | "offline" | "disabled"
  lastHeartbeatAt?: string | null
  leaseExpiresAt?: string | null
  conversationCount: number
}

export type ChannelMonitorResult = {
  generatedAt: string
  summary: {
    totalChannels: number
    online: number
    offline: number
    disabled: number
    queuedItems: number
  }
  channels: ChannelMonitorChannel[]
  apps: ChannelMonitorApp[]
}

type ApiEnvelope<T> = {
  code: string
  message?: string
  data: T
}

export class IamApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "IamApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession()
  if (!session) {
    throw new IamApiError(401, "UNAUTHORIZED", "请先登录。")
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok || !payload || payload.code !== "OK") {
    throw new IamApiError(
      response.status,
      payload?.code ?? "UNKNOWN",
      payload?.message ?? "请求失败，请稍后重试。",
    )
  }
  return payload.data
}

export function listBusinessApps() {
  return request<BusinessApp[]>("/admin/v1/apps")
}

export function listChannelCredentials() {
  return request<ChannelCredential[]>("/admin/v1/iam/channel-access/apps")
}

export function registerBusinessApp(input: { displayName: string; serviceKey: string }) {
  return request<BusinessApp>("/admin/v1/apps/register", {
    method: "POST",
    body: JSON.stringify({
      displayName: input.displayName,
      serviceKey: input.serviceKey,
      kind: "business-channel",
    }),
  })
}

export function issueChannelCredential(input: { appId: string; name: string }) {
  return request<IssuedCredential & { credential: ChannelCredential }>(
    "/admin/v1/iam/channel-access/apps",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  )
}

export function rotateChannelCredential(appId: string) {
  return request<IssuedCredential & { credential: ChannelCredential }>(
    `/admin/v1/iam/channel-access/apps/${appId}/rotate`,
    { method: "POST" },
  )
}

export function setChannelCredentialStatus(appId: string, status: "active" | "disabled" | "revoked") {
  return request<ChannelCredential>(
    `/admin/v1/iam/channel-access/apps/${appId}/${status === "revoked" ? "revoke" : status}`,
    { method: "POST" },
  )
}

export function deleteChannelCredential(appId: string) {
  return request<string>(`/admin/v1/iam/channel-access/apps/${appId}`, {
    method: "DELETE",
  })
}

export function listStaff() {
  return request<Staff[]>("/admin/v1/iam/staff")
}

export function createStaff(input: { displayName: string; email: string; role: string }) {
  return request<CreatedStaff>("/admin/v1/iam/staff", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateStaff(userKey: string, input: { displayName: string; email: string; role: string }) {
  return request<Staff>(`/admin/v1/iam/staff/${userKey}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function setStaffRole(userKey: string, role: string) {
  return request<Staff>(`/admin/v1/iam/staff/${userKey}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  })
}

export function setStaffStatus(userKey: string, status: "active" | "disabled") {
  return request<Staff>(`/admin/v1/iam/staff/${userKey}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export function forceStaffLogout(userKey: string) {
  return request<string>(`/admin/v1/iam/staff/${userKey}/logout`, { method: "POST" })
}

export function resetStaffPassword(userKey: string) {
  return request<CreatedStaff>(`/admin/v1/iam/staff/${userKey}/password/reset`, { method: "POST" })
}

export function listRoles() {
  return request<Role[]>("/admin/v1/iam/roles")
}

export function createRole(input: Pick<Role, "name" | "description" | "status" | "scopes">) {
  return request<Role>("/admin/v1/iam/roles", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateRole(roleKey: string, input: Pick<Role, "name" | "description" | "status" | "scopes">) {
  return request<Role>(`/admin/v1/iam/roles/${roleKey}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteRole(roleKey: string) {
  return request<string>(`/admin/v1/iam/roles/${roleKey}`, { method: "DELETE" })
}

export function listAuditLogs(input: {
  keyword?: string
  action?: string
  result?: string
  page?: number
  pageSize?: number
}) {
  const params = new URLSearchParams()
  if (input.keyword) params.set("keyword", input.keyword)
  if (input.action) params.set("action", input.action)
  if (input.result && input.result !== "all") params.set("result", input.result)
  if (input.page) params.set("page", String(input.page))
  if (input.pageSize) params.set("pageSize", String(input.pageSize))
  return request<AuditLogPage>(`/admin/v1/iam/audit-logs?${params.toString()}`)
}

export function listChannelMonitor() {
  return request<ChannelMonitorResult>("/admin/v1/channel-monitor")
}
