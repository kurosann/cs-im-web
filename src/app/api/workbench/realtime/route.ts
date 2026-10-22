import { relayStream } from "@/lib/server/relay"

export const maxDuration = 300

export async function GET(request: Request) {
  return relayStream(request, "/api/v1/relays/realtime")
}
