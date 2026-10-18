import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "用户协议 | 聚合客服",
  description: "聚合客服用户协议",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-10 text-[#0f172a] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[24px] border border-[#e2e8f0] bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <Link href="/login" className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">
          返回登录
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.02em]">用户协议</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">最后更新：2026 年 10 月 18 日</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-[#475569]">
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">1. 服务范围</h2>
            <p className="mt-2">
              聚合客服工作台用于统一管理客户会话、业务渠道、消息投递和团队协作。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">2. 使用要求</h2>
            <p className="mt-2">
              请使用真实、合法且由你控制的注册信息，不得利用本系统实施违法活动或尝试访问未授权数据。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">3. 服务使用</h2>
            <p className="mt-2">
              您应按照授权范围使用工作台，不得干扰服务运行、访问未授权数据或利用系统从事违法活动。
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
