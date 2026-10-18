"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { readSession } from "@/lib/auth"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login")
      return
    }

    const timer = window.setTimeout(() => setIsReady(true), 0)
    return () => window.clearTimeout(timer)
  }, [router])

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin text-[#2563eb]" />
          正在打开工作台
        </div>
      </main>
    )
  }

  return children
}
