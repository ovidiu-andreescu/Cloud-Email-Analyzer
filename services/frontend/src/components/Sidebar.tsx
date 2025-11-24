import React from "react"
import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const items = [
    { label: "Activity", icon: "📊", href: "/" },
    { label: "API Docs", icon: "🔌", href: "/api-docs" }, // <-- NEW ITEM
    { label: "Block List", icon: "🚫", href: "/block-list" },
    { label: "Updates & Help", icon: "❓", href: "/help" },
    { label: "Users' Details", icon: "👥", href: "/users" },
  ]

  return (
    <aside className="w-64 bg-white h-screen sticky top-0 p-6 hidden md:flex flex-col border-r border-slate-100">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold">E</div>
        <div className="text-lg font-semibold">Email Analyzer</div>
      </div>
      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.label}
            to={it.href}
            // This function handles the active styling
            className={({ isActive }) =>
              "sidebar-item w-full " +
              (isActive ? "bg-primary text-white hover:bg-primary" : "")
            }
            // We set 'end' for the root path to avoid it matching all routes
            end={it.href === "/"}
          >
            <span className="text-xl">{it.icon}</span>
            <span className="flex-1 text-left">{it.label}</span>

            {/* This renders the '>' only if the link is active */}
            {({ isActive }) => (isActive && <span>›</span>)}
          </NavLink>
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