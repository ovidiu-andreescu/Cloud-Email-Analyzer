import { BookOpen, Inbox, LogOut, Shield } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import { clearToken, fetchMe, type User } from "./lib/api"

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken()
        navigate("/login")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500">
        Loading security workspace...
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 md:flex">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader user={user} />
        <main className="min-w-0 flex-1 p-4 md:p-8 lg:p-10">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}

function MobileHeader({ user }: { user: User }) {
  function signOut() {
    clearToken()
    location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Shield size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold leading-tight">Email Analyzer</div>
            <div className="max-w-[170px] truncate text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"
          aria-label="Sign out"
        >
          <LogOut size={17} aria-hidden="true" />
        </button>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto" aria-label="Mobile navigation">
        <MobileLink to="/" label="Inbox" icon={Inbox} />
        {user.role === "admin" && (
          <>
            <MobileLink to="/admin" label="Admin" icon={Shield} />
            <MobileLink to="/api-docs" label="API Docs" icon={BookOpen} />
          </>
        )}
      </nav>
    </header>
  )
}

function MobileLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Inbox }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </Link>
  )
}
