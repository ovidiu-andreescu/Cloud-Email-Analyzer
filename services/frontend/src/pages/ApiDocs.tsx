import { BookOpen, LockKeyhole } from "lucide-react"
import React from "react"
import Badge from "../components/Badge"
import { useSession } from "../lib/session"

type Endpoint = {
  method: "GET" | "POST"
  path: string
  access: "Public" | "User" | "Admin"
  description: string
  query?: string[]
}

const endpoints: Endpoint[] = [
  { method: "POST", path: "/auth/login", access: "Public", description: "Signs in a user and returns a local JWT." },
  { method: "GET", path: "/me", access: "User", description: "Returns the authenticated user profile and role." },
  { method: "GET", path: "/messages", access: "User", description: "Returns the caller's inbox rows. Admins only see admin-owned inbox messages here; all analyzed messages live under /admin/messages.", query: ["q", "status", "finalVerdict", "mlVerdict", "virusVerdict", "hasAttachments", "mailbox", "sortBy", "sortDirection", "limit", "cursor"] },
  { method: "GET", path: "/messages/{messageId}", access: "User", description: "Returns one authorized message with parsed artifacts." },
  { method: "GET", path: "/messages/{messageId}/indicators", access: "User", description: "Returns extracted URLs, domains, hashes, and detector reasons for an authorized message." },
  { method: "GET", path: "/messages/{messageId}/timeline", access: "User", description: "Returns the workflow-stage timeline for an authorized message." },
  { method: "GET", path: "/messages/{messageId}/attachments", access: "User", description: "Returns authorized attachment scan records for a message." },
  { method: "GET", path: "/messages/{messageId}/attachments/{attachmentId}/download", access: "User", description: "Streams an authorized attachment from artifact storage. Unsafe or unverified files require frontend confirmation before this route is called." },
  { method: "GET", path: "/admin/messages", access: "Admin", description: "Returns all messages with admin filters, sorting, and pagination.", query: ["q", "status", "finalVerdict", "mlVerdict", "virusVerdict", "hasAttachments", "mailbox", "userId", "sortBy", "sortDirection", "limit", "cursor"] },
  { method: "POST", path: "/admin/messages/{messageId}/reprocess", access: "Admin", description: "Starts the local/AWS-compatible analysis workflow again for a stored raw message." },
  { method: "GET", path: "/admin/audit-log", access: "Admin", description: "Returns audited security actions for the admin audit page with pagination. Multi-value filters are comma-separated.", query: ["q", "action", "role", "limit", "cursor"] },
  { method: "GET", path: "/admin/metrics/security-summary", access: "Admin", description: "Returns total messages, unsafe counts, top senders, mailbox volume, and verdict/status counts." },
  { method: "GET", path: "/admin/metrics/verdicts-over-time", access: "Admin", description: "Returns verdict counts grouped by received date." },
  { method: "GET", path: "/admin/users", access: "Admin", description: "Returns user records without password fields." },
  { method: "GET", path: "/admin/mailboxes", access: "Admin", description: "Returns mailbox ownership mappings." },
]

export default function ApiDocs() {
  const { user } = useSession()

  if (user.role !== "admin") {
    return (
      <section className="card max-w-2xl p-8">
        <LockKeyhole size={28} className="text-slate-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">API docs are admin-only</h1>
        <p className="mt-2 text-slate-500">Normal users can use their inbox, but API details are reserved for administrators.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <BookOpen size={16} aria-hidden="true" />
          API reference
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Authenticated API</h1>
        <p className="mt-1 text-sm text-slate-500">Current routes used by the security inbox, backed by LocalStack DynamoDB and S3.</p>
      </header>

      <div className="space-y-4">
        {endpoints.map(endpoint => (
          <section key={`${endpoint.method}-${endpoint.path}`} className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${endpoint.method === "GET" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                {endpoint.method}
              </span>
              <code className="text-base font-semibold text-slate-900">{endpoint.path}</code>
              <Badge tone={endpoint.access === "Admin" ? "unsafe" : endpoint.access === "User" ? "suspicious" : "neutral"}>{endpoint.access}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600">{endpoint.description}</p>
            {endpoint.query && (
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-500">Supported filters</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {endpoint.query.map(param => <code key={param} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{param}</code>)}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
