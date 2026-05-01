# Cloud Email Analyzer

Cloud Email Analyzer is a local-first email security inbox that is being migrated back toward an AWS-capable architecture.

The product goal is simple:

```text
Receive or seed an email
  -> store the raw MIME message
  -> parse body, headers, URLs, and attachments
  -> run phishing ML on the body text
  -> scan attachments with ClamAV
  -> store the ledger in DynamoDB
  -> show the result in an authenticated dashboard
```

The current working milestone is the **LocalStack Pro image-mode demo**. It uses LocalStack S3, DynamoDB, EventBridge, Step Functions, Lambda container images, local ECR, FastAPI, and React.

## Why This Migration Exists

The original project was built for AWS email ingestion and scanning, but the AWS account was shut down after cost issues around the ClamAV VM/layer workflow. We revived the project with a local-first design so development and demos do not depend on a live AWS account.

The important architecture change is the canonical `MailReceived` event:

```text
Local mode:
  .eml fixture -> LocalStack S3 -> MailReceived event -> shared pipeline

AWS mode:
  SES inbound email -> S3 -> SES adapter -> MailReceived event -> shared pipeline
```

That means ingestion is environment-specific, but parsing, ML, ClamAV, storage, API, and dashboard behavior stay shared.

## Operating Modes

| Mode | Status | Purpose | Lambda packaging | Notes |
| --- | --- | --- | --- | --- |
| Local Pro | Current default | Best local demo and development path | Container images in LocalStack ECR | Requires a LocalStack auth token. Runs packaged ML and ClamAV image scanner. |
| Local Free | Future fallback | Keep a no-subscription local path available | ZIP Lambdas | Guarded and experimental. Real local-free ClamAV and packaged ML support are not finished yet. |
| AWS | Future deployment path | Real inbound email and hosted cloud deployment | ECR Lambda images | Terraform is partially AWS-ready, but SES adapter, full image publish flow, Cognito, and production ClamAV lifecycle still need final work. |

## Local Pro Quick Start

Prerequisites:

- Docker Desktop
- AWS CLI
- Terraform
- Node.js/npm
- LocalStack auth token saved in `.env.localstack`

The token file should look like this:

```bash
LOCALSTACK_AUTH_TOKEN=your-token-here
```

Start the full local demo:

```bash
make codex-start
```

Open:

```text
Dashboard: http://localhost:5173/login
API:       http://localhost:8000/
```

Stop containers and clear the local database/S3 state:

```bash
make codex-stop
```

Repopulate demo users and messages without restarting:

```bash
make codex-populate
```

Check container status:

```bash
make codex-status
```

## Demo Accounts

The application does not hardcode users or messages. The population scripts create them in DynamoDB.

```text
admin@demo.local / admin123!demo
alice@demo.local / alice123!demo
bob@demo.local   / bob123!demo
```

Seeded messages currently cover:

- benign email
- phishing-like email
- EICAR attachment email
- multiple safe attachments layout test

## Current Local Flow

```text
fixtures/*.eml
  -> scripts/populate_demo.py
  -> scripts/local_seed_email.py
  -> LocalStack S3 raw email bucket
  -> canonical MailReceived EventBridge event
  -> Step Functions workflow
       InitLedger
       ResolveRecipients
       ParseEmail
       PhishingML
       AttachmentScan
       AggregateVerdicts
  -> DynamoDB tables
  -> FastAPI
  -> React dashboard
```

Local mode simulates inbound email through `.eml` fixtures because LocalStack SES does not receive real inbound mail.

## DynamoDB Tables

Local tables use this prefix by default:

```text
cloud-email-analyzer-local-dev
```

Tables:

- `users`
- `mailboxes`
- `messages`
- `inbox-messages`
- `attachments`
- `audit-log`

`make codex-stop` removes the LocalStack volume, so the next `make codex-start` begins with a clean database and then repopulates demo data.

## API Routes

Current authenticated API:

```text
POST /auth/login
GET  /me
GET  /messages
GET  /messages/{messageId}
GET  /messages/{messageId}/indicators
GET  /messages/{messageId}/timeline
GET  /messages/{messageId}/attachments
GET  /messages/{messageId}/attachments/{attachmentId}/download

GET  /admin/messages
POST /admin/messages/{messageId}/reprocess
GET  /admin/users
GET  /admin/mailboxes
GET  /admin/audit-log
GET  /admin/metrics/security-summary
GET  /admin/metrics/verdicts-over-time
```

Authorization is enforced by the backend:

- admins can view all analyzed messages in admin tools
- normal users can only view messages mapped to their user ID
- attachment downloads repeat the same ownership/admin check

## Important Make Targets

```bash
make local-up              # start LocalStack only
make local-build           # default: build/push LocalStack Pro Lambda images
make local-deploy          # apply local infra and wire Step Functions/EventBridge
make local-create-users    # create demo users and mailboxes
make local-seed-benign     # seed benign email
make local-seed-phishing   # seed phishing-like email
make local-seed-eicar      # seed EICAR attachment email
make local-seed-multiple   # seed multiple safe attachments email
make local-ui              # build and serve frontend plus API
make local-down            # stop and clear local data
```

## Local Free Mode

Local free mode is intentionally preserved, but it is not the supported demo path yet.

```bash
ALLOW_EXPERIMENTAL_ZIP_LAMBDAS=1 LOCAL_LAMBDA_MODE=zip make codex-start
```

Current limitations:

- ZIP ClamAV does not include a production scanner/signature lifecycle.
- ZIP ML does not yet package the trained model artifacts.
- This mode is for future development only.

## AWS Migration Status

The project is designed so AWS can reuse the same pipeline after an AWS ingestion adapter emits the canonical `MailReceived` event.

Still needed before a real AWS deployment:

- SES receipt rule and SES-to-`MailReceived` adapter
- ECR build/push flow for every Lambda image
- Cognito or production-grade auth configuration
- real `jwt_secret` value if deploying the current local-JWT API mode
- Route53/domain setup for real inbound mail
- production ClamAV signature update lifecycle
- frontend hosting validation with S3/CloudFront

Do not use old direct-S3 upload scripts as the real ingestion model. The shared contract is `MailReceived`.

## Verification

Frontend build:

```bash
cd services/frontend && npm run build
```

Python compile check:

```bash
python3 -m compileall -q services/web_server/src services/parse_email/src services/init_ledger/src services/aggregate_verdicts/src services/phishing_ml_predict services/clamav_virus_scan tests/unit
```

Unit tests:

```bash
uv run --extra test --with fastapi==0.115.5 --with boto3 --with botocore python -m pytest tests/unit
```
