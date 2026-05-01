import { Filter, Search, ShieldAlert } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import BackLink from "../components/BackLink"
import { MultiSelectFilter, SingleSelectFilter } from "../components/FilterControls"
import MessageList from "../components/MessageList"
import { fetchAdminMessages, fetchAdminUsers, type Email, type MessageFilters, type User } from "../lib/api"
import { useSession } from "../lib/session"

const verdictOptions = ["SAFE", "LOW_RISK", "UNSAFE", "PHISHING", "PARTIAL", "ERROR"]
const statusOptions = ["RECEIVED", "RECIPIENTS_RESOLVED", "PARSED", "ML_SCANNED", "ATTACHMENTS_SCANNED", "COMPLETE", "PARTIAL", "FAILED", "QUARANTINED"]
const sortOptions = ["receivedAt", "sender", "mailbox", "subject", "status", "finalVerdict"]
const sortLabels: Record<string, string> = { receivedAt: "Received", sender: "Sender", mailbox: "Mailbox", subject: "Subject", status: "Status", finalVerdict: "Final" }
const pageSize = 10

export default function AdminMessagesPage() {
  const { user } = useSession()
  const [messages, setMessages] = useState<Email[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState<MessageFilters>({ sortBy: "receivedAt", sortDirection: "desc" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cursor, setCursor] = useState("")
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (user.role !== "admin") return
    fetchAdminUsers()
      .then(response => setUsers(response.items))
      .catch(() => setError("Unable to load admin users."))
  }, [user.role])

  useEffect(() => {
    if (user.role !== "admin") return
    setLoading(true)
    setError("")
    fetchAdminMessages({ ...filters, limit: pageSize, cursor })
      .then(response => {
        setMessages(response.items)
        setTotal(response.total ?? response.items.length)
        setNextCursor(response.nextCursor)
      })
      .catch(() => setError("Unable to load admin messages."))
      .finally(() => setLoading(false))
  }, [filters, cursor, user.role])

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => Boolean(value) && !["sortBy", "sortDirection"].includes(key)).length,
    [filters],
  )

  if (user.role !== "admin") return <NotAuthorized />

  function setFilter(key: keyof MessageFilters, value: string) {
    setFilters(current => ({ ...current, [key]: value || undefined }))
    setCursor("")
    setCursorStack([])
  }

  function clearFilters() {
    setFilters({ sortBy: "receivedAt", sortDirection: "desc" })
    setCursor("")
    setCursorStack([])
  }

  function setSortBy(value: string) {
    setFilters(current => ({
      ...current,
      sortBy: value || "receivedAt",
      sortDirection: value && value !== "receivedAt" ? "asc" : "desc",
    }))
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
            <ShieldAlert size={16} aria-hidden="true" />
            Message review
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <div className="text-sm text-slate-500">Search and filter all analyzed messages with the same fields used in the inbox.</div>
        </div>
      </header>

      <section className="card space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(135px,1fr))]">
          <label className="relative">
            <span className="sr-only">Search admin messages</span>
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={filters.q || ""}
              onChange={event => setFilter("q", event.target.value)}
              placeholder="Search messages"
            />
          </label>
          <MultiSelectFilter label="Final" value={filters.finalVerdict || ""} options={verdictOptions} onChange={value => setFilter("finalVerdict", value)} />
          <MultiSelectFilter label="ML" value={filters.mlVerdict || ""} options={verdictOptions} onChange={value => setFilter("mlVerdict", value)} />
          <MultiSelectFilter label="Virus" value={filters.virusVerdict || ""} options={verdictOptions} onChange={value => setFilter("virusVerdict", value)} />
          <MultiSelectFilter label="Status" value={filters.status || ""} options={statusOptions} onChange={value => setFilter("status", value)} />
          <MultiSelectFilter
            label="User"
            value={filters.userId || ""}
            options={users.map(row => row.userId || row.sub || "")}
            labels={Object.fromEntries(users.map(row => [row.userId || row.sub || "", row.email]))}
            searchable
            searchPlaceholder="Search users"
            onChange={value => setFilter("userId", value)}
          />
        </div>
        <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(150px,220px)_minmax(150px,220px)_auto]">
          <SingleSelectFilter label="Sort" value={filters.sortBy || "receivedAt"} options={sortOptions} labels={sortLabels} onChange={setSortBy} />
          <SingleSelectFilter
            label="Order"
            value={filters.sortDirection || "desc"}
            options={["desc", "asc"]}
            labels={(filters.sortBy || "receivedAt") === "receivedAt" ? { desc: "Newest first", asc: "Oldest first" } : { asc: "A to Z", desc: "Z to A" }}
            onChange={value => setFilter("sortDirection", value)}
          />
          <button type="button" onClick={clearFilters} className="inline-flex h-11 w-32 justify-self-start items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter size={16} aria-hidden="true" />
            Clear {activeFilterCount ? `(${activeFilterCount})` : ""}
          </button>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">All Messages</h2>
          <p className="text-sm text-slate-500">{loading ? "Loading..." : `${messages.length} messages in this view`}</p>
        </div>
        <AdminMessageList messages={messages} loading={loading} />
        {!loading && (
          <PagingFooter
            total={total}
            shown={messages.length}
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

function AdminMessageList({ messages, loading }: { messages: Email[]; loading: boolean }) {
  if (loading) return <div className="p-6 text-sm text-slate-500">Loading messages...</div>
  if (!messages.length) return <div className="p-6 text-sm text-slate-500">No messages match the selected filters.</div>

  return <MessageList items={messages} framed={false} backTo={{ to: "/admin/messages", label: "Back to message review", source: "message-review" }} />
}

function PagingFooter({
  total,
  shown,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: {
  total: number
  shown: number
  canPrevious: boolean
  canNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div>Showing {shown} of {total} messages</div>
      <div className="flex gap-2">
        <button type="button" disabled={!canPrevious} onClick={onPrevious} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
        <button type="button" disabled={!canNext} onClick={onNext} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

function NotAuthorized() {
  return (
    <section className="card max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-slate-900">Not authorized</h1>
      <p className="mt-2 text-slate-500">Admin message review is only available to administrator accounts.</p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
        Return to inbox
      </Link>
    </section>
  )
}
