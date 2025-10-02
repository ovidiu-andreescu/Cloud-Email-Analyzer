COMPOSE_UNIT = docker compose -f docker-compose.unit.yaml
COMPOSE_INTEGRATION = docker compose -f docker-compose.localstack.yaml

.PHONY: help build-test-env test test-unit test-integration up down logs clean init-tf

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