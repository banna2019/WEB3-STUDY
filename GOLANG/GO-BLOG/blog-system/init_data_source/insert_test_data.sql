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
