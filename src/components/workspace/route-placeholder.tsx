import { ArrowUpRight, Construction } from "lucide-react"
import Link from "next/link"

export function RoutePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="flex min-h-[560px] items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-14 text-center shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:px-12">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
          <Construction className="size-5" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#64748b]">{description}</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          返回总览
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
