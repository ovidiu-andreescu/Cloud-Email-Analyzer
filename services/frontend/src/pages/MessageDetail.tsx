import { Activity, AlertTriangle, Brain, CheckCircle2, ChevronDown, Clipboard, Code2, Download, FileWarning, Mail, Paperclip, RotateCcw, ShieldAlert, X } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useLocation, useParams, useSearchParams } from "react-router-dom"
import BackLink from "../components/BackLink"
import Badge from "../components/Badge"
import { downloadAttachment, fetchAttachments, fetchMessage, fetchMessageIndicators, fetchMessageTimeline, reprocessMessage, type Attachment, type Email, type IndicatorSet, type TimelineStep } from "../lib/api"
import { formatBytes, formatExactDate, formatPercent } from "../lib/format"
import { receivedAt, recipientLabel, senderLabel, threatSummary, verdictTone } from "../lib/messages"
import { useSession } from "../lib/session"

export default function MessageDetail() {
  const { messageId = "" } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useSession()
  const [message, setMessage] = useState<Email | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [indicators, setIndicators] = useState<IndicatorSet | null>(null)
  const [timeline, setTimeline] = useState<TimelineStep[]>([])
  const [view, setView] = useState<"email" | "metadata">("email")
  const [error, setError] = useState("")
  const [attachmentsError, setAttachmentsError] = useState("")
  const [indicatorsError, setIndicatorsError] = useState("")
  const [timelineError, setTimelineError] = useState("")
  const [downloadError, setDownloadError] = useState("")
  const [downloadingId, setDownloadingId] = useState("")
  const [pendingDownload, setPendingDownload] = useState<Attachment | null>(null)
  const [downloadAccepted, setDownloadAccepted] = useState(false)
  const [reprocessStatus, setReprocessStatus] = useState("")
  const [reprocessing, setReprocessing] = useState(false)
  const [pendingReprocess, setPendingReprocess] = useState(false)

  useEffect(() => {
    let active = true
    setError("")
    setAttachmentsError("")
    setIndicatorsError("")
    setTimelineError("")
    setMessage(null)
    setAttachments([])
    setIndicators(null)
    setTimeline([])

    fetchMessage(messageId)
      .then(messageResponse => {
        if (active) setMessage(messageResponse)
      })
      .catch(() => {
        if (active) setError("Unable to load this message.")
      })

    fetchAttachments(messageId)
      .then(attachmentResponse => {
        if (active) setAttachments(attachmentResponse.items)
      })
      .catch(() => {
        if (active) setAttachmentsError("Attachments could not be loaded. The email body is still available.")
      })

    fetchMessageIndicators(messageId)
      .then(indicatorResponse => {
        if (active) setIndicators(indicatorResponse)
      })
      .catch(() => {
        if (active) setIndicatorsError("Threat evidence could not be loaded.")
      })

    fetchMessageTimeline(messageId)
      .then(timelineResponse => {
        if (active) setTimeline(timelineResponse.items)
      })
      .catch(() => {
        if (active) setTimelineError("Workflow timeline could not be loaded.")
      })

    return () => {
      active = false
    }
  }, [messageId])

  async function startDownload(attachment: Attachment) {
    setDownloadError("")
    if (requiresDownloadWarning(attachment)) {
      setPendingDownload(attachment)
      setDownloadAccepted(false)
      return
    }
    await performDownload(attachment)
  }

  async function confirmPendingDownload() {
    if (!pendingDownload) return
    const ok = await performDownload(pendingDownload)
    if (ok) {
      setPendingDownload(null)
      setDownloadAccepted(false)
    }
  }

  async function performDownload(attachment: Attachment) {
    setDownloadingId(attachment.attachmentId)
    setDownloadError("")
    try {
      const result = await downloadAttachment(messageId, attachment.attachmentId)
      saveBlob(result.blob, result.filename || attachment.filename || "attachment")
      return true
    } catch {
      setDownloadError("Unable to download this attachment. Check that the API, LocalStack, and artifact bucket are available.")
      return false
    } finally {
      setDownloadingId("")
    }
  }

  function startReprocess() {
    setPendingReprocess(true)
  }

  async function confirmReprocess() {
    setPendingReprocess(false)
    setReprocessing(true)
    setReprocessStatus("")
    try {
      const result = await reprocessMessage(messageId)
      setReprocessStatus(result.executionArn ? "Reprocess started." : "Reprocess requested.")
    } catch {
      setReprocessStatus("Unable to start reprocess. Check that LocalStack Step Functions is running.")
    } finally {
      setReprocessing(false)
    }
  }

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
  if (!message) return <div className="card p-8 text-sm text-slate-500">Loading message...</div>

  const headers = message.parsed?.headers || {}
  const bodyText = message.parsed?.text?.trim()
  const htmlBody = message.parsed?.html?.trim()
  const to = recipientLabel(message) || headers.To || headers.to || "-"
  const from = senderLabel(message) || headers.From || headers.from || "-"
  const exactReceived = formatExactDate(receivedAt(message))
  const backTarget = getBackTarget(location.state, searchParams.get("from"), user.role)
  const backHref = backTarget.to
  const backLabel = backTarget.label
  const unsafeSummary = message.finalVerdict === "UNSAFE"

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <BackLink to={backHref}>{backLabel}</BackLink>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{message.subject || "(no subject)"}</h1>
            <div className="text-sm text-slate-500">{from} · {exactReceived}</div>
          </div>
          {user.role === "admin" && (
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={startReprocess}
                disabled={reprocessing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={16} aria-hidden="true" />
                {reprocessing ? "Reprocessing" : "Reprocess"}
              </button>
              {reprocessStatus && <div className="max-w-xs text-right text-xs font-medium text-slate-500">{reprocessStatus}</div>}
            </div>
          )}
        </div>
      </header>

      <section className={`card border p-5 ${unsafeSummary ? "border-red-100 shadow-[0_0_0_1px_rgba(254,202,202,0.55),0_18px_45px_rgba(239,68,68,0.08)]" : "border-green-100 shadow-[0_0_0_1px_rgba(187,247,208,0.65),0_18px_45px_rgba(34,197,94,0.10)]"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${unsafeSummary ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700 ring-1 ring-green-200"}`}>
              {unsafeSummary ? <ShieldAlert size={22} aria-hidden="true" /> : <CheckCircle2 size={22} aria-hidden="true" />}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Threat Summary</div>
              <p className="mt-1 max-w-3xl text-base font-medium text-slate-900">{threatSummary(message, attachments)}</p>
            </div>
          </div>
          <Badge tone={verdictTone(message.finalVerdict)}>{message.finalVerdict || "PENDING"}</Badge>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Status" value={message.status || "PENDING"} />
        <MetricCard label="Final" value={message.finalVerdict || "PENDING"} tone={verdictTone(message.finalVerdict)} />
        <MetricCard label="ML" value={message.mlVerdict || "PENDING"} tone={verdictTone(message.mlVerdict)} />
        <MetricCard label="Virus" value={message.virusVerdict || "PENDING"} tone={verdictTone(message.virusVerdict)} />
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("email")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${view === "email" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Mail size={16} aria-hidden="true" />
              Email view
            </button>
            <button
              type="button"
              onClick={() => setView("metadata")}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${view === "metadata" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Code2 size={16} aria-hidden="true" />
              Metadata
            </button>
          </div>

          {view === "email" ? (
            <EmailBody message={message} from={from} to={to} received={exactReceived} bodyText={bodyText} htmlBody={htmlBody} />
          ) : (
            <MetadataPanel message={message} />
          )}
          <AttachmentPanel
            attachments={attachments}
            loadError={attachmentsError}
            downloadError={downloadError}
            downloadingId={downloadingId}
            onDownload={startDownload}
          />
        </div>

        <aside className="space-y-4">
          <AnalysisCard message={message} />
          <WorkflowTimeline steps={timeline} loadError={timelineError} />
          <ThreatEvidence indicators={indicators} loadError={indicatorsError} />
        </aside>
      </section>

      {pendingReprocess && (
        <ReprocessDialog
          message={message}
          reprocessing={reprocessing}
          onCancel={() => setPendingReprocess(false)}
          onConfirm={confirmReprocess}
        />
      )}

      {pendingDownload && (
        <AttachmentWarningDialog
          attachment={pendingDownload}
          accepted={downloadAccepted}
          downloading={downloadingId === pendingDownload.attachmentId}
          error={downloadError}
          onAcceptedChange={setDownloadAccepted}
          onCancel={() => {
            setPendingDownload(null)
            setDownloadAccepted(false)
            setDownloadError("")
          }}
          onConfirm={confirmPendingDownload}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: ReturnType<typeof verdictTone> }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1"><Badge tone={tone}>{value}</Badge></div>
    </div>
  )
}

function EmailBody({
  message,
  from,
  to,
  received,
  bodyText,
  htmlBody,
}: {
  message: Email
  from: string
  to: string
  received: string
  bodyText?: string
  htmlBody?: string
}) {
  return (
    <section className="card p-5">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-semibold text-slate-900">{message.subject || "(no subject)"}</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <HeaderLine label="From" value={from} />
          <HeaderLine label="To" value={to} />
          <HeaderLine label="Date" value={received} />
        </dl>
      </div>

      <div className="mt-5 rounded-lg border border-slate-100 bg-white p-5 text-slate-800">
        {bodyText ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-7">{bodyText}</pre>
        ) : htmlBody ? (
          <iframe
            className="h-[420px] w-full rounded-lg border border-slate-100 bg-white"
            sandbox=""
            title="Email HTML preview"
            srcDoc={htmlBody}
          />
        ) : (
          <p className="text-sm text-slate-500">No parsed email body is available for this message.</p>
        )}
      </div>
    </section>
  )
}

function MetadataPanel({ message }: { message: Email }) {
  const [copied, setCopied] = useState(false)
  const metadata = message as Record<string, unknown>
  const rawJson = JSON.stringify(message, null, 2)
  const rows = [
    { label: "Message ID", value: metadata.messageId },
    { label: "Tenant", value: metadata.tenantId },
    { label: "Status", value: metadata.status },
    { label: "Raw object", value: joinS3Pointer(metadata.rawBucket, metadata.rawKey) },
    { label: "Parsed object", value: joinS3Pointer(metadata.parsedBucket, metadata.parsedKey) },
    { label: "Recipients", value: metadata.recipients },
    { label: "Owners", value: metadata.ownerUserIds },
    { label: "Unresolved recipients", value: metadata.unresolvedRecipients },
  ]

  async function copyMetadata() {
    await navigator.clipboard.writeText(rawJson)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="card min-w-0 max-w-full overflow-hidden p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Metadata</h2>
          <p className="mt-1 text-sm text-slate-500">Pipeline metadata for debugging and audit review.</p>
        </div>
        <button
          type="button"
          onClick={copyMetadata}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Clipboard size={16} aria-hidden="true" />
          {copied ? "Copied" : "Copy metadata"}
        </button>
      </div>

      <dl className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
        {rows.map(row => (
          <div key={row.label} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-800">{metadataDisplay(row.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">Raw JSON</div>
        <pre className="max-h-[420px] max-w-full overflow-auto p-4 text-xs leading-6 text-slate-100">
          <code className="block whitespace-pre">{rawJson}</code>
        </pre>
      </div>
    </section>
  )
}

function joinS3Pointer(bucket: unknown, key: unknown) {
  if (!bucket || !key) return undefined
  return `s3://${String(bucket)}/${String(key)}`
}

function metadataDisplay(value: unknown) {
  if (value === undefined || value === null || value === "") return "-"
  if (Array.isArray(value)) return value.length ? value.map(item => String(item)).join(", ") : "-"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function HeaderLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  )
}

function AnalysisCard({ message }: { message: Email }) {
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Brain size={18} aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">ML Analysis</h2>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <AnalysisLine label="Verdict" value={message.mlVerdict || "PENDING"} />
        <AnalysisLine label="Category" value={message.mlCategory || "-"} />
        <AnalysisLine label="Confidence" value={formatPercent(message.mlConfidence)} />
        <AnalysisLine label="Model" value={message.mlModelVersion || "-"} />
        <AnalysisLine label="Source" value={message.mlModelSource || "-"} />
      </dl>
    </section>
  )
}

function WorkflowTimeline({ steps, loadError = "" }: { steps: TimelineStep[]; loadError?: string }) {
  const [expanded, setExpanded] = useState(false)
  const first = steps[0]
  const lastComplete = [...steps].reverse().find(step => step.status === "COMPLETE") || steps[steps.length - 1]
  const completeCount = steps.filter(step => step.status === "COMPLETE").length
  const progress = steps.length ? Math.max(8, (completeCount / steps.length) * 100) : 0

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={18} aria-hidden="true" />
          <h2 className="font-semibold text-slate-900">Workflow Timeline</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "Expand"}
          <ChevronDown size={14} aria-hidden="true" className={`transition ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {loadError && <PanelError>{loadError}</PanelError>}

      {steps.length ? (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
            <span>{first?.label || "Start"}</span>
            <span>{lastComplete?.label || "Complete"}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>{first?.timestamp ? formatExactDate(first.timestamp) : "No start time"}</span>
            <span>{lastComplete?.timestamp ? formatExactDate(lastComplete.timestamp) : "No completion time"}</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-100 p-4 text-sm text-slate-500">No workflow events are available.</div>
      )}

      {expanded && (
        <div className="mt-4 space-y-3">
          {steps.map(step => (
            <div key={step.id} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
              <span className={`mt-1 h-3 w-3 rounded-full ${step.status === "COMPLETE" ? "bg-emerald-500" : step.status === "CURRENT" ? "bg-amber-500" : "bg-slate-200"}`} />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">{step.label}</div>
                  <Badge tone={step.status === "COMPLETE" ? "safe" : step.status === "CURRENT" ? "suspicious" : "neutral"}>{step.status}</Badge>
                </div>
                <p className="mt-1 break-words text-sm text-slate-500">{step.detail || "-"}</p>
                <div className="mt-1 text-xs text-slate-400">{step.timestamp ? formatExactDate(step.timestamp) : "No timestamp recorded"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ThreatEvidence({ indicators, loadError = "" }: { indicators: IndicatorSet | null; loadError?: string }) {
  if (!indicators) {
    return (
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} aria-hidden="true" />
          <h2 className="font-semibold text-slate-900">Threat Evidence</h2>
        </div>
        {loadError ? <PanelError>{loadError}</PanelError> : <div className="mt-4 rounded-lg border border-slate-100 p-4 text-sm text-slate-500">No evidence is available.</div>}
      </section>
    )
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">Threat Evidence</h2>
      </div>
      <div className="mt-4 space-y-4">
        <EvidenceGroup title="Why this verdict" empty="No explicit detector reasons were recorded.">
          {indicators.reasons.map(reason => <EvidenceText key={reason} value={reason} />)}
        </EvidenceGroup>
        <EvidenceGroup title="URLs" empty="No URLs extracted from the parsed body.">
          {indicators.urls.map(url => <EvidenceToken key={url} value={url} />)}
        </EvidenceGroup>
        <EvidenceGroup title="Domains" empty="No domains extracted from the parsed body.">
          {indicators.domains.map(domain => <EvidenceToken key={domain} value={domain} />)}
        </EvidenceGroup>
        <EvidenceGroup title="Attachment Hashes" empty="No attachment hashes recorded.">
          {indicators.hashes.map(hash => (
            <EvidenceToken
              key={hash.sha256 || hash.attachmentId}
              value={`${hash.filename || "attachment"} · ${hash.sha256 || "-"}`}
              badge={hash.verdict}
            />
          ))}
        </EvidenceGroup>
      </div>
    </section>
  )
}

function EvidenceGroup({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-2 space-y-2">
        {items.length ? items : <div className="rounded-lg border border-slate-100 p-3 text-sm text-slate-500">{empty}</div>}
      </div>
    </div>
  )
}

function EvidenceText({ value }: { value: string }) {
  return <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-medium text-slate-700">{value}</div>
}

function EvidenceToken({ value, badge }: { value: string; badge?: string }) {
  async function copyValue(event: React.MouseEvent) {
    event.preventDefault()
    await navigator.clipboard.writeText(value)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2">
      <div className="min-w-0 flex-1 break-all text-sm font-medium text-slate-700">
        {value}
      </div>
      {badge && <Badge tone={verdictTone(badge)}>{badge}</Badge>}
      <button
        type="button"
        onClick={copyValue}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
        aria-label="Copy evidence value"
      >
        <Clipboard size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

function AnalysisLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function AttachmentPanel({
  attachments,
  loadError,
  downloadError,
  downloadingId,
  onDownload,
}: {
  attachments: Attachment[]
  loadError?: string
  downloadError: string
  downloadingId: string
  onDownload: (attachment: Attachment) => void
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Paperclip size={18} aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">Attachments</h2>
      </div>
      {loadError && <PanelError>{loadError}</PanelError>}
      {downloadError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {downloadError}
        </div>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {attachments.map(attachment => (
          <AttachmentCard
            key={attachment.attachmentId}
            attachment={attachment}
            downloading={downloadingId === attachment.attachmentId}
            onDownload={() => onDownload(attachment)}
          />
        ))}
        {!attachments.length && <div className="rounded-lg border border-slate-100 p-4 text-sm text-slate-500">No attachments were extracted from this message.</div>}
      </div>
    </section>
  )
}

function PanelError({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
      <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function ReprocessDialog({
  message,
  reprocessing,
  onCancel,
  onConfirm,
}: {
  message: Email
  reprocessing: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reprocess-title"
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <RotateCcw size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="reprocess-title" className="text-lg font-bold text-slate-900">Reprocess message</h2>
              <p className="mt-1 text-sm text-slate-600">
                Start the analysis workflow again for this stored raw message. Existing verdict fields may update when the workflow completes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Close reprocess dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
          <WarningLine label="Message" value={message.messageId} />
          <WarningLine label="Subject" value={message.subject || "(no subject)"} />
          <WarningLine label="Raw object" value={`${message.rawBucket || "-"} / ${message.rawKey || "-"}`} />
        </dl>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={reprocessing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={16} aria-hidden="true" />
            {reprocessing ? "Starting" : "Start reprocess"}
          </button>
        </div>
      </section>
    </div>
  )
}

function AttachmentCard({
  attachment,
  downloading,
  onDownload,
}: {
  attachment: Attachment
  downloading: boolean
  onDownload: () => void
}) {
  const signature = visibleSignature(attachment.clamavSignature)

  async function copyHash() {
    if (attachment.sha256) await navigator.clipboard.writeText(attachment.sha256)
  }

  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <FileWarning size={17} aria-hidden="true" />
            <span className="truncate">{attachment.filename}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">{attachment.contentType || "unknown type"} · {formatBytes(attachment.sizeBytes)}</div>
        </div>
        <Badge tone={verdictTone(attachment.scanVerdict)}>{attachment.scanVerdict || "PENDING"}</Badge>
      </div>
      <div className="mt-3 text-sm text-slate-600">{attachment.scanStatus || "UNKNOWN"}{signature ? ` · ${signature}` : ""}</div>
      {attachment.sha256 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2">
          <code className="min-w-0 flex-1 truncate text-xs text-slate-600" title={attachment.sha256}>{shortHash(attachment.sha256)}</code>
          <button
            type="button"
            onClick={copyHash}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            aria-label="Copy attachment hash"
          >
            <Clipboard size={15} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="mt-auto flex justify-end pt-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} aria-hidden="true" />
          {downloading ? "Downloading" : "Download"}
        </button>
      </div>
    </div>
  )
}

function AttachmentWarningDialog({
  attachment,
  accepted,
  downloading,
  error,
  onAcceptedChange,
  onCancel,
  onConfirm,
}: {
  attachment: Attachment
  accepted: boolean
  downloading: boolean
  error: string
  onAcceptedChange: (value: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const unsafe = attachment.scanVerdict === "UNSAFE"
  const signature = visibleSignature(attachment.clamavSignature)
  const title = unsafe ? "Unsafe attachment download" : "Unverified attachment download"
  const detail = unsafe
    ? "The attachment scanner marked this file as unsafe. Download it only inside a controlled analysis environment."
    : "This attachment was not verified as safe. Review the scan status before downloading it."

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachment-warning-title"
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${unsafe ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="attachment-warning-title" className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{detail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Close download warning"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
          <WarningLine label="File" value={attachment.filename || "attachment"} />
          <WarningLine label="Verdict" value={attachment.scanVerdict || "UNKNOWN"} />
          <WarningLine label="Status" value={attachment.scanStatus || "UNKNOWN"} />
          <WarningLine label="Signature" value={signature || "No signature"} />
          <WarningLine label="SHA256" value={attachment.sha256 || "-"} />
        </dl>

        <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={event => onAcceptedChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>I understand this file may be dangerous and should only be opened in a controlled analysis environment.</span>
        </label>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!accepted || downloading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} aria-hidden="true" />
            {downloading ? "Downloading" : "Download anyway"}
          </button>
        </div>
      </section>
    </div>
  )
}

function WarningLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function requiresDownloadWarning(attachment: Attachment) {
  return attachment.scanVerdict !== "SAFE"
}

function visibleSignature(signature?: string) {
  return signature === "clamscan-not-installed" ? "" : (signature || "")
}

function shortHash(value: string) {
  return value.length > 28 ? `${value.slice(0, 18)}...${value.slice(-8)}` : value
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

function getBackTarget(state: unknown, source: string | null, role: string) {
  if (source === "inbox") return { to: "/", label: "Back to inbox" }
  if (source === "admin") return { to: "/admin", label: "Back to admin" }
  if (source === "message-review") return { to: "/admin/messages", label: "Back to message review" }

  const candidate = state && typeof state === "object" && "backTo" in state
    ? (state as { backTo?: unknown }).backTo
    : undefined

  if (candidate && typeof candidate === "object") {
    const target = candidate as { to?: unknown; label?: unknown }
    if (typeof target.to === "string" && typeof target.label === "string") {
      return { to: target.to, label: target.label }
    }
  }

  return role === "admin"
    ? { to: "/admin", label: "Back to admin" }
    : { to: "/", label: "Back to inbox" }
}
