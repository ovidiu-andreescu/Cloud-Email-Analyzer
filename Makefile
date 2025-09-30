COMPOSE_FILE = -f docker-compose.localstack.yaml

.PHONY: help build test test-unit test-integration up down logs clean

.DEFAULT_GOAL := help

help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build:
	docker compose $(COMPOSE_FILE) build

test: test-unit test-integration

test-unit:
	@echo "Running unit tests..."
	docker compose $(COMPOSE_FILE) run --rm --build tests /app/scripts/run_tests.sh unit

test-integration:
	@echo "Running integration tests..."
	docker compose $(COMPOSE_FILE) up --build --abort-on-container-exit --exit-code-from tests
	@echo "Tearing down integration test environment..."
	@# This 'down' command runs after the 'up' command finishes, ensuring cleanup.
	docker compose $(COMPOSE_FILE) down

up:
	docker compose $(COMPOSE_FILE) up -d

down:
	docker compose $(COMPOSE_FILE) down

logs:
	docker compose $(COMPOSE_FILE) logs -f

clean:
	docker compose $(COMPOSE_FILE) down -v --remove-orphans