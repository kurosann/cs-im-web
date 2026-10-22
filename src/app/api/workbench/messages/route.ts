import { relayJSON } from "@/lib/server/relay"

export async function POST(request: Request) {
  const body = await request.text()
  return relayJSON(request, "/api/v1/relays/messages", {
    method: "POST",
    body,
  })
}
