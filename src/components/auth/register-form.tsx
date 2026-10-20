"use client"

import { Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { register } from "@/lib/auth"

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    tenantName: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    if (!form.displayName.trim() || !form.email.trim() || !form.password) {
      setError("请填写姓名、邮箱和密码。")
      return
    }
    if (form.password.length < 8) {
      setError("密码至少需要 8 个字符。")
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致。")
      return
    }

    setError("")
    setIsSubmitting(true)
    const result = await register({
      displayName: form.displayName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      tenantName: form.tenantName.trim(),
    })
    if (result.ok) {
      router.replace("/")
      return
    }
    setError(result.message)
    setIsSubmitting(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6">
      <Card className="w-full max-w-[460px]">
        <CardHeader className="items-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" strokeWidth={2.5} />
          </span>
          <CardTitle className="text-2xl">创建租户主账号</CardTitle>
          <CardDescription>
            主账号将成为一个独立租户，并拥有这个租户的超级管理员权限。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>姓名</FieldLabel>
                <Input
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="例如：李清"
                />
              </Field>
              <Field>
                <FieldLabel>邮箱</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="name@company.com"
                />
              </Field>
              <Field>
                <FieldLabel>租户名称</FieldLabel>
                <Input
                  value={form.tenantName}
                  onChange={(event) => setForm({ ...form, tenantName: event.target.value })}
                  placeholder="例如：官网客服工作区"
                />
                <FieldDescription>不填时默认使用“姓名 + 的工作区”。</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>密码</FieldLabel>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="至少 8 个字符"
                />
              </Field>
              <Field>
                <FieldLabel>确认密码</FieldLabel>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  placeholder="再次输入密码"
                />
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {isSubmitting ? "正在创建租户…" : "创建租户并进入工作台"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号？
              <Link href="/login" className="ml-1 font-medium text-primary">
                返回登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
