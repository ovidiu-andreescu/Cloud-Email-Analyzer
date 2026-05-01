import { ArrowLeft } from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"

export default function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-primary shadow-sm hover:bg-slate-50">
      <ArrowLeft size={16} aria-hidden="true" />
      {children}
    </Link>
  )
}
