# SolarERP Development Makefile
# Provides convenient shortcuts for common development tasks

.PHONY: help install dev test build clean docker

# Default target - show help
help:
	@echo "SolarERP Development Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install         - Install all dependencies (backend + frontend)"
	@echo "  make install-backend - Install backend dependencies only"
	@echo "  make install-frontend- Install frontend dependencies only"
	@echo "  make clean-install   - Clean install (removes node_modules first)"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start full development environment"
	@echo "  make dev-backend    - Start backend development server only"
	@echo "  make dev-frontend   - Start frontend development server only"
	@echo "  make dev-debug      - Start backend with debugging enabled"
	@echo ""
	@echo "Database:"
	@echo "  make db-setup       - Create database and run migrations"
	@echo "  make db-reset       - Reset database (drop, create, migrate)"
	@echo "  make db-migrate     - Run pending migrations"
	@echo "  make db-seed        - Seed database with sample data"
	@echo "  make db-status      - Check migration status"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo "  make test-watch     - Run tests in watch mode"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           - Run linters on all code"
	@echo "  make lint-fix       - Auto-fix linting issues"
	@echo "  make format         - Format all code with Prettier"
	@echo "  make type-check     - Run TypeScript type checking"
	@echo "  make validate       - Run all validation checks"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start Docker containers"
	@echo "  make docker-down    - Stop Docker containers"
	@echo "  make docker-rebuild - Rebuild Docker containers"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-dev     - Start development Docker environment"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build          - Build production version"
	@echo "  make build-analyze  - Build and analyze bundle size"
	@echo "  make deploy-railway - Deploy to Railway"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Remove build artifacts and caches"
	@echo "  make check-deps     - Check for dependency updates"
	@echo "  make update-deps    - Update all dependencies"
	@echo "  make security-check - Run security audit"
	@echo "  make create-admin   - Create admin user"

# Installation targets
install:
	@echo "Installing all dependencies..."
	@npm install
	@cd client-new && npm install
	@echo "Dependencies installed successfully!"

install-backend:
	@echo "Installing backend dependencies..."
	@npm install

install-frontend:
	@echo "Installing frontend dependencies..."
	@cd client-new && npm install

clean-install:
	@echo "Performing clean installation..."
	@make clean
	@make install

# Development targets
dev:
	@echo "Starting full development environment..."
	@npm run dev:full

dev-backend:
	@echo "Starting backend development server..."
	@npm run dev

dev-frontend:
	@echo "Starting frontend development server..."
	@cd client-new && npm start

dev-debug:
	@echo "Starting backend with debugging..."
	@npm run dev:debug

# Database targets
db-setup:
	@echo "Setting up database..."
	@npm run db:create
	@npm run db:migrate
	@echo "Database setup complete!"

db-reset:
	@echo "Resetting database..."
	@npm run db:reset
	@echo "Database reset complete!"

db-migrate:
	@echo "Running migrations..."
	@npm run db:migrate

db-seed:
	@echo "Seeding database..."
	@npm run db:seed

db-status:
	@echo "Checking migration status..."
	@npm run db:migrate:status

# Testing targets
test:
	@echo "Running all tests..."
	@npm run test:ci
	@cd client-new && npm run test:ci

test-backend:
	@echo "Running backend tests..."
	@npm run test:ci

test-frontend:
	@echo "Running frontend tests..."
	@cd client-new && npm run test:ci

test-watch:
	@echo "Running tests in watch mode..."
	@npm run test:watch

test-coverage:
	@echo "Running tests with coverage..."
	@npm run test:ci
	@cd client-new && npm run test:coverage

# Code quality targets
lint:
	@echo "Running linters..."
	@npm run lint
	@cd client-new && npm run lint

lint-fix:
	@echo "Fixing linting issues..."
	@npm run lint:fix
	@cd client-new && npm run lint:fix

format:
	@echo "Formatting code..."
	@npm run format
	@cd client-new && npm run format

type-check:
	@echo "Running TypeScript type checking..."
	@cd client-new && npm run type-check

validate:
	@echo "Running all validation checks..."
	@npm run validate
	@cd client-new && npm run validate

# Docker targets
docker-up:
	@echo "Starting Docker containers..."
	@docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-rebuild:
	@echo "Rebuilding Docker containers..."
	@npm run docker:rebuild

docker-logs:
	@echo "Viewing Docker logs..."
	@docker-compose logs -f

docker-dev:
	@echo "Starting development Docker environment..."
	@npm run docker:dev

# Build targets
build:
	@echo "Building production version..."
	@npm run build:prod

build-analyze:
	@echo "Building and analyzing bundle..."
	@npm run build:analyze

# Deploy targets
deploy-railway:
	@echo "Deploying to Railway..."
	@npm run railway:build

# Utility targets
clean:
	@echo "Cleaning build artifacts and caches..."
	@npm run clean

check-deps:
	@echo "Checking for dependency updates..."
	@npm run check:deps

update-deps:
	@echo "Updating dependencies..."
	@npm run update:deps

security-check:
	@echo "Running security audit..."
	@npm run security:check

create-admin:
	@echo "Creating admin user..."
	@npm run create-admin

# Quick development shortcuts
.PHONY: d t l f
d: dev
t: test
l: lint-fix
f: format