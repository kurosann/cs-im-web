import { relayJSON } from "@/lib/server/relay"

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params
  const params = new URL(request.url).searchParams
  const relayParams = new URLSearchParams({ limit: params.get("limit") ?? "20" })
  const beforeSeq = params.get("beforeSeq")
  if (beforeSeq) relayParams.set("beforeSeq", beforeSeq)
	return relayJSON(
		request,
		`/api/v1/relays/conversations/${encodeURIComponent(conversationId)}/messages?${relayParams.toString()}`,
	)
}
