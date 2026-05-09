# Demo Script

Maximum duration: 3 minutes.

## Demo Goal

Show the complete reviewer experience: a prepared inbound email is processed into a message record, detector evidence is attached to it, and the dashboard presents a final verdict with supporting details and auditability.

## Setup Requirements

- Project stack running with the API, dashboard, workflow services, object storage, event routing, and DynamoDB-compatible tables available.
- One prepared inbound email message that exercises the pipeline.
- One normal user account and one administrator account available for review.
- Dashboard URL available before recording.
- `TODO:` confirm final presenter machine URL, demo account details, and exact startup command.

## 3-Minute Flow

### 0:00-0:25 — Open the Dashboard

Show: login screen, then inbox or admin overview.

Say: “The demo starts from the review interface. The system has already received an email and processed it through the same staged pipeline shown in the architecture.”

Expected output: the dashboard loads and shows messages or security summary information.

### 0:25-0:55 — Select a Message

Show: message list with sender, subject, status, and verdict fields.

Say: “The reviewer does not only see a label. The message row is backed by stored raw evidence, parsed artifacts, detector outputs, and a ledger state.”

Expected output: one message can be opened from the list.

### 0:55-1:45 — Inspect Evidence

Show: message detail page, verdict summary, ML classification section, attachment section, hashes or scan state, and timeline.

Say: “The page separates the text classifier result from attachment scan evidence. That matters because a suspicious body and a malicious attachment are different reasons for review.”

Expected output: the detail page shows ML verdict, attachment scan state, metadata, and workflow timeline.

### 1:45-2:25 — Show Admin / Audit View

Show: admin review or audit log screen.

Say: “Administrative review is broader, but it is still controlled by the backend. Security-relevant actions such as login, view, reprocess, or attachment download are represented as audit events.”

Expected output: admin view or audit log displays review-oriented records.

### 2:25-3:00 — Close the Demo

Show: return to message detail or dashboard summary.

Say: “The point is traceability: the final verdict is useful because the system keeps the original message, derived artifacts, detector evidence, and review actions connected.”

Expected output: audience sees the final verdict and its supporting evidence.

## Backup Plan

If the live stack is slow or unavailable, use a recorded video of the same sequence. If the dashboard cannot authenticate, show the compiled presentation slides 4, 5, 7, and 8 and explain the flow verbally using the architecture, workflow, evidence model, and evaluation slides.
