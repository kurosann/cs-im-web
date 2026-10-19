import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "用户协议 | 聚合客服",
  description: "聚合客服用户协议",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <Button asChild variant="link" size="sm" className="h-auto w-fit p-0">
            <Link href="/login">返回登录</Link>
          </Button>
          <CardTitle className="text-3xl">用户协议</CardTitle>
          <CardDescription>最后更新：2026 年 10 月 18 日</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. 服务范围</h2>
            <p className="mt-2">
              聚合客服工作台用于统一管理客户会话、业务渠道、消息投递和团队协作。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. 使用要求</h2>
            <p className="mt-2">
              请使用真实、合法且由你控制的注册信息，不得利用本系统实施违法活动或尝试访问未授权数据。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. 服务使用</h2>
            <p className="mt-2">
              您应按照授权范围使用工作台，不得干扰服务运行、访问未授权数据或利用系统从事违法活动。
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
