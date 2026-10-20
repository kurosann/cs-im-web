"use client"

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

import { login, readSession } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const operatingPoints = [
  "统一接入多个客户消息渠道",
  "AI 与人工坐席协同处理",
  "实时查看会话、投递和渠道状态",
]

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (readSession()) {
      router.replace("/")
    }
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const normalizedIdentifier = identifier.trim().toLowerCase()
    if (!normalizedIdentifier) {
      setError("请输入邮箱或账号。")
      return
    }

    if (!password) {
      setError("请输入密码。")
      return
    }

    if (!agreedToTerms) {
      setError("请先阅读并同意隐私政策和用户协议。")
      return
    }

    setIsSubmitting(true)
    const result = await login(normalizedIdentifier, password, remember)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }

    router.replace("/")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-primary px-8 py-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:px-10 xl:py-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-primary">
              <svg className="absolute inset-0 size-full text-primary-foreground/14" fill="none">
                <defs>
                  <pattern id="login-grid" width="56" height="56" patternUnits="userSpaceOnUse">
                    <path d="M56 0H0v56" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#login-grid)" />
              </svg>
              <svg className="absolute inset-0 size-full text-primary-foreground/25" fill="none">
                <path d="M-40 520C130 420 245 340 390 220C500 128 630 72 760 44" stroke="currentColor" strokeWidth="1" />
                <path d="M-40 700C160 640 280 520 380 390C470 274 600 190 780 150" stroke="currentColor" strokeWidth="1" />
                <path d="M120 100C230 220 330 310 480 380C600 436 700 520 780 640" stroke="currentColor" strokeWidth="1" />
                <path d="M180 820C280 680 380 600 520 540C630 492 700 420 760 320" stroke="currentColor" strokeWidth="1" />
              </svg>
              <svg className="absolute inset-0 size-full text-primary-foreground/70" fill="currentColor">
                <circle cx="390" cy="220" r="2.5" />
                <circle cx="380" cy="390" r="3.5" />
                <circle cx="520" cy="540" r="2.5" />
                <circle cx="480" cy="380" r="4" />
                <circle cx="760" cy="44" r="2" />
                <circle cx="120" cy="100" r="2" />
              </svg>
              <div className="absolute -top-24 -left-16 size-[420px] rounded-full bg-primary-foreground/10 blur-[120px]" />
              <div className="absolute -bottom-32 right-0 size-[360px] rounded-full bg-primary-foreground/8 blur-[110px]" />
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15">
                <MessageCircle className="size-5" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[15px] font-semibold">聚合客服</p>
                <p className="mt-0.5 text-xs text-primary-foreground/70">统一工作台</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl xl:mt-32">
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] xl:text-7xl">
                让每一条客户消息都有明确去处。
              </h1>
              <p className="mt-7 max-w-lg text-[15px] leading-7 text-primary-foreground/75">
                从统一收件、智能判断到人工接管，把客服团队每天反复处理的工作集中在一个安静、清晰的工作台里。
              </p>

              <div className="mt-8 flex flex-col gap-4">
                {operatingPoints.map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-primary-foreground/85">
                    <span className="grid size-5 place-items-center rounded-full border border-primary-foreground/30">
                      <Check className="size-3" strokeWidth={2.8} />
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
          <div className="w-full max-w-[460px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <MessageCircle className="size-5" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-sm font-semibold">聚合客服</p>
                <p className="text-xs text-muted-foreground">统一工作台</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">登录工作台</CardTitle>
                <CardDescription>使用平台账号进入聚合客服系统。</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="identifier">邮箱或账号</FieldLabel>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="identifier"
                          className="pl-10"
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          autoComplete="username"
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          className="pr-11 pl-10"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={showPassword ? "隐藏密码" : "显示密码"}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((show) => !show)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </Field>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={remember}
                        onCheckedChange={(checked) => setRemember(Boolean(checked))}
                      />
                      <FieldLabel htmlFor="remember" className="text-muted-foreground">
                        记住本次登录
                      </FieldLabel>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="privacy-consent"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
                        aria-required
                      />
                      <FieldLabel htmlFor="privacy-consent" className="font-normal leading-5 text-muted-foreground">
                        我已阅读并同意
                        <Link href="/privacy" className="mx-1 font-medium text-primary">
                          《隐私政策》
                        </Link>
                        和
                        <Link href="/terms" className="ml-1 font-medium text-primary">
                          《用户协议》
                        </Link>
                      </FieldLabel>
                    </div>

                    {error ? (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
                      {isSubmitting ? "正在进入工作台..." : "进入工作台"}
                      <ArrowRight data-icon="inline-end" className="size-4" />
                    </Button>

                    {process.env.NODE_ENV !== "production" ? (
                      <Button type="button" variant="outline" className="h-11 w-full" asChild>
                        <Link href="/preview">开发预览：直接进入 V2 工作台</Link>
                      </Button>
                    ) : null}
                  </FieldGroup>
                </form>
              </CardContent>

              <FieldDescription className="pb-6 text-center">
                还没有账号？
                <Link href="/register" className="ml-1 font-medium text-primary">
                  立即注册
                </Link>
              </FieldDescription>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
