import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchInbox, fetchMe, type Email, type User } from "../lib/api"

function verdictClass(v?: string | null) {
  if (v === "SAFE" || v === "LOW_RISK") return "badge-safe"
  if (v === "UNSAFE" || v === "PHISHING") return "badge-unsafe"
  return "badge-suspicious"
}

export default function Inbox() {
  const [items, setItems] = useState<Email[]>([])
  const [me, setMe] = useState<User | null>(null)

  useEffect(() => {
    fetchMe().then(setMe).catch(() => location.href = "/login")
    fetchInbox().then(r => setItems(r.items)).catch(console.error)
  }, [])

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security Inbox</h1>
          <div className="text-sm text-slate-500">{me?.email} · {me?.role}</div>
        </div>
      </header>

      <section className="mt-6 card overflow-hidden">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-slate-400 text-sm">
              {["Received", "From", "Mailbox", "Subject", "Status", "Final", "ML", "Attachments"].map(h => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.messageId} className="border-t border-slate-100">
                <td className="px-6 py-4 text-sm text-slate-500">{m.receivedAt || m.sortKey?.split("#")[0]}</td>
                <td className="px-6 py-4">{m.from || m.sender}</td>
                <td className="px-6 py-4">{m.mailbox || "-"}</td>
                <td className="px-6 py-4 max-w-[320px] truncate">
                  <Link className="text-primary font-medium" to={`/messages/${m.messageId}`}>{m.subject}</Link>
                </td>
                <td className="px-6 py-4">{m.status}</td>
                <td className="px-6 py-4"><span className={`badge ${verdictClass(m.finalVerdict)}`}>{m.finalVerdict || "PENDING"}</span></td>
                <td className="px-6 py-4"><span className={`badge ${verdictClass(m.mlVerdict)}`}>{m.mlVerdict || "PENDING"}</span></td>
                <td className="px-6 py-4">{m.attachmentCount ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
