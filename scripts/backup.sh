#!/bin/bash

# SolarERP Backup Script
# This script performs automated backups of the database and uploaded files

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DB_NAME:-solarerp}"
DB_USER="${DB_USERNAME:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/logs"

# Function to log messages
log_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$TIMESTAMP.log"
}

# Function to log errors
log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$BACKUP_DIR/logs/backup_$TIMESTAMP.log"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup $status: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# Start backup process
log_message "Starting SolarERP backup process..."

# 1. Database Backup
log_message "Backing up PostgreSQL database..."
DB_BACKUP_FILE="$BACKUP_DIR/database/solarerp_db_$TIMESTAMP.sql.gz"

if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists | gzip -9 > "$DB_BACKUP_FILE"; then
    
    log_message "Database backup completed: $DB_BACKUP_FILE"
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log_message "Database backup size: $DB_SIZE"
else
    log_error "Database backup failed!"
    send_notification "FAILED" "Database backup failed"
    exit 1
fi

# 2. File System Backup
log_message "Backing up uploaded files..."
FILE_BACKUP_FILE="$BACKUP_DIR/files/solarerp_files_$TIMESTAMP.tar.gz"

if [ -d "uploads" ]; then
    if tar -czf "$FILE_BACKUP_FILE" uploads/ 2>/dev/null; then
        log_message "File backup completed: $FILE_BACKUP_FILE"
        FILE_SIZE=$(du -h "$FILE_BACKUP_FILE" | cut -f1)
        log_message "File backup size: $FILE_SIZE"
    else
        log_error "File backup failed!"
        send_notification "FAILED" "File backup failed"
    fi
else
    log_message "No uploads directory found, skipping file backup"
fi

# 3. Configuration Backup
log_message "Backing up configuration files..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/files/solarerp_config_$TIMESTAMP.tar.gz"

if tar -czf "$CONFIG_BACKUP_FILE" \
    .env \
    package.json \
    ecosystem.config.js \
    docker-compose.yml \
    nginx.conf \
    2>/dev/null; then
    log_message "Configuration backup completed: $CONFIG_BACKUP_FILE"
else
    log_message "Some configuration files not found, partial backup completed"
fi

# 4. Redis Backup (if Redis is configured)
if [ -n "$REDIS_URL" ]; then
    log_message "Backing up Redis data..."
    REDIS_BACKUP_FILE="$BACKUP_DIR/database/solarerp_redis_$TIMESTAMP.rdb"
    
    if redis-cli --rdb "$REDIS_BACKUP_FILE" 2>/dev/null; then
        gzip -9 "$REDIS_BACKUP_FILE"
        log_message "Redis backup completed: ${REDIS_BACKUP_FILE}.gz"
    else
        log_message "Redis backup skipped (Redis not accessible)"
    fi
fi

# 5. Clean up old backups
log_message "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR/logs" -name "*.log" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
log_message "Cleanup completed"

# 6. Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
    log_message "Uploading backups to S3..."
    
    if command -v aws &> /dev/null; then
        # Upload database backup
        if aws s3 cp "$DB_BACKUP_FILE" "s3://$S3_BUCKET/database/" --storage-class STANDARD_IA; then
            log_message "Database backup uploaded to S3"
        else
            log_error "Failed to upload database backup to S3"
        fi
        
        # Upload file backup
        if [ -f "$FILE_BACKUP_FILE" ]; then
            if aws s3 cp "$FILE_BACKUP_FILE" "s3://$S3_BUCKET/files/" --storage-class STANDARD_IA; then
                log_message "File backup uploaded to S3"
            else
                log_error "Failed to upload file backup to S3"
            fi
        fi
        
        # Sync entire backup directory (optional)
        # aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/full-backup/" --delete
    else
        log_error "AWS CLI not installed, skipping S3 upload"
    fi
fi

# 7. Verify backup integrity
log_message "Verifying backup integrity..."
if gunzip -t "$DB_BACKUP_FILE" 2>/dev/null; then
    log_message "Database backup integrity: OK"
else
    log_error "Database backup integrity check failed!"
    send_notification "WARNING" "Database backup integrity check failed"
fi

# 8. Generate backup report
REPORT_FILE="$BACKUP_DIR/logs/backup_report_$TIMESTAMP.txt"
{
    echo "SolarERP Backup Report"
    echo "======================"
    echo "Timestamp: $TIMESTAMP"
    echo "Database Backup: $DB_BACKUP_FILE ($DB_SIZE)"
    echo "File Backup: $FILE_BACKUP_FILE ($FILE_SIZE)"
    echo "Configuration Backup: $CONFIG_BACKUP_FILE"
    echo ""
    echo "Backup Directory Contents:"
    ls -lah "$BACKUP_DIR/database/" | tail -5
    echo ""
    echo "Disk Usage:"
    df -h "$BACKUP_DIR"
} > "$REPORT_FILE"

log_message "Backup report generated: $REPORT_FILE"

# 9. Send success notification
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
send_notification "SUCCESS" "Backup completed successfully. Total size: $TOTAL_SIZE"

log_message "Backup process completed successfully!"

# Exit with success
exit 0