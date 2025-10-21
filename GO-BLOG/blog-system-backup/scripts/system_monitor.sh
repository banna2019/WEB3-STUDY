#!/bin/bash
# 系统监控脚本
# 文件: scripts/system_monitor.sh

# 配置
ALERT_EMAIL="admin@example.com"
LOG_FILE="/var/log/blog-monitor.log"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85

# 函数：发送告警邮件
send_alert() {
    local subject=$1
    local message=$2
    echo "$(date): $message" >> $LOG_FILE
    # echo "$message" | mail -s "$subject" $ALERT_EMAIL
}

# 检查服务状态
check_service() {
    if ! systemctl is-active --quiet blog-system; then
        send_alert "服务告警" "Blog system service is down"
        systemctl restart blog-system
        send_alert "服务恢复" "Blog system service restarted"
    fi
}

# 检查数据库连接
check_database() {
    if ! mysql -u blog_user -p${DB_PASSWORD} -e "SELECT 1" blog_system > /dev/null 2>&1; then
        send_alert "数据库告警" "Database connection failed"
    fi
}

# 检查CPU使用率
check_cpu() {
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $THRESHOLD_CPU" | bc -l) )); then
        send_alert "CPU告警" "CPU usage is high: ${cpu_usage}%"
    fi
}

# 检查内存使用率
check_memory() {
    memory_usage=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > $THRESHOLD_MEMORY" | bc -l) )); then
        send_alert "内存告警" "Memory usage is high: ${memory_usage}%"
    fi
}

# 检查磁盘使用率
check_disk() {
    disk_usage=$(df /opt/blog-system | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $disk_usage -gt $THRESHOLD_DISK ]; then
        send_alert "磁盘告警" "Disk usage is high: ${disk_usage}%"
    fi
}

# 检查API响应
check_api() {
    response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8080/api/posts)
    if (( $(echo "$response_time > 5" | bc -l) )); then
        send_alert "API告警" "API response time is slow: ${response_time}s"
    fi
}

# 主监控流程
echo "$(date): Starting system monitoring" >> $LOG_FILE

check_service
check_database
check_cpu
check_memory
check_disk
check_api

echo "$(date): System monitoring completed" >> $LOG_FILE
