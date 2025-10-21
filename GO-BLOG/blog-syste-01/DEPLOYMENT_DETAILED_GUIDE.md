# 博客系统项目环境部署详细指南

## 📋 文档概述

本文档提供了博客系统项目的完整部署指南，包括环境准备、数据库初始化、测试数据导入、功能测试等全流程操作步骤。

## 🎯 部署目标

- **开发环境**: 本地开发调试
- **测试环境**: 功能测试验证
- **生产环境**: 正式运行部署

## 📋 目录

1. [环境要求](#1-环境要求)
2. [开发环境部署](#2-开发环境部署)
3. [数据库初始化](#3-数据库初始化)
4. [测试数据导入](#4-测试数据导入)
5. [项目功能测试](#5-项目功能测试)
6. [测试环境部署](#6-测试环境部署)
7. [生产环境部署](#7-生产环境部署)
8. [Docker容器化部署](#8-docker容器化部署)
9. [监控和运维](#9-监控和运维)
10. [故障排查](#10-故障排查)

---

## 1. 环境要求

### 1.1 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| **操作系统** | Linux/macOS/Windows | Ubuntu 20.04+ / CentOS 8+ |
| **内存** | 2GB RAM | 4GB+ RAM |
| **磁盘空间** | 10GB | 50GB+ |
| **CPU** | 2核心 | 4核心+ |

### 1.2 软件要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Go** | 1.21+ | Go语言运行环境 |
| **MySQL** | 8.0+ | 数据库服务器 |
| **Docker** | 20.10+ | 容器化部署(可选) |
| **Git** | 2.0+ | 版本控制 |

### 1.3 网络要求

- **端口**: 8080 (应用服务)
- **端口**: 3306 (MySQL数据库)
- **端口**: 80/443 (Web访问)

---

## 2. 开发环境部署

### 2.1 环境准备

#### 2.1.1 安装Go语言环境

**Ubuntu/Debian系统:**
```bash
# 下载Go安装包
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压到/usr/local目录
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export GOROOT=/usr/local/go' >> ~/.bashrc

# 重新加载环境变量
source ~/.bashrc

# 验证安装
go version
```

**CentOS/RHEL系统:**
```bash
# 下载Go安装包
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压到/usr/local目录
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bash_profile
echo 'export GOPATH=$HOME/go' >> ~/.bash_profile
echo 'export GOROOT=/usr/local/go' >> ~/.bash_profile

# 重新加载环境变量
source ~/.bash_profile

# 验证安装
go version
```

**macOS系统:**
```bash
# 使用Homebrew安装
brew install go

# 验证安装
go version
```

#### 2.1.2 安装MySQL数据库

**Ubuntu/Debian系统:**
```bash
# 更新包列表
sudo apt update

# 安装MySQL服务器
sudo apt install -y mysql-server mysql-client

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

**CentOS/RHEL系统:**
```bash
# 安装MySQL服务器
sudo yum install -y mysql-server mysql

# 启动MySQL服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 获取临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# 安全配置
sudo mysql_secure_installation
```

**macOS系统:**
```bash
# 使用Homebrew安装
brew install mysql

# 启动MySQL服务
brew services start mysql
```

### 2.2 项目部署

#### 2.2.1 获取项目代码

```bash
# 克隆项目仓库
git clone <repository-url>
cd blog-system

# 查看项目结构
ls -la
```

#### 2.2.2 安装项目依赖

```bash
# 初始化Go模块
go mod init blog-system

# 下载依赖包
go mod tidy

# 验证依赖
go mod verify
```

#### 2.2.3 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量配置
vim .env
```

**环境变量配置示例:**
```bash
# 应用配置
APP_NAME=Blog System
APP_VERSION=1.0.0
APP_ENV=development

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=blog_user
DB_PASSWORD=blog_password
DB_NAME=blog_system
DB_CHARSET=utf8mb4
DB_PARSE_TIME=true
DB_LOC=Local

# JWT配置
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE_HOURS=24

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 2.2.4 生成JWT密钥

```bash
# 使用项目提供的脚本生成密钥
chmod +x generate_jwt_secret.sh
./generate_jwt_secret.sh

# 将生成的密钥复制到.env文件中
# 例如: JWT_SECRET=生成的密钥
```

---

## 3. 数据库初始化

### 3.1 创建数据库和用户

#### 3.1.1 连接MySQL

```bash
# 使用root用户连接MySQL
mysql -u root -p

# 输入root密码
```

#### 3.1.2 创建数据库

```sql
-- 创建数据库
CREATE DATABASE blog_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 查看数据库
SHOW DATABASES;

-- 使用数据库
USE blog_system;
```

#### 3.1.3 创建用户和授权

```sql
-- 创建应用用户
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_password';

-- 授权数据库权限
GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'localhost';

-- 创建远程访问用户(如果需要)
CREATE USER 'blog_user'@'%' IDENTIFIED BY 'blog_password';
GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看用户
SELECT User, Host FROM mysql.user WHERE User = 'blog_user';

-- 退出MySQL
EXIT;
```

### 3.2 验证数据库连接

```bash
# 使用应用用户连接数据库
mysql -u blog_user -p blog_system

# 输入密码: blog_password

# 查看数据库
SHOW TABLES;

# 退出
EXIT;
```

### 3.3 数据库表结构初始化

#### 3.3.1 启动应用自动迁移

```bash
# 启动应用(会自动创建表结构)
go run main.go
```

#### 3.3.2 验证表结构

```bash
# 连接数据库查看表结构
mysql -u blog_user -p blog_system

# 查看所有表
SHOW TABLES;

# 查看用户表结构
DESCRIBE users;

# 查看文章表结构
DESCRIBE posts;

# 查看评论表结构
DESCRIBE comments;

# 退出
EXIT;
```

**预期表结构:**

**users表:**
```
+------------+------------------+------+-----+---------+----------------+
| Field      | Type             | Null | Key | Default | Extra          |
+------------+------------------+------+-----+---------+----------------+
| id         | bigint unsigned  | NO   | PRI | NULL    | auto_increment |
| username   | varchar(50)      | NO   | UNI | NULL    |                |
| email      | varchar(100)     | NO   | UNI | NULL    |                |
| password   | varchar(255)     | NO   |     | NULL    |                |
| nickname   | varchar(50)      | YES  |     | NULL    |                |
| avatar     | varchar(255)     | YES  |     | NULL    |                |
| bio        | text             | YES  |     | NULL    |                |
| is_active  | tinyint(1)       | YES  |     | 1       |                |
| post_count | int              | YES  |     | 0       |                |
| created_at | datetime(3)      | YES  |     | NULL    |                |
| updated_at | datetime(3)      | YES  |     | NULL    |                |
| deleted_at | datetime(3)      | YES  | MUL | NULL    |                |
+------------+------------------+------+-----+---------+----------------+
```

**posts表:**
```
+------------+------------------+------+-----+---------+----------------+
| Field      | Type             | Null | Key | Default | Extra          |
+------------+------------------+------+-----+---------+----------------+
| id         | bigint unsigned  | NO   | PRI | NULL    | auto_increment |
| title      | varchar(200)     | NO   |     | NULL    |                |
| content    | longtext         | NO   |     | NULL    |                |
| summary    | varchar(500)     | YES  |     | NULL    |                |
| status     | varchar(20)      | YES  |     | published |              |
| user_id    | bigint unsigned  | NO   | MUL | NULL    |                |
| created_at | datetime(3)      | YES  |     | NULL    |                |
| updated_at | datetime(3)      | YES  |     | NULL    |                |
| deleted_at | datetime(3)      | YES  | MUL | NULL    |                |
+------------+------------------+------+-----+---------+----------------+
```

**comments表:**
```
+------------+------------------+------+-----+---------+----------------+
| Field      | Type             | Null | Key | Default | Extra          |
+------------+------------------+------+-----+---------+----------------+
| id         | bigint unsigned  | NO   | PRI | NULL    | auto_increment |
| content    | text             | NO   |     | NULL    |                |
| user_id    | bigint unsigned  | NO   | MUL | NULL    |                |
| post_id    | bigint unsigned  | NO   | MUL | NULL    |                |
| created_at | datetime(3)      | YES  |     | NULL    |                |
| updated_at | datetime(3)      | YES  |     | NULL    |                |
| deleted_at | datetime(3)      | YES  | MUL | NULL    |                |
+------------+------------------+------+-----+---------+----------------+
```

---

## 4. 测试数据导入

### 4.1 创建测试数据脚本

#### 4.1.1 创建测试数据文件

```bash
# 创建测试数据目录
mkdir -p test_data

# 创建测试数据脚本
vim test_data/insert_test_data.sql
```

#### 4.1.2 测试数据SQL脚本

```sql
-- 测试数据插入脚本
-- 文件: test_data/insert_test_data.sql

USE blog_system;

-- 清空现有数据(可选)
-- DELETE FROM comments;
-- DELETE FROM posts;
-- DELETE FROM users;

-- 插入测试用户数据
INSERT INTO users (username, email, password, nickname, avatar, bio, is_active, post_count, created_at, updated_at) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 'https://via.placeholder.com/150', '系统管理员，负责博客系统维护', 1, 0, NOW(), NOW()),
('alice', 'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '爱丽丝', 'https://via.placeholder.com/150', '热爱写作的技术博主', 1, 0, NOW(), NOW()),
('bob', 'bob@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '鲍勃', 'https://via.placeholder.com/150', '前端开发工程师', 1, 0, NOW(), NOW()),
('charlie', 'charlie@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '查理', 'https://via.placeholder.com/150', '后端开发工程师', 1, 0, NOW(), NOW()),
('diana', 'diana@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '黛安娜', 'https://via.placeholder.com/150', 'UI/UX设计师', 1, 0, NOW(), NOW());

-- 插入测试文章数据
INSERT INTO posts (title, content, summary, status, user_id, created_at, updated_at) VALUES
('Go语言入门指南', 'Go语言是Google开发的一种静态强类型、编译型、并发型，并具有垃圾回收功能的编程语言...', '本文介绍Go语言的基本概念、语法特性和开发环境搭建，适合初学者入门学习。', 'published', 1, NOW(), NOW()),
('Gin框架快速上手', 'Gin是一个用Go语言编写的Web框架，具有高性能、易用性强的特点...', '详细介绍Gin框架的使用方法，包括路由、中间件、参数绑定等核心功能。', 'published', 1, NOW(), NOW()),
('GORM数据库操作详解', 'GORM是Go语言中最受欢迎的ORM库之一，提供了丰富的数据库操作功能...', '全面介绍GORM的使用方法，包括模型定义、CRUD操作、关联查询等。', 'published', 2, NOW(), NOW()),
('JWT认证机制实现', 'JWT(JSON Web Token)是一种用于安全传输信息的开放标准...', '详细介绍JWT的原理和实现方法，包括token生成、验证和刷新机制。', 'published', 2, NOW(), NOW()),
('Docker容器化部署', 'Docker是一个开源的应用容器引擎，让开发者可以打包应用及依赖包到一个可移植的容器中...', '介绍如何使用Docker进行应用容器化部署，包括Dockerfile编写和Docker Compose使用。', 'published', 3, NOW(), NOW()),
('MySQL性能优化技巧', 'MySQL是最流行的开源关系型数据库之一，性能优化是数据库管理的重要方面...', '分享MySQL性能优化的实用技巧，包括索引优化、查询优化、配置调优等。', 'published', 3, NOW(), NOW()),
('RESTful API设计规范', 'RESTful API是一种基于REST架构风格的Web API设计规范...', '详细介绍RESTful API的设计原则和最佳实践，包括URL设计、HTTP方法使用等。', 'published', 4, NOW(), NOW()),
('微服务架构实践', '微服务架构是一种将单一应用程序开发为一组小型服务的方法...', '探讨微服务架构的设计理念和实践方法，包括服务拆分、通信机制、数据管理等。', 'published', 4, NOW(), NOW()),
('前端Vue.js开发指南', 'Vue.js是一套用于构建用户界面的渐进式框架...', '介绍Vue.js的核心概念和开发技巧，包括组件开发、状态管理、路由配置等。', 'published', 5, NOW(), NOW()),
('系统监控与日志管理', '系统监控和日志管理是运维工作的重要组成部分...', '分享系统监控和日志管理的最佳实践，包括监控指标选择、日志收集分析等。', 'published', 5, NOW(), NOW());

-- 插入测试评论数据
INSERT INTO comments (content, user_id, post_id, created_at, updated_at) VALUES
('很好的入门教程，对我帮助很大！', 2, 1, NOW(), NOW()),
('感谢分享，期待更多Go语言相关文章', 3, 1, NOW(), NOW()),
('Gin框架确实很好用，性能也很不错', 4, 2, NOW(), NOW()),
('GORM的关联查询功能很强大', 5, 3, NOW(), NOW()),
('JWT认证实现得很清晰，学习了', 2, 4, NOW(), NOW()),
('Docker部署确实很方便', 3, 5, NOW(), NOW()),
('MySQL优化技巧很实用', 4, 6, NOW(), NOW()),
('RESTful API设计规范总结得很好', 5, 7, NOW(), NOW()),
('微服务架构的实践案例很有价值', 2, 8, NOW(), NOW()),
('Vue.js开发指南很详细', 3, 9, NOW(), NOW()),
('系统监控的重要性不言而喻', 4, 10, NOW(), NOW()),
('日志管理确实需要系统性的方法', 5, 10, NOW(), NOW());

-- 更新用户文章数量统计
UPDATE users SET post_count = (
    SELECT COUNT(*) FROM posts WHERE user_id = users.id AND deleted_at IS NULL
) WHERE id IN (1, 2, 3, 4, 5);

-- 查看插入结果
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Posts' as table_name, COUNT(*) as count FROM posts
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM comments;
```

### 4.2 执行测试数据导入

#### 4.2.1 导入测试数据

```bash
# 执行测试数据导入
mysql -u blog_user -p blog_system < test_data/insert_test_data.sql

# 输入密码: blog_password
```

#### 4.2.2 验证数据导入

```bash
# 连接数据库验证数据
mysql -u blog_user -p blog_system

# 查看用户数据
SELECT id, username, email, nickname, post_count FROM users;

# 查看文章数据
SELECT id, title, summary, user_id, created_at FROM posts ORDER BY created_at DESC;

# 查看评论数据
SELECT id, content, user_id, post_id, created_at FROM comments ORDER BY created_at DESC;

# 查看用户文章数量统计
SELECT u.username, u.post_count, COUNT(p.id) as actual_posts 
FROM users u 
LEFT JOIN posts p ON u.id = p.user_id AND p.deleted_at IS NULL 
GROUP BY u.id, u.username, u.post_count;

# 退出
EXIT;
```

### 4.3 创建测试数据管理脚本

#### 4.3.1 创建数据管理脚本

```bash
# 创建数据管理脚本
vim test_data/manage_test_data.sh
```

#### 4.3.2 数据管理脚本内容

```bash
#!/bin/bash
# 测试数据管理脚本
# 文件: test_data/manage_test_data.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="blog_system"
DB_USER="blog_user"
DB_PASS="blog_password"

# 函数：显示帮助信息
show_help() {
    echo "测试数据管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  import    导入测试数据"
    echo "  export    导出测试数据"
    echo "  clear     清空测试数据"
    echo "  status    查看数据状态"
    echo "  help      显示帮助信息"
    echo ""
}

# 函数：导入测试数据
import_data() {
    echo -e "${YELLOW}正在导入测试数据...${NC}"
    
    if [ ! -f "test_data/insert_test_data.sql" ]; then
        echo -e "${RED}错误: 测试数据文件不存在${NC}"
        exit 1
    fi
    
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < test_data/insert_test_data.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}测试数据导入成功${NC}"
    else
        echo -e "${RED}测试数据导入失败${NC}"
        exit 1
    fi
}

# 函数：导出测试数据
export_data() {
    echo -e "${YELLOW}正在导出测试数据...${NC}"
    
    # 导出用户数据
    mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME users > test_data/users_backup.sql
    
    # 导出文章数据
    mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME posts > test_data/posts_backup.sql
    
    # 导出评论数据
    mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME comments > test_data/comments_backup.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}测试数据导出成功${NC}"
        echo "导出文件:"
        echo "  - test_data/users_backup.sql"
        echo "  - test_data/posts_backup.sql"
        echo "  - test_data/comments_backup.sql"
    else
        echo -e "${RED}测试数据导出失败${NC}"
        exit 1
    fi
}

# 函数：清空测试数据
clear_data() {
    echo -e "${YELLOW}正在清空测试数据...${NC}"
    
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME << EOF
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE comments AUTO_INCREMENT = 1;
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}测试数据清空成功${NC}"
    else
        echo -e "${RED}测试数据清空失败${NC}"
        exit 1
    fi
}

# 函数：查看数据状态
show_status() {
    echo -e "${YELLOW}数据库状态:${NC}"
    
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME << EOF
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Posts' as table_name, COUNT(*) as count FROM posts
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM comments;
EOF
}

# 主程序
case "$1" in
    import)
        import_data
        ;;
    export)
        export_data
        ;;
    clear)
        clear_data
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}错误: 未知选项 '$1'${NC}"
        show_help
        exit 1
        ;;
esac
```

#### 4.3.3 设置脚本权限

```bash
# 设置脚本执行权限
chmod +x test_data/manage_test_data.sh

# 测试脚本
./test_data/manage_test_data.sh help
```

---

## 5. 项目功能测试

### 5.1 启动项目服务

#### 5.1.1 启动应用

```bash
# 启动应用服务
go run main.go

# 预期输出:
# 服务器启动在 0.0.0.0:8080
# Swagger文档地址: http://0.0.0.0:8080/swagger/index.html
```

#### 5.1.2 验证服务启动

```bash
# 检查服务状态
curl -f http://localhost:8080/api/posts

# 预期返回: JSON格式的文章列表
```

### 5.2 API接口测试

#### 5.2.1 创建测试脚本

```bash
# 创建API测试脚本
vim test_data/api_test.sh
```

#### 5.2.2 API测试脚本内容

```bash
#!/bin/bash
# API接口测试脚本
# 文件: test_data/api_test.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API基础URL
BASE_URL="http://localhost:8080/api"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 函数：执行API测试
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}测试: $test_name${NC}"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint")
    fi
    
    # 分离响应体和状态码
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo "响应状态码: $http_code"
    echo "响应内容: $response_body"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 测试通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ 测试失败 (期望: $expected_status, 实际: $http_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "----------------------------------------"
}

# 函数：显示测试结果
show_results() {
    echo -e "${YELLOW}测试结果统计:${NC}"
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}所有测试通过!${NC}"
        exit 0
    else
        echo -e "${RED}有 $FAILED_TESTS 个测试失败${NC}"
        exit 1
    fi
}

# 主测试流程
echo -e "${YELLOW}开始API接口测试...${NC}"
echo "========================================"

# 1. 测试获取文章列表
test_api "GET" "/posts" "" "200" "获取文章列表"

# 2. 测试获取单个文章
test_api "GET" "/posts/1" "" "200" "获取单个文章"

# 3. 测试获取文章评论
test_api "GET" "/posts/1/comments" "" "200" "获取文章评论"

# 4. 测试用户注册
test_api "POST" "/register" '{
    "username": "testuser",
    "password": "testpass123",
    "email": "testuser@example.com"
}' "201" "用户注册"

# 5. 测试用户登录
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin",
        "password": "password"
    }' \
    "$BASE_URL/login")

echo -e "${BLUE}测试: 用户登录${NC}"
echo "请求: POST /login"
echo "响应: $login_response"

# 提取token
token=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✓ 登录成功，获取到token${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ 登录失败，未获取到token${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo "----------------------------------------"

# 6. 测试创建文章(需要认证)
if [ -n "$token" ]; then
    test_api "POST" "/posts" '{
        "title": "测试文章",
        "content": "这是一篇测试文章的内容",
        "summary": "测试文章摘要"
    }' "201" "创建文章(认证)"
else
    echo -e "${RED}跳过创建文章测试(未获取到token)${NC}"
fi

# 7. 测试创建评论(需要认证)
if [ -n "$token" ]; then
    test_api "POST" "/posts/1/comments" '{
        "content": "这是一条测试评论"
    }' "201" "创建评论(认证)"
else
    echo -e "${RED}跳过创建评论测试(未获取到token)${NC}"
fi

# 显示测试结果
show_results
```

#### 5.2.3 执行API测试

```bash
# 设置脚本执行权限
chmod +x test_data/api_test.sh

# 执行API测试
./test_data/api_test.sh
```

### 5.3 Swagger文档测试

#### 5.3.1 访问Swagger文档

```bash
# 在浏览器中访问Swagger文档
# URL: http://localhost:8080/swagger/index.html
```

#### 5.3.2 Swagger测试步骤

1. **打开Swagger文档页面**
2. **测试用户注册接口**
   - 点击 `POST /api/register`
   - 点击 "Try it out"
   - 输入测试数据:
     ```json
     {
       "username": "swagger_test",
       "password": "testpass123",
       "email": "swagger_test@example.com"
     }
     ```
   - 点击 "Execute"
   - 验证返回状态码为201

3. **测试用户登录接口**
   - 点击 `POST /api/login`
   - 点击 "Try it out"
   - 输入登录数据:
     ```json
     {
       "username": "admin",
       "password": "password"
     }
     ```
   - 点击 "Execute"
   - 复制返回的token

4. **设置认证信息**
   - 点击页面右上角的 "Authorize" 按钮
   - 在弹出框中输入: `Bearer <复制的token>`
   - 点击 "Authorize"

5. **测试需要认证的接口**
   - 测试 `POST /api/posts` 创建文章
   - 测试 `POST /api/posts/{id}/comments` 创建评论

### 5.4 数据库功能测试

#### 5.4.1 创建数据库测试脚本

```bash
# 创建数据库测试脚本
vim test_data/database_test.sh
```

#### 5.4.2 数据库测试脚本内容

```bash
#!/bin/bash
# 数据库功能测试脚本
# 文件: test_data/database_test.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="blog_system"
DB_USER="blog_user"
DB_PASS="blog_password"

# 函数：执行SQL查询
execute_sql() {
    local sql=$1
    local description=$2
    
    echo -e "${BLUE}测试: $description${NC}"
    echo "SQL: $sql"
    
    result=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "$sql" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 查询成功${NC}"
        echo "结果:"
        echo "$result"
    else
        echo -e "${RED}✗ 查询失败${NC}"
        echo "错误: $result"
    fi
    
    echo "----------------------------------------"
}

# 主测试流程
echo -e "${YELLOW}开始数据库功能测试...${NC}"
echo "========================================"

# 1. 测试用户表查询
execute_sql "SELECT COUNT(*) as user_count FROM users;" "查询用户总数"

# 2. 测试文章表查询
execute_sql "SELECT COUNT(*) as post_count FROM posts;" "查询文章总数"

# 3. 测试评论表查询
execute_sql "SELECT COUNT(*) as comment_count FROM comments;" "查询评论总数"

# 4. 测试用户文章关联查询
execute_sql "SELECT u.username, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id, u.username;" "用户文章关联查询"

# 5. 测试文章评论关联查询
execute_sql "SELECT p.title, COUNT(c.id) as comment_count FROM posts p LEFT JOIN comments c ON p.id = c.post_id GROUP BY p.id, p.title;" "文章评论关联查询"

# 6. 测试数据完整性
execute_sql "SELECT 'Users with posts' as check_type, COUNT(*) as count FROM users u WHERE EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id) UNION ALL SELECT 'Posts with comments' as check_type, COUNT(*) as count FROM posts p WHERE EXISTS (SELECT 1 FROM comments c WHERE c.post_id = p.id);" "数据完整性检查"

# 7. 测试索引性能
execute_sql "EXPLAIN SELECT * FROM users WHERE username = 'admin';" "用户名索引测试"

# 8. 测试外键约束
execute_sql "SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '$DB_NAME' AND REFERENCED_TABLE_NAME IS NOT NULL;" "外键约束检查"

echo -e "${GREEN}数据库功能测试完成${NC}"
```

#### 5.4.3 执行数据库测试

```bash
# 设置脚本执行权限
chmod +x test_data/database_test.sh

# 执行数据库测试
./test_data/database_test.sh
```

### 5.5 性能测试

#### 5.5.1 安装性能测试工具

```bash
# 安装Apache Bench (ab)
sudo apt install -y apache2-utils

# 验证安装
ab -V
```

#### 5.5.2 创建性能测试脚本

```bash
# 创建性能测试脚本
vim test_data/performance_test.sh
```

#### 5.5.3 性能测试脚本内容

```bash
#!/bin/bash
# 性能测试脚本
# 文件: test_data/performance_test.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试配置
BASE_URL="http://localhost:8080/api"
CONCURRENT_USERS=10
TOTAL_REQUESTS=100

# 函数：执行性能测试
run_performance_test() {
    local endpoint=$1
    local test_name=$2
    local method=$3
    
    echo -e "${BLUE}性能测试: $test_name${NC}"
    echo "端点: $method $endpoint"
    echo "并发用户: $CONCURRENT_USERS"
    echo "总请求数: $TOTAL_REQUESTS"
    
    if [ "$method" = "POST" ]; then
        ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS -p test_data/post_data.json -T application/json "$BASE_URL$endpoint"
    else
        ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS "$BASE_URL$endpoint"
    fi
    
    echo "----------------------------------------"
}

# 创建POST测试数据文件
cat > test_data/post_data.json << EOF
{
    "username": "perf_test",
    "password": "testpass123",
    "email": "perf_test@example.com"
}
EOF

# 主测试流程
echo -e "${YELLOW}开始性能测试...${NC}"
echo "========================================"

# 1. 测试获取文章列表性能
run_performance_test "/posts" "获取文章列表性能测试" "GET"

# 2. 测试获取单个文章性能
run_performance_test "/posts/1" "获取单个文章性能测试" "GET"

# 3. 测试获取文章评论性能
run_performance_test "/posts/1/comments" "获取文章评论性能测试" "GET"

# 4. 测试用户注册性能
run_performance_test "/register" "用户注册性能测试" "POST"

echo -e "${GREEN}性能测试完成${NC}"

# 清理测试数据文件
rm -f test_data/post_data.json
```

#### 5.5.4 执行性能测试

```bash
# 设置脚本执行权限
chmod +x test_data/performance_test.sh

# 执行性能测试
./test_data/performance_test.sh
```

---

## 6. 测试环境部署

### 6.1 Docker测试环境

#### 6.1.1 创建测试环境配置

```bash
# 创建测试环境配置文件
vim docker-compose.test.yml
```

#### 6.1.2 测试环境Docker Compose配置

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  mysql-test:
    image: mysql:8.0
    container_name: blog-mysql-test
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: blog_system_test
      MYSQL_USER: blog_user
      MYSQL_PASSWORD: blog_password
    ports:
      - "3307:3306"
    volumes:
      - mysql_test_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  blog-system-test:
    build: .
    container_name: blog-system-test
    restart: unless-stopped
    ports:
      - "8081:8080"
    environment:
      - SERVER_PORT=8080
      - SERVER_HOST=0.0.0.0
      - DB_HOST=mysql-test
      - DB_PORT=3306
      - DB_USERNAME=blog_user
      - DB_PASSWORD=blog_password
      - DB_NAME=blog_system_test
      - JWT_SECRET=test_secret_key_for_testing_only
      - APP_ENV=testing
      - LOG_LEVEL=debug
    depends_on:
      mysql-test:
        condition: service_healthy
    volumes:
      - .:/app
    command: go run main.go
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/api/posts"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  mysql_test_data:
```

#### 6.1.3 启动测试环境

```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 查看服务状态
docker-compose -f docker-compose.test.yml ps

# 查看日志
docker-compose -f docker-compose.test.yml logs -f blog-system-test
```

#### 6.1.4 测试环境验证

```bash
# 测试API接口
curl http://localhost:8081/api/posts

# 访问Swagger文档
# URL: http://localhost:8081/swagger/index.html
```

### 6.2 自动化测试

#### 6.2.1 创建自动化测试脚本

```bash
# 创建自动化测试脚本
vim test_data/automated_test.sh
```

#### 6.2.2 自动化测试脚本内容

```bash
#!/bin/bash
# 自动化测试脚本
# 文件: test_data/automated_test.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试配置
TEST_URL="http://localhost:8081/api"
TEST_RESULTS_DIR="test_results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建测试结果目录
mkdir -p $TEST_RESULTS_DIR

# 函数：记录测试结果
log_test_result() {
    local test_name=$1
    local status=$2
    local details=$3
    
    echo "[$TIMESTAMP] $test_name: $status" >> "$TEST_RESULTS_DIR/test_results_$TIMESTAMP.log"
    if [ -n "$details" ]; then
        echo "Details: $details" >> "$TEST_RESULTS_DIR/test_results_$TIMESTAMP.log"
    fi
}

# 函数：执行API测试
test_api_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    echo -e "${BLUE}执行测试: $test_name${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$TEST_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$TEST_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 测试通过${NC}"
        log_test_result "$test_name" "PASS" "Status: $http_code"
    else
        echo -e "${RED}✗ 测试失败${NC}"
        log_test_result "$test_name" "FAIL" "Expected: $expected_status, Actual: $http_code, Response: $response_body"
    fi
}

# 主测试流程
echo -e "${YELLOW}开始自动化测试...${NC}"
echo "测试时间: $TIMESTAMP"
echo "测试URL: $TEST_URL"
echo "========================================"

# 1. 基础功能测试
test_api_endpoint "GET" "/posts" "" "200" "获取文章列表"
test_api_endpoint "GET" "/posts/1" "" "200" "获取单个文章"
test_api_endpoint "GET" "/posts/1/comments" "" "200" "获取文章评论"

# 2. 用户功能测试
test_api_endpoint "POST" "/register" '{
    "username": "autotest_user",
    "password": "testpass123",
    "email": "autotest@example.com"
}' "201" "用户注册"

# 3. 认证功能测试
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin",
        "password": "password"
    }' \
    "$TEST_URL/login")

token=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✓ 登录成功${NC}"
    log_test_result "用户登录" "PASS" "Token获取成功"
    
    # 4. 认证接口测试
    test_api_endpoint "POST" "/posts" '{
        "title": "自动化测试文章",
        "content": "这是自动化测试创建的文章",
        "summary": "自动化测试摘要"
    }' "201" "创建文章(认证)"
    
    test_api_endpoint "POST" "/posts/1/comments" '{
        "content": "自动化测试评论"
    }' "201" "创建评论(认证)"
else
    echo -e "${RED}✗ 登录失败${NC}"
    log_test_result "用户登录" "FAIL" "Token获取失败"
fi

# 5. 错误处理测试
test_api_endpoint "GET" "/posts/99999" "" "404" "获取不存在的文章"
test_api_endpoint "POST" "/register" '{
    "username": "",
    "password": "",
    "email": ""
}' "400" "无效注册数据"

echo -e "${GREEN}自动化测试完成${NC}"
echo "测试结果保存在: $TEST_RESULTS_DIR/test_results_$TIMESTAMP.log"
```

#### 6.2.3 执行自动化测试

```bash
# 设置脚本执行权限
chmod +x test_data/automated_test.sh

# 执行自动化测试
./test_data/automated_test.sh
```

---

## 7. 生产环境部署

### 7.1 服务器环境准备

#### 7.1.1 系统更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim htop iotop nethogs

# 配置时区
sudo timedatectl set-timezone Asia/Shanghai
```

#### 7.1.2 创建应用用户

```bash
# 创建应用用户
sudo useradd -m -s /bin/bash blogapp

# 设置用户组
sudo usermod -aG sudo blogapp

# 设置密码
sudo passwd blogapp

# 切换到应用用户
sudo su - blogapp
```

#### 7.1.3 安装Go环境

```bash
# 下载Go安装包
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压到/usr/local目录
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export GOROOT=/usr/local/go' >> ~/.bashrc

# 重新加载环境变量
source ~/.bashrc

# 验证安装
go version
```

#### 7.1.4 安装MySQL

```bash
# 安装MySQL服务器
sudo apt install -y mysql-server mysql-client

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 7.2 应用部署

#### 7.2.1 部署应用代码

```bash
# 创建应用目录
sudo mkdir -p /opt/blog-system
sudo chown blogapp:blogapp /opt/blog-system

# 切换到应用目录
cd /opt/blog-system

# 克隆项目代码
git clone <repository-url> .

# 安装依赖
go mod tidy

# 编译应用
go build -o blog-system main.go
```

#### 7.2.2 配置生产环境

```bash
# 创建生产环境配置
cp env.example .env.production

# 编辑生产环境配置
vim .env.production
```

**生产环境配置示例:**
```bash
# 应用配置
APP_NAME=Blog System
APP_VERSION=1.0.0
APP_ENV=production

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=blog_user
DB_PASSWORD=<强密码>
DB_NAME=blog_system
DB_CHARSET=utf8mb4
DB_PARSE_TIME=true
DB_LOC=Local

# JWT配置
JWT_SECRET=<生成的强密钥>
JWT_EXPIRE_HOURS=24

# 日志配置
LOG_LEVEL=warn
LOG_FORMAT=json
```

#### 7.2.3 配置数据库

```bash
# 连接MySQL
mysql -u root -p

# 创建生产数据库
CREATE DATABASE blog_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建应用用户
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY '<强密码>';
GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'localhost';

# 刷新权限
FLUSH PRIVILEGES;

# 退出
EXIT;
```

#### 7.2.4 配置系统服务

```bash
# 创建systemd服务文件
sudo vim /etc/systemd/system/blog-system.service
```

**服务配置文件内容:**
```ini
[Unit]
Description=Blog System API Server
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=blogapp
Group=blogapp
WorkingDirectory=/opt/blog-system
ExecStart=/opt/blog-system/blog-system
Restart=always
RestartSec=5
Environment=GIN_MODE=release

# 环境变量
EnvironmentFile=/opt/blog-system/.env.production

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=blog-system

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/blog-system

[Install]
WantedBy=multi-user.target
```

#### 7.2.5 启动服务

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable blog-system

# 启动服务
sudo systemctl start blog-system

# 检查服务状态
sudo systemctl status blog-system

# 查看服务日志
sudo journalctl -u blog-system -f
```

### 7.3 反向代理配置

#### 7.3.1 安装Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动Nginx服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 7.3.2 配置Nginx

```bash
# 创建Nginx配置文件
sudo vim /etc/nginx/sites-available/blog-system
```

**Nginx配置文件内容:**
```nginx
upstream blog_backend {
    server 127.0.0.1:8080;
    # 可以添加更多后端服务器实现负载均衡
    # server 127.0.0.1:8081;
    # server 127.0.0.1:8082;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 日志配置
    access_log /var/log/nginx/blog-system.access.log;
    error_log /var/log/nginx/blog-system.error.log;

    # 客户端最大请求体大小
    client_max_body_size 10M;

    # API代理
    location /api/ {
        proxy_pass http://blog_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Swagger文档代理
    location /swagger/ {
        proxy_pass http://blog_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://blog_backend/api/posts;
        proxy_set_header Host $host;
        access_log off;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log|sql)$ {
        deny all;
    }
}
```

#### 7.3.3 启用站点

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/blog-system /etc/nginx/sites-enabled/

# 删除默认站点
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 重新加载Nginx配置
sudo systemctl reload nginx
```

### 7.4 SSL证书配置

#### 7.4.1 安装Certbot

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

#### 7.4.2 配置自动续期

```bash
# 添加定时任务
sudo crontab -e

# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 8. Docker容器化部署

### 8.1 Docker生产配置

#### 8.1.1 创建生产环境Docker Compose配置

```bash
# 创建生产环境配置文件
vim docker-compose.prod.yml
```

#### 8.1.2 生产环境Docker Compose配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: blog-mysql-prod
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_prod_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./mysql.cnf:/etc/mysql/conf.d/custom.cnf
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - blog_network

  blog-system:
    build: .
    container_name: blog-system-prod
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
      - SERVER_HOST=0.0.0.0
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - APP_ENV=production
      - LOG_LEVEL=warn
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/api/posts"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - blog_network
    volumes:
      - ./logs:/app/logs

  nginx:
    image: nginx:alpine
    container_name: blog-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - blog-system
    networks:
      - blog_network

volumes:
  mysql_prod_data:

networks:
  blog_network:
    driver: bridge
```

#### 8.1.3 MySQL优化配置

```bash
# 创建MySQL配置文件
vim mysql.cnf
```

**MySQL配置文件内容:**
```ini
[mysqld]
# 基础配置
default-storage-engine=InnoDB
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 性能优化
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
innodb_log_buffer_size=16M
innodb_flush_log_at_trx_commit=2
innodb_file_per_table=1

# 连接配置
max_connections=200
max_connect_errors=1000
wait_timeout=28800
interactive_timeout=28800

# 查询缓存
query_cache_type=1
query_cache_size=64M
query_cache_limit=2M

# 慢查询日志
slow_query_log=1
slow_query_log_file=/var/lib/mysql/slow.log
long_query_time=2

# 二进制日志
log-bin=mysql-bin
binlog_format=ROW
expire_logs_days=7

[mysql]
default-character-set=utf8mb4

[client]
default-character-set=utf8mb4
```

#### 8.1.4 Nginx配置文件

```bash
# 创建Nginx配置文件
vim nginx.conf
```

**Nginx配置文件内容:**
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    # 基础配置
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 上游服务器
    upstream blog_backend {
        server blog-system:8080;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # 日志
        access_log /var/log/nginx/access.log main;
        error_log /var/log/nginx/error.log;

        # API代理
        location /api/ {
            proxy_pass http://blog_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Swagger文档
        location /swagger/ {
            proxy_pass http://blog_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 8.2 Docker部署流程

#### 8.2.1 准备环境变量

```bash
# 创建生产环境变量文件
vim .env.production
```

**生产环境变量内容:**
```bash
# 数据库配置
DB_ROOT_PASSWORD=<强密码>
DB_NAME=blog_system
DB_USERNAME=blog_user
DB_PASSWORD=<强密码>

# JWT配置
JWT_SECRET=<生成的强密钥>

# 域名配置
DOMAIN=your-domain.com
```

#### 8.2.2 构建和启动

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

#### 8.2.3 数据初始化

```bash
# 等待MySQL启动
sleep 30

# 导入初始数据
docker exec blog-mysql-prod mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < init.sql

# 导入测试数据
docker exec blog-mysql-prod mysql -u ${DB_USERNAME} -p${DB_PASSWORD} ${DB_NAME} < test_data/insert_test_data.sql
```

---

## 9. 监控和运维

### 9.1 日志管理

#### 9.1.1 配置日志轮转

```bash
# 创建日志轮转配置
sudo vim /etc/logrotate.d/blog-system
```

**日志轮转配置内容:**
```
/opt/blog-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 blogapp blogapp
    postrotate
        systemctl reload blog-system
    endscript
}

/var/log/nginx/blog-system.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

#### 9.1.2 创建日志分析脚本

```bash
# 创建日志分析脚本
vim scripts/log_analysis.sh
```

**日志分析脚本内容:**
```bash
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
```

### 9.2 系统监控

#### 9.2.1 创建监控脚本

```bash
# 创建监控脚本
vim scripts/system_monitor.sh
```

**系统监控脚本内容:**
```bash
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
```

#### 9.2.2 设置定时监控

```bash
# 设置定时任务
crontab -e

# 添加以下行
*/5 * * * * /opt/blog-system/scripts/system_monitor.sh
0 0 * * * /opt/blog-system/scripts/log_analysis.sh
```

### 9.3 备份策略

#### 9.3.1 创建备份脚本

```bash
# 创建备份脚本
vim scripts/backup.sh
```

**备份脚本内容:**
```bash
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
```

#### 9.3.2 设置定时备份

```bash
# 设置定时任务
crontab -e

# 添加以下行
0 2 * * * /opt/blog-system/scripts/backup.sh
```

---

## 10. 故障排查

### 10.1 常见问题诊断

#### 10.1.1 服务无法启动

**问题症状:**
- 服务状态显示为failed
- 无法访问API接口

**诊断步骤:**
```bash
# 1. 检查服务状态
sudo systemctl status blog-system

# 2. 查看服务日志
sudo journalctl -u blog-system -f

# 3. 检查端口占用
sudo netstat -tlnp | grep :8080
sudo lsof -i :8080

# 4. 检查配置文件
cat /opt/blog-system/.env.production

# 5. 检查应用文件权限
ls -la /opt/blog-system/blog-system
```

**解决方案:**
```bash
# 1. 修复权限问题
sudo chown blogapp:blogapp /opt/blog-system/blog-system
sudo chmod +x /opt/blog-system/blog-system

# 2. 重新启动服务
sudo systemctl restart blog-system

# 3. 检查服务状态
sudo systemctl status blog-system
```

#### 10.1.2 数据库连接失败

**问题症状:**
- 应用日志显示数据库连接错误
- API返回500错误

**诊断步骤:**
```bash
# 1. 检查MySQL服务状态
sudo systemctl status mysql

# 2. 测试数据库连接
mysql -u blog_user -p blog_system

# 3. 检查数据库用户权限
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'blog_user';"

# 4. 检查数据库配置
cat /opt/blog-system/.env.production | grep DB_
```

**解决方案:**
```bash
# 1. 重启MySQL服务
sudo systemctl restart mysql

# 2. 重新创建数据库用户
mysql -u root -p << EOF
DROP USER IF EXISTS 'blog_user'@'localhost';
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_password';
GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. 重启应用服务
sudo systemctl restart blog-system
```

#### 10.1.3 性能问题

**问题症状:**
- API响应时间过长
- 系统资源使用率高

**诊断步骤:**
```bash
# 1. 检查系统资源使用
htop
free -h
df -h

# 2. 检查MySQL性能
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# 3. 检查应用性能
go tool pprof http://localhost:8080/debug/pprof/profile

# 4. 检查网络连接
netstat -an | grep :8080 | wc -l
```

**解决方案:**
```bash
# 1. 优化MySQL配置
mysql -u root -p << EOF
SET GLOBAL innodb_buffer_pool_size = 1073741824;
SET GLOBAL max_connections = 200;
EOF

# 2. 重启服务
sudo systemctl restart mysql
sudo systemctl restart blog-system

# 3. 清理系统资源
sudo apt autoremove -y
sudo apt autoclean
```

### 10.2 日志分析

#### 10.2.1 应用日志分析

```bash
# 查看错误日志
grep -i "error\|fail\|exception" /opt/blog-system/logs/*.log

# 查看访问日志
grep "GET\|POST\|PUT\|DELETE" /opt/blog-system/logs/*.log | tail -100

# 查看响应时间
grep "response_time" /opt/blog-system/logs/*.log | tail -20
```

#### 10.2.2 系统日志分析

```bash
# 查看系统日志
sudo journalctl -u blog-system --since "1 hour ago"

# 查看MySQL日志
sudo tail -f /var/log/mysql/error.log

# 查看Nginx日志
sudo tail -f /var/log/nginx/blog-system.error.log
```

### 10.3 性能优化

#### 10.3.1 数据库优化

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 优化查询
EXPLAIN SELECT * FROM posts WHERE user_id = 1;
CREATE INDEX idx_user_id ON posts(user_id);

-- 查看表状态
SHOW TABLE STATUS LIKE 'posts';
```

#### 10.3.2 应用优化

```bash
# 启用Go性能分析
go tool pprof http://localhost:8080/debug/pprof/profile

# 内存分析
go tool pprof http://localhost:8080/debug/pprof/heap

# 协程分析
go tool pprof http://localhost:8080/debug/pprof/goroutine
```

---

## 📋 部署检查清单

### ✅ 环境准备
- [ ] 系统更新完成
- [ ] Go环境安装完成
- [ ] MySQL安装配置完成
- [ ] 应用用户创建完成

### ✅ 应用部署
- [ ] 项目代码克隆完成
- [ ] 依赖包安装完成
- [ ] 环境变量配置完成
- [ ] JWT密钥生成完成
- [ ] 应用编译完成

### ✅ 数据库配置
- [ ] 数据库创建完成
- [ ] 用户创建授权完成
- [ ] 表结构初始化完成
- [ ] 测试数据导入完成

### ✅ 服务配置
- [ ] systemd服务配置完成
- [ ] 服务启动成功
- [ ] 服务自启动配置完成

### ✅ 反向代理
- [ ] Nginx安装配置完成
- [ ] 站点配置完成
- [ ] SSL证书配置完成

### ✅ 监控运维
- [ ] 日志轮转配置完成
- [ ] 监控脚本配置完成
- [ ] 备份策略配置完成
- [ ] 定时任务配置完成

### ✅ 功能测试
- [ ] API接口测试通过
- [ ] Swagger文档访问正常
- [ ] 数据库功能测试通过
- [ ] 性能测试通过

---

## 📞 技术支持

### 联系方式
- **邮箱**: support@example.com
- **文档**: [项目文档链接]
- **Issues**: [GitHub Issues链接]

### 常见问题
1. **Q: 服务启动失败怎么办？**
   A: 检查日志文件，确认配置正确，检查端口占用情况

2. **Q: 数据库连接失败怎么办？**
   A: 检查MySQL服务状态，确认用户权限，验证连接参数

3. **Q: API响应慢怎么办？**
   A: 检查系统资源使用，优化数据库查询，调整应用配置

4. **Q: 如何备份数据？**
   A: 使用提供的备份脚本，设置定时任务自动备份

### 更新日志
- **v1.0.0**: 初始版本发布
- **v1.1.0**: 添加Docker支持
- **v1.2.0**: 添加监控功能
- **v1.3.0**: 添加备份功能

---

**文档版本**: v1.0.0  
**最后更新**: 2024年10月  
**维护者**: 开发团队
