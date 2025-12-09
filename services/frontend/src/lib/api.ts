// The BASE_URL is correct
export const BASE_URL = "https://rukc2weama.execute-api.eu-central-1.amazonaws.com"

export type Email = {
    messageId: string
    sender: string
    recipient: string
    subject: string
    category: string | null
    verdict: string | null
    virus_verdict?: string | null
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
    page?: number
    page_size?: number
    sort?: string
}): Promise<Paginated<Email>> {
    const url = new URL(`${BASE_URL}/api/emails`)
    Object.entries(params).forEach(([k,v]) => {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
    })
    const res = await fetch(url)
    if (!res.ok) {
        console.error("Failed to fetch emails:", await res.text())
        throw new Error("Failed to fetch emails")
    }
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
    if (!res.ok) {
        console.error("Failed to fetch metrics:", await res.text())
        throw new Error("Failed to fetch metrics")
    }
    return res.json()
}

