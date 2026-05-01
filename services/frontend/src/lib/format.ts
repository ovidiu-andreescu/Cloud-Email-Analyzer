export function formatDate(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

export function formatExactDate(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    }).format(date)
}

export function formatPercent(value?: string | number | null) {
    if (value === undefined || value === null || value === "") return "-"
    const n = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(n)) return String(value)
    return `${Math.round(n * 100)}%`
}

export function formatBytes(value?: number | null) {
    if (value === undefined || value === null) return "-"
    if (value < 1024) return `${value} B`
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
    return `${(value / 1024 / 1024).toFixed(1)} MB`
}
