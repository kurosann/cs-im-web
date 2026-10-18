"use client"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { FormEvent, useState } from "react"

import { registerAccount } from "@/lib/auth"

const operatingPoints = [
  "统一接入多个客户消息渠道",
  "AI 与人工坐席协同处理",
  "实时查看会话、投递和渠道状态",
]

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedAccount = account.trim().toLowerCase()

    if (!normalizedEmail) {
      setError("请输入邮箱。")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("请输入有效的邮箱地址。")
      return
    }

    if (!normalizedAccount) {
      setError("请输入账号。")
      return
    }

    if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(normalizedAccount)) {
      setError("账号需为 2-32 位字母、数字、点、下划线或短横线。")
      return
    }

    if (password.length < 8) {
      setError("密码至少需要 8 位。")
      return
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。")
      return
    }

    if (!agreedToTerms) {
      setError("请先阅读并同意隐私政策和用户协议。")
      return
    }

    const result = registerAccount({
      account: normalizedAccount,
      email: normalizedEmail,
      password,
    })

    if (!result.ok) {
      setError(
        result.reason === "account_exists"
          ? "该账号已存在，请换一个账号。"
          : result.reason === "email_exists"
            ? "该邮箱已注册，请直接登录。"
            : "暂时无法完成注册，请稍后重试。"
      )
      return
    }

    setIsRegistered(true)
  }

  if (isRegistered) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 py-8 text-[#0f172a] sm:px-8">
        <section className="w-full max-w-[460px] rounded-[24px] border border-[#e2e8f0] bg-white p-7 text-center shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#dcfce7] text-[#15803d]">
            <Check className="size-6" strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">注册成功</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            账号已创建，现在可以使用邮箱或账号登录工作台。
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#2563eb]/20"
          >
            返回登录
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#0f172a]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-[#10253a] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(134,179,205,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(134,179,205,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
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
              <h2 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.02em] xl:text-[4.25rem]">
                从今天开始，
                <br />
                <span className="text-[#72c7ee]">让客户消息</span>
                <br />
                有序流转。
              </h2>
              <p className="mt-7 max-w-lg text-[15px] leading-7 text-[#b4c7d5]">
                创建工作台账号，集中管理客服会话、渠道状态和消息投递。
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
              <div className="mb-7">
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">
                  创建工作台账号
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  注册后即可登录并进入客服工作台。
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium text-[#334155]">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      className="h-12 w-full rounded-xl border border-[#dbe3ec] bg-[#fbfcfe] pl-10 pr-3 text-sm text-[#0f172a] outline-none transition placeholder:text-[#a4b0bd] focus:border-[#6b9cff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-account" className="text-sm font-medium text-[#334155]">
                    账号
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="register-account"
                      name="account"
                      type="text"
                      autoComplete="username"
                      value={account}
                      onChange={(event) => setAccount(event.target.value)}
                      placeholder="设置登录账号"
                      className="h-12 w-full rounded-xl border border-[#dbe3ec] bg-[#fbfcfe] pl-10 pr-3 text-sm text-[#0f172a] outline-none transition placeholder:text-[#a4b0bd] focus:border-[#6b9cff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-[#334155]">
                    密码
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="至少 8 位密码"
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

                <div className="space-y-2">
                  <label
                    htmlFor="register-confirm-password"
                    className="text-sm font-medium text-[#334155]"
                  >
                    确认密码
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="再次输入密码"
                      className="h-12 w-full rounded-xl border border-[#dbe3ec] bg-[#fbfcfe] pl-10 pr-11 text-sm text-[#0f172a] outline-none transition placeholder:text-[#a4b0bd] focus:border-[#6b9cff] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
                      title={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
                      className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#475569]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label
                  htmlFor="register-consent"
                  className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-[#64748b]"
                >
                  <input
                    id="register-consent"
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
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#2563eb]/20"
                >
                  创建账号
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#64748b]">
                已有账号？
                <Link
                  href="/login"
                  className="ml-1 inline-flex items-center gap-1 font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]"
                >
                  <ArrowLeft className="size-3.5" />
                  返回登录
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
