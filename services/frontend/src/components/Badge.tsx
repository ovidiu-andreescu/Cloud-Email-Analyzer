import React from "react"

type Tone = "safe" | "unsafe" | "suspicious" | "neutral"

const toneClass: Record<Tone, string> = {
  safe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  unsafe: "bg-red-50 text-red-700 ring-red-200",
  suspicious: "bg-amber-50 text-amber-800 ring-amber-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
}

export default function Badge({
  tone = "neutral",
  children,
  title,
}: {
  tone?: Tone
  children: React.ReactNode
  title?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClass[tone]}`}
      title={title}
    >
      {children}
    </span>
  )
}
