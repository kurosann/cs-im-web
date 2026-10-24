import type { NextRequest } from "next/server"
import { relayJSON } from "@/lib/server/relay"

type TranslationItem = {
  text: string
  targetLang?: string
  sourceLang?: string
  providerId?: string
}

type RelayTranslationPayload = {
  items: TranslationItem[]
}

export async function POST(request: NextRequest) {
  const body = await request.json() as RelayTranslationPayload | null
  if (!body?.items?.length) {
    return Response.json({ code: "BAD_REQUEST", message: "翻译内容不能为空。" }, { status: 400 })
  }

  return relayJSON(request, "/api/v1/relays/translations", {
    method: "POST",
    body: JSON.stringify({
      items: body.items.filter(item => item.text.trim()),
    }),
  })
}
