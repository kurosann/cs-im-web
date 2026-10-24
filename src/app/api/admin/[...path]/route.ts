import type { NextRequest } from "next/server"
import { requireWebSession } from "@/lib/server/relay"

type AdminProxyContext = {
  params: Promise<{ path: string[] }>
}

const ALLOWED_PATHS = [
  /^iam\/channel-access\/apps$/,
  /^iam\/channel-access\/apps\/[^/]+$/,
  /^iam\/channel-access\/apps\/[^/]+\/(enable|disable|revoke|rotate)$/,
  /^iam\/tokens$/,
  /^iam\/tokens\/[^/]+$/,
  /^iam\/tokens\/[^/]+\/(enable|disable|rotate)$/,
  /^channels$/,
  /^channels\/[^/]+$/,
  /^channels\/[^/]+\/(enable|disable|test)$/,
]

function isAllowed(path: string[]) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path.join("/")))
}

async function proxyAdminRequest(request: NextRequest, context: AdminProxyContext) {
  const { path } = await context.params
  if (!isAllowed(path)) {
    return Response.json(
      { code: "NOT_FOUND", message: "admin API path is not exposed" },
      { status: 404 },
    )
  }

  const unauthorized = await requireWebSession(request)
  if (unauthorized) return unauthorized

  const apiBase = (process.env.CS_IM_API_BASE ?? "http://127.0.0.1:8080").replace(/\/$/, "")

  const requestURL = new URL(request.url)
  const targetURL = `${apiBase}/admin/v1/${path.map(encodeURIComponent).join("/")}${requestURL.search}`

  const headers = new Headers()
  headers.set("authorization", request.headers.get("authorization") ?? "")
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text()
    if (body) init.body = body
  }

  try {
    const upstream = await fetch(targetURL, init)
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    })
  } catch {
    return Response.json(
      {
        code: "BAD_GATEWAY",
        message: "无法连接 cs-im-server，请检查 CS_IM_API_BASE 和服务状态。",
      },
      { status: 502 },
    )
  }
}

export async function GET(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context)
}

export async function POST(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context)
}

export async function PATCH(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context)
}

export async function PUT(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context)
}

export async function DELETE(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context)
}
