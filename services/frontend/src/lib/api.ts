const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export type Email = {
  id: number
  email_id: number
  sender: string
  recipient: string
  subject: string
  category: "Spam" | "Ham" | "Promotional"
  verdict: "Safe" | "Unsafe" | "Suspicious"
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
}

export async function fetchEmails(params: {
  q?: string
  category?: string
  verdict?: string
  sort?: "newest" | "oldest"
  page?: number
  page_size?: number
}): Promise<Paginated<Email>> {
  const url = new URL(`${BASE_URL}/api/emails`)
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
  })
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch emails")
  return res.json()
}

export type Metrics = {
  total_users: number
  total_emails: number
  active_now: number
  active_this_month_delta_pct: number
  emails_this_week_delta_pct: number
}

export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch(`${BASE_URL}/api/metrics`)
  if (!res.ok) throw new Error("Failed to fetch metrics")
  return res.json()
}
