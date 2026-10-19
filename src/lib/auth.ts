export type WebSession = {
  userId: string
  displayName: string
  email: string
  role: string
  workspace: string
  createdAt: string
  token: string
}

const LOCAL_SESSION_KEY = "cs-im-web.session"
const SESSION_SESSION_KEY = "cs-im-web.session.session"

export type LoginResult = { ok: true } | { ok: false; message: string }

const roleLabels: Record<string, string> = {
  admin: "管理员",
  supervisor: "客服主管",
  agent: "客服专员",
  auditor: "审计员",
  developer: "开发者",
}

export async function login(
  identifier: string,
  password: string,
  remember = true,
): Promise<LoginResult> {
  try {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })
    const payload = await response.json()
    if (!response.ok || payload?.code !== "OK") {
      return { ok: false, message: payload?.message ?? "登录失败，请稍后重试。" }
    }
    const data = payload.data
    const user = data.user
    writeSession(
      {
        userId: user.userKey,
        displayName: user.displayName || user.account,
        email: user.email,
        role: roleLabels[user.role] ?? "客服专员",
        workspace: "客服工作区",
        createdAt: new Date().toISOString(),
        token: data.token.token,
      },
      remember,
    )
    return { ok: true }
  } catch {
    return { ok: false, message: "无法连接服务，请稍后重试。" }
  }
}

export async function logout(): Promise<void> {
  const session = readSession()
  if (session?.token) {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => undefined)
  }
  clearSession()
}

export function readSession(): WebSession | null {
  if (typeof window === "undefined") {
    return null
  }
  const raw =
    window.localStorage.getItem(LOCAL_SESSION_KEY) ??
    window.sessionStorage.getItem(SESSION_SESSION_KEY)
  if (!raw) {
    return null
  }
  try {
    const session = JSON.parse(raw) as WebSession
    if (!session.userId || !session.token) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function writeSession(session: WebSession, remember: boolean) {
  if (typeof window === "undefined") {
    return
  }
  clearSession()
  const storage = remember ? window.localStorage : window.sessionStorage
  const key = remember ? LOCAL_SESSION_KEY : SESSION_SESSION_KEY
  storage.setItem(key, JSON.stringify(session))
}

export function clearSession() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(LOCAL_SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_SESSION_KEY)
}
