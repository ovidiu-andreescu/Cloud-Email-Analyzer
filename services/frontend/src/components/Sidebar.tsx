import React from "react"

export default function Sidebar() {
  const items = [
    { label: "Activity", icon: "📊", active: true },
    { label: "Block List", icon: "🚫" },
    { label: "Updates & Help", icon: "❓" },
    { label: "Users' Details", icon: "👥" },
  ]
  return (
    <aside className="w-64 bg-white h-screen sticky top-0 p-6 hidden md:flex flex-col border-r border-slate-100">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold">E</div>
        <div className="text-lg font-semibold">Email Analyzer</div>
      </div>
      <nav className="space-y-1">
        {items.map((it) => (
          <button key={it.label}
            className={"sidebar-item w-full " + (it.active ? "bg-primary text-white hover:bg-primary" : "")}>
            <span className="text-xl">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>
            {it.active && <span>›</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 pt-6">
        <img src="/avatar.png" className="w-10 h-10 rounded-full" alt="avatar" />
        <div>
          <div className="font-medium">Evano</div>
          <div className="text-sm text-slate-500">Security Admin</div>
        </div>
      </div>
    </aside>
  )
}
