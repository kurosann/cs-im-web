import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "隐私政策 | 聚合客服",
  description: "聚合客服隐私政策",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-10 text-[#0f172a] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[24px] border border-[#e2e8f0] bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <Link href="/login" className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">
          返回登录
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.02em]">隐私政策</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">最后更新：2026 年 10 月 18 日</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-[#475569]">
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">1. 信息收集</h2>
            <p className="mt-2">
              为提供账户登录、客服会话和工作台管理服务，我们会在必要范围内处理您提交的账号、邮箱及业务信息。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">2. 信息使用</h2>
            <p className="mt-2">
              相关信息将用于身份验证、服务通知、权限管理、系统安全和服务质量提升，不会用于与服务无关的用途。
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-[#0f172a]">3. 数据管理</h2>
            <p className="mt-2">
              我们会采取合理的安全措施保护您的信息。您可以联系系统管理员查询、更正或删除与您相关的账户信息。
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
