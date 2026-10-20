"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { writeSession, type WebSession } from "@/lib/auth"

const previewSession: WebSession = {
  userId: "demo",
  displayName: "演示客服",
  email: "demo@cs-im.local",
  role: "客服专员",
  workspace: "客服工作区",
  createdAt: new Date().toISOString(),
  token: "demo-preview-token",
}

export default function PreviewPage() {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.replace("/login")
      return
    }

    writeSession(previewSession, true)
    router.replace("/v2")
  }, [router])

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <p className="text-sm font-semibold">正在进入 V2 预览</p>
        <p className="mt-2 text-xs text-muted-foreground">开发环境会写入本地演示会话并跳转到 V2 工作台。</p>
      </div>
    </main>
  )
}
