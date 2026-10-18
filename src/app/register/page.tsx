import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "注册 | 聚合客服",
  description: "创建聚合客服工作台账号",
}

export default function RegisterPage() {
  return <RegisterForm />
}
