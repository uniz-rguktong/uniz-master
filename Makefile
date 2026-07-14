.PHONY: help deps up down logs seed restart ps

COMPOSE := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)
COMPOSE_FILE := docker/local/compose.yml
COMPOSE_CMD = $(COMPOSE) -f $(COMPOSE_FILE)

help:
	@echo "LOCAL DEMO ONLY — production is K3s via GitHub Actions (see STRUCTURE.md)"
	@echo "make deps      - build shared deps image (once)"
	@echo "make up        - start full stack"
	@echo "make down      - stop"
	@echo "make logs      - follow logs"
	@echo "make seed      - sample users (webmaster / password123)"
	@echo "make ps        - status"

deps:
	docker build -f docker/local/Dockerfile.deps -t uniz-deps:local .

up: deps
	@test -f .env || cp .env.example .env
	$(COMPOSE_CMD) up --build -d
	@echo ""
	@echo "Portal:  http://localhost:$${WEB_PORT:-8080}"
	@echo "Gateway: http://localhost:$${GATEWAY_PORT:-3000}/api/v1"
	@echo "Seed:    make seed"

down:
	$(COMPOSE_CMD) --profile seed down

logs:
	$(COMPOSE_CMD) logs -f

seed:
	$(COMPOSE_CMD) --profile seed run --rm seed

restart: deps
	$(COMPOSE_CMD) up --build -d

ps:
	$(COMPOSE_CMD) ps
