"use client"

import {
  Activity,
  ArrowRightLeft,
  BellRing,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  FileClock,
  KeyRound,
  LibraryBig,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Webhook,
  UsersRound,
} from "lucide-react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { WebSession, logout, readSession } from "@/lib/auth"
import { listConversations } from "@/lib/gateway"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  count?: number
  alert?: boolean
  children?: Array<{
    href: string
    label: string
  }>
}

const workItems: NavItem[] = [
  { href: "/", label: "总览", icon: LayoutDashboard },
  { href: "/v2", label: "V2 验收入口", icon: Sparkles },
]

const platformItems: NavItem[] = [
  {
    href: "/team",
    label: "团队管理",
    icon: UsersRound,
    children: [
    { href: "/team", label: "员工管理" },
      { href: "/roles", label: "角色管理" },
    ],
  },
  { href: "/channel-access", label: "渠道接入", icon: KeyRound },
  { href: "/monitor", label: "渠道监控", icon: MonitorCog },
  { href: "/audit", label: "审计日志", icon: ShieldCheck },
]

const conversationItems: NavItem[] = [
  { href: "/conversations", label: "会话", icon: MessageSquareText, alert: true },
  { href: "/chat", label: "客服聊天", icon: Activity, alert: true },
]

const aiItems: NavItem[] = [
  { href: "/employee", label: "AI 客服员工", icon: Bot },
  { href: "/knowledge", label: "知识库", icon: LibraryBig },
]

const flowItems: NavItem[] = [
  { href: "/assign", label: "智能分配", icon: ArrowRightLeft },
  { href: "/reminders", label: "基础提醒", icon: BellRing },
]

const systemItems: NavItem[] = [
  { href: "/logs", label: "消息日志", icon: FileClock },
  { href: "/webhook", label: "Webhook", icon: Webhook },
  { href: "/settings", label: "设置", icon: Settings2 },
]

const pageTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/": {
    eyebrow: "工作台",
    title: "总览",
    description: "快速掌握当前服务状态和待处理工作。",
  },
  "/v2": {
    eyebrow: "V2 工作台",
    title: "总览",
    description: "V2 智能工作台入口，集中查看 AI 辅助、翻译和会话服务状态。",
  },
  "/v2/chat": {
    eyebrow: "V2 会话服务",
    title: "聊天室",
    description: "AI 建议填充、自动翻译、会话摘要、风险识别和上下文协作。",
  },
  "/v2/employee": {
    eyebrow: "V2 AI 配置",
    title: "AI 客服员工",
    description: "配置 AI 员工的基础模式、专业模式、账号绑定和发布状态。",
  },
  "/v2/knowledge": {
    eyebrow: "V2 AI 配置",
    title: "知识库",
    description: "维护 FAQ、政策、规则、多语言答案和命中统计。",
  },
  "/v2/assign": {
    eyebrow: "V2 流程控制",
    title: "智能分配",
    description: "按技能、语言、负载和风险把会话分配给 AI 或人工坐席。",
  },
  "/v2/reminders": {
    eyebrow: "V2 流程控制",
    title: "基础提醒",
    description: "集中处理超时、失败、高风险和转人工提醒。",
  },
  "/conversations": {
    eyebrow: "客服工作",
    title: "会话",
    description: "集中处理来自各个渠道的客户消息。",
  },
  "/chat": {
    eyebrow: "客户服务",
    title: "客服聊天",
    description: "使用快捷回复和 AI 建议协助处理会话。",
  },
  "/ai": {
    eyebrow: "工作台",
    title: "总览",
    description: "统一查看智能接待、人工协作和知识服务状态。",
  },
  "/employee": {
    eyebrow: "AI 配置",
    title: "AI 客服员工",
    description: "配置 AI 员工的人设、知识范围和自动回复策略。",
  },
  "/knowledge": {
    eyebrow: "AI 配置",
    title: "知识库",
    description: "维护 FAQ、政策、规则和多语言答案。",
  },
  "/assign": {
    eyebrow: "流程控制",
    title: "智能分配",
    description: "按规则优先级将会话分配给 AI 或人工坐席。",
  },
  "/reminders": {
    eyebrow: "流程控制",
    title: "基础提醒",
    description: "集中处理超时、失败和转人工提醒。",
  },
  "/team": {
    eyebrow: "团队管理",
    title: "员工管理",
    description: "管理员工账号、角色和状态。",
  },
  "/roles": {
    eyebrow: "团队管理",
    title: "角色管理",
    description: "维护权限模板，并按角色分配系统能力。",
  },
  "/channel-access": {
    eyebrow: "平台管理",
    title: "渠道接入",
    description: "管理业务渠道 AppID 和平台转发渠道。",
  },
  "/monitor": {
    eyebrow: "平台管理",
    title: "渠道监控",
    description: "查看渠道健康、投递状态、转发链路和告警。",
  },
  "/audit": {
    eyebrow: "平台管理",
    title: "审计日志",
    description: "查看登录、凭证变更、权限调整和越权访问。",
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
  if (href === "/" || href === "/v2") {
    return pathname === href
  }

  return pathname.startsWith(href)
}

function NavGroup({
  label,
  items,
  pathname,
  counts,
}: {
  label: string
  items: NavItem[]
  pathname: string
  counts?: Record<string, number>
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            if (item.children) {
              const isChildActive = item.children.some((child) => isNavItemActive(child.href, pathname))

              return (
                <CollapsiblePrimitive.Root
                  key={`${item.href}-${isChildActive ? "active" : "idle"}`}
                  className="group/collapsible"
                  defaultOpen={isChildActive}
                >
                  <SidebarMenuItem>
                    <CollapsiblePrimitive.Trigger asChild>
                      <SidebarMenuButton isActive={isChildActive} tooltip={item.label}>
                        <Icon className="size-4" strokeWidth={2.2} />
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsiblePrimitive.Trigger>
                    <CollapsiblePrimitive.Content>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={isNavItemActive(child.href, pathname)}>
                              <Link href={child.href}>
                                <span>{child.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsiblePrimitive.Content>
                  </SidebarMenuItem>
                </CollapsiblePrimitive.Root>
              )
            }

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isNavItemActive(item.href, pathname)}>
                  <Link href={item.href}>
                    <Icon className="size-4" strokeWidth={2.2} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.alert && (counts?.[item.href] ?? 0) > 0 ? (
                  <SidebarMenuBadge
                    aria-label={`未读 ${counts?.[item.href]} 条`}
                    className="min-w-5 rounded-full bg-destructive px-1.5 py-0 text-[10px] font-semibold text-white"
                  >
                    {counts?.[item.href] ?? 0}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<WebSession | null>(null)
  const [menuCounts, setMenuCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setSession(readSession()), 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!session) return

    let active = true
    const loadUnreadCounts = async () => {
      try {
        const page = await listConversations({ page: 1, pageSize: 100 })
        if (!active) return
        const unreadCount = page.items.reduce((total, item) => total + (item.unreadCount ?? 0), 0)
        setMenuCounts({
          "/conversations": unreadCount,
          "/chat": unreadCount,
        })
      } catch {
        if (active) setMenuCounts({})
      }
    }

    void loadUnreadCounts()
    window.addEventListener("cs-im:unread-changed", loadUnreadCounts)
    const timer = window.setInterval(loadUnreadCounts, 15000)

    return () => {
      active = false
      window.removeEventListener("cs-im:unread-changed", loadUnreadCounts)
      window.clearInterval(timer)
    }
  }, [session])

  const pageMeta = useMemo(
    () =>
      pageTitles[pathname] ?? {
        eyebrow: "工作台",
        title: "页面",
        description: "查看和管理工作台信息。",
      },
    [pathname]
  )

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex h-14 justify-center border-b border-sidebar-border py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="聚合客服">
                  <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <MessageSquareText className="size-4" strokeWidth={2.4} />
                  </span>
                  <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold">聚合客服</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">智能工作台</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <NavGroup label="工作台" items={workItems} pathname={pathname} />
            <NavGroup label="客户服务" items={conversationItems} pathname={pathname} counts={menuCounts} />
            <NavGroup label="AI 配置" items={aiItems} pathname={pathname} />
            <NavGroup label="流程工作" items={flowItems} pathname={pathname} />
            <NavGroup label="平台管理" items={platformItems} pathname={pathname} />
            <NavGroup label="系统设置" items={systemItems} pathname={pathname} />
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" tooltip={session?.displayName ?? "客服专员"}>
                      <Avatar>
                        <AvatarFallback>
                          {session?.displayName.slice(0, 1) ?? "客"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-semibold">
                          {session?.displayName ?? "客服专员"}
                        </span>
                        <span className="truncate text-xs text-sidebar-foreground/60">
                          {session?.email ?? "member@example.com"}
                        </span>
                      </span>
                      <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="right"
                    sideOffset={4}
                    className="min-w-56"
                  >
                    <DropdownMenuLabel className="flex items-center gap-2 p-0">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <Avatar>
                          <AvatarFallback>
                            {session?.displayName.slice(0, 1) ?? "客"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 leading-tight">
                          <span className="truncate text-sm font-medium">
                            {session?.displayName ?? "客服专员"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {session?.email ?? "member@example.com"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="size-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 xl:gap-4">
                <SidebarTrigger className="hidden md:inline-flex" />
                <div className="min-w-0">
                  {pageMeta.eyebrow ? (
                    <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
                      {pageMeta.eyebrow}
                    </p>
                  ) : null}
                  <h1 className="truncate text-lg font-semibold">{pageMeta.title}</h1>
                </div>
                <p className="hidden max-w-sm truncate border-l pl-4 text-sm text-muted-foreground xl:block">
                  {pageMeta.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Button variant="ghost" size="icon" aria-label="帮助">
                  <CircleHelp className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-5">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
