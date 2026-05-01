import { Filter, Search, Shield } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AuditTable from "../components/AuditTable"
import BackLink from "../components/BackLink"
import { MultiSelectFilter, SingleSelectFilter } from "../components/FilterControls"
import { fetchAuditLog, type AuditEvent, type AuditFilters } from "../lib/api"
import { useSession } from "../lib/session"

const actionOptions = [
  "auth.login.success",
  "message.view",
  "message.reprocess",
  "attachment.download",
  "attachment.download.risky",
]

export default function AuditLogPage() {
  const { user } = useSession()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [filters, setFilters] = useState<AuditFilters>({ limit: 50 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cursor, setCursor] = useState("")
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (user.role !== "admin") return
    setLoading(true)
    setError("")
    fetchAuditLog({ ...filters, cursor })
      .then(response => {
        setEvents(response.items)
        setTotal(response.total ?? response.items.length)
        setNextCursor(response.nextCursor)
      })
      .catch(() => setError("Unable to load audit logs."))
      .finally(() => setLoading(false))
  }, [filters, cursor, user.role])

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => Boolean(value) && key !== "limit").length,
    [filters],
  )

  if (user.role !== "admin") {
    return (
      <section className="card max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900">Not authorized</h1>
        <p className="mt-2 text-slate-500">Audit logs are only available to administrator accounts.</p>
        <Link to="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Return to inbox
        </Link>
      </section>
    )
  }

  function setFilter(key: keyof AuditFilters, value: string) {
    setFilters(current => ({ ...current, [key]: value || undefined }))
    setCursor("")
    setCursorStack([])
  }

  function clearFilters() {
    setFilters({ limit: 50 })
    setCursor("")
    setCursorStack([])
  }

  function nextPage() {
    if (!nextCursor) return
    setCursorStack(current => [...current, cursor])
    setCursor(nextCursor)
  }

  function previousPage() {
    setCursorStack(current => {
      const next = [...current]
      setCursor(next.pop() || "")
      return next
    })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <BackLink to="/admin">Back to admin</BackLink>
          <div className="inline-flex h-9 items-center gap-2 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
            <Shield size={16} aria-hidden="true" />
            Audit trail
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <div className="text-sm text-slate-500">Search security actions, actors, messages, and download activity.</div>
      </header>

      <section className="card space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_minmax(220px,1fr)_minmax(160px,220px)]">
          <label className="relative">
            <span className="sr-only">Search audit logs</span>
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={filters.q || ""}
              onChange={event => setFilter("q", event.target.value)}
              placeholder="Search action, actor, message, or metadata"
            />
          </label>
          <MultiSelectFilter label="Action" value={filters.action || ""} options={actionOptions} onChange={value => setFilter("action", value)} />
          <SingleSelectFilter label="Role" value={filters.role || ""} options={["admin", "user"]} onChange={value => setFilter("role", value)} />
        </div>
        <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(150px,220px)_auto]">
          <SingleSelectFilter
            label="Limit"
            value={String(filters.limit || 50)}
            options={["25", "50", "100", "200"]}
            labels={{ "25": "25 events", "50": "50 events", "100": "100 events", "200": "200 events" }}
            onChange={value => setFilter("limit", value)}
          />
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 w-32 justify-self-start items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Filter size={16} aria-hidden="true" />
            Clear {activeFilterCount ? `(${activeFilterCount})` : "(0)"}
          </button>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">All Audit Events</h2>
          <p className="text-sm text-slate-500">{loading ? "Loading..." : `${events.length} of ${total} event${total === 1 ? "" : "s"} shown`}</p>
        </div>
        {loading ? <div className="px-5 py-6 text-sm text-slate-500">Loading audit events...</div> : <AuditTable events={events} />}
        {!loading && (
          <PagingFooter
            canPrevious={cursorStack.length > 0}
            canNext={Boolean(nextCursor)}
            onPrevious={previousPage}
            onNext={nextPage}
          />
        )}
      </section>
    </div>
  )
}

function PagingFooter({
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: {
  canPrevious: boolean
  canNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
      <button type="button" disabled={!canPrevious} onClick={onPrevious} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
      <button type="button" disabled={!canNext} onClick={onNext} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
    </div>
  )
}
