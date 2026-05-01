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
    mlCategory?: string | null
    mlConfidence?: string | number | null
    mlModelVersion?: string | null
    mlModelSource?: string | null
    virusVerdict?: string | null
    finalVerdict?: string | null
    status?: string
    mailbox?: string
    mimeTo?: string
    recipients?: string[]
    resolvedAt?: string
    receivedAt?: string
    sortKey?: string
    rawBucket?: string
    rawKey?: string
    parsedBucket?: string
    parsedKey?: string
    hasAttachments?: boolean
    attachmentCount?: number
    parsed?: {
        headers?: Record<string, string>
        summary?: Record<string, unknown>
        text?: string
        html?: string
    }
}

export type MessageFilters = {
    q?: string
    status?: string
    finalVerdict?: string
    mlVerdict?: string
    virusVerdict?: string
    hasAttachments?: string
    mailbox?: string
    userId?: string
    sortBy?: string
    sortDirection?: string
    limit?: string | number
    cursor?: string
}

export type MessagePage = {
    items: Email[]
    total?: number
    limit?: number
    cursor?: string
    nextCursor?: string | null
}

export type User = {
    userId?: string
    sub?: string
    email: string
    role: "admin" | "user"
    displayName?: string
}

export type Mailbox = {
    emailAddress: string
    tenantId?: string
    ownerUserIds?: string[]
    mailboxType?: string
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

export type IndicatorSet = {
    messageId: string
    reasons: string[]
    urls: string[]
    domains: string[]
    hashes: Array<{
        attachmentId?: string
        filename?: string
        sha256?: string
        verdict?: string
        signature?: string
    }>
    sender?: string
    recipients?: string[]
}

export type TimelineStep = {
    id: string
    label: string
    status: "COMPLETE" | "CURRENT" | "PENDING" | string
    timestamp?: string
    detail?: string
}

export type AuditEvent = {
    eventId?: string
    timestamp: string
    actorEmail: string
    actorUserId?: string
    actorRole?: string
    action: string
    messageId?: string
    metadata?: Record<string, unknown>
}

export type AuditFilters = {
    q?: string
    action?: string
    actor?: string
    role?: string
    messageId?: string
    limit?: string | number
    cursor?: string
}

export type AuditPage = {
    items: AuditEvent[]
    total?: number
    limit?: number
    cursor?: string
    nextCursor?: string | null
}

export type SecuritySummary = {
    totals: {
        messages: number
        attachments: number
        unsafeMessages: number
        phishingMessages: number
        unsafeAttachments: number
        needsReview: number
    }
    verdictCounts: Record<string, number>
    mlCounts: Record<string, number>
    virusCounts: Record<string, number>
    statusCounts: Record<string, number>
    topSenders: Array<{ sender: string; count: number }>
    mailboxes: Array<{ mailbox: string; count: number }>
}

export type VerdictTrend = {
    date: string
    total?: number
    SAFE?: number
    UNSAFE?: number
    SUSPICIOUS?: number
    PENDING?: number
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

function withQuery(path: string, params: Record<string, string | number | undefined | null> = {}) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value))
        }
    })
    const suffix = query.toString()
    return suffix ? `${path}?${suffix}` : path
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

async function apiDownload(path: string): Promise<{ blob: Blob; filename?: string }> {
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const res = await fetch(`${BASE_URL}${path}`, {headers})
    if (!res.ok) throw new Error(await res.text())
    return {
        blob: await res.blob(),
        filename: filenameFromDisposition(res.headers.get("Content-Disposition")),
    }
}

function filenameFromDisposition(disposition: string | null) {
    if (!disposition) return undefined
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (encoded?.[1]) return decodeURIComponent(encoded[1])
    const quoted = disposition.match(/filename="([^"]+)"/i)
    return quoted?.[1]
}

export async function login(email: string, password: string): Promise<{accessToken: string, user: User}> {
    const data = await apiFetch("/auth/login", {method: "POST", body: JSON.stringify({email, password})})
    setToken(data.accessToken)
    return data
}

export async function fetchMe(): Promise<User> {
    return apiFetch("/me")
}

export async function fetchMessages(filters: MessageFilters = {}): Promise<MessagePage> {
    return apiFetch(withQuery("/messages", filters))
}

export async function fetchInbox(filters: MessageFilters = {}): Promise<MessagePage> {
    return fetchMessages(filters)
}

export async function fetchMessage(messageId: string): Promise<Email> {
    return apiFetch(`/messages/${messageId}`)
}

export async function fetchAttachments(messageId: string): Promise<{items: Attachment[]}> {
    return apiFetch(`/messages/${messageId}/attachments`)
}

export async function fetchMessageIndicators(messageId: string): Promise<IndicatorSet> {
    return apiFetch(`/messages/${messageId}/indicators`)
}

export async function fetchMessageTimeline(messageId: string): Promise<{items: TimelineStep[]}> {
    return apiFetch(`/messages/${messageId}/timeline`)
}

export async function downloadAttachment(messageId: string, attachmentId: string): Promise<{ blob: Blob; filename?: string }> {
    return apiDownload(`/messages/${messageId}/attachments/${attachmentId}/download`)
}

export async function fetchAdminMessages(filters: MessageFilters = {}): Promise<MessagePage> {
    return apiFetch(withQuery("/admin/messages", filters))
}

export async function reprocessMessage(messageId: string): Promise<{ok: boolean; executionArn?: string}> {
    return apiFetch(`/admin/messages/${messageId}/reprocess`, {method: "POST"})
}

export async function fetchAuditLog(filters: AuditFilters = {}): Promise<AuditPage> {
    return apiFetch(withQuery("/admin/audit-log", filters))
}

export async function fetchSecuritySummary(): Promise<SecuritySummary> {
    return apiFetch("/admin/metrics/security-summary")
}

export async function fetchVerdictsOverTime(): Promise<{items: VerdictTrend[]}> {
    return apiFetch("/admin/metrics/verdicts-over-time")
}

export async function fetchAdminUsers(): Promise<{items: User[]}> {
    return apiFetch("/admin/users")
}

export async function fetchAdminMailboxes(): Promise<{items: Mailbox[]}> {
    return apiFetch("/admin/mailboxes")
}
