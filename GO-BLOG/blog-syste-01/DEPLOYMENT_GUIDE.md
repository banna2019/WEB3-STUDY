# 项目环境部署步骤总结

## 📋 部署概览

本项目支持多种环境部署方式，包括开发环境、测试环境、生产环境等。本文档总结了所有部署步骤和配置要点。

## 🚀 快速部署指南

### 开发环境 (5分钟)
```bash
# 1. 克隆项目
git clone <repository-url>
cd blog-system

# 2. 安装依赖
go mod tidy

# 3. 配置环境
cp env.example .env
# 编辑.env文件

# 4. 启动MySQL
sudo systemctl start mysql

# 5. 运行项目
go run main.go
```

### Docker环境 (3分钟)
```bash
# 1. 启动服务
docker-compose up -d

# 2. 查看状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f
```

### 生产环境 (30分钟)
```bash
# 1. 服务器准备
sudo apt update && sudo apt upgrade -y
sudo apt install -y mysql-server mysql-client

# 2. 部署应用
git clone <repository-url>
cd blog-system
go mod tidy
go build -o blog-system main.go

# 3. 配置服务
sudo systemctl enable blog-system
sudo systemctl start blog-system
```

## 🔧 环境配置对比

| 环境 | 数据库 | 端口 | 日志级别 | 特点 |
|------|--------|------|----------|------|
| 开发 | MySQL本地 | 8080 | info | 详细日志，热重载 |
| 测试 | MySQL容器 | 8081 | debug | 独立环境，自动化测试 |
| 生产 | MySQL优化 | 8080 | warn | 性能优化，安全加固 |

## 📁 配置文件说明

### .env 开发环境
```bash
APP_ENV=development
DB_HOST=localhost
DB_PORT=3306
LOG_LEVEL=info
```

### .env.production 生产环境
```bash
APP_ENV=production
DB_HOST=localhost
DB_PORT=3306
LOG_LEVEL=warn
JWT_SECRET=<强密钥>
```

## 🐳 Docker配置

### docker-compose.yml 开发环境
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
  
  blog-system:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - mysql
```

### docker-compose.prod.yml 生产环境
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    restart: unless-stopped
    volumes:
      - mysql_data:/var/lib/mysql
  
  blog-system:
    build: .
    restart: unless-stopped
    environment:
      - APP_ENV=production
```

## 🔒 安全配置

### 防火墙设置
```bash
# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3306  # 禁止外部访问MySQL
```

### SSL证书配置
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

## 📊 监控配置

### 系统监控
```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 配置监控脚本
*/5 * * * * root /opt/blog-system/scripts/monitor.sh
```

### 日志轮转
```bash
# 配置logrotate
/opt/blog-system/logs/*.log {
    daily
    rotate 30
    compress
}
```

## 💾 备份策略

### 数据库备份
```bash
# 每日备份
0 2 * * * /opt/blog-system/scripts/backup.sh

# 备份脚本
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_$(date +%Y%m%d).sql
```

### 应用备份
```bash
# 每周备份
0 3 * * 0 /opt/blog-system/scripts/app-backup.sh

# 备份脚本
tar -czf app_backup_$(date +%Y%m%d).tar.gz /opt/blog-system
```

## 🚨 故障处理

### 常见问题
1. **服务无法启动**: 检查端口占用、配置文件
2. **数据库连接失败**: 检查MySQL服务、用户权限
3. **内存不足**: 优化MySQL配置、增加服务器内存
4. **磁盘空间不足**: 清理日志、备份文件

### 性能优化
```bash
# MySQL优化
SET GLOBAL innodb_buffer_pool_size = 1073741824;  # 1GB

# 应用监控
go tool pprof http://localhost:8080/debug/pprof/profile
```

## 📈 扩展部署

### 负载均衡
```nginx
upstream blog_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}
```

### 高可用部署
- 多实例部署
- 数据库主从复制
- 负载均衡器
- 健康检查

## 🔍 部署验证

### 功能验证
```bash
# 健康检查
curl -f http://localhost:8080/api/posts

# API测试
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@example.com"}'
```

### 性能验证
```bash
# 压力测试
ab -n 1000 -c 10 http://localhost:8080/api/posts

# 响应时间
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:8080/api/posts
```

## 📚 相关文档

- [README.md](./README.md) - 项目主文档
- [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - API文档使用指南
- [JWT_SECURITY.md](./JWT_SECURITY.md) - JWT安全最佳实践
- [env.example](./env.example) - 环境变量配置示例

## 🆘 技术支持

如遇到部署问题，请检查：
1. 系统环境要求
2. 配置文件格式
3. 服务状态
4. 日志信息

更多详细信息请参考主README.md文档中的"项目环境部署步骤"章节。
