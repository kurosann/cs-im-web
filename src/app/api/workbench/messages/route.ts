import { relayJSON, requireWebSession } from "@/lib/server/relay"

export async function POST(request: Request) {
  const unauthorized = await requireWebSession(request)
  if (unauthorized) return unauthorized

  const body = await request.text()
  return relayJSON("/api/v1/relays/messages", {
    method: "POST",
    body,
  })
}
