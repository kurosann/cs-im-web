const apiBase = process.env.CS_IM_API_BASE ?? "http://127.0.0.1:8080"
const relayToken = process.env.CS_IM_RELAY_TOKEN ?? ""

type ApiEnvelope<T> = {
  code: string
  message?: string
  data: T
}

export async function requireWebSession(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "")
  if (!token) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "请先登录。" },
      { status: 401 },
    )
  }

  const response = await fetch(`${apiBase}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
  if (!response.ok || !payload || payload.code !== "OK") {
    return Response.json(
      { code: "UNAUTHORIZED", message: payload?.message ?? "请先登录。" },
      { status: 401 },
    )
  }
  return null
}

function unauthorized() {
  return Response.json(
    { code: "CONFIG_ERROR", message: "转发渠道凭证未配置。" },
    { status: 503 },
  )
}

export async function relayJSON<T>(path: string, init: RequestInit = {}): Promise<Response> {
  if (!relayToken) return unauthorized()
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${relayToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  return Response.json(
    payload ?? { code: "UNKNOWN", message: "请求失败，请稍后重试。" },
    { status: response.ok && payload?.code === "OK" ? 200 : response.status },
  )
}

export async function relayStream(path: string): Promise<Response> {
  if (!relayToken) return unauthorized()
  const response = await fetch(`${apiBase}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${relayToken}`,
      Accept: "text/event-stream",
    },
  })
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
    return Response.json(
      payload ?? { code: "UNKNOWN", message: "实时连接失败。" },
      { status: response.status },
    )
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
