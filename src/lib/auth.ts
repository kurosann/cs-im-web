export type DemoSession = {
  userId: string
  displayName: string
  email: string
  role: string
  workspace: string
  createdAt: string
}

const LOCAL_SESSION_KEY = "cs-im-web.session.v1"
const SESSION_SESSION_KEY = "cs-im-web.session.session.v1"
const REGISTERED_ACCOUNTS_KEY = "cs-im-web.accounts.v1"

export const DEMO_CREDENTIALS = {
  account: "demo",
  email: "demo@cs-im.local",
  password: "demo1234",
}

type RegisteredAccount = {
  account: string
  email: string
  password: string
  createdAt: string
}

type RegisterAccountInput = {
  account: string
  email: string
  password: string
}

export type RegisterAccountResult =
  | { ok: true }
  | { ok: false; reason: "account_exists" | "email_exists" | "storage_unavailable" }

export function createDemoSession(
  email = DEMO_CREDENTIALS.email,
  displayName = "客服专员",
  userId = "demo-agent-01"
): DemoSession {
  return {
    userId,
    displayName,
    email,
    role: "客服主管",
    workspace: "客服工作区",
    createdAt: new Date().toISOString(),
  }
}

export function readSession(): DemoSession | null {
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
    return JSON.parse(raw) as DemoSession
  } catch {
    clearSession()
    return null
  }
}

export function writeSession(session: DemoSession, remember: boolean) {
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

function readRegisteredAccounts() {
  if (typeof window === "undefined") {
    return [] as RegisteredAccount[]
  }

  const raw = window.localStorage.getItem(REGISTERED_ACCOUNTS_KEY)
  if (!raw) {
    return [] as RegisteredAccount[]
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RegisteredAccount[]) : []
  } catch {
    return []
  }
}

function findRegisteredAccount(identifier: string, password?: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()

  return readRegisteredAccounts().find((account) => {
    const identifierMatches =
      account.account === normalizedIdentifier || account.email === normalizedIdentifier
    return identifierMatches && (password === undefined || account.password === password)
  })
}

export function registerAccount(input: RegisterAccountInput): RegisterAccountResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "storage_unavailable" }
  }

  const account = input.account.trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  const accounts = readRegisteredAccounts()

  if (account === DEMO_CREDENTIALS.account || accounts.some((item) => item.account === account)) {
    return { ok: false, reason: "account_exists" }
  }

  if (email === DEMO_CREDENTIALS.email || accounts.some((item) => item.email === email)) {
    return { ok: false, reason: "email_exists" }
  }

  accounts.push({
    account,
    email,
    password: input.password,
    createdAt: new Date().toISOString(),
  })
  window.localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts))

  return { ok: true }
}

export function isCredentialValid(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const isDemoCredential =
    (normalizedIdentifier === DEMO_CREDENTIALS.account ||
      normalizedIdentifier === DEMO_CREDENTIALS.email) &&
    password === DEMO_CREDENTIALS.password

  return isDemoCredential || Boolean(findRegisteredAccount(identifier, password))
}

export function createSessionForIdentifier(identifier: string): DemoSession {
  const registeredAccount = findRegisteredAccount(identifier)
  if (!registeredAccount) {
    return createDemoSession()
  }

  return createDemoSession(
    registeredAccount.email,
    registeredAccount.account,
    `local-agent-${registeredAccount.account}`
  )
}
