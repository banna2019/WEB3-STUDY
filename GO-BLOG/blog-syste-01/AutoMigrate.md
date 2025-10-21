# GORM AutoMigrate 自动数据库迁移说明

## 📋 文档概述

本文档详细说明了博客系统项目中GORM AutoMigrate功能的实现原理、使用方法和注意事项。

## 🎯 核心问题

**问题**: 项目使用 `go run main.go` 运行程序连接数据库后，会自动创建库表结构吗？

**答案**: **是的，项目会自动创建数据库表结构**。

## 🔄 自动迁移流程

### 1. 程序启动流程

```go
func main() {
    // 1. 加载配置
    cfg := config.Load()
    
    // 2. 初始化数据库连接
    database.InitDB(cfg)
    
    // 3. 自动迁移数据库表结构 ⭐
    if err := models.AutoMigrate(database.GetDB()); err != nil {
        log.Fatal("数据库迁移失败:", err)
    }
    
    // 4. 设置路由和启动服务
    // ...
}
```

### 2. AutoMigrate函数实现

```go
// AutoMigrate 自动迁移数据库表结构
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(&User{}, &Post{}, &Comment{})
}
```

### 3. 数据库初始化

```go
// InitDB 初始化数据库连接
func InitDB(cfg *config.Config) {
    var err error

    // 配置GORM日志
    logLevel := logger.Silent
    switch cfg.Log.Level {
    case "info":
        logLevel = logger.Info
    case "warn":
        logLevel = logger.Warn
    case "error":
        logLevel = logger.Error
    }

    gormConfig := &gorm.Config{
        Logger: logger.Default.LogMode(logLevel),
    }

    // 连接MySQL数据库
    DB, err = gorm.Open(mysql.Open(cfg.GetDSN()), gormConfig)
    if err != nil {
        log.Fatal("数据库连接失败:", err)
    }

    // 获取底层的sql.DB对象进行连接池配置
    sqlDB, err := DB.DB()
    if err != nil {
        log.Fatal("获取数据库连接失败:", err)
    }

    // 设置连接池参数
    sqlDB.SetMaxIdleConns(10)   // 设置空闲连接池中连接的最大数量
    sqlDB.SetMaxOpenConns(100)  // 设置打开数据库连接的最大数量
    sqlDB.SetConnMaxLifetime(0) // 设置连接可复用的最大时间

    log.Println("MySQL数据库连接成功")
}
```

## 🗄️ 自动创建的表结构

程序会自动创建以下三个表：

### 1. users表 (用户表)

```sql
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `bio` text,
  `is_active` tinyint(1) DEFAULT '1',
  `post_count` int DEFAULT '0',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_deleted_at` (`deleted_at`)
);
```

**对应Go结构体**:
```go
type User struct {
    ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
    Username  string     `gorm:"unique;not null;size:50;comment:用户名" json:"username"`
    Email     string     `gorm:"unique;not null;size:100;comment:邮箱" json:"email"`
    Password  string     `gorm:"not null;size:255;comment:密码" json:"-"`
    Nickname  string     `gorm:"size:50;comment:昵称" json:"nickname"`
    Avatar    string     `gorm:"size:255;comment:头像URL" json:"avatar"`
    Bio       string     `gorm:"type:text;comment:个人简介" json:"bio"`
    IsActive  bool       `gorm:"default:true;comment:是否激活" json:"is_active"`
    PostCount int        `gorm:"default:0;comment:文章数量统计" json:"post_count"`
    CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
    UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
    DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`
    
    // 一对多关系：一个用户可以发布多篇文章
    Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
}
```

### 2. posts表 (文章表)

```sql
CREATE TABLE `posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` longtext NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'published',
  `user_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_posts_user_id` (`user_id`),
  KEY `idx_posts_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**对应Go结构体**:
```go
type Post struct {
    ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
    Title     string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
    Content   string     `gorm:"not null;type:longtext;comment:文章内容" json:"content"`
    Summary   string     `gorm:"size:500;comment:文章摘要" json:"summary"`
    Status    string     `gorm:"default:published;size:20;comment:文章状态" json:"status"`
    UserID    uint       `gorm:"not null;index;comment:作者ID" json:"user_id"`
    CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
    UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
    DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`
    
    // 多对一关系：多篇文章属于一个用户
    User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
    
    // 一对多关系：一篇文章可以有多个评论
    Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}
```

### 3. comments表 (评论表)

```sql
CREATE TABLE `comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `post_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_user_id` (`user_id`),
  KEY `idx_comments_post_id` (`post_id`),
  KEY `idx_comments_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**对应Go结构体**:
```go
type Comment struct {
    ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
    Content   string     `gorm:"not null;type:text;comment:评论内容" json:"content"`
    UserID    uint       `gorm:"not null;index;comment:评论者ID" json:"user_id"`
    PostID    uint       `gorm:"not null;index;comment:文章ID" json:"post_id"`
    CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
    UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
    DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`
    
    // 多对一关系：多个评论属于一个用户
    User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
    
    // 多对一关系：多个评论属于一篇文章
    Post Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`
}
```

## 🎯 GORM AutoMigrate特性

### 1. 自动创建表
- ✅ 如果表不存在，会自动创建
- ✅ 根据Go结构体定义生成表结构
- ✅ 自动处理字段类型映射

### 2. 自动添加字段
- ✅ 如果结构体新增字段，会自动添加列
- ✅ 不会删除现有列（安全特性）
- ✅ 支持字段类型变更

### 3. 自动创建索引
- ✅ 根据结构体标签自动创建索引
- ✅ 包括主键、唯一索引、普通索引
- ✅ 支持复合索引

### 4. 自动创建外键
- ✅ 根据关联关系自动创建外键约束
- ✅ 支持级联删除等约束
- ✅ 自动处理关联关系

### 5. 软删除支持
- ✅ 自动添加 `deleted_at` 字段
- ✅ 支持软删除功能
- ✅ 自动创建软删除索引

## 📋 使用前提条件

### 1. 数据库必须存在

```sql
-- 需要手动创建数据库
CREATE DATABASE blog_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 数据库用户权限

```sql
-- 需要创建用户并授权
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_password';
GRANT ALL PRIVILEGES ON blog_system.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 环境变量配置

```bash
# .env文件配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=blog_user
DB_PASSWORD=blog_password
DB_NAME=blog_system
DB_CHARSET=utf8mb4
DB_PARSE_TIME=true
DB_LOC=Local
```

## 🚀 验证自动迁移

### 1. 启动程序

```bash
# 进入项目目录
cd blog-system

# 启动程序
go run main.go
```

### 2. 查看日志输出

```
MySQL数据库连接成功
服务器启动在 0.0.0.0:8080
Swagger文档地址: http://0.0.0.0:8080/swagger/index.html
```

### 3. 验证表结构

```bash
# 连接数据库查看表
mysql -u blog_user -p blog_system

# 查看所有表
SHOW TABLES;

# 预期输出:
# +----------------------+
# | Tables_in_blog_system |
# +----------------------+
# | comments             |
# | posts                |
# | users                |
# +----------------------+

# 查看表结构
DESCRIBE users;
DESCRIBE posts;
DESCRIBE comments;
```

### 4. 验证索引和外键

```sql
-- 查看索引
SHOW INDEX FROM users;
SHOW INDEX FROM posts;
SHOW INDEX FROM comments;

-- 查看外键约束
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = 'blog_system' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## ⚠️ 注意事项

### 1. 数据库必须预先创建
- ❌ 程序只会创建表，不会创建数据库
- ✅ 需要手动创建数据库和用户

### 2. 用户权限要足够
- ✅ 需要对指定数据库有CREATE、ALTER权限
- ✅ 需要能够创建索引和外键约束

### 3. 字段类型映射
- ✅ Go类型会自动映射到MySQL类型
- ✅ 支持自定义字段类型和长度

### 4. 索引自动创建
- ✅ 根据结构体标签自动创建索引
- ✅ 支持唯一索引、普通索引、复合索引

### 5. 外键约束
- ✅ 会自动创建外键约束和级联删除
- ✅ 支持多对一、一对多、多对多关系

### 6. 数据安全
- ✅ AutoMigrate不会删除现有列
- ✅ 不会删除现有数据
- ✅ 只添加新字段和索引

## 🔧 高级配置

### 1. 自定义迁移选项

```go
// 可以添加更多配置选项
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &User{}, 
        &Post{}, 
        &Comment{},
    )
}
```

### 2. 条件迁移

```go
// 可以根据环境条件进行迁移
func AutoMigrate(db *gorm.DB) error {
    if os.Getenv("APP_ENV") == "production" {
        // 生产环境特殊处理
        return db.AutoMigrate(&User{}, &Post{}, &Comment{})
    }
    
    // 开发环境
    return db.AutoMigrate(&User{}, &Post{}, &Comment{})
}
```

### 3. 迁移日志

```go
// 添加迁移日志
func AutoMigrate(db *gorm.DB) error {
    log.Println("开始数据库迁移...")
    
    err := db.AutoMigrate(&User{}, &Post{}, &Comment{})
    if err != nil {
        log.Printf("数据库迁移失败: %v", err)
        return err
    }
    
    log.Println("数据库迁移完成")
    return nil
}
```

## 📊 迁移过程示例

### 1. 首次运行

```bash
# 启动程序
go run main.go

# 控制台输出
MySQL数据库连接成功
服务器启动在 0.0.0.0:8080
Swagger文档地址: http://0.0.0.0:8080/swagger/index.html
```

### 2. 数据库变化

```sql
-- 程序运行后，数据库会自动创建以下表：
-- 1. users表
-- 2. posts表  
-- 3. comments表

-- 以及相应的索引和外键约束
```

### 3. 后续运行

```bash
# 再次启动程序
go run main.go

# AutoMigrate会检查表结构
# 如果结构体有变化，会自动更新表结构
# 如果结构体没有变化，不会做任何操作
```

## 🎯 总结

**是的，项目使用 `go run main.go` 运行程序后会自动创建数据库表结构**。

### ✅ 自动完成的功能

- **自动创建表**: 根据Go结构体定义创建MySQL表
- **自动添加字段**: 结构体新增字段时自动添加列
- **自动创建索引**: 根据标签自动创建各种索引
- **自动创建外键**: 根据关联关系自动创建外键约束
- **保持数据安全**: 不会删除现有列和数据

### 📋 需要手动完成的工作

- **创建数据库**: 需要手动创建数据库
- **创建用户**: 需要手动创建数据库用户
- **配置权限**: 需要给用户足够的权限
- **配置环境**: 需要正确配置环境变量

### 🚀 使用步骤

1. **创建数据库和用户**
2. **配置环境变量**
3. **运行程序**: `go run main.go`
4. **验证表结构**: 检查数据库中的表

这样，你就可以专注于业务逻辑开发，而不用担心数据库表结构的创建和维护了！

---

**文档版本**: v1.0.0  
**最后更新**: 2024年10月  
**维护者**: 开发团队
