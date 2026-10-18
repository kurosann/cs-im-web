"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

type Rule = { id: string; name: string; condition: string; target: string; priority: number; enabled: boolean }

const initialRules: Rule[] = [
  { id: "1", name: "高风险优先人工", condition: "风险等级 = 高", target: "售后二组 · 任意在线坐席", priority: 1, enabled: true },
  { id: "2", name: "西语客服", condition: "客户语言 = 西班牙语", target: "Lucía / Sofía", priority: 2, enabled: true },
  { id: "3", name: "退款问题", condition: "意图包含退款或退货", target: "售后专员组", priority: 3, enabled: true },
  { id: "4", name: "普通售前", condition: "默认兜底规则", target: "先给 AI 售前助手", priority: 4, enabled: false },
]

export function V2Assign() {
  const [rules, setRules] = useState(initialRules)
  const [notice, setNotice] = useState("")

  function move(id: string, direction: -1 | 1) {
    setRules((current) => {
      const index = current.findIndex((item) => item.id === id)
      const next = index + direction
      if (index < 0 || next < 0 || next >= current.length) return current
      const cloned = [...current]
      ;[cloned[index], cloned[next]] = [cloned[next], cloned[index]]
      return cloned.map((item, itemIndex) => ({ ...item, priority: itemIndex + 1 }))
    })
  }

  function addRule() {
    const id = String(Date.now())
    setRules((current) => [...current, { id, name: "新分配规则", condition: "请设置匹配条件", target: "请选择处理对象", priority: current.length + 1, enabled: false }])
    setNotice("已新增一条规则")
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf1f5] p-6">
          <div><h2 className="text-lg font-semibold text-[#0f172a]">分配规则</h2><p className="mt-2 text-sm leading-6 text-[#64748b]">按优先级从上到下匹配。命中的第一条规则决定会话先给谁。</p></div>
          <button type="button" onClick={addRule} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]"><Plus className="size-4" />新增规则</button>
        </div>
        <div className="space-y-3 p-6">
          {rules.map((rule, index) => (
            <div key={rule.id} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 transition hover:border-[#94a3b8]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid size-10 place-items-center rounded-xl bg-[#f1f5f9] text-sm font-semibold text-[#475569]">{rule.priority}</div>
                <div className="min-w-0 flex-1">
                  <input value={rule.name} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, name: event.target.value } : item))} className="h-9 w-full max-w-sm border-0 bg-transparent px-0 text-sm font-semibold text-[#0f172a] outline-none" />
                  <p className="mt-1 text-xs text-[#64748b]">{rule.condition} → {rule.target}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-1 text-[11px]", rule.enabled ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f1f5f9] text-[#64748b]")}>{rule.enabled ? "启用" : "停用"}</span>
                  <button type="button" onClick={() => move(rule.id, -1)} disabled={index === 0} className="h-8 rounded-lg border border-[#e2e8f0] px-2.5 text-xs font-semibold text-[#475569] disabled:opacity-35">上移</button>
                  <button type="button" onClick={() => move(rule.id, 1)} disabled={index === rules.length - 1} className="h-8 rounded-lg border border-[#e2e8f0] px-2.5 text-xs font-semibold text-[#475569] disabled:opacity-35">下移</button>
                  <button type="button" onClick={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))} className="h-8 rounded-lg border border-[#e2e8f0] px-2.5 text-xs font-semibold text-[#475569]">{rule.enabled ? "停用" : "启用"}</button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-[#059669]">{notice}</p>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "负载均衡", value: "单坐席上限 18 会话", detail: "超出后进入候补队列。" },
          { title: "工作时间", value: "09:00 - 22:00", detail: "非工作时间优先 AI，高风险转值班。" },
          { title: "转人工保护", value: "连续 2 次低置信", detail: "自动转人工，并记录原因。" },
        ].map((item) => <div key={item.title} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"><p className="text-sm font-semibold text-[#0f172a]">{item.title}</p><p className="mt-4 text-lg font-semibold text-[#0f172a]">{item.value}</p><p className="mt-1 text-xs text-[#64748b]">{item.detail}</p></div>)}
      </section>
    </div>
  )
}
