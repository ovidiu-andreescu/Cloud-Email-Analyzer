import { BookOpen, Inbox, LogOut, Shield, UserCircle } from "lucide-react"
import React from "react"
import { NavLink } from "react-router-dom"
import { clearToken, type User } from "../lib/api"

export default function Sidebar({ user }: { user: User }) {
  const items = [
    { label: "Inbox", icon: Inbox, href: "/" },
    ...(user.role === "admin"
      ? [
          { label: "Admin", icon: Shield, href: "/admin" },
          { label: "API Docs", icon: BookOpen, href: "/api-docs" },
        ]
      : []),
  ]

  function signOut() {
    clearToken()
    location.href = "/login"
  }

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex sticky top-0">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Shield size={22} aria-hidden="true" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight">Email Analyzer</div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Security inbox</div>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition " +
                (isActive ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
            <UserCircle size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{user.email}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{user.role}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
