"use client"

import {
  Activity,
  ArrowRightLeft,
  BellRing,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  FileClock,
  LibraryBig,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  Settings2,
  Webhook,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { clearSession, DemoSession, readSession } from "@/lib/auth"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  count?: number
}

const workItems: NavItem[] = [
  { href: "/", label: "总览", icon: LayoutDashboard },
]

const conversationItems: NavItem[] = [
  { href: "/conversations", label: "会话", icon: MessageSquareText, count: 12 },
  { href: "/chat", label: "聊天室", icon: Activity },
]

const aiItems: NavItem[] = [
  { href: "/v2/employee", label: "AI 客服员工", icon: Bot },
  { href: "/v2/knowledge", label: "知识库", icon: LibraryBig },
]

const flowItems: NavItem[] = [
  { href: "/v2/assign", label: "智能分配", icon: ArrowRightLeft },
  { href: "/v2/reminders", label: "基础提醒", icon: BellRing },
]

const channelItems: NavItem[] = [
  { href: "/apps", label: "业务渠道", icon: BriefcaseBusiness },
  { href: "/channels", label: "转发渠道", icon: RadioTower },
  { href: "/logs", label: "消息日志", icon: FileClock },
]

const systemItems: NavItem[] = [
  { href: "/webhook", label: "Webhook", icon: Webhook },
  { href: "/settings", label: "设置", icon: Settings2 },
]

const pageTitles: Record<string, { eyebrow: string; title: string; description: string; badge?: string }> = {
  "/": {
    eyebrow: "工作台",
    title: "总览",
    description: "快速掌握当前服务状态和待处理工作。",
  },
  "/conversations": {
    eyebrow: "客服工作",
    title: "会话",
    description: "集中处理来自各个渠道的客户消息。",
  },
  "/chat": {
    eyebrow: "会话服务",
    title: "聊天室",
    description: "使用翻译、快捷回复和 AI 建议协助处理会话。",
  },
  "/v2": {
    eyebrow: "工作台",
    title: "总览",
    description: "统一查看智能接待、人工协作和知识服务状态。",
  },
  "/v2/chat": {
    eyebrow: "会话服务",
    title: "聊天室",
    description: "使用翻译、快捷回复和 AI 建议协助处理会话。",
  },
  "/v2/employee": {
    eyebrow: "AI 配置",
    title: "AI 客服员工",
    description: "配置 AI 员工的人设、知识范围和自动回复策略。",
  },
  "/v2/knowledge": {
    eyebrow: "AI 配置",
    title: "知识库",
    description: "维护 FAQ、政策、规则和多语言答案。",
  },
  "/v2/assign": {
    eyebrow: "流程控制",
    title: "智能分配",
    description: "按规则优先级将会话分配给 AI 或人工坐席。",
  },
  "/v2/reminders": {
    eyebrow: "流程控制",
    title: "基础提醒",
    description: "集中处理超时、失败和转人工提醒。",
  },
  "/apps": {
    eyebrow: "会话服务",
    title: "业务渠道",
    description: "管理接入工作台的业务应用和心跳状态。",
  },
  "/channels": {
    eyebrow: "会话服务",
    title: "转发渠道",
    description: "配置客服消息需要投递到的后端目标。",
  },
  "/ai": {
    eyebrow: "会话服务",
    title: "AI 客服",
    description: "管理自动回复、忽略和转人工策略。",
  },
  "/webhook": {
    eyebrow: "系统设置",
    title: "Webhook",
    description: "管理事件回调、订阅范围和投递状态。",
  },
  "/logs": {
    eyebrow: "系统设置",
    title: "消息日志",
    description: "追踪消息在各个渠道的投递链路。",
  },
  "/settings": {
    eyebrow: "系统设置",
    title: "设置",
    description: "管理工作区信息、会话偏好和角色权限。",
  },
}

function isNavItemActive(href: string, pathname: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/v2"
  }

  if (href === "/v2") {
    return pathname === "/v2"
  }

  if (href === "/chat") {
    return pathname === "/chat" || pathname === "/v2/chat"
  }

  return pathname.startsWith(href)
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string
  items: NavItem[]
  pathname: string
  collapsed: boolean
}) {
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "px-3 text-sm font-semibold text-[#8fa5b5] transition-opacity",
          collapsed && "pointer-events-none opacity-0"
        )}
        aria-hidden={collapsed}
      >
        {label}
      </p>
      <nav className="space-y-1" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon
          const active = isNavItemActive(item.href, pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex min-h-12 items-center gap-3 rounded-2xl text-[15px] font-medium transition",
                collapsed ? "justify-center px-2" : "px-4",
                active
                  ? "bg-[#020617] text-white shadow-sm"
                  : "text-[#5d7080] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Icon
                className={cn("size-4.5", active ? "text-white" : "text-[#90a1af] group-hover:text-[#64748b]")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={cn("truncate transition-opacity", collapsed && "pointer-events-none w-0 opacity-0")}>
                {item.label}
              </span>
              {item.count ? (
                <span
                  className={cn(
                    "rounded-full bg-[#fff1c7] px-1.5 py-0.5 text-[10px] font-bold text-[#9a6700]",
                    collapsed
                      ? "absolute -right-0.5 -top-1 grid size-4 place-items-center px-0"
                      : "ml-auto"
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<DemoSession | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSession(readSession()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.localStorage.getItem("cs-im-web.sidebar-collapsed") === "true") {
        setSidebarCollapsed(true)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const pageMeta = useMemo(
    () =>
      pageTitles[pathname] ?? {
        eyebrow: "工作台",
        title: "页面",
        description: "查看和管理工作台信息。",
      },
    [pathname]
  )

  function handleLogout() {
    clearSession()
    router.replace("/login")
  }

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      window.localStorage.setItem("cs-im-web.sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0f172a]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-[#e2e8f0] bg-white transition-[width] duration-200 md:flex md:flex-col",
          sidebarCollapsed ? "w-[76px]" : "w-[288px]"
        )}
      >
        <div className={cn("flex h-[78px] items-center border-b border-[#edf1f5]", sidebarCollapsed ? "justify-center px-3" : "gap-3 px-6")}>
          <div className="grid size-9 place-items-center rounded-full bg-[#020617] text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]">
            <MessageSquareText className="size-4.5" strokeWidth={2.4} />
          </div>
          <div className={cn("min-w-0 overflow-hidden transition-[width,opacity] duration-200", sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <p className="text-sm font-semibold tracking-[-0.01em]">聚合客服</p>
            <p className="mt-0.5 text-[11px] text-[#94a3b8]">智能工作台</p>
          </div>
          <button
            type="button"
            aria-label="切换工作区"
            title="切换工作区"
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#64748b] transition hover:bg-[#f1f5f9]",
              sidebarCollapsed && "pointer-events-none w-0 overflow-hidden px-0 opacity-0"
            )}
          >
            <span className="max-w-20 truncate">客服工作区</span>
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div className={cn("flex-1 space-y-7 overflow-y-auto py-6", sidebarCollapsed ? "px-2" : "px-3")}>
          <NavGroup label="工作台" items={workItems} pathname={pathname} collapsed={sidebarCollapsed} />
          <NavGroup label="会话服务" items={conversationItems} pathname={pathname} collapsed={sidebarCollapsed} />
          <NavGroup label="AI 配置" items={aiItems} pathname={pathname} collapsed={sidebarCollapsed} />
          <NavGroup label="流程控制" items={flowItems} pathname={pathname} collapsed={sidebarCollapsed} />
          <NavGroup label="渠道与日志" items={channelItems} pathname={pathname} collapsed={sidebarCollapsed} />
          <NavGroup label="系统设置" items={systemItems} pathname={pathname} collapsed={sidebarCollapsed} />
        </div>

        <div className={cn("border-t border-[#edf1f5] p-3", sidebarCollapsed && "px-2")}>
          <div className={cn("flex items-center rounded-xl bg-[#f8fafc] py-3", sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3")}>
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
              {session?.displayName.slice(0, 1) ?? "客"}
            </div>
            <div className={cn("min-w-0 overflow-hidden transition-[width,opacity] duration-200", sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
              <p className="truncate text-xs font-semibold text-[#334155]">
                {session?.displayName ?? "客服专员"}
              </p>
              <p className="truncate text-[11px] text-[#94a3b8]">{session?.role ?? "客服主管"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="退出登录"
              title="退出登录"
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg text-[#94a3b8] transition hover:bg-white hover:text-[#dc2626]",
                sidebarCollapsed ? "pointer-events-none w-0 opacity-0" : "ml-auto opacity-100"
              )}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className={cn("transition-[padding-left] duration-200", sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[288px]")}>
        <header className="sticky top-0 z-20 border-b border-[#e2e8f0]/90 bg-white/95 backdrop-blur">
          <div className="flex min-h-[78px] items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? "展开导航栏" : "收起导航栏"}
                title={sidebarCollapsed ? "展开导航栏" : "收起导航栏"}
                className="hidden size-9 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#1d4ed8] md:grid"
              >
                {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-label={mobileNavOpen ? "关闭导航" : "打开导航"}
                title={mobileNavOpen ? "关闭导航" : "打开导航"}
                className="grid size-9 place-items-center rounded-lg border border-[#e2e8f0] text-[#64748b] md:hidden"
              >
                <ChevronDown className={cn("size-4 transition", mobileNavOpen && "rotate-180")} />
              </button>
              <div className="min-w-0">
                {pageMeta.eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                    {pageMeta.eyebrow}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <h1 className="truncate text-lg font-semibold tracking-[-0.01em] text-[#0f172a]">
                    {pageMeta.title}
                  </h1>
                </div>
              </div>
              {pageMeta.description ? (
                <>
                  <span className="hidden h-5 w-px bg-[#e2e8f0] sm:block" />
                  <p className="hidden truncate text-sm text-[#64748b] lg:block">{pageMeta.description}</p>
                </>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#dcefe4] bg-[#f2fbf5] px-3 py-1.5 text-xs font-medium text-[#25834b] sm:flex">
                <span className="size-1.5 rounded-full bg-[#38b86b]" />
                服务运行正常
              </div>
              <button
                type="button"
                aria-label="帮助"
                title="帮助"
                className="grid size-9 place-items-center rounded-lg text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
              >
                <CircleHelp className="size-4.5" />
              </button>
              <div className="hidden items-center gap-2 sm:flex">
              <div className="grid size-8 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
                  {session?.displayName.slice(0, 1) ?? "客"}
                </div>
                <span className="max-w-24 truncate text-sm font-medium text-[#334155]">
                  {session?.displayName ?? "客服专员"}
                </span>
              </div>
            </div>
          </div>

          {mobileNavOpen ? (
            <div className="border-t border-[#edf1f5] bg-white px-5 py-4 md:hidden">
              <div className="grid gap-1 sm:grid-cols-3">
                {[...workItems, ...conversationItems, ...aiItems, ...flowItems, ...channelItems, ...systemItems].map((item) => {
                  const Icon = item.icon
                  const active = isNavItemActive(item.href, pathname)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                        active ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#64748b]"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#dc2626]"
              >
                <LogOut className="size-4" />
                退出登录
              </button>
            </div>
          ) : null}
        </header>

        <main className="mx-auto min-h-[calc(100vh-78px)] w-full max-w-[1600px] px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
