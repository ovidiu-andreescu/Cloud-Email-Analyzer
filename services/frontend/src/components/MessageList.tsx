import { Paperclip } from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"
import Badge from "./Badge"
import type { Email } from "../lib/api"
import { formatDate } from "../lib/format"
import { receivedAt, recipientLabel, senderLabel, verdictTone } from "../lib/messages"

type MessageListProps = {
  items: Email[]
  framed?: boolean
  backTo?: MessageBackTarget
}

export type MessageBackTarget = {
  to: string
  label: string
  source?: string
}

const desktopColumns = "xl:grid-cols-[88px_minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,2fr)_104px_116px_48px]"
const twoLineText = "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"

export default function MessageList({ items, framed = true, backTo }: MessageListProps) {
  const desktop = (
    <div className="hidden xl:block">
      <div className={`grid min-w-0 gap-3 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-400 ${desktopColumns}`}>
        <div>Received</div>
        <div>From</div>
        <div>Mailbox</div>
        <div>Subject</div>
        <div>Status</div>
        <div>Final</div>
        <div className="justify-self-end">Files</div>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((message) => (
          <MessageRow key={message.messageId} message={message} backTo={backTo} />
        ))}
      </div>
    </div>
  )

  const mobile = (
    <div className={framed ? "space-y-3 xl:hidden" : "divide-y divide-slate-100 xl:hidden"}>
      {items.map((message) => (
        <MessageCard key={message.messageId} message={message} framed={framed} backTo={backTo} />
      ))}
    </div>
  )

  if (!framed) {
    return (
      <>
        {desktop}
        {mobile}
      </>
    )
  }

  return (
    <>
      <section className="card hidden xl:block">{desktop}</section>
      {mobile}
    </>
  )
}

function MessageRow({ message, backTo }: { message: Email; backTo?: MessageBackTarget }) {
  return (
    <Link
      to={messageHref(message.messageId, backTo)}
      state={backTo ? { backTo } : undefined}
      className={`group/message grid min-w-0 gap-3 px-5 py-4 outline-none transition hover:bg-slate-50 focus-visible:bg-primary/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${desktopColumns}`}
      aria-label={`Open message ${message.subject || "without subject"} from ${senderLabel(message)}`}
    >
      <div className="min-w-0 text-sm text-slate-500" title={receivedAt(message)}>{formatDate(receivedAt(message))}</div>
      <div className={`min-w-0 break-all text-slate-800 ${twoLineText}`} title={senderLabel(message)}>{senderLabel(message)}</div>
      <div className={`min-w-0 break-all text-slate-800 ${twoLineText}`} title={recipientLabel(message)}>{recipientLabel(message)}</div>
      <div className={`min-w-0 break-words font-semibold text-primary ${twoLineText}`} title={message.subject || "(no subject)"}>{message.subject || "(no subject)"}</div>
      <div className="min-w-0 truncate text-sm font-medium text-slate-600">{message.status || "PENDING"}</div>
      <ThreatVerdict message={message} />
      <div className="min-w-0 justify-self-end">
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <Paperclip size={15} aria-hidden="true" />
          {message.attachmentCount ?? 0}
        </span>
      </div>
    </Link>
  )
}

function MessageCard({ message, framed, backTo }: { message: Email; framed: boolean; backTo?: MessageBackTarget }) {
  return (
    <Link
      to={messageHref(message.messageId, backTo)}
      state={backTo ? { backTo } : undefined}
      className={`${framed ? "card block p-4" : "block px-5 py-4"} min-w-0 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30`}
      aria-label={`Open message ${message.subject || "without subject"} from ${senderLabel(message)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`break-words font-semibold text-slate-900 ${twoLineText}`}>{message.subject || "(no subject)"}</div>
          <div className={`mt-1 break-all text-sm text-slate-500 ${twoLineText}`}>{senderLabel(message)} to {recipientLabel(message)}</div>
        </div>
        <div className="shrink-0 text-xs text-slate-400">{formatDate(receivedAt(message))}</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ThreatVerdict message={message} compact />
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Paperclip size={14} aria-hidden="true" />
          {message.attachmentCount ?? 0}
        </span>
      </div>
    </Link>
  )
}

function messageHref(messageId: string, backTo?: MessageBackTarget) {
  const suffix = backTo?.source ? `?from=${encodeURIComponent(backTo.source)}` : ""
  return `/messages/${messageId}${suffix}`
}

function ThreatVerdict({ message, compact = false }: { message: Email; compact?: boolean }) {
  return (
    <div className="group/final relative min-w-0">
      <Badge
        tone={verdictTone(message.finalVerdict)}
        title={`Final: ${message.finalVerdict || "PENDING"}. ML: ${message.mlVerdict || "PENDING"}. Virus: ${message.virusVerdict || "PENDING"}.`}
      >
        {compact ? `Final ${message.finalVerdict || "PENDING"}` : message.finalVerdict || "PENDING"}
      </Badge>
      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute right-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-lg border border-slate-200 bg-white p-3 text-sm opacity-0 shadow-lg ring-1 ring-slate-900/5 transition group-hover/final:visible group-hover/final:opacity-100 group-focus-visible/message:visible group-focus-visible/message:opacity-100"
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Threat details</div>
        <dl className="mt-2 space-y-2">
          <ThreatLine label="ML" value={message.mlVerdict || "PENDING"} tone={verdictTone(message.mlVerdict)} />
          <ThreatLine label="Virus" value={message.virusVerdict || "PENDING"} tone={verdictTone(message.virusVerdict)} />
          {message.mlCategory && <ThreatLine label="Category" value={message.mlCategory} />}
        </dl>
      </div>
    </div>
  )
}

function ThreatLine({ label, value, tone = "neutral" }: { label: string; value: string; tone?: ReturnType<typeof verdictTone> }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0">
        <Badge tone={tone} title={`${label}: ${value}`}>
          <span className="block max-w-36 truncate">{value}</span>
        </Badge>
      </dd>
    </div>
  )
}
