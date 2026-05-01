import { LockKeyhole, Mail, Shield } from "lucide-react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../lib/api"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      navigate("/")
    } catch {
      setError("The email or password is incorrect.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} autoComplete="off" className="card w-full max-w-md space-y-5 p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Shield size={26} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Email Analyzer</h1>
            <p className="text-sm text-slate-500">Sign in to your security inbox</p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Email address</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="w-full rounded-lg border border-slate-200 px-10 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@example.com"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="w-full rounded-lg border border-slate-200 px-10 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Password"
              required
            />
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          className="w-full rounded-lg bg-primary px-3 py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}
