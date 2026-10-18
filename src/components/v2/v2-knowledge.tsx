"use client"

import { ChevronDown, ChevronRight, FolderPlus, LibraryBig, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"

import {
  knowledgeBases as initialBases,
  knowledgeDocs as initialDocs,
  knowledgeGroups as initialGroups,
  type KnowledgeBase,
  type KnowledgeDoc,
  type KnowledgeGroup,
} from "@/data/mock/v2"
import { cn } from "@/lib/utils"

const statusFilters = ["全部", "已发布", "待审核", "草稿"] as const
type Draft = Pick<KnowledgeDoc, "title" | "answer" | "type" | "language" | "status"> & { id?: string }

export function V2Knowledge() {
  const [groups, setGroups] = useState<KnowledgeGroup[]>(initialGroups)
  const [bases, setBases] = useState<KnowledgeBase[]>(initialBases)
  const [docs, setDocs] = useState<KnowledgeDoc[]>(initialDocs)
  const [activeGroupId, setActiveGroupId] = useState(initialGroups[0].id)
  const [activeBaseId, setActiveBaseId] = useState(initialBases[0].id)
  const [expanded, setExpanded] = useState<string[]>(initialGroups.map((group) => group.id))
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("全部")
  const [keyword, setKeyword] = useState("")
  const [newGroup, setNewGroup] = useState("")
  const [newBase, setNewBase] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notice, setNotice] = useState("")

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0]
  const activeBase = bases.find((base) => base.id === activeBaseId)
  const activeBases = bases.filter((base) => base.groupId === activeGroup.id)
  const activeDocs = activeBase ? docs.filter((doc) => doc.baseId === activeBase.id) : docs.filter((doc) => activeBases.some((base) => base.id === doc.baseId))
  const visibleDocs = useMemo(() => activeDocs.filter((doc) => {
    const statusMatches = statusFilter === "全部" || doc.status === statusFilter
    const keywordMatches = `${doc.title}${doc.answer}`.toLowerCase().includes(keyword.trim().toLowerCase())
    return statusMatches && keywordMatches
  }), [activeDocs, keyword, statusFilter])

  function addGroup() {
    const name = newGroup.trim()
    if (!name || groups.some((group) => group.name === name)) return
    const group = { id: `g_${Date.now()}`, name }
    setGroups((current) => [...current, group])
    setExpanded((current) => [...current, group.id])
    setActiveGroupId(group.id)
    setActiveBaseId("")
    setNewGroup("")
  }

  function addBase() {
    const name = newBase.trim()
    if (!name || bases.some((base) => base.groupId === activeGroup.id && base.name === name)) return
    const base = { id: `kb_${Date.now()}`, groupId: activeGroup.id, name, product: "自定义产品", description: "用于维护团队共享知识。" }
    setBases((current) => [...current, base])
    setActiveBaseId(base.id)
    setNewBase("")
  }

  function saveDoc() {
    if (!draft?.title.trim() || !draft.answer.trim() || !activeBase) return
    if (draft.id) {
      setDocs((current) => current.map((doc) => doc.id === draft.id ? { ...doc, ...draft, id: doc.id, baseId: doc.baseId } : doc))
    } else {
      setDocs((current) => [{ id: `d_${Date.now()}`, baseId: activeBase.id, hits: 0, ...draft }, ...current])
    }
    setDraft(null)
    setNotice("文档已保存")
    window.setTimeout(() => setNotice(""), 1800)
  }

  return (
    <div className="grid min-h-[calc(100vh-170px)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-start gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-[#f1f5f9] text-[#475569]"><LibraryBig className="size-4" /></div>
          <div><h2 className="text-sm font-semibold text-[#0f172a]">知识库树</h2><p className="mt-1 text-xs text-[#64748b]">按分组管理知识库。</p></div>
        </div>
        <div className="mt-5 flex gap-2">
          <input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addGroup()} placeholder="新分组" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e2e8f0] px-3 text-xs outline-none focus:border-[#94a3b8]" />
          <button type="button" onClick={addGroup} aria-label="新建分组" title="新建分组" className="grid size-9 place-items-center rounded-lg bg-[#020617] text-white hover:bg-[#1e293b]"><FolderPlus className="size-4" /></button>
        </div>
        <div className="mt-5 space-y-1">
          {groups.map((group) => {
            const isExpanded = expanded.includes(group.id)
            const groupBases = bases.filter((base) => base.groupId === group.id)
            return (
              <div key={group.id}>
                <div className={cn("flex items-center rounded-lg px-2 py-2 text-sm", !activeBase && group.id === activeGroup.id ? "bg-[#f1f5f9] font-semibold text-[#0f172a]" : "text-[#64748b]")}>
                  <button type="button" aria-label={isExpanded ? "收起分组" : "展开分组"} onClick={() => setExpanded((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id])} className="grid size-7 place-items-center rounded-lg hover:bg-[#f1f5f9]">{isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button>
                  <button type="button" onClick={() => { setActiveGroupId(group.id); setActiveBaseId("") }} className="flex min-w-0 flex-1 items-center gap-2 px-1 text-left"><span className="truncate">{group.name}</span><span className="ml-auto text-xs text-[#94a3b8]">{groupBases.length}</span></button>
                </div>
                {isExpanded ? <div className="ml-4 border-l border-[#e2e8f0] pl-2">{groupBases.map((base) => <button type="button" key={base.id} onClick={() => { setActiveGroupId(group.id); setActiveBaseId(base.id) }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition", base.id === activeBase?.id ? "bg-[#020617] text-white" : "text-[#64748b] hover:bg-[#f8fafc]")}><LibraryBig className="size-3.5 shrink-0" /><span className="truncate">{base.name}</span></button>)}</div> : null}
              </div>
            )
          })}
        </div>
        <div className="mt-5 border-t border-[#edf1f5] pt-4">
          <p className="text-xs text-[#64748b]">在「{activeGroup.name}」下新建知识库</p>
          <div className="mt-2 flex gap-2">
            <input value={newBase} onChange={(event) => setNewBase(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addBase()} placeholder="知识库名称" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e2e8f0] px-3 text-xs outline-none focus:border-[#94a3b8]" />
            <button type="button" onClick={addBase} aria-label="新建知识库" title="新建知识库" className="grid size-9 place-items-center rounded-lg bg-[#020617] text-white hover:bg-[#1e293b]"><Plus className="size-4" /></button>
          </div>
        </div>
      </aside>

      <section className="min-w-0 rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1f5] p-6">
          <div><h2 className="text-lg font-semibold text-[#0f172a]">{activeBase ? activeBase.name : activeGroup.name}</h2><p className="mt-2 text-sm text-[#64748b]">{activeBase ? `${activeBase.product} · ${activeBase.description}` : `${activeGroup.name} · 包含 ${activeBases.length} 个知识库`}</p></div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs text-[#64748b]">{activeDocs.length} 条</span><button type="button" disabled={!activeBase} onClick={() => setDraft({ title: "", answer: "", type: "FAQ", language: "中文", status: "草稿" })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#020617] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-3.5" />新增文档</button></div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 lg:w-80"><Search className="size-4 text-[#94a3b8]" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索文档或答案" className="min-w-0 flex-1 text-sm outline-none placeholder:text-[#94a3b8]" /></label>
            <div className="flex flex-wrap gap-2">{statusFilters.map((item) => <button type="button" key={item} onClick={() => setStatusFilter(item)} className={cn("rounded-full border px-3 py-1.5 text-xs", statusFilter === item ? "border-[#020617] bg-[#020617] text-white" : "border-[#e2e8f0] bg-white text-[#64748b]")}>{item}</button>)}</div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]"><tr><th className="px-4 py-3">标题 / 答案</th><th className="px-4 py-3">类型</th><th className="px-4 py-3">语言</th><th className="px-4 py-3">状态</th><th className="px-4 py-3 text-right">命中</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
              <tbody className="divide-y divide-[#edf1f5]">
                {visibleDocs.map((doc) => <tr key={doc.id} className="hover:bg-[#fbfdff]"><td className="max-w-[360px] px-4 py-4"><p className="truncate font-medium text-[#0f172a]">{doc.title}</p><p className="mt-1 truncate text-xs text-[#64748b]">{doc.answer}</p></td><td className="px-4 py-4"><span className="rounded-full border border-[#e2e8f0] px-2 py-1 text-[11px] text-[#64748b]">{doc.type}</span></td><td className="px-4 py-4 text-[#64748b]">{doc.language}</td><td className="px-4 py-4"><span className={cn("rounded-full px-2 py-1 text-[11px]", doc.status === "已发布" ? "bg-[#ecfdf5] text-[#059669]" : doc.status === "待审核" ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#f1f5f9] text-[#64748b]")}>{doc.status}</span></td><td className="px-4 py-4 text-right tabular-nums text-[#475569]">{doc.hits}</td><td className="px-4 py-4 text-right"><div className="inline-flex gap-2"><button type="button" onClick={() => setDraft({ id: doc.id, title: doc.title, answer: doc.answer, type: doc.type, language: doc.language, status: doc.status })} className="rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]">编辑</button><button type="button" onClick={() => setDocs((current) => current.map((entry) => entry.id === doc.id ? { ...entry, status: entry.status === "已发布" ? "草稿" : "已发布" } : entry))} className="rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]">{doc.status === "已发布" ? "下架" : "发布"}</button></div></td></tr>)}
              </tbody>
            </table>
            {!visibleDocs.length ? <div className="border-t border-dashed border-[#e2e8f0] px-6 py-14 text-center text-sm text-[#64748b]">这个知识库里没有匹配文档。</div> : null}
          </div>
          <p className="text-xs text-[#059669]">{notice}</p>
        </div>
      </section>

      {draft ? <div className="fixed inset-0 z-40 flex justify-end bg-[#0f172a]/35" role="dialog" aria-modal="true"><div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"><div className="border-b border-[#edf1f5] p-5"><div className="flex items-center justify-between"><div><h3 className="text-base font-semibold text-[#0f172a]">{draft.id ? "编辑文档" : "新增文档"}</h3><p className="mt-1 text-xs text-[#64748b]">当前知识库：{activeBase?.name ?? "未选择"}</p></div><button type="button" onClick={() => setDraft(null)} className="rounded-lg px-2 py-1 text-sm text-[#64748b] hover:bg-[#f1f5f9]">关闭</button></div></div><div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"><label className="block space-y-2 text-sm"><span className="text-[#64748b]">标题</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 outline-none focus:border-[#94a3b8]" /></label><label className="block space-y-2 text-sm"><span className="text-[#64748b]">答案 / 内容</span><textarea value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} className="min-h-48 w-full resize-none rounded-lg border border-[#e2e8f0] p-3 leading-6 outline-none focus:border-[#94a3b8]" /></label><div className="grid gap-3 sm:grid-cols-3">{[["type", ["FAQ", "政策", "规则", "模板"]], ["language", ["中文", "English", "Español"]], ["status", ["已发布", "待审核", "草稿"]]].map(([field, options]) => <label key={field as string} className="space-y-2 text-sm"><span className="block text-[#64748b]">{field === "type" ? "类型" : field === "language" ? "语言" : "状态"}</span><select value={draft[field as keyof Draft] as string} onChange={(event) => setDraft({ ...draft, [field as string]: event.target.value } as Draft)} className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm outline-none">{(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}</div></div><div className="flex justify-end gap-2 border-t border-[#edf1f5] p-5"><button type="button" onClick={() => setDraft(null)} className="h-10 rounded-lg border border-[#e2e8f0] px-4 text-sm font-semibold text-[#475569]">取消</button><button type="button" onClick={saveDoc} className="h-10 rounded-lg bg-[#020617] px-4 text-sm font-semibold text-white">保存</button></div></div></div> : null}
    </div>
  )
}
