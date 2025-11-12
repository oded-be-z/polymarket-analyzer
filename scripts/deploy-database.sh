#!/bin/bash
# Database Deployment Script
# Connects to PostgreSQL and runs migrations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="$HOME/polymarket-worktrees"
DB_WORKTREE="$WORKTREE_BASE/02-database"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$NC}$1${NC}"
}

log "================================================================================" "$BLUE"
log "DATABASE DEPLOYMENT" "$BLUE"
log "================================================================================" "$BLUE"

# Load database credentials from environment or .env file
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    log "Loading environment variables from .env..." "$BLUE"
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

# Check required variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log "❌ Missing database credentials. Required:" "$RED"
    log "   DB_HOST, DB_NAME, DB_USER, DB_PASSWORD" "$RED"
    log "" ""
    log "Example .env file:" "$YELLOW"
    log "   DB_HOST=postgres-seekapatraining-prod.postgres.database.azure.com" "$YELLOW"
    log "   DB_PORT=6432" "$YELLOW"
    log "   DB_NAME=polymarket_analyzer" "$YELLOW"
    log "   DB_USER=seekapaadmin" "$YELLOW"
    log "   DB_PASSWORD=your_password" "$YELLOW"
    exit 1
fi

DB_PORT="${DB_PORT:-6432}"
CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

log "Database: $DB_NAME@$DB_HOST:$DB_PORT" "$GREEN"
log "" ""

# Test connection
log "Testing database connection..." "$BLUE"
if psql "$CONNECTION_STRING" -c "SELECT 1;" >/dev/null 2>&1; then
    log "✅ Connection successful" "$GREEN"
else
    log "❌ Connection failed" "$RED"
    log "Please check your credentials and network connectivity" "$RED"
    exit 1
fi

log "" ""

# Find migration files
MIGRATION_DIR="$DB_WORKTREE/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
    log "⚠️  Migration directory not found: $MIGRATION_DIR" "$YELLOW"
    log "Attempting to find schema.sql..." "$YELLOW"

    # Look for schema files
    SCHEMA_FILES=$(find "$DB_WORKTREE" -name "schema.sql" -o -name "*.sql" 2>/dev/null)
    if [ -z "$SCHEMA_FILES" ]; then
        log "❌ No SQL files found in database worktree" "$RED"
        exit 1
    fi

    log "Found SQL files:" "$GREEN"
    echo "$SCHEMA_FILES" | while read -r file; do
        log "   - $file" "$GREEN"
    done
    log "" ""

    # Run each SQL file
    echo "$SCHEMA_FILES" | while read -r file; do
        log "Executing: $(basename "$file")..." "$BLUE"
        if psql "$CONNECTION_STRING" -f "$file"; then
            log "✅ $(basename "$file") executed successfully" "$GREEN"
        else
            log "❌ Failed to execute $(basename "$file")" "$RED"
            exit 1
        fi
        log "" ""
    done
else
    log "Running migrations from: $MIGRATION_DIR" "$BLUE"

    # Run migrations in order
    for migration in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            log "Executing: $(basename "$migration")..." "$BLUE"
            if psql "$CONNECTION_STRING" -f "$migration"; then
                log "✅ $(basename "$migration") executed successfully" "$GREEN"
            else
                log "❌ Failed to execute $(basename "$migration")" "$RED"
                exit 1
            fi
            log "" ""
        fi
    done
fi

# Verify tables
log "Verifying tables..." "$BLUE"
TABLES=$(psql "$CONNECTION_STRING" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")

if [ -z "$TABLES" ]; then
    log "⚠️  No tables found" "$YELLOW"
else
    log "✅ Tables created:" "$GREEN"
    echo "$TABLES" | while read -r table; do
        if [ -n "$table" ]; then
            # Count rows
            COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
            log "   - $table ($COUNT rows)" "$GREEN"
        fi
    done
fi

log "" ""

# Insert seed data if available
SEED_FILE="$DB_WORKTREE/seed.sql"
if [ -f "$SEED_FILE" ]; then
    log "Loading seed data..." "$BLUE"
    if psql "$CONNECTION_STRING" -f "$SEED_FILE"; then
        log "✅ Seed data loaded successfully" "$GREEN"
    else
        log "⚠️  Failed to load seed data (may be optional)" "$YELLOW"
    fi
    log "" ""
fi

# Create indexes if index file exists
INDEX_FILE="$DB_WORKTREE/indexes.sql"
if [ -f "$INDEX_FILE" ]; then
    log "Creating indexes..." "$BLUE"
    if psql "$CONNECTION_STRING" -f "$INDEX_FILE"; then
        log "✅ Indexes created successfully" "$GREEN"
    else
        log "⚠️  Failed to create indexes" "$YELLOW"
    fi
    log "" ""
fi

log "================================================================================" "$GREEN"
log "DATABASE DEPLOYMENT COMPLETE" "$GREEN"
log "================================================================================" "$GREEN"
log "Database: $DB_NAME" "$GREEN"
log "Host: $DB_HOST:$DB_PORT" "$GREEN"
log "Status: Ready" "$GREEN"
log "================================================================================" "$GREEN"

exit 0
