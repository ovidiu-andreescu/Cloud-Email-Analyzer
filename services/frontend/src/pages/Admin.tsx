import React, { useEffect, useState } from "react"
import { fetchAdminMailboxes, fetchAdminMessages, fetchAdminUsers, type Email, type User } from "../lib/api"

export default function Admin() {
  const [messages, setMessages] = useState<Email[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [mailboxes, setMailboxes] = useState<any[]>([])

  useEffect(() => {
    fetchAdminMessages().then(r => setMessages(r.items)).catch(console.error)
    fetchAdminUsers().then(r => setUsers(r.items)).catch(console.error)
    fetchAdminMailboxes().then(r => setMailboxes(r.items)).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-slate-500">All users, mailboxes, and analyzed messages</div>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5"><div className="text-sm text-slate-500">Messages</div><div className="text-3xl font-bold">{messages.length}</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">Users</div><div className="text-3xl font-bold">{users.length}</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">Mailboxes</div><div className="text-3xl font-bold">{mailboxes.length}</div></div>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold mb-3">Recent Messages</h2>
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.messageId} className="border border-slate-100 rounded-lg p-3">
              <div className="font-medium">{m.subject}</div>
              <div className="text-sm text-slate-500">{m.from} · {m.finalVerdict} · {m.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
