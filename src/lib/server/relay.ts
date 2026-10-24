const apiBase = process.env.CS_IM_API_BASE ?? "http://127.0.0.1:8080"
type ApiEnvelope<T> = {
  code: string
  message?: string
  data: T
}

export async function requireWebSession(request: Request) {
	const token = request.headers.get("Authorization")?.replace(/^Bearer /, "")
	if (!token) {
		return Response.json({ code: "UNAUTHORIZED", message: "请先登录。" }, { status: 401 })
	}
	const response = await fetch(`${apiBase}/auth/v1/management/me`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
	if (!response.ok || !payload || payload.code !== "OK") {
		return Response.json({ code: "UNAUTHORIZED", message: payload?.message ?? "请先登录。" }, { status: 401 })
	}
	return null
}

export async function relayJSON<T>(request: Request, path: string, init: RequestInit = {}): Promise<Response> {
	const token = request.headers.get("Authorization")?.replace(/^Bearer /, "")
	if (!token) {
		return Response.json({ code: "UNAUTHORIZED", message: "请先登录。" }, { status: 401 })
	}
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
			Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  return Response.json(
    payload ?? { code: "UNKNOWN", message: "请求失败，请稍后重试。" },
    { status: response.ok && payload?.code === "OK" ? 200 : response.status },
  )
}

export async function relayStream(request: Request, path: string): Promise<Response> {
	const token = request.headers.get("Authorization")?.replace(/^Bearer /, "")
	if (!token) {
		return Response.json({ code: "UNAUTHORIZED", message: "请先登录。" }, { status: 401 })
	}
  const response = await fetch(`${apiBase}${path}`, {
    cache: "no-store",
    headers: {
			Authorization: `Bearer ${token}`,
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
