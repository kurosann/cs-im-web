"use client"

import { Bot, Save } from "lucide-react"
import { useState } from "react"

import { knowledgeBases, knowledgeDocs, knowledgeGroups } from "@/data/mock/v2"
import { cn } from "@/lib/utils"

type Mode = "basic" | "professional"
type Employee = {
  id: string
  name: string
  persona: string
  status: "运行中" | "已暂停"
  mode: Mode
  prompt: string
  history: number
  autoReply: boolean
  selectedDocIds: string[]
  tools: string[]
}

const initialEmployees: Employee[] = [
  { id: "1", name: "售前助手", persona: "热情简洁，擅长商品和活动介绍", status: "运行中", mode: "basic", prompt: "你是电商售前客服，用简洁中文回答商品、价格和优惠问题。", history: 10, autoReply: true, selectedDocIds: ["d1", "d2"], tools: ["查询商品"] },
  { id: "2", name: "售后专员", persona: "耐心安抚，严格遵守售后规则", status: "运行中", mode: "professional", prompt: "你是售后客服，只回答退款、退货和物流问题，不承诺赔付。", history: 15, autoReply: true, selectedDocIds: ["d3", "d4"], tools: ["查询订单", "查询物流"] },
  { id: "3", name: "海外客服", persona: "正式礼貌，支持英西双语", status: "已暂停", mode: "professional", prompt: "Answer in the customer's language. Keep replies short and professional.", history: 12, autoReply: false, selectedDocIds: ["d7", "d8"], tools: ["自动翻译", "查询订单"] },
]

const toolOptions = ["查询商品", "查询订单", "查询物流", "自动翻译"]

export function V2Employee() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [activeId, setActiveId] = useState(initialEmployees[0].id)
  const [notice, setNotice] = useState("")
  const active = employees.find((item) => item.id === activeId) ?? employees[0]

  function update(patch: Partial<Employee>) {
    setEmployees((current) => current.map((item) => item.id === active.id ? { ...item, ...patch } : item))
  }

  function toggleList(field: "selectedDocIds" | "tools", value: string) {
    const selected = active[field]
    update({ [field]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] } as Partial<Employee>)
  }

  function toggleBase(baseId: string) {
    const docIds = knowledgeDocs.filter((doc) => doc.baseId === baseId).map((doc) => doc.id)
    const allSelected = docIds.every((id) => active.selectedDocIds.includes(id))
    update({ selectedDocIds: allSelected ? active.selectedDocIds.filter((id) => !docIds.includes(id)) : Array.from(new Set([...active.selectedDocIds, ...docIds])) })
  }

  function save(published: boolean) {
    setNotice(published ? "配置已保存并发布" : "草稿已保存")
    window.setTimeout(() => setNotice(""), 1800)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <button
          type="button"
          onClick={() => {
            const id = String(Date.now())
            setEmployees((current) => [...current, { ...initialEmployees[0], id, name: "新 AI 客服员工", status: "已暂停" }])
            setActiveId(id)
          }}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#020617] text-sm font-semibold text-white transition hover:bg-[#1e293b]"
        >
          创建 AI 客服员工
        </button>
        {employees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => setActiveId(employee.id)}
            className={cn("w-full rounded-2xl border bg-white p-4 text-left transition", employee.id === active.id ? "border-[#020617] shadow-[0_18px_45px_-35px_rgba(15,23,42,0.55)]" : "border-[#e2e8f0] hover:border-[#94a3b8]")}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f1f5f9] text-[#475569]"><Bot className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0f172a]">{employee.name}</p>
                <p className="mt-1 truncate text-xs text-[#64748b]">{employee.persona}</p>
              </div>
              <span className={cn("rounded-full px-2 py-1 text-[11px]", employee.status === "运行中" ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f1f5f9] text-[#64748b]")}>{employee.status}</span>
            </div>
          </button>
        ))}
      </aside>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf1f5] p-6">
          <div>
            <h2 className="text-xl font-semibold text-[#0f172a]">{active.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">AI 客服员工是独立配置对象。基础模式用于快速上线，专业模式用于接入知识库、工具和更严格的转人工规则。</p>
          </div>
          <div className="flex rounded-xl bg-[#f1f5f9] p-1">
            {(["basic", "professional"] as Mode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => update({ mode })} className={cn("rounded-lg px-4 py-2 text-xs font-semibold", active.mode === mode ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]")}>{mode === "basic" ? "基础模式" : "专业模式"}</button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm"><span className="text-[#64748b]">名称</span><input value={active.name} onChange={(event) => update({ name: event.target.value })} className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 text-sm outline-none focus:border-[#94a3b8]" /></label>
            <label className="space-y-2 text-sm"><span className="text-[#64748b]">人设</span><input value={active.persona} onChange={(event) => update({ persona: event.target.value })} className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 text-sm outline-none focus:border-[#94a3b8]" /></label>
          </div>
          <label className="block space-y-2 text-sm"><span className="text-[#64748b]">系统提示词</span><textarea rows={5} value={active.prompt} onChange={(event) => update({ prompt: event.target.value })} className="w-full resize-none rounded-lg border border-[#e2e8f0] p-3 text-sm leading-6 outline-none focus:border-[#94a3b8]" /></label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm"><span className="text-[#64748b]">携带历史消息</span><input type="number" min={0} max={50} value={active.history} onChange={(event) => update({ history: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 text-sm outline-none focus:border-[#94a3b8]" /></label>
            <div className="space-y-2 text-sm"><span className="block text-[#64748b]">自动回复</span><button type="button" onClick={() => update({ autoReply: !active.autoReply })} className={cn("h-10 w-full rounded-lg border text-sm font-semibold", active.autoReply ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{active.autoReply ? "已开启" : "已关闭"}</button></div>
            <div className="space-y-2 text-sm"><span className="block text-[#64748b]">运行状态</span><button type="button" onClick={() => update({ status: active.status === "运行中" ? "已暂停" : "运行中" })} className={cn("h-10 w-full rounded-lg border text-sm font-semibold", active.status === "运行中" ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{active.status}</button></div>
          </div>

          {active.mode === "professional" ? (
            <div className="grid gap-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <div><p className="text-sm font-semibold text-[#0f172a]">知识库文档</p><p className="mt-1 text-xs text-[#64748b]">可按产品分组整库选择，也可以只勾选具体文档。</p></div>
                {knowledgeGroups.map((group) => {
                  const bases = knowledgeBases.filter((base) => base.groupId === group.id)
                  return (
                    <div key={group.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{group.name}</p>
                      <div className="mt-3 space-y-3">
                        {bases.map((base) => {
                          const docs = knowledgeDocs.filter((doc) => doc.baseId === base.id)
                          const selectedCount = docs.filter((doc) => active.selectedDocIds.includes(doc.id)).length
                          const allSelected = docs.length > 0 && selectedCount === docs.length
                          return (
                            <div key={base.id} className="rounded-xl bg-[#f8fafc] p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div><p className="text-sm font-medium text-[#0f172a]">{base.name}</p><p className="mt-0.5 text-xs text-[#64748b]">{base.product} · 已选 {selectedCount}/{docs.length}</p></div>
                                <button type="button" onClick={() => toggleBase(base.id)} className={cn("rounded-full border px-3 py-1.5 text-xs", allSelected ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{allSelected ? "取消整库" : "选择整库"}</button>
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {docs.map((doc) => {
                                  const selected = active.selectedDocIds.includes(doc.id)
                                  return <button type="button" key={doc.id} onClick={() => toggleList("selectedDocIds", doc.id)} className={cn("rounded-lg border p-2 text-left text-xs", selected ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}><span className="block truncate font-medium">{doc.title}</span><span className={cn("mt-0.5 block", selected ? "text-white/70" : "text-[#94a3b8]")}>{doc.language} · {doc.status}</span></button>
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div><p className="text-sm font-semibold text-[#0f172a]">工具调用</p><div className="mt-3 flex flex-wrap gap-2">{toolOptions.map((item) => <button type="button" key={item} onClick={() => toggleList("tools", item)} className={cn("rounded-full border px-3 py-1.5 text-xs", active.tools.includes(item) ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{item}</button>)}</div></div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-5 text-sm leading-6 text-[#1d4ed8]">基础模式只保留最容易上手的配置。切到专业模式后，可以挂知识库、工具、测试用例和发布流程。</div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#edf1f5] pt-5">
            <span className="mr-auto text-xs text-[#059669]">{notice}</span>
            <button type="button" onClick={() => save(false)} className="h-10 rounded-lg border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc]">保存草稿</button>
            <button type="button" onClick={() => save(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]"><Save className="size-4" />保存并发布</button>
          </div>
        </div>
      </section>
    </div>
  )
}
