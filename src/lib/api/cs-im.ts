import { readSession } from "@/lib/auth"

export type AccountTokenKind = "business" | "relay"
export type AccountTokenStatus = "active" | "disabled" | "revoked"

export type AccountToken = {
  tokenKey: string
  accountKey: string
  name: string
  tenantId: string
  kind: AccountTokenKind | ""
  scopes: string[]
  status: AccountTokenStatus | ""
  expiresAt?: string | null
  revokedAt?: string | null
  lastUsedAt?: string | null
}

export type IssueAccountTokenRequest = {
  accountKey: string
  name: string
  kind: AccountTokenKind
  scopes?: string[]
  expiresAt?: string
}

export type IssueAccountTokenResult = {
  token: AccountToken
  secret: string
}

export type RelayChannelStatus = "active" | "disabled"

export type RelayChannel = {
  channelId: string
  name: string
  type: string
  endpoint?: string
  config?: Record<string, unknown>
  status: RelayChannelStatus
  lastTestedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CreateRelayChannelRequest = {
  name: string
  type: string
  endpoint?: string
  config?: Record<string, unknown>
}

type ApiEnvelope<T> = {
  code: string
  message?: string
  data?: T
}

export class CsImApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "CsImApiError"
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession()
  if (!session) {
    throw new CsImApiError("请先登录。", 401, "UNAUTHORIZED")
  }

  const headers = new Headers(init?.headers)
  headers.set("authorization", `Bearer ${session.token}`)
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  let response: Response
  try {
    response = await fetch(`/api/admin${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
  } catch {
    throw new CsImApiError("无法连接 cs-im-server", 0, "NETWORK_ERROR")
  }

  const text = await response.text()
  let payload: ApiEnvelope<T> | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new CsImApiError(
      payload?.message ?? `请求失败（HTTP ${response.status}）`,
      response.status,
      payload?.code,
    )
  }

  if (!payload) {
    return undefined as T
  }

  if (payload.code !== "OK") {
    throw new CsImApiError(
      payload.message ?? "cs-im-server 返回了非成功结果",
      response.status,
      payload.code,
    )
  }

  return payload.data as T
}

export function listAccountTokens() {
  return request<AccountToken[]>("/iam/tokens")
}

export function issueAccountToken(input: IssueAccountTokenRequest) {
  return request<IssueAccountTokenResult>("/iam/tokens", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function setAccountTokenStatus(
  tokenKey: string,
  status: "active" | "disabled",
) {
  const action = status === "active" ? "enable" : "disable"
  return request<AccountToken>(
    `/iam/tokens/${encodeURIComponent(tokenKey)}/${action}`,
    { method: "POST" },
  )
}

export function rotateAccountToken(tokenKey: string) {
  return request<IssueAccountTokenResult>(
    `/iam/tokens/${encodeURIComponent(tokenKey)}/rotate`,
    { method: "POST" },
  )
}

export function listRelayChannels() {
  return request<RelayChannel[]>("/channels")
}

export function createRelayChannel(input: CreateRelayChannelRequest) {
  return request<RelayChannel>("/channels", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function setRelayChannelStatus(channelId: string, enabled: boolean) {
  const action = enabled ? "enable" : "disable"
  return request<RelayChannel>(
    `/channels/${encodeURIComponent(channelId)}/${action}`,
    { method: "POST" },
  )
}

export function testRelayChannel(channelId: string) {
  return request<RelayChannel>(
    `/channels/${encodeURIComponent(channelId)}/test`,
    { method: "POST" },
  )
}
