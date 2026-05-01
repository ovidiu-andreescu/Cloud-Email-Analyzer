COMPOSE_UNIT = docker compose -f docker/docker-compose.unit.yaml
COMPOSE_INTEGRATION = docker compose -f docker/docker-compose.localstack.yaml
LOCAL_ENDPOINT ?= http://localhost:4566
AWS_REGION ?= eu-central-1
LOCAL_PREFIX ?= cloud-email-analyzer-local-dev

.PHONY: help build-test-env test test-unit test-integration up down logs clean init-tf local-up local-build local-deploy local-create-users local-seed-benign local-seed-phishing local-seed-eicar local-api local-ui local-test local-down codex-start codex-stop codex-status

.DEFAULT_GOAL := help

help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'


up: ## Start LocalStack services in the background
	$(COMPOSE_INTEGRATION) up -d

down: ## Stop LocalStack services
	$(COMPOSE_INTEGRATION) down

logs: ## Follow logs from LocalStack services
	$(COMPOSE_INTEGRATION) logs -f

clean: ## Stop services and remove all data (volumes, orphans)
	$(COMPOSE_INTEGRATION) down -v --remove-orphans

local-up: ## Start LocalStack for the local demo
	$(COMPOSE_INTEGRATION) up -d localstack

local-build: ## Package local Lambda ZIPs for LocalStack
	LOCALSTACK_ENDPOINT=$(LOCAL_ENDPOINT) AWS_REGION=$(AWS_REGION) ./scripts/local_build_push.sh

local-deploy: ## Apply LocalStack Terraform and ensure local tables
	LOCALSTACK_ENDPOINT=$(LOCAL_ENDPOINT) AWS_REGION=$(AWS_REGION) ./scripts/local_deploy.sh

local-create-users: ## Seed demo users and mailbox mappings
	AWS_ENDPOINT_URL=$(LOCAL_ENDPOINT) AWS_DEFAULT_REGION=$(AWS_REGION) LOCAL_PREFIX=$(LOCAL_PREFIX) ./scripts/create_demo_users.py

local-seed-benign: ## Seed a benign email to Alice
	PYTHONPATH=libs/common/src AWS_ENDPOINT_URL=$(LOCAL_ENDPOINT) AWS_DEFAULT_REGION=$(AWS_REGION) LOCAL_PREFIX=$(LOCAL_PREFIX) ./scripts/local_seed_email.py --email fixtures/benign.eml --to alice@demo.local

local-seed-phishing: ## Seed a phishing-like email to Alice
	PYTHONPATH=libs/common/src AWS_ENDPOINT_URL=$(LOCAL_ENDPOINT) AWS_DEFAULT_REGION=$(AWS_REGION) LOCAL_PREFIX=$(LOCAL_PREFIX) ./scripts/local_seed_email.py --email fixtures/phishing.eml --to alice@demo.local --from-address attacker@example.com

local-seed-eicar: ## Seed an EICAR attachment email to Bob
	PYTHONPATH=libs/common/src AWS_ENDPOINT_URL=$(LOCAL_ENDPOINT) AWS_DEFAULT_REGION=$(AWS_REGION) LOCAL_PREFIX=$(LOCAL_PREFIX) ./scripts/local_seed_email.py --email fixtures/eicar.eml --to bob@demo.local --from-address scanner-test@example.com

local-api: ## Run the FastAPI dashboard API locally against LocalStack
	$(COMPOSE_INTEGRATION) up --build api

local-ui: ## Build and run the React dashboard locally
	cd services/frontend && test -d node_modules || npm install --ignore-scripts
	cd services/frontend && VITE_API_BASE_URL=http://127.0.0.1:8000 npm run build
	$(COMPOSE_INTEGRATION) up --build -d api frontend

local-test: ## Run local unit tests
	PYTHONPATH=libs/common/src:services/init_ledger/src:services/parse_email/src:services/resolve_recipients/src:services/aggregate_verdicts/src pytest -q

local-down: ## Stop and clean the local demo environment
	$(COMPOSE_INTEGRATION) down -v --remove-orphans

codex-start: ## Start the complete LocalStack demo stack
	LC_ALL=C ./scripts/codex_local_demo.sh start

codex-stop: ## Stop the complete LocalStack demo stack without deleting volumes
	LC_ALL=C ./scripts/codex_local_demo.sh stop

codex-status: ## Show LocalStack demo container status
	LC_ALL=C ./scripts/codex_local_demo.sh status

build-test-env: ## Build all Docker images required for testing
	$(COMPOSE_UNIT) build
	$(COMPOSE_INTEGRATION) build

init-tf: up ## Initialize LocalStack with Terraform (requires services to be up)
	@echo "Initializing LocalStack with Terraform..."
	$(COMPOSE_INTEGRATION) run --rm tests /app/scripts/init_localstack.sh

test: test-unit test-integration ## Run all unit and integration tests

test-unit: ## Run unit tests (fast and isolated)
	@echo "Running unit tests..."
	$(COMPOSE_UNIT) run --rm --build tests /app/scripts/run_tests.sh unit

test-integration: init-tf ## Run integration tests (includes setup and teardown)
	@echo "Running integration tests..."
	$(COMPOSE_INTEGRATION) run --rm tests /app/scripts/run_tests.sh integration
	@echo "Tearing down integration test environment..."
	@$(COMPOSE_INTEGRATION) down
