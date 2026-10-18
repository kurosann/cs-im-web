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

import {
  createSessionForIdentifier,
  isCredentialValid,
  readSession,
  writeSession,
} from "@/lib/auth"

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    if (!isCredentialValid(normalizedIdentifier, password)) {
      setError("邮箱/账号或密码不正确，请重试。")
      return
    }

    setIsSubmitting(true)
    writeSession(createSessionForIdentifier(normalizedIdentifier), remember)
    router.replace("/")
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-[#10253a] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(134,179,205,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(134,179,205,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,rgba(8,22,36,0.82))]" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-[13px] bg-[#2f72ff] shadow-[0_12px_30px_rgba(47,114,255,0.35)]">
                <MessageCircle className="size-5" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-[0.01em]">聚合客服</p>
                <p className="mt-0.5 text-xs text-[#a5bacb]">统一工作台</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl xl:mt-32">
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.02em] xl:text-[4.25rem]">
                让每一条
                <span className="text-[#72c7ee]"> 客户消息</span>
                <br />
                都有明确去处。
              </h1>
              <p className="mt-7 max-w-lg text-[15px] leading-7 text-[#b4c7d5]">
                从统一收件、智能判断到人工接管，把客服团队每天反复处理的工作集中在一个安静、清晰的工作台里。
              </p>

              <div className="mt-10 space-y-4">
                {operatingPoints.map((point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-[#d4e0e8]">
                    <span className="grid size-5 place-items-center rounded-full border border-[#5e91aa]/60 bg-[#1c4661]">
                      <Check className="size-3 text-[#8ee0b5]" strokeWidth={2.8} />
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-xl bg-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]">
                <MessageCircle className="size-5" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-semibold">聚合客服</p>
                <p className="text-xs text-slate-500">统一工作台</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-9">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">
                  欢迎回到工作台
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  登录后查看待处理会话、渠道健康度和消息投递情况。
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-sm font-medium text-[#334155]">
                    邮箱/账号
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="请输入邮箱或账号"
                      className="h-12 w-full rounded-xl border border-[#dbe3ec] bg-[#fbfcfe] pl-10 pr-3 text-sm text-[#0f172a] outline-none transition placeholder:text-[#a4b0bd] focus:border-[#6b9cff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                    密码
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="请输入密码"
                      className="h-12 w-full rounded-xl border border-[#dbe3ec] bg-[#fbfcfe] pl-10 pr-11 text-sm text-[#0f172a] outline-none transition placeholder:text-[#a4b0bd] focus:border-[#6b9cff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "隐藏密码" : "显示密码"}
                      title={showPassword ? "隐藏密码" : "显示密码"}
                      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-[#64748b]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="size-4 rounded border-[#cbd5e1] accent-[#2563eb]"
                    />
                    记住本次登录
                  </label>
                </div>

                <label
                  htmlFor="privacy-consent"
                  className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-[#64748b]"
                >
                  <input
                    id="privacy-consent"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(event) => setAgreedToTerms(event.target.checked)}
                    aria-required="true"
                    className="mt-0.5 size-4 shrink-0 rounded border-[#cbd5e1] accent-[#2563eb]"
                  />
                  <span>
                    我已阅读并同意
                    <Link
                      href="/privacy"
                      className="mx-1 whitespace-nowrap font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                    >
                      《隐私政策》
                    </Link>
                    和
                    <Link
                      href="/terms"
                      className="ml-1 whitespace-nowrap font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                    >
                      《用户协议》
                    </Link>
                  </span>
                </label>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-sm leading-5 text-[#b91c1c]"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#2563eb]/20 disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? "正在进入工作台..." : "进入工作台"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-[#64748b]">
                还没有账号？
                <Link
                  href="/register"
                  className="ml-1 font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
