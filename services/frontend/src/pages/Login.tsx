import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../lib/api"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    try {
      await login(email, password)
      navigate("/")
    } catch {
      setError("Login failed")
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 px-4">
      <form onSubmit={submit} autoComplete="off" className="card p-8 w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Email Analyzer</h1>
          <p className="text-sm text-slate-500 mt-1">Local demo sign in</p>
        </div>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="Email address"
        />
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Password"
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="w-full bg-primary text-white rounded-lg px-3 py-2 font-medium">Sign in</button>
      </form>
    </div>
  )
}
