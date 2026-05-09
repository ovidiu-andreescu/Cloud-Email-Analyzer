# Speaker Notes

Target duration: about 10 minutes, plus an optional demo segment of up to 3 minutes.

## Slide 1 — Title (0:35)

Open with the project name and the core idea: Cloud Email Analyzer turns inbound email into stored, reviewable security evidence. Mention that the presentation follows the finished paper and uses the same evidence discipline. The author/team, coordinator, university, and group fields are still marked as `TODO:` until final submission metadata is confirmed.

## Slide 2 — Problem (0:55)

Email triage is not only about reading the subject line. A raw message can contain MIME alternatives, envelope recipients, URLs, attachments, and upstream verdict hints. The operational problem is that these signals often arrive separately, while reviewers need a single place where the original evidence, detector output, authorization boundary, and audit history can be inspected.

## Slide 3 — Proposed Solution (0:55)

Describe the system as four moves: receive, preserve, analyze, and review. The important boundary is the canonical `MailReceived` event. It carries metadata and storage pointers, while the raw body and attachment bytes stay in object storage. That event keeps downstream parsing, classification, scanning, aggregation, and review independent from the mechanics of mail receipt.

## Slide 4 — System Architecture (1:10)

Walk left to right through the two lanes. The upper lane is AWS mail ingress: Route53 MX records, SES inbound mail, S3 raw MIME storage, an adapter, and EventBridge. The lower lane is the analysis and review path: Step Functions, Lambda stages, S3 and DynamoDB state, FastAPI, and the React dashboard. Emphasize separation of concerns rather than listing every service as a buzzword.

## Slide 5 — Workflow / Data Flow (1:10)

Explain why the pipeline is staged. The ledger is initialized first, recipients are resolved from the envelope, the raw MIME message is parsed, the body text is classified, attachments are scanned, and final verdict fields are aggregated. Each stage writes evidence for the next stage instead of hiding everything behind one opaque label.

## Slide 6 — Implementation (1:00)

Use this slide to show that the architecture maps to built modules. The cloud services provide ingress, orchestration, storage, and query state. The analysis stages are bounded tasks. The review layer includes FastAPI routes, JWT authorization, the React dashboard, admin review, and audit records. Point out that authorization is enforced server-side.

## Slide 7 — Evidence Model (1:00)

The data model supports the security story. S3 stores heavy artifacts such as raw MIME, parsed bodies, and extracted attachments. DynamoDB stores compact review state such as message ledger rows, inbox projections, attachment metadata, users, mailboxes, and audit records. This split makes the dashboard fast while preserving evidence for reprocessing or review.

## Slide 8 — Results / Evaluation (1:20)

Be careful with scope. The numbers come from checked ML evaluation artifacts, not live organizational traffic. The SGD classifier is the strongest of the plotted models, with accuracy, precision, recall, and F1 near 0.983. The internal validation accuracy is 0.9803, and the Nazario split class-1 recall is 0.9457. The takeaway is that the packaged classifier has supporting evidence for use inside the triage workflow.

## Slide 9 — Demo Transition (0:40)

Use this as the bridge into the demo or video. Tell the audience what they will see: a prepared inbound message, workflow processing, a dashboard verdict, supporting evidence, attachment scan state, and audit/admin review. Keep the demo focused on the message lifecycle rather than every internal command.

## Slide 10 — Limitations and Future Work (1:00)

Keep the tone honest and confident. The current detector set focuses on text classification and ClamAV attachment scanning. The architecture leaves room for URL and domain reputation, header authentication scoring, managed identity with Cognito, ClamAV signature lifecycle management, analyst notes, case assignment, and exportable reports.

## Slide 11 — Questions (0:25)

Close with the contribution in one sentence: the project turns inbound mail into traceable security evidence. Then invite questions. If discussion needs a starting point, return to the architecture and evaluation slides because those are the strongest anchors.
