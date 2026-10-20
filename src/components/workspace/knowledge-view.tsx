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
} from "@/data/mock/chat"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const statusFilters = ["全部", "已发布", "待审核", "草稿"] as const

type Draft = Pick<KnowledgeDoc, "title" | "answer" | "type" | "language" | "status"> & {
  id?: string
  channels?: string[]
  effectiveAt?: string
  source?: string
}

export function KnowledgeView() {
  const [groups, setGroups] = useState<KnowledgeGroup[]>(initialGroups)
  const [bases, setBases] = useState<KnowledgeBase[]>(initialBases)
  const [docs, setDocs] = useState<KnowledgeDoc[]>(initialDocs)
  const [activeGroupId, setActiveGroupId] = useState(initialGroups[0].id)
  const [activeBaseId, setActiveBaseId] = useState(initialBases[0].id)
  const [expanded, setExpanded] = useState<string[]>(initialGroups.map((group) => group.id))
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("全部")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [newGroup, setNewGroup] = useState("")
  const [newBase, setNewBase] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notice, setNotice] = useState("")

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0]
  const activeBase = bases.find((base) => base.id === activeBaseId)
  const activeBases = bases.filter((base) => base.groupId === activeGroup.id)
  const activeDocs = activeBase
    ? docs.filter((doc) => doc.baseId === activeBase.id)
    : docs.filter((doc) => activeBases.some((base) => base.id === doc.baseId))

  const visibleDocs = useMemo(
    () =>
      activeDocs.filter((doc) => {
        const statusMatches = statusFilter === "全部" || doc.status === statusFilter
        const keywordMatches = `${doc.title}${doc.answer}`
          .toLowerCase()
          .includes(keyword.trim().toLowerCase())

        return statusMatches && keywordMatches
      }),
    [activeDocs, keyword, statusFilter]
  )

  const pagedDocs = visibleDocs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  function addGroup() {
    const name = newGroup.trim()
    if (!name || groups.some((group) => group.name === name)) return

    const group = { id: `g_${Date.now()}`, name }
    setGroups((current) => [...current, group])
    setExpanded((current) => [...current, group.id])
    setActiveGroupId(group.id)
    setActiveBaseId("")
    setPage(1)
    setNewGroup("")
  }

  function addBase() {
    const name = newBase.trim()
    if (!name || bases.some((base) => base.groupId === activeGroup.id && base.name === name)) return

    const base = {
      id: `kb_${Date.now()}`,
      groupId: activeGroup.id,
      name,
      product: "自定义产品",
      description: "用于维护团队共享知识。",
    }
    setBases((current) => [...current, base])
    setActiveBaseId(base.id)
    setPage(1)
    setNewBase("")
  }

  function saveDoc() {
    if (!draft?.title.trim() || !draft.answer.trim() || !activeBase) return

    if (draft.id) {
      setDocs((current) =>
        current.map((doc) =>
          doc.id === draft.id ? { ...doc, ...draft, id: doc.id, baseId: doc.baseId } : doc
        )
      )
    } else {
      setDocs((current) => [{ id: `d_${Date.now()}`, baseId: activeBase.id, hits: 0, ...draft }, ...current])
    }

    setDraft(null)
    setNotice("文档已保存")
    window.setTimeout(() => setNotice(""), 1800)
  }

  function toggleExpanded(groupId: string) {
    setExpanded((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-142px)] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="grid gap-3 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
        {[
          { label: "知识条目", value: String(docs.length), hint: "覆盖 FAQ、政策、规则和模板" },
          { label: "已发布", value: String(docs.filter((doc) => doc.status === "已发布").length), hint: "可被 AI 检索" },
          { label: "近 7 天命中", value: "82%", hint: "命中后继续追问率 14%" },
          { label: "多语言答案", value: "3", hint: "中文 / English / Español" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 pt-0">
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card className="h-fit">
        <CardHeader className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <LibraryBig className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm">知识库树</CardTitle>
            <CardDescription>第一级是分组，第二级是知识库。</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              value={newGroup}
              onChange={(event) => setNewGroup(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addGroup()}
              placeholder="新分组"
            />
            <Button size="icon" onClick={addGroup} aria-label="新建分组">
              <FolderPlus className="size-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            {groups.map((group) => {
              const isExpanded = expanded.includes(group.id)
              const groupBases = bases.filter((base) => base.groupId === group.id)

              return (
                <div key={group.id}>
                  <div
                    className={cn(
                      "flex items-center rounded-lg px-2 py-2 text-sm",
                      !activeBase && group.id === activeGroup.id
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Button variant="ghost" size="icon-sm" aria-label={isExpanded ? "收起分组" : "展开分组"} onClick={() => toggleExpanded(group.id)}>
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-0 flex-1 justify-start px-1"
                      onClick={() => {
                        setActiveGroupId(group.id)
                        setActiveBaseId("")
                        setPage(1)
                      }}
                    >
                      <span className="truncate">{group.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{groupBases.length}</span>
                    </Button>
                  </div>

                  {isExpanded ? (
                    <div className="ml-4 border-l border-border pl-2">
                      {groupBases.map((base) => (
                        <Button
                          key={base.id}
                          variant={base.id === activeBase?.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveGroupId(group.id)
                            setActiveBaseId(base.id)
                            setPage(1)
                          }}
                        >
                          <LibraryBig className="size-3.5 shrink-0" />
                          <span className="truncate">{base.name}</span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">在「{activeGroup.name}」下新建知识库</p>
            <div className="mt-2 flex gap-2">
              <Input
                value={newBase}
                onChange={(event) => setNewBase(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addBase()}
                placeholder="知识库名称"
              />
              <Button size="icon" onClick={addBase} aria-label="新建知识库">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{activeBase ? activeBase.name : activeGroup.name}</CardTitle>
            <CardDescription>
              {activeBase
                ? `${activeBase.product} · ${activeBase.description}`
                : `${activeGroup.name} · 包含 ${activeBases.length} 个知识库`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeDocs.length} 条</Badge>
            <Button
              size="sm"
              disabled={!activeBase}
              onClick={() => setDraft({ title: "", answer: "", type: "FAQ", language: "中文", status: "草稿", channels: ["WhatsApp", "Web Chat"], effectiveAt: "2026-10-20", source: "手动问答对" })}
            >
              <Plus className="size-3.5" />
              新增文档
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                value={keyword}
                onChange={(event) => {
                  setPage(1)
                  setKeyword(event.target.value)
                }}
                placeholder="搜索文档或答案"
              />
            </div>

            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value) => {
                if (!value) return
                setPage(1)
                setStatusFilter(value as typeof statusFilter)
              }}
              variant="outline"
              className="flex-wrap"
            >
              {statusFilters.map((item) => (
                <ToggleGroupItem key={item} value={item} className="text-xs">
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>标题 / 答案</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">命中</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="max-w-[360px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-medium">{doc.title}</p>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {doc.source ?? "手动问答对"}
                        </Badge>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {doc.language}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{doc.answer}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">生效：{doc.effectiveAt ?? "长期"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {(doc.channels ?? ["Web Chat"]).slice(0, 2).map((channel) => (
                          <Badge key={channel} variant="outline" className="text-[10px]">{channel}</Badge>
                        ))}
                        {(doc.channels?.length ?? 0) > 2 ? (
                          <Badge variant="secondary" className="text-[10px]">+{(doc.channels?.length ?? 0) - 2}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "已发布" ? "secondary" : doc.status === "待审核" ? "outline" : "ghost"}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{doc.hits}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            setDraft({
                              id: doc.id,
                              title: doc.title,
                              answer: doc.answer,
                              type: doc.type,
                              language: doc.language,
                              status: doc.status,
                              channels: doc.channels,
                              effectiveAt: doc.effectiveAt,
                              source: doc.source,
                            })
                          }
                        >
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            setDocs((current) =>
                              current.map((entry) =>
                                entry.id === doc.id
                                  ? { ...entry, status: entry.status === "已发布" ? "草稿" : "已发布" }
                                  : entry
                              )
                            )
                          }
                        >
                          {doc.status === "已发布" ? "下架" : "发布"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!pagedDocs.length ? (
              <div className="border-t border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                这个知识库里没有匹配文档。
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-dashed p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">术语保护</p>
              <Badge variant="outline" className="text-[10px]">翻译时优先保留原文</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["订单号", "品牌名", "链接", "金额", "日期", "型号"].map((term) => (
                <Badge key={term} variant="secondary" className="text-[10px]">
                  {term} · 原文保留
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              翻译命中术语库时不会被改写；无法安全翻译的内容会提示客服仅发送原文。
            </p>
          </div>

          <TablePagination
            total={visibleDocs.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1)
              setPageSize(size)
            }}
          />

          <p className="text-xs text-primary">{notice}</p>
        </CardContent>
      </Card>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "编辑文档" : "新增文档"}</DialogTitle>
            <DialogDescription>当前知识库：{activeBase?.name ?? "未选择"}</DialogDescription>
          </DialogHeader>

          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
            {draft ? (
              <FieldGroup>
              <Field>
                <FieldLabel htmlFor="doc-title">标题</FieldLabel>
                <Input
                  id="doc-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="doc-answer">答案 / 内容</FieldLabel>
                <Textarea
                  id="doc-answer"
                  className="min-h-48 resize-none"
                  value={draft.answer}
                  onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel>类型</FieldLabel>
                  <Select value={draft.type} onValueChange={(value) => setDraft({ ...draft, type: value as Draft["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["FAQ", "政策", "规则", "模板"].map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>语言</FieldLabel>
                  <Select value={draft.language} onValueChange={(value) => setDraft({ ...draft, language: value as Draft["language"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["中文", "English", "Español"].map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>状态</FieldLabel>
                  <Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as Draft["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["已发布", "待审核", "草稿"].map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="doc-channels">适用渠道</FieldLabel>
                  <Input
                    id="doc-channels"
                    value={(draft.channels ?? []).join(", ")}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        channels: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="WhatsApp, Telegram, Web Chat"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="doc-effective">生效时间</FieldLabel>
                  <Input
                    id="doc-effective"
                    type="date"
                    value={draft.effectiveAt ?? ""}
                    onChange={(event) => setDraft({ ...draft, effectiveAt: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>知识来源</FieldLabel>
                  <Select
                    value={draft.source ?? "手动问答对"}
                    onValueChange={(value) => setDraft({ ...draft, source: value })}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["手动问答对", "文档上传", "网页抓取", "业务系统同步", "常用语导入", "历史会话沉淀"].map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              取消
            </Button>
            <Button onClick={saveDoc}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
