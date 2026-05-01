export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export type Email = {
    messageId: string
    from?: string
    sender?: string
    recipient?: string
    subject: string
    category: string | null
    verdict?: string | null
    virus_verdict?: string | null
    mlVerdict?: string | null
    virusVerdict?: string | null
    finalVerdict?: string | null
    status?: string
    mailbox?: string
    mimeTo?: string
    recipients?: string[]
    resolvedAt?: string
    receivedAt?: string
    sortKey?: string
    hasAttachments?: boolean
    attachmentCount?: number
    parsed?: {
        headers?: Record<string, string>
        summary?: Record<string, unknown>
        text?: string
        html?: string
    }
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

export type User = {
    userId?: string
    sub?: string
    email: string
    role: "admin" | "user"
    displayName?: string
}

export type Attachment = {
    messageId: string
    attachmentId: string
    filename: string
    contentType?: string
    sizeBytes?: number
    sha256?: string
    scanStatus?: string
    scanVerdict?: string
    clamavSignature?: string
}

export function getToken() {
    return localStorage.getItem("accessToken")
}

export function setToken(token: string) {
    localStorage.setItem("accessToken", token)
}

export function clearToken() {
    localStorage.removeItem("accessToken")
}

async function apiFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set("Content-Type", "application/json")
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const res = await fetch(`${BASE_URL}${path}`, {...init, headers})
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

export async function login(email: string, password: string): Promise<{accessToken: string, user: User}> {
    const data = await apiFetch("/auth/login", {method: "POST", body: JSON.stringify({email, password})})
    setToken(data.accessToken)
    return data
}

export async function fetchMe(): Promise<User> {
    return apiFetch("/me")
}

export async function fetchInbox(): Promise<{items: Email[]}> {
    return apiFetch("/messages")
}

export async function fetchMessage(messageId: string): Promise<Email> {
    return apiFetch(`/messages/${messageId}`)
}

export async function fetchAttachments(messageId: string): Promise<{items: Attachment[]}> {
    return apiFetch(`/messages/${messageId}/attachments`)
}

export async function fetchAdminMessages(): Promise<{items: Email[]}> {
    return apiFetch("/admin/messages")
}

export async function fetchAdminUsers(): Promise<{items: User[]}> {
    return apiFetch("/admin/users")
}

export async function fetchAdminMailboxes(): Promise<{items: any[]}> {
    return apiFetch("/admin/mailboxes")
}
