import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "登录 | 聚合客服",
  description: "进入聚合客服统一工作台",
}

export default function LoginPage() {
  return <LoginForm />
}
