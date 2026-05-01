import React from "react"
import type { AuditEvent } from "../lib/api"
import { formatExactDate } from "../lib/format"

type AuditTableProps = {
  events: AuditEvent[]
  emptyText?: string
}

const columns = "lg:grid-cols-[190px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(120px,0.7fr)_96px]"

export default function AuditTable({ events, emptyText = "No audit events found." }: AuditTableProps) {
  return (
    <div className="min-w-0 overflow-hidden">
      <div className={`hidden border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid lg:gap-4 ${columns}`}>
        <div>Time</div>
        <div>Action</div>
        <div>Actor</div>
        <div>Message</div>
        <div>Role</div>
      </div>
      <div className="divide-y divide-slate-100">
        {events.map(event => (
          <AuditRow key={event.eventId || `${event.timestamp}-${event.action}-${event.messageId}`} event={event} />
        ))}
        {!events.length && <div className="px-5 py-4 text-sm text-slate-500">{emptyText}</div>}
      </div>
    </div>
  )
}

function AuditRow({ event }: { event: AuditEvent }) {
  const riskyDownload = event.action === "attachment.download.risky"
  return (
    <div className={`grid gap-2 px-5 py-4 text-sm lg:gap-4 ${columns} lg:items-center ${riskyDownload ? "bg-red-50/70 shadow-[inset_3px_0_0_rgb(239_68_68)]" : ""}`}>
      <AuditCell label="Time">
        <span className={riskyDownload ? "font-medium text-red-800" : "text-slate-600"}>{formatExactDate(event.timestamp)}</span>
      </AuditCell>
      <AuditCell label="Action">
        <span className={`font-semibold ${riskyDownload ? "text-red-900" : "text-slate-900"}`}>{event.action}</span>
      </AuditCell>
      <AuditCell label="Actor">
        <span className={`block min-w-0 truncate ${riskyDownload ? "text-red-900" : "text-slate-700"}`}>{event.actorEmail || "-"}</span>
        {event.actorUserId && <span className={`block min-w-0 truncate text-xs ${riskyDownload ? "text-red-700/70" : "text-slate-400"}`}>{event.actorUserId}</span>}
      </AuditCell>
      <AuditCell label="Message">
        <span className={`block min-w-0 truncate ${riskyDownload ? "font-medium text-red-900" : "text-slate-700"}`}>{event.messageId || "-"}</span>
      </AuditCell>
      <AuditCell label="Role">
        <RolePill role={event.actorRole} />
      </AuditCell>
    </div>
  )
}

function RolePill({ role }: { role?: string }) {
  if (!role) return <span className="text-xs font-semibold text-slate-400">-</span>
  const admin = role === "admin"
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide ${admin ? "bg-red-100 text-red-700 ring-1 ring-red-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
      {role}
    </span>
  )
}

function AuditCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">{label}</div>
      {children}
    </div>
  )
}
