# Cloud Email Analyzer

> A local-first email-security pipeline that turns raw messages into clear, auditable security evidence.

Cloud Email Analyzer receives a MIME email, extracts its content and attachments, evaluates phishing signals and malware verdicts, and presents the result in an authenticated review dashboard. The project is designed for a convincing local demonstration today and a reusable AWS deployment path later.

## What It Demonstrates

- **Event-driven design** — one canonical `MailReceived` event connects ingestion to a staged processing pipeline.
- **Defense in depth** — phishing-text classification, ClamAV attachment scanning, a reviewable ledger, and audit logging work together.
- **Practical authorization** — the API, rather than the UI, enforces user mailbox ownership and admin access.
- **Reproducible local workflow** — LocalStack, Docker, Terraform, FastAPI, React, and fixtures provide a self-contained demo environment.

```text
Email fixture or AWS SES
        |
        v
  MailReceived event
        |
        v
Resolve recipient -> Parse message -> Phishing ML -> Attachment scan -> Aggregate verdicts
        |
        v
DynamoDB ledger -> FastAPI -> React review dashboard
```

## Technology

| Area | Tools |
| --- | --- |
| Local cloud emulation | LocalStack, Docker, Terraform |
| Processing | AWS Lambda-compatible Python services, EventBridge, Step Functions |
| Security analysis | Scikit-learn phishing classifier, ClamAV |
| Storage and API | DynamoDB, FastAPI |
| Interface | React, TypeScript, Vite |
| Validation | Pytest, Docker Compose |

## Quick Start

### Prerequisites

- Docker Desktop
- AWS CLI and Terraform
- Node.js/npm
- A LocalStack Pro auth token in an ignored `.env.localstack` file

Create the token file locally (never commit it):

```bash
LOCALSTACK_AUTH_TOKEN=your-token-here
```

Start the complete demo:

```bash
make codex-start
```

Then open the dashboard at <http://localhost:5173/login> and the API at <http://localhost:8000/>.

Useful companion commands:

```bash
make codex-status    # inspect service status
make codex-populate  # recreate demo users and sample messages
make codex-stop      # stop the stack and remove local demo state
```

The repository includes deliberately non-sensitive demo accounts for local evaluation:

```text
admin@demo.local / admin123!demo
alice@demo.local / alice123!demo
bob@demo.local   / bob123!demo
```

## Demo Scenarios

The fixture set demonstrates benign mail, a phishing-style message, an EICAR antivirus test attachment, and a message with several safe attachments. Local mode seeds `.eml` files because LocalStack does not accept real inbound SES email.

## Architecture and Deployment Modes

| Mode | Status | Packaging | Notes |
| --- | --- | --- | --- |
| Local Pro | Supported demo path | Lambda container images in LocalStack ECR | Full local pipeline, including ML and ClamAV image scan. |
| Local Free | Experimental | ZIP Lambdas | Preserved for future work; packaged ML and production-grade ClamAV lifecycle are incomplete. |
| AWS | Planned | ECR Lambda images | Shares the pipeline contract; SES adapter, production identity, and operational hardening remain. |

The environment-specific ingestion adapters emit the same `MailReceived` contract, so the parser, classifier, scanner, ledger, API, and dashboard remain shared.

## Developer Commands

```bash
make local-up              # start LocalStack
make local-build           # build/push LocalStack Lambda images
make local-deploy          # provision local infrastructure and workflow
make local-create-users    # create demo users and mailbox mappings
make local-seed-benign     # seed a benign message
make local-seed-phishing   # seed a phishing-style message
make local-seed-eicar      # seed the EICAR test message
make local-seed-multiple   # seed a safe multi-attachment message
make local-ui              # build and serve the API and frontend
make local-down            # stop the local demo and clear its state
```

## Verification

```bash
# Frontend production build
cd services/frontend && npm run build

# Python unit tests
uv run --extra test --with fastapi==0.115.5 --with boto3 --with botocore python -m pytest tests/unit
```

## Project Materials

- [Project paper](paper/README.md) — LaTeX source and rendered paper.
- [Presentation](presentation/README.md) — editable PowerPoint deck, PDF export, and editable slide source.
- `presentation/Cloud_Email_Analyzer_Demo.mp4` and `presentation/Cloud_Email_Analyzer_Demo_x2.mov` — recorded project demonstrations.
- `fixtures/` — safe, deterministic local demo messages and population data.

## Security and Repository Hygiene

Credentials belong in ignored local environment files; `.env.localstack` is intentionally excluded from Git. The repository retains source, model artifacts, recorded demos, and the paper/presentation deliverables needed to evaluate the project, while generated LocalStack ZIP packages, tool state, and backups are excluded.

For a production AWS deployment, supply a strong `jwt_secret`, use managed identity, and complete the operational ClamAV signature-update lifecycle described in the paper.

## Authors

- Andreescu Ovidiu-Ștefan
- Anghelea Andrei
- Sîrbu-Boeți Eduard-Cristian

## License

Released under the [MIT License](LICENSE).
