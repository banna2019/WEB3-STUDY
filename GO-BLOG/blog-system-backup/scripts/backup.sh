#!/bin/bash
# 备份脚本
# 文件: scripts/backup.sh

# 配置
BACKUP_DIR="/opt/blog-system/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="blog_system"
DB_USER="blog_user"
DB_PASS="${DB_PASSWORD}"
APP_DIR="/opt/blog-system"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "$(date): Starting backup process" >> /var/log/blog-backup.log

# 数据库备份
echo "Backing up database..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 应用文件备份
echo "Backing up application files..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='node_modules' \
    .

# 清理旧备份(保留7天)
echo "Cleaning old backups..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

# 备份到远程存储(可选)
# rsync -av $BACKUP_DIR/ user@backup-server:/backups/blog-system/

echo "$(date): Backup completed successfully" >> /var/log/blog-backup.log
echo "Backup files:"
echo "  Database: $BACKUP_DIR/db_backup_$DATE.sql.gz"
echo "  Application: $BACKUP_DIR/app_backup_$DATE.tar.gz"
