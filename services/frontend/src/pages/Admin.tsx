import { Activity, AlertTriangle, BarChart3, Filter, Inbox, Mailbox, Paperclip, Shield, ShieldAlert, Users } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AuditTable from "../components/AuditTable"
import Badge from "../components/Badge"
import MessageList from "../components/MessageList"
import StatCard from "../components/StatCard"
import { fetchAdminMailboxes, fetchAdminMessages, fetchAdminUsers, fetchAuditLog, fetchSecuritySummary, fetchVerdictsOverTime, type AuditEvent, type Email, type Mailbox as MailboxRow, type SecuritySummary, type User, type VerdictTrend } from "../lib/api"
import { useSession } from "../lib/session"

const recentMessageCount = 5

export default function Admin() {
  const { user } = useSession()
  const [messages, setMessages] = useState<Email[]>([])
  const [summary, setSummary] = useState<SecuritySummary | null>(null)
  const [trends, setTrends] = useState<VerdictTrend[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [mailboxes, setMailboxes] = useState<MailboxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user.role !== "admin") return
    setLoading(true)
    Promise.all([
      fetchSecuritySummary(),
      fetchVerdictsOverTime(),
      fetchAuditLog({ limit: 8 }),
      fetchAdminUsers(),
      fetchAdminMailboxes(),
      fetchAdminMessages({ limit: recentMessageCount, sortBy: "receivedAt", sortDirection: "desc" }),
    ])
      .then(([summaryResponse, trendResponse, auditResponse, userResponse, mailboxResponse, messageResponse]) => {
        setSummary(summaryResponse)
        setTrends(trendResponse.items)
        setAuditEvents(auditResponse.items)
        setUsers(userResponse.items)
        setMailboxes(mailboxResponse.items)
        setMessages(messageResponse.items)
      })
      .catch(() => setError("Unable to load admin data."))
      .finally(() => setLoading(false))
  }, [user.role])

  const stats = useMemo(() => {
    const totals = summary?.totals
    return {
      messages: totals?.messages ?? 0,
      unsafe: totals?.unsafeMessages ?? 0,
      phishing: totals?.phishingMessages ?? 0,
      unsafeAttachments: totals?.unsafeAttachments ?? 0,
      needsReview: totals?.needsReview ?? 0,
    }
  }, [summary])

  if (user.role !== "admin") return <NotAuthorized />

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Shield size={16} aria-hidden="true" />
          Admin tools
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Security Operations</h1>
        <div className="text-sm text-slate-500">All users, mailbox mappings, and analyzed messages</div>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Messages" value={stats.messages} helper="Total analyzed" icon={Inbox} />
        <StatCard title="Unsafe" value={stats.unsafe} helper="Final unsafe verdict" icon={ShieldAlert} />
        <StatCard title="Phishing" value={stats.phishing} helper="ML phishing verdict" icon={AlertTriangle} />
        <StatCard title="Unsafe Files" value={stats.unsafeAttachments} helper="Attachment scan hits" icon={Paperclip} />
        <StatCard title="Review" value={stats.needsReview} helper="Failed, partial, or quarantined" icon={Filter} />
      </section>

      <SecurityMetrics summary={summary} trends={trends} />

      <section className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Messages</h2>
            <p className="text-sm text-slate-500">{loading ? "Loading..." : `${messages.length} latest messages`}</p>
          </div>
          <Link to="/admin/messages" className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            View all messages
          </Link>
        </div>
        <AdminMessageList messages={messages} loading={loading} />
      </section>

      <AuditLog events={auditEvents} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminRows title="Users" icon={Users} rows={users.map(row => ({
          key: row.userId || row.sub || row.email,
          primary: row.email,
          secondary: row.displayName || row.role,
          badge: row.role,
        }))} />
        <AdminRows title="Mailboxes" icon={Mailbox} rows={mailboxes.map(row => ({
          key: row.emailAddress,
          primary: row.emailAddress,
          secondary: (row.ownerUserIds || []).join(", ") || "No owner",
          badge: row.mailboxType || "MAILBOX",
        }))} />
      </section>
    </div>
  )
}

function AdminMessageList({ messages, loading }: { messages: Email[]; loading: boolean }) {
  if (loading) return <div className="p-6 text-sm text-slate-500">Loading messages...</div>
  if (!messages.length) return <div className="p-6 text-sm text-slate-500">No recent messages yet.</div>

  return (
    <MessageList items={messages} framed={false} backTo={{ to: "/admin", label: "Back to admin", source: "admin" }} />
  )
}

function SecurityMetrics({ summary, trends }: { summary: SecuritySummary | null; trends: VerdictTrend[] }) {
  const maxMailbox = Math.max(1, ...(summary?.mailboxes || []).map(row => row.count))
  const maxSender = Math.max(1, ...(summary?.topSenders || []).map(row => row.count))

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} aria-hidden="true" />
          <h2 className="font-semibold text-slate-900">Security Metrics</h2>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <MetricBars title="Top Senders" items={(summary?.topSenders || []).map(row => ({ label: row.sender, value: row.count }))} max={maxSender} />
          <MetricBars title="Mailbox Volume" items={(summary?.mailboxes || []).map(row => ({ label: row.mailbox, value: row.count }))} max={maxMailbox} />
        </div>
      </section>
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <Activity size={18} aria-hidden="true" />
          <h2 className="font-semibold text-slate-900">Verdicts Over Time</h2>
        </div>
        <div className="mt-5 space-y-3">
          {trends.map(row => (
            <div key={row.date} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-800">{row.date}</span>
                <span className="text-slate-500">{row.total || 0} total</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="safe">SAFE {row.SAFE || 0}</Badge>
                <Badge tone="unsafe">UNSAFE {row.UNSAFE || 0}</Badge>
                <Badge tone="suspicious">SUSPICIOUS {row.SUSPICIOUS || 0}</Badge>
              </div>
            </div>
          ))}
          {!trends.length && <div className="rounded-lg border border-slate-100 p-4 text-sm text-slate-500">No trend data yet.</div>}
        </div>
      </section>
    </section>
  )
}

function MetricBars({ title, items, max }: { title: string; items: { label: string; value: number }[]; max: number }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3 space-y-3">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="min-w-0 truncate">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {!items.length && <div className="rounded-lg border border-slate-100 p-3 text-sm text-slate-500">No data yet.</div>}
      </div>
    </div>
  )
}

function AuditLog({ events }: { events: AuditEvent[] }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} aria-hidden="true" />
          <h2 className="font-semibold text-slate-900">Recent Audit Log</h2>
        </div>
        <Link to="/admin/audit-log" className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          View all logs
        </Link>
      </div>
      <AuditTable events={events} emptyText="No audit events recorded yet." />
    </section>
  )
}

function AdminRows({
  title,
  icon: Icon,
  rows,
}: {
  title: string
  icon: typeof Users
  rows: { key: string; primary: string; secondary: string; badge: string }[]
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Icon size={18} aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900">{row.primary}</div>
              <div className="truncate text-sm text-slate-500">{row.secondary}</div>
            </div>
            <Badge tone="neutral">{row.badge}</Badge>
          </div>
        ))}
        {!rows.length && <div className="px-5 py-4 text-sm text-slate-500">No records found.</div>}
      </div>
    </section>
  )
}

function NotAuthorized() {
  return (
    <section className="card max-w-2xl p-8">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700">
        <ShieldAlert size={24} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Not authorized</h1>
      <p className="mt-2 text-slate-500">
        Your account can view its own inbox, but admin tools are only available to administrator accounts.
      </p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
        Return to inbox
      </Link>
    </section>
  )
}
