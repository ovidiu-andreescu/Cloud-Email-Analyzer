import React from "react"

export default function StatCard(props: {
  title: string
  value: string | number
  deltaPct?: number
  icon?: string
}) {
  const { title, value, deltaPct, icon } = props
  const pos = (deltaPct ?? 0) >= 0
  return (
    <div className="card p-6 flex-1 min-w-[220px]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 grid place-items-center text-2xl">{icon ?? "📈"}</div>
        <div className="text-slate-500 font-medium">{title}</div>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      {deltaPct !== undefined && (
        <div className={"mt-1 text-sm " + (pos ? "text-green-600" : "text-red-600")}>
          {pos ? "↑" : "↓"} {Math.abs(deltaPct * 100).toFixed(0)}% {pos ? "this month" : "this week"}
        </div>
      )}
    </div>
  )
}
