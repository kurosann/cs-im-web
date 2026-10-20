"use client"

import { Lock, Upload } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { changeOwnPassword, clearSession, readSession } from "@/lib/auth"

export function ProfileView() {
  const router = useRouter()
  const session = readSession()
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (saving || !session) return
    if (form.currentPassword && form.newPassword.length < 8) {
      toast.error("新密码至少需要 8 位。")
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("两次输入的新密码不一致。")
      return
    }

    setSaving(true)
    const result = await changeOwnPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success("密码已更新，请重新登录。")
    clearSession()
    router.replace("/login")
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
          <CardDescription>查看当前账号的基础信息。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg font-semibold">
                {session?.displayName.slice(0, 1) ?? "客"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-sm font-medium">{session?.displayName ?? "未知用户"}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{session?.role ?? "成员"}</Badge>
                <Badge variant="outline">{session?.workspace ?? "工作区"}</Badge>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">邮箱</p>
              <p className="mt-1 break-all text-sm">{session?.email ?? "—"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" disabled>
            <Upload className="size-4" />
            更换头像
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>更新成功后所有会话会失效，需要重新登录。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>当前密码</FieldLabel>
              <Input
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>新密码</FieldLabel>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                placeholder="至少 8 位"
              />
            </Field>
            <Field>
              <FieldLabel>确认新密码</FieldLabel>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => void submit()}
            disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          >
            <Lock className="size-4" />
            {saving ? "正在保存..." : "保存新密码"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
