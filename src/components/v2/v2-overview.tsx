import { ArrowRight, Bot, CheckCircle2, Languages, MessageSquareText, NotebookPen } from "lucide-react"
import Link from "next/link"

const metrics = [
  { label: "AI 自动接待", value: "1,286", hint: "今日 · 占比 68%", icon: Bot, tone: "bg-[#eff6ff] text-[#2563eb]" },
  { label: "人工辅助采纳", value: "312", hint: "建议回复采纳率 74%", icon: MessageSquareText, tone: "bg-[#f0fdf4] text-[#16a34a]" },
  { label: "自动翻译", value: "568", hint: "覆盖 9 个语种", icon: Languages, tone: "bg-[#fff7ed] text-[#ea580c]" },
  { label: "知识命中", value: "82%", hint: "近 7 天平均命中率", icon: NotebookPen, tone: "bg-[#f5f3ff] text-[#7c3aed]" },
]

const scenarios = [
  { href: "/v2/employee", title: "配置 AI 客服员工", description: "设置人设、自动回复、知识范围和工具权限。", action: "去配置" },
  { href: "/v2/knowledge", title: "维护知识库", description: "维护 FAQ、政策、规则和多语言答案。", action: "去维护" },
  { href: "/v2/reminders", title: "处理基础提醒", description: "集中处理超时、失败和转人工提醒。", action: "查看提醒" },
]

export function V2Overview() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-8">
          <div>
            <span className="inline-flex rounded-full bg-[#020617] px-3 py-1 text-xs font-semibold text-white">智能工作台</span>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.02em] text-[#0f172a] lg:text-3xl">
              让人工更省力，让 AI 接得住重复问题
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              将 AI 客服员工、知识库、智能分配和人工协作放在同一套工作流中，帮助团队更快响应每一条客户消息。
            </p>
            <Link
              href="/v2/employee"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
            >
              配置 AI 客服员工
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-[#020617] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">当前运行</p>
            <div className="mt-4 space-y-3">
              {[
                { name: "售前助手", value: "负责 4 个 WhatsApp 账号", tone: "bg-[#1e293b]" },
                { name: "售后专员", value: "命中退款政策 38 次", tone: "bg-[#16233a]" },
                { name: "海外客服", value: "已暂停 · 等待审核", tone: "bg-[#1a2435]" },
              ].map((item) => (
                <div key={item.name} className={`rounded-xl ${item.tone} p-4`}>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="mt-1 text-xs text-white/65">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#64748b]">{item.label}</span>
                <span className={`grid size-9 place-items-center rounded-xl ${item.tone}`}>
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#0f172a]">{item.value}</div>
              <div className="mt-1 text-xs text-[#94a3b8]">{item.hint}</div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {scenarios.map((item) => (
          <div key={item.href} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-[#f8fafc] text-[#475569]">
                <CheckCircle2 className="size-4" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">下一步</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#0f172a]">{item.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-[#64748b]">{item.description}</p>
            <Link href={item.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
              {item.action}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ))}
      </section>
    </div>
  )
}
