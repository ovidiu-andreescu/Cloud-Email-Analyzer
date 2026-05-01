import type { Attachment, Email } from "./api"

export function verdictTone(value?: string | null) {
    if (value === "SAFE" || value === "LOW_RISK") return "safe"
    if (value === "UNSAFE" || value === "PHISHING") return "unsafe"
    if (value === "PARTIAL" || value === "ERROR" || value === "FAILED") return "suspicious"
    return "neutral"
}

export function recipientLabel(message: Email) {
    return message.mimeTo || message.mailbox || message.recipient || message.recipients?.join(", ") || "-"
}

export function senderLabel(message: Email) {
    return message.from || message.sender || "-"
}

export function receivedAt(message: Email) {
    return message.receivedAt || message.sortKey?.split("#")[0] || ""
}

export function threatSummary(message: Email, attachments: Attachment[] = []) {
    if (message.finalVerdict === "UNSAFE" && message.virusVerdict === "UNSAFE") {
        return "This message is unsafe because one or more attachments matched the attachment scanner."
    }
    if (message.finalVerdict === "UNSAFE" && message.mlVerdict === "PHISHING") {
        return "This message is unsafe because the phishing classifier found credential-theft language or behavior."
    }
    if (attachments.some((attachment) => attachment.scanVerdict === "UNSAFE")) {
        return "This message has an unsafe attachment result and should not be trusted."
    }
    if (message.finalVerdict === "SAFE" || message.finalVerdict === "LOW_RISK") {
        return "No high-risk signal was found in the parsed email body or attachments."
    }
    return "The message has been analyzed. Review the ML and attachment results before taking action."
}
