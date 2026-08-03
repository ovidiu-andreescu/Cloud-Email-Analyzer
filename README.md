# Cloud Email Analyzer

[![CI](https://github.com/ovidiu-andreescu/Cloud-Email-Analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/ovidiu-andreescu/Cloud-Email-Analyzer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Cloud Email Analyzer is an event-driven email-security review platform. It preserves raw messages, extracts reviewable evidence, classifies phishing risk, scans attachments with ClamAV, and presents the resulting verdicts in an authenticated dashboard.

The project combines an AWS-shaped processing pipeline with a reproducible local development deployment built on LocalStack, Docker, Terraform, FastAPI, and React.

## What It Does

```text
Receive or seed an email
        |
        v
Preserve raw MIME -> Resolve recipients -> Parse content and attachments
        |
        v
Phishing classification -> ClamAV scan -> Aggregate verdicts
        |
        v
DynamoDB review state -> FastAPI -> React dashboard and audit views
```

Key capabilities include:

- a canonical `MailReceived` event that keeps ingestion separate from analysis;
- raw MIME and derived-artifact preservation in S3-compatible storage;
- TF-IDF-based phishing classification using committed model artifacts;
- per-attachment ClamAV scan status and final verdict aggregation;
- mailbox ownership and administrator authorization enforced by the API; and
- audit records for security-relevant review actions.

## Technology

| Area | Tools |
| --- | --- |
| Infrastructure | Terraform, LocalStack, Docker Compose |
| Processing | Python Lambda services, EventBridge, Step Functions |
| Security analysis | Scikit-learn, ClamAV |
| Data and API | S3, DynamoDB, FastAPI |
| Interface | React, TypeScript, Vite |
| Validation | Pytest, GitHub Actions |

## Run the Local Development Deployment

The complete development deployment uses LocalStack Pro and Lambda container images.

### Prerequisites

- Docker Desktop
- AWS CLI
- Terraform
- Node.js and npm
- A LocalStack Pro auth token

Create an ignored `.env.localstack` file in the repository root:

```bash
LOCALSTACK_AUTH_TOKEN=your-token-here
```

Start the complete environment:

```bash
make codex-start
```

Open the dashboard at <http://localhost:5173/login> or the API at <http://localhost:8000/>.

The local population step creates these demo accounts:

```text
admin@demo.local / admin123!demo
alice@demo.local / alice123!demo
bob@demo.local   / bob123!demo
```

The included fixtures cover benign mail, a phishing-style message, an EICAR antivirus test attachment, and a message with several safe attachments.

Useful commands:

```bash
make codex-status    # show local service status
make codex-populate  # recreate demo users and messages
make codex-stop      # stop services and clear local demo state
```

## Test and Validate

Run the Python unit tests:

```bash
uv run --locked --extra test \
  --with fastapi==0.115.5 \
  --with boto3 \
  --with botocore \
  python -m pytest tests/unit
```

Build the frontend:

```bash
cd services/frontend
npm ci
npm run build
```

Check Terraform formatting and configuration:

```bash
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform init -backend=false
terraform -chdir=infra/terraform validate
```

GitHub Actions runs these checks automatically for pushes and pull requests targeting `main` or `dev`. CI also compiles the Python sources and validates every presentation `.mjs` module. These checks require neither a LocalStack subscription nor an AWS account.

## Repository Structure

| Path | Purpose |
| --- | --- |
| `services/` | Pipeline stages, FastAPI backend, React frontend, ML inference, and ClamAV services |
| `libs/common/` | Shared AWS clients, event contracts, mail helpers, and secret loading |
| `infra/terraform/` | Active infrastructure definitions for storage, orchestration, compute, API, and frontend hosting |
| `infra/legacy/` | Historical AWS deployment material retained for restoration work |
| `docker/` | Local development and test container definitions |
| `scripts/` | Build, provision, populate, operate, and inspect the local environment |
| `fixtures/` | Deterministic demo messages and user population data |
| `tests/` | Unit and integration-test workspace |
| `paper/` | LaTeX project paper and native figures |
| `presentation/` | Presentation deliverables, recorded demos, and editable slide source |

## Project Materials

- [Project paper](paper/README.md)
- [Presentation package](presentation/README.md)
- [Recorded MP4 demo](presentation/Cloud_Email_Analyzer_Demo.mp4)
- [Recorded MOV demo](presentation/Cloud_Email_Analyzer_Demo_x2.mov)

## Authors

- Andreescu Ovidiu-Ștefan
- Anghelea Andrei
- Sîrbu-Boeți Eduard-Cristian

## License

Released under the [MIT License](LICENSE).
