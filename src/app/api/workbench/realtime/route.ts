import { relayStream, requireWebSession } from "@/lib/server/relay"

export const maxDuration = 300

export async function GET(request: Request) {
  const unauthorized = await requireWebSession(request)
  if (unauthorized) return unauthorized

  return relayStream("/api/v1/relays/realtime")
}
