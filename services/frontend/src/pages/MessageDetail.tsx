import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { fetchAttachments, fetchMessage, type Attachment, type Email } from "../lib/api"

export default function MessageDetail() {
  const { messageId = "" } = useParams()
  const [message, setMessage] = useState<Email | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [view, setView] = useState<"email" | "metadata">("email")

  useEffect(() => {
    fetchMessage(messageId).then(setMessage)
    fetchAttachments(messageId).then(r => setAttachments(r.items))
  }, [messageId])

  if (!message) return <div>Loading...</div>

  const headers = message.parsed?.headers || {}
  const bodyText = message.parsed?.text?.trim()
  const htmlBody = message.parsed?.html?.trim()
  const to = message.mimeTo || message.recipients?.join(", ") || headers.To || headers.to || "-"
  const from = message.from || message.sender || headers.From || headers.from || "-"
  const received = message.receivedAt || message.sortKey?.split("#")[0] || "-"

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{message.subject}</h1>
        <div className="text-sm text-slate-500">{from} · {received}</div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-sm text-slate-500">Status</div><div className="font-semibold">{message.status}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Final</div><div className="font-semibold">{message.finalVerdict}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">ML</div><div className="font-semibold">{message.mlVerdict}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Virus</div><div className="font-semibold">{message.virusVerdict}</div></div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("email")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "email" ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          Email view
        </button>
        <button
          type="button"
          onClick={() => setView("metadata")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "metadata" ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          Metadata
        </button>
      </div>

      {view === "email" ? (
        <section className="card p-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl font-semibold">{message.subject || "(no subject)"}</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="grid grid-cols-[72px_1fr] gap-3">
                <dt className="text-slate-400">From</dt>
                <dd>{from}</dd>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-3">
                <dt className="text-slate-400">To</dt>
                <dd>{to}</dd>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-3">
                <dt className="text-slate-400">Date</dt>
                <dd>{received}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 min-h-[260px] rounded-lg border border-slate-100 bg-white p-6 text-slate-800">
            {bodyText ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-base leading-7">{bodyText}</pre>
            ) : htmlBody ? (
              <iframe
                className="h-[420px] w-full rounded-lg border border-slate-100 bg-white"
                sandbox=""
                title="Email HTML preview"
                srcDoc={htmlBody}
              />
            ) : (
              <p className="text-slate-500">No parsed email body is available for this message.</p>
            )}
          </div>
        </section>
      ) : (
      <section className="card p-6">
        <h2 className="font-semibold mb-3">Metadata</h2>
        <pre className="text-sm overflow-auto bg-slate-50 rounded-lg p-4">{JSON.stringify(message, null, 2)}</pre>
      </section>
      )}

      <section className="card p-6">
        <h2 className="font-semibold mb-3">Attachments</h2>
        <div className="space-y-3">
          {attachments.map(att => (
            <div key={att.attachmentId} className="border border-slate-100 rounded-lg p-3">
              <div className="font-medium">{att.filename}</div>
              <div className="text-sm text-slate-500 break-all">{att.sha256}</div>
              <div className="text-sm mt-1">{att.scanStatus} · {att.scanVerdict} · {att.clamavSignature}</div>
            </div>
          ))}
          {!attachments.length && <div className="text-sm text-slate-500">No attachments</div>}
        </div>
      </section>
    </div>
  )
}
