#!/bin/bash

# SolarERP Restore Script
# This script restores the database and files from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DB_NAME:-solarerp}"
DB_USER="${DB_USERNAME:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to log errors
log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Function to log warnings
log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --database FILE    Database backup file to restore"
    echo "  -f, --files FILE       Files backup archive to restore"
    echo "  -t, --timestamp TIME   Restore from specific timestamp"
    echo "  -l, --list            List available backups"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --database /backups/database/solarerp_db_20240120_120000.sql.gz"
    echo "  $0 --timestamp 20240120_120000"
    exit 1
}

# List available backups
list_backups() {
    log_message "Available backups:"
    echo ""
    echo "Database backups:"
    ls -lah "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null || echo "  No database backups found"
    echo ""
    echo "File backups:"
    ls -lah "$BACKUP_DIR/files/"*.tar.gz 2>/dev/null || echo "  No file backups found"
    exit 0
}

# Parse command line arguments
DB_BACKUP_FILE=""
FILE_BACKUP_FILE=""
TIMESTAMP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DB_BACKUP_FILE="$2"
            shift 2
            ;;
        -f|--files)
            FILE_BACKUP_FILE="$2"
            shift 2
            ;;
        -t|--timestamp)
            TIMESTAMP="$2"
            shift 2
            ;;
        -l|--list)
            list_backups
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# If timestamp is provided, find the backup files
if [ -n "$TIMESTAMP" ]; then
    DB_BACKUP_FILE="$BACKUP_DIR/database/solarerp_db_$TIMESTAMP.sql.gz"
    FILE_BACKUP_FILE="$BACKUP_DIR/files/solarerp_files_$TIMESTAMP.tar.gz"
    
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        log_error "Database backup not found: $DB_BACKUP_FILE"
        exit 1
    fi
fi

# Check if at least one backup file is specified
if [ -z "$DB_BACKUP_FILE" ] && [ -z "$FILE_BACKUP_FILE" ]; then
    log_error "No backup file specified"
    usage
fi

# Confirmation prompt
echo ""
log_warning "This will restore the following:"
[ -n "$DB_BACKUP_FILE" ] && echo "  Database: $DB_BACKUP_FILE"
[ -n "$FILE_BACKUP_FILE" ] && echo "  Files: $FILE_BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? This will overwrite existing data! (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_message "Restore cancelled"
    exit 0
fi

# Start restore process
log_message "Starting SolarERP restore process..."

# 1. Stop the application
log_message "Stopping application services..."
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
fi

if command -v systemctl &> /dev/null; then
    sudo systemctl stop solarerp 2>/dev/null || true
fi

# 2. Restore database
if [ -n "$DB_BACKUP_FILE" ]; then
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        log_error "Database backup file not found: $DB_BACKUP_FILE"
        exit 1
    fi
    
    log_message "Restoring database from: $DB_BACKUP_FILE"
    
    # Create backup of current database
    CURRENT_BACKUP="$BACKUP_DIR/database/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    log_message "Creating backup of current database..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" | gzip > "$CURRENT_BACKUP" 2>/dev/null || true
    
    # Drop and recreate database
    log_message "Dropping existing database..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    
    log_message "Creating new database..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -c "CREATE DATABASE $DB_NAME;"
    
    # Restore database
    log_message "Restoring database data..."
    if gunzip -c "$DB_BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME"; then
        log_message "Database restored successfully"
    else
        log_error "Database restore failed!"
        log_message "Attempting to restore previous database..."
        gunzip -c "$CURRENT_BACKUP" | PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" 2>/dev/null || true
        exit 1
    fi
fi

# 3. Restore files
if [ -n "$FILE_BACKUP_FILE" ]; then
    if [ ! -f "$FILE_BACKUP_FILE" ]; then
        log_error "File backup not found: $FILE_BACKUP_FILE"
        exit 1
    fi
    
    log_message "Restoring files from: $FILE_BACKUP_FILE"
    
    # Backup current files
    if [ -d "uploads" ]; then
        log_message "Backing up current files..."
        mv uploads "uploads_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Extract files
    if tar -xzf "$FILE_BACKUP_FILE"; then
        log_message "Files restored successfully"
        
        # Set proper permissions
        chmod -R 755 uploads/ 2>/dev/null || true
    else
        log_error "File restore failed!"
    fi
fi

# 4. Run database migrations
log_message "Running database migrations..."
npm run db:migrate 2>/dev/null || log_warning "Migration failed or not needed"

# 5. Clear cache
if [ -n "$REDIS_URL" ]; then
    log_message "Clearing Redis cache..."
    redis-cli FLUSHALL 2>/dev/null || log_warning "Redis cache clear failed"
fi

# 6. Restart application
log_message "Starting application services..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js --env production
    pm2 save
elif command -v systemctl &> /dev/null; then
    sudo systemctl start solarerp
else
    log_warning "Please start the application manually"
fi

# 7. Verify restore
log_message "Verifying restore..."
sleep 5

# Check if application is running
if curl -s http://localhost:5002/health > /dev/null; then
    log_message "Application is running"
else
    log_warning "Application health check failed"
fi

# Check database connection
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log_message "Database connection verified"
else
    log_warning "Database connection check failed"
fi

log_message "Restore process completed!"
log_message ""
log_message "Post-restore checklist:"
echo "  1. Verify application functionality"
echo "  2. Check all integrations"
echo "  3. Review application logs"
echo "  4. Test critical workflows"
echo "  5. Notify team of restore completion"

exit 0