"use client"

import { ArrowRight, Info } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RegisterForm() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6">
      <Card className="w-full max-w-[460px] text-center">
        <CardHeader className="items-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Info className="size-6" strokeWidth={2.5} />
          </span>
          <CardTitle className="text-2xl">账号由管理员开通</CardTitle>
          <CardDescription>
            工作台账号由管理员在 IAM 中创建并分配角色，不支持自主注册。请联系管理员开通后返回登录。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button asChild className="h-12 w-full">
            <Link href="/login">
              返回登录
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
