# SocialPilot Pro — Development Commands
# Usage: make <target>

.PHONY: setup install dev build db-push db-seed db-reset db-studio \
        docker-up docker-down clean test lint format help

# ── Setup ─────────────────────────────────────────────────────
setup:
	@echo "🚀 Running setup wizard..."
	node scripts/setup.js

install:
	@echo "📦 Installing dependencies..."
	npm install -g pnpm@10.6.1
	pnpm install

# ── Development ───────────────────────────────────────────────
dev:
	@echo "▶ Starting all services..."
	pnpm dev

dev-backend:
	@echo "▶ Starting backend only..."
	pnpm dev:backend:only

dev-frontend:
	@echo "▶ Starting frontend only..."
	pnpm dev:frontend:only

dev-orchestrator:
	@echo "▶ Starting orchestrator only..."
	pnpm dev:orchestrator

# ── Database ──────────────────────────────────────────────────
db-push:
	@echo "🗄  Pushing schema to database..."
	pnpm prisma-db-push

db-seed:
	@echo "🌱 Seeding database..."
	pnpm prisma-seed

db-migrate:
	@echo "🗄  Creating migration..."
	pnpm prisma-migrate

db-migrate-deploy:
	@echo "🗄  Deploying migrations..."
	pnpm prisma-migrate-deploy

db-reset:
	@echo "⚠️  Resetting database (DESTRUCTIVE)..."
	pnpm prisma-reset

db-studio:
	@echo "🔍 Opening Prisma Studio..."
	pnpm prisma-studio

# ── Docker ────────────────────────────────────────────────────
docker-up:
	@echo "🐳 Starting Docker services..."
	docker compose -f docker-compose.dev.yaml up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker compose -f docker-compose.dev.yaml down

docker-prod:
	@echo "🐳 Starting production Docker stack..."
	docker compose up -d

docker-logs:
	docker compose logs -f

# ── Build ─────────────────────────────────────────────────────
build:
	@echo "🔨 Building all apps..."
	pnpm build

build-backend:
	pnpm build:backend

build-frontend:
	pnpm build:frontend

# ── Quality ───────────────────────────────────────────────────
test:
	pnpm test

lint:
	pnpm dlx eslint apps/backend/src --ext .ts
	pnpm dlx eslint apps/frontend/src --ext .ts,.tsx

format:
	pnpm dlx prettier --write "apps/**/*.{ts,tsx}" "libraries/**/*.ts"

# ── Cleanup ───────────────────────────────────────────────────
clean:
	@echo "🧹 Cleaning build artifacts..."
	Remove-Item -Recurse -Force apps/backend/dist -ErrorAction SilentlyContinue
	Remove-Item -Recurse -Force apps/frontend/.next -ErrorAction SilentlyContinue
	Remove-Item -Recurse -Force apps/orchestrator/dist -ErrorAction SilentlyContinue

# ── Ollama ────────────────────────────────────────────────────
ollama-setup:
	@echo "🤖 Setting up Ollama..."
	ollama pull llama3.2
	@echo "✅ Model ready. Run 'ollama serve' to start."

# ── Help ──────────────────────────────────────────────────────
help:
	@echo ""
	@echo "SocialPilot Pro — Available Commands"
	@echo "====================================="
	@echo ""
	@echo "  make setup          Interactive setup wizard"
	@echo "  make install        Install all dependencies"
	@echo "  make dev            Start all services (dev)"
	@echo "  make dev-backend    Start backend only"
	@echo "  make dev-frontend   Start frontend only"
	@echo "  make docker-up      Start PostgreSQL + Ollama via Docker"
	@echo "  make db-push        Push Prisma schema to DB"
	@echo "  make db-seed        Seed initial data"
	@echo "  make db-studio      Open Prisma Studio GUI"
	@echo "  make build          Build all apps for production"
	@echo "  make docker-prod    Start full production stack"
	@echo "  make ollama-setup   Download AI model"
	@echo ""
