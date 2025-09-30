# Makefile for managing the Docker-based development environment.

# Use a variable for the compose file to keep things DRY (Don't Repeat Yourself).
COMPOSE_FILE = -f docker-compose.local.yaml

# By declaring targets as .PHONY, we tell 'make' that these are command recipes,
# not files to be created. This prevents conflicts with files of the same name.
.PHONY: help build test test-unit test-integration up down logs clean

# Set the default command to 'help' if 'make' is run without arguments.
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