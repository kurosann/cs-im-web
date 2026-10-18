"use client"

import {
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileClock,
  Globe2,
  KeyRound,
  LoaderCircle,
  MessageCircle,
  Power,
  RadioTower,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

type ManagementKind = "apps" | "channels" | "ai" | "webhook" | "logs" | "settings"

const managementMeta: Record<ManagementKind, { title: string; description: string; icon: typeof Activity }> = {
  apps: { title: "业务渠道", description: "管理接入工作台的业务应用和运行状态。", icon: Globe2 },
  channels: { title: "转发渠道", description: "配置客服消息需要投递到的后端目标。", icon: RadioTower },
  ai: { title: "AI 客服", description: "管理自动回复、忽略和转人工策略。", icon: Activity },
  webhook: { title: "Webhook", description: "管理事件回调、订阅范围和投递状态。", icon: Webhook },
  logs: { title: "消息日志", description: "追踪消息在各个渠道的投递链路。", icon: FileClock },
  settings: { title: "设置", description: "管理工作区信息、会话偏好和角色权限。", icon: Settings2 },
}

const platformMeta: Record<string, { icon: typeof Activity; className: string; background: string }> = {
  WhatsApp: { icon: MessageCircle, className: "text-[#16a34a]", background: "bg-[#f0fdf4]" },
  Telegram: { icon: Send, className: "text-[#0284c7]", background: "bg-[#f0f9ff]" },
  Messenger: { icon: MessageCircle, className: "text-[#6366f1]", background: "bg-[#eef2ff]" },
}

type ManagementItem = {
  name: string
  detail: string
  status: string
  tone: "green" | "amber" | "gray"
  enabled: boolean
}

const initialData: Record<"apps" | "channels" | "ai", ManagementItem[]> = {
  apps: [
    { name: "WhatsApp", detail: "4 个账号 · 最近心跳 20 秒前", status: "在线", tone: "green", enabled: true },
    { name: "Telegram", detail: "2 个账号 · 最近心跳 32 秒前", status: "在线", tone: "green", enabled: true },
    { name: "Messenger", detail: "1 个账号 · 凭证即将到期", status: "需关注", tone: "amber", enabled: true },
  ],
  channels: [
    { name: "客服通知中心", detail: "https://notify.example.com/customer", status: "正常", tone: "green", enabled: true },
    { name: "订单服务", detail: "https://order.example.com/events", status: "正常", tone: "green", enabled: true },
    { name: "数据仓库", detail: "https://warehouse.example.com/messages", status: "正常", tone: "gray", enabled: false },
  ],
  ai: [
    { name: "退款与售后", detail: "自动回复 · 置信度低于 0.72 时转人工", status: "正常", tone: "green", enabled: true },
    { name: "账号安全", detail: "仅识别意图 · 不自动执行敏感操作", status: "正常", tone: "green", enabled: true },
    { name: "营销咨询", detail: "工作时间外暂停自动回复", status: "正常", tone: "gray", enabled: false },
  ],
}

const logRows = [
  { id: "msg_7d31a4", channel: "WhatsApp", event: "客户消息", target: "客服工作台", status: "已送达", time: "刚刚" },
  { id: "msg_8f21ad", channel: "Messenger", event: "AI 回复", target: "客户会话", status: "已送达", time: "2 分钟前" },
  { id: "msg_73bc02", channel: "Telegram", event: "转发消息", target: "订单服务", status: "重试中", time: "8 分钟前" },
  { id: "msg_61d0a8", channel: "WhatsApp", event: "状态回执", target: "客服工作台", status: "失败", time: "12 分钟前" },
]

function statusTone(tone: string) {
  return tone === "green" ? "bg-[#ecfdf5] text-[#059669]" : tone === "amber" ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#f1f5f9] text-[#64748b]"
}

function activationTone(enabled: boolean) {
  return enabled ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#f1f5f9] text-[#64748b]"
}

function ActionToast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) {
    return null
  }

  const isLoading = message.includes("正在检查")

  return (
    <div className="pointer-events-none fixed inset-x-4 top-24 z-50 flex justify-end sm:left-auto sm:right-6">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-[#dbe4ee] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full",
            isLoading ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#ecfdf5] text-[#059669]"
          )}
        >
          {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-[#0f172a]">{isLoading ? "正在检查" : "操作完成"}</p>
          <p className="mt-0.5 truncate text-xs text-[#64748b]">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭提示"
          title="关闭提示"
          className="grid size-7 shrink-0 place-items-center rounded-md text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function V1Management({ kind }: { kind: ManagementKind }) {
  const meta = managementMeta[kind]
  const Icon = meta.icon
  const [items, setItems] = useState<ManagementItem[]>(() => initialData[kind as keyof typeof initialData] ?? [])
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState("")
  const [checkingItems, setCheckingItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => setNotice(""), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const visibleItems = useMemo(
    () => items.filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase())),
    [items, query]
  )

  function handleHealthCheck(name: string) {
    if (checkingItems[name]) {
      return
    }

    setCheckingItems((current) => ({ ...current, [name]: true }))
    setNotice(`${name}正在检查...`)

    window.setTimeout(() => {
      setCheckingItems((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
      setNotice(`${name}已执行健康检查`)
    }, 1200)
  }

  if (kind === "logs") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-[#64748b]">最近 24 小时共记录 4,812 条消息。</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 sm:w-80"><Search className="size-4 text-[#94a3b8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索消息 ID、渠道或目标" className="min-w-0 flex-1 text-sm outline-none placeholder:text-[#94a3b8]" /></label>
        </div>
        <section className="overflow-x-auto rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]"><tr>{["消息 ID", "渠道", "事件", "目标", "状态", "时间", "操作"].map((item) => <th key={item} className="px-5 py-3.5">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#edf1f5]">{logRows.filter((row) => `${row.id} ${row.channel} ${row.target}`.toLowerCase().includes(query.trim().toLowerCase())).map((row) => <tr key={row.id} className="hover:bg-[#fbfdff]"><td className="px-5 py-4 font-mono text-xs text-[#475569]">{row.id}</td><td className="px-5 py-4">{row.channel}</td><td className="px-5 py-4 text-[#64748b]">{row.event}</td><td className="px-5 py-4 text-[#64748b]">{row.target}</td><td className="px-5 py-4"><span className={cn("rounded-full px-2 py-1 text-[11px]", row.status === "已送达" ? "bg-[#ecfdf5] text-[#059669]" : row.status === "重试中" ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#fff1f2] text-[#dc2626]")}>{row.status}</span></td><td className="px-5 py-4 text-xs text-[#94a3b8]">{row.time}</td><td className="px-5 py-4"><button type="button" onClick={() => setNotice(`已打开 ${row.id}`)} className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8]">查看详情</button></td></tr>)}</tbody></table>
        </section>
        <ActionToast message={notice} onClose={() => setNotice("")} />
      </div>
    )
  }

  if (kind === "settings") {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="flex items-start gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#f1f5f9] text-[#475569]"><Settings2 className="size-4" /></div><div><h2 className="text-base font-semibold text-[#0f172a]">工作区设置</h2><p className="mt-1 text-xs text-[#64748b]">管理团队成员使用的默认工作参数。</p></div></div>
          <div className="mt-6 space-y-5">
            <label className="block space-y-2 text-sm"><span className="text-[#64748b]">工作区名称</span><input defaultValue="客服工作区" className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 outline-none focus:border-[#94a3b8]" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm"><span className="block text-[#64748b]">默认语言</span><select defaultValue="中文" className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 outline-none"><option>中文</option><option>English</option></select></label><label className="space-y-2 text-sm"><span className="block text-[#64748b]">会话超时</span><select defaultValue="10 分钟" className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 outline-none"><option>5 分钟</option><option>10 分钟</option><option>30 分钟</option></select></label></div>
            <div className="flex justify-end border-t border-[#edf1f5] pt-5"><button type="button" onClick={() => setNotice("设置已保存")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]"><Save className="size-4" />保存设置</button></div>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"><div className="flex items-start gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#ecfdf5] text-[#059669]"><ShieldCheck className="size-4" /></div><div><h2 className="text-base font-semibold text-[#0f172a]">权限与安全</h2><p className="mt-1 text-xs text-[#64748b]">当前工作区的安全策略。</p></div></div><div className="mt-6 space-y-3">{["登录后 30 分钟无操作自动锁定", "敏感操作需要二次确认", "仅允许已授权渠道发送消息"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f8fafc] p-3 text-sm text-[#475569]"><CheckCircle2 className="size-4 text-[#059669]" />{item}</div>)}</div></section>
        <ActionToast message={notice} onClose={() => setNotice("")} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-[#64748b]">{meta.description}</p></div>
        <div className="flex items-center gap-2"><label className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3"><Search className="size-4 text-[#94a3b8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称或配置" className="w-44 text-sm outline-none placeholder:text-[#94a3b8]" /></label><button type="button" onClick={() => setNotice("新配置入口已准备")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]">新增配置</button></div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="divide-y divide-[#edf1f5]">
          {visibleItems.map((item) => {
            const itemMeta = kind === "apps" ? platformMeta[item.name] : undefined
            const ItemIcon = itemMeta?.icon ?? Icon
            const isChecking = Boolean(checkingItems[item.name])

            return (
              <div key={item.name} className="flex flex-wrap items-center gap-4 px-5 py-5">
                <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", itemMeta?.background ?? "bg-[#f1f5f9]", itemMeta?.className ?? "text-[#475569]")}>
                  <ItemIcon className="size-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0f172a]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      isChecking ? "bg-[#eff6ff] text-[#2563eb]" : statusTone(item.tone)
                    )}
                    aria-live="polite"
                    aria-busy={isChecking}
                  >
                    {isChecking ? <LoaderCircle className="size-3 animate-spin" aria-hidden="true" /> : null}
                    {isChecking ? "检查中" : item.status}
                  </span>
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium", activationTone(item.enabled))}>
                    {item.enabled ? "已启用" : "已停用"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleHealthCheck(item.name)}
                    disabled={isChecking}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]",
                      isChecking && "cursor-wait bg-[#f8fafc] text-[#94a3b8]"
                    )}
                  >
                    {isChecking ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Activity className="size-3.5" />}
                    {isChecking ? "检查中" : "检查状态"}
                  </button>
                  <button
                    type="button"
                    disabled={isChecking}
                    onClick={() => {
                      setItems((current) => current.map((entry) => entry.name === item.name ? { ...entry, enabled: !entry.enabled } : entry))
                      setNotice(`${item.name}${item.enabled ? "已停用" : "已启用"}`)
                    }}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]",
                      isChecking && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Power className="size-3.5" />{item.enabled ? "停用" : "启用"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {!visibleItems.length ? <div className="px-6 py-14 text-center text-sm text-[#64748b]">没有找到匹配的配置。</div> : null}
      </section>
      <ActionToast message={notice} onClose={() => setNotice("")} />
      {kind === "webhook" ? <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[#e2e8f0] bg-white p-5"><div className="flex items-center gap-3"><KeyRound className="size-4 text-[#64748b]" /><p className="text-sm font-semibold">签名密钥</p></div><div className="mt-4 flex items-center justify-between rounded-lg bg-[#f8fafc] px-3 py-2 font-mono text-xs text-[#64748b]"><span>sk_live_••••••••••</span><button type="button" aria-label="复制签名密钥" title="复制签名密钥" onClick={() => setNotice("签名密钥已复制")}><Copy className="size-3.5" /></button></div></div><div className="rounded-2xl border border-[#e2e8f0] bg-white p-5"><div className="flex items-center gap-3"><ExternalLink className="size-4 text-[#64748b]" /><p className="text-sm font-semibold">事件文档</p></div><p className="mt-3 text-sm leading-6 text-[#64748b]">查看可订阅事件、重试策略和签名校验说明。</p><button type="button" onClick={() => setNotice("文档入口已打开")} className="mt-3 text-sm font-semibold text-[#2563eb]">查看文档</button></div></section> : null}
    </div>
  )
}
