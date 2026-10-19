"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { readSession } from "@/lib/auth"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login")
    }
  }, [router])

  return children
}
