#!/bin/bash
# 日志分析脚本
# 文件: scripts/log_analysis.sh

LOG_DIR="/opt/blog-system/logs"
REPORT_DIR="/opt/blog-system/reports"
DATE=$(date +"%Y%m%d")

# 创建报告目录
mkdir -p $REPORT_DIR

# 分析应用日志
echo "=== 应用日志分析 ===" > "$REPORT_DIR/log_analysis_$DATE.txt"
echo "日期: $(date)" >> "$REPORT_DIR/log_analysis_$DATE.txt"
echo "" >> "$REPORT_DIR/log_analysis_$DATE.txt"

# 错误统计
echo "错误统计:" >> "$REPORT_DIR/log_analysis_$DATE.txt"
grep -i "error\|fail\|exception" $LOG_DIR/*.log | wc -l >> "$REPORT_DIR/log_analysis_$DATE.txt"
echo "" >> "$REPORT_DIR/log_analysis_$DATE.txt"

# 访问统计
echo "API访问统计:" >> "$REPORT_DIR/log_analysis_$DATE.txt"
grep "GET\|POST\|PUT\|DELETE" $LOG_DIR/*.log | awk '{print $7}' | sort | uniq -c | sort -nr >> "$REPORT_DIR/log_analysis_$DATE.txt"
echo "" >> "$REPORT_DIR/log_analysis_$DATE.txt"

# 响应时间统计
echo "响应时间统计:" >> "$REPORT_DIR/log_analysis_$DATE.txt"
grep "response_time" $LOG_DIR/*.log | awk '{print $NF}' | sort -n | tail -10 >> "$REPORT_DIR/log_analysis_$DATE.txt"

echo "日志分析完成，报告保存在: $REPORT_DIR/log_analysis_$DATE.txt"
