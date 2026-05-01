import type { LucideIcon } from "lucide-react"
import React from "react"

export default function StatCard(props: {
  title: string
  value: string | number
  helper?: string
  icon?: LucideIcon
}) {
  const Icon = props.icon
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={20} aria-hidden="true" />
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-slate-500">{props.title}</div>
          <div className="text-3xl font-bold text-slate-800">{props.value}</div>
        </div>
      </div>
      {props.helper && <div className="mt-3 text-sm text-slate-500">{props.helper}</div>}
    </div>
  )
}
