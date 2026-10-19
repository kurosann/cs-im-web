import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "隐私政策 | 聚合客服",
  description: "聚合客服隐私政策",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <Button asChild variant="link" size="sm" className="h-auto w-fit p-0">
            <Link href="/login">返回登录</Link>
          </Button>
          <CardTitle className="text-3xl">隐私政策</CardTitle>
          <CardDescription>最后更新：2026 年 10 月 18 日</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. 信息收集</h2>
            <p className="mt-2">
              为提供账户登录、客服会话和工作台管理服务，我们会在必要范围内处理您提交的账号、邮箱及业务信息。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. 信息使用</h2>
            <p className="mt-2">
              相关信息将用于身份验证、服务通知、权限管理、系统安全和服务质量提升，不会用于与服务无关的用途。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. 数据管理</h2>
            <p className="mt-2">
              我们会采取合理的安全措施保护您的信息。您可以联系系统管理员查询、更正或删除与您相关的账户信息。
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
