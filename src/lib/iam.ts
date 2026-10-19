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
}

export type CreatedStaff = {
  user: Staff
  initialPassword: string
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
    `/admin/v1/iam/channel-access/apps/${appId}/${status}`,
    { method: "POST" },
  )
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
