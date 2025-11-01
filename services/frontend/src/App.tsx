import React, { useEffect, useState } from "react"
import Sidebar from "./components/Sidebar"
import StatCard from "./components/StatCard"
import EmailTable from "./components/EmailTable"
import Pagination from "./components/Pagination"
import { fetchEmails, fetchMetrics, type Email } from "./lib/api"

export default function App(){
  const [metrics, setMetrics] = useState({total_users:0,total_emails:0,active_now:0,active_this_month_delta_pct:0,emails_this_week_delta_pct:0})
  const [emails, setEmails] = useState<Email[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<"newest"|"oldest">("newest")

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(console.error)
  }, [])

  useEffect(() => {
    fetchEmails({page, page_size: pageSize, q, sort}).then(r => {
      setEmails(r.items)
      setTotal(r.total)
    }).catch(console.error)
  }, [page, q, sort])

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ADMINISTRATOR</h1>
          <div className="relative">
            <input value={q} onChange={e => {setPage(1); setQ(e.target.value)}} className="pl-10 pr-3 py-2 rounded-xl bg-white border border-slate-200 outline-none" placeholder="Search" />
            <span className="absolute left-3 top-2.5">🔍</span>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={metrics.total_users} deltaPct={metrics.active_this_month_delta_pct} icon="👥" />
          <StatCard title="Number of Emails" value={metrics.total_emails} deltaPct={metrics.emails_this_week_delta_pct} icon="✉️" />
          <StatCard title="Active Now" value={metrics.active_now} icon="🖥️" />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">All Users</h2>
              <div className="text-slate-500 text-sm">Active Members</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input value={q} onChange={e => {setPage(1); setQ(e.target.value)}} className="pl-10 pr-3 py-2 rounded-xl bg-white border border-slate-200 outline-none" placeholder="Search" />
                <span className="absolute left-3 top-2.5">🔍</span>
              </div>
              <select className="bg-white border border-slate-200 rounded-xl px-3 py-2" value={sort} onChange={e => setSort(e.target.value as any)}>
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
              </select>
            </div>
          </div>

          <EmailTable items={emails} />

          <div className="mt-4 flex justify-end">
            <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
          </div>
        </section>
      </main>
    </div>
  )
}
