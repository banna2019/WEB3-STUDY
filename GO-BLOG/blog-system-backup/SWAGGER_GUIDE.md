# Swagger API文档使用说明

## 📖 概述

本项目集成了Swagger API文档，提供了完整的API接口文档和在线测试功能。

## 🚀 快速开始

### 1. 启动服务
```bash
go run main.go
```

### 2. 访问Swagger文档
打开浏览器访问: `http://localhost:8080/swagger/index.html`

## 🔧 Swagger功能特性

### ✅ 在线测试
- 直接在浏览器中测试API接口
- 无需安装额外工具
- 实时查看请求和响应

### ✅ 参数验证
- 自动验证请求参数格式
- 显示必填和可选参数
- 提供参数类型和示例

### ✅ 认证支持
- 支持JWT Bearer Token认证
- 一键设置认证信息
- 自动在请求头中添加认证信息

### ✅ 响应示例
- 提供完整的请求和响应示例
- 显示所有可能的响应状态码
- 包含错误信息说明

### ✅ 接口分组
- 按功能模块分组显示接口
- 用户管理、文章管理、评论管理
- 清晰的接口分类

## 📋 接口分组

### 👤 用户管理
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录

### 📝 文章管理
- `GET /api/posts` - 获取所有文章
- `GET /api/posts/{id}` - 获取单个文章
- `POST /api/posts` - 创建文章 (需要认证)
- `PUT /api/posts/{id}` - 更新文章 (需要认证)
- `DELETE /api/posts/{id}` - 删除文章 (需要认证)

### 💬 评论管理
- `GET /api/posts/{id}/comments` - 获取文章评论
- `POST /api/posts/{id}/comments` - 创建评论 (需要认证)

## 🔐 认证使用

### 1. 获取JWT Token
1. 使用 `POST /api/login` 接口登录
2. 复制响应中的 `token` 字段

### 2. 设置认证
1. 点击Swagger页面右上角的 "Authorize" 按钮
2. 在弹出框中输入: `Bearer {your_token}`
3. 点击 "Authorize" 确认

### 3. 测试需要认证的接口
- 设置认证后，所有需要认证的接口都会自动在请求头中添加 `Authorization: Bearer {token}`

## 📝 测试流程

### 完整测试流程
1. **注册用户**
   - 使用 `POST /api/register` 接口
   - 填写用户名、密码、邮箱

2. **用户登录**
   - 使用 `POST /api/login` 接口
   - 复制返回的token

3. **设置认证**
   - 点击 "Authorize" 按钮
   - 输入 `Bearer {token}`

4. **创建文章**
   - 使用 `POST /api/posts` 接口
   - 填写文章标题和内容

5. **获取文章列表**
   - 使用 `GET /api/posts` 接口
   - 查看创建的文章

6. **创建评论**
   - 使用 `POST /api/posts/{id}/comments` 接口
   - 填写评论内容

7. **查看评论**
   - 使用 `GET /api/posts/{id}/comments` 接口
   - 查看文章的评论

## 🛠️ 开发说明

### 生成Swagger文档
```bash
# 安装swag工具
go install github.com/swaggo/swag/cmd/swag@latest

# 生成文档
swag init

# 重新生成文档(修改注释后)
swag init -g main.go
```

### Swagger注释格式
```go
// @Summary 接口摘要
// @Description 接口详细描述
// @Tags 接口分组
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "参数描述"
// @Param request body models.Request true "请求体"
// @Success 200 {object} models.Response "成功响应"
// @Failure 400 {object} models.Response "错误响应"
// @Router /api/endpoint [method]
func Handler(c *gin.Context) {
    // 处理逻辑
}
```

## 📁 文件结构

```
docs/
├── docs.go        # Swagger文档生成文件
├── swagger.json   # Swagger JSON格式文档
└── swagger.yaml   # Swagger YAML格式文档
```

## 🔄 更新文档

当修改API接口或添加新接口时，需要重新生成Swagger文档：

```bash
# 重新生成文档
swag init

# 重启服务
go run main.go
```

## 💡 最佳实践

1. **保持注释更新**: 修改接口时及时更新Swagger注释
2. **提供示例**: 为复杂参数提供示例值
3. **错误码说明**: 详细说明各种错误情况
4. **版本管理**: 使用版本号管理API变更
5. **测试覆盖**: 确保所有接口都有对应的测试用例

## 🐛 常见问题

### Q: Swagger页面无法访问
A: 确保服务已启动，检查端口是否正确

### Q: 认证失败
A: 检查token格式是否正确，确保包含 "Bearer " 前缀

### Q: 文档不更新
A: 重新运行 `swag init` 命令生成文档

### Q: 参数验证失败
A: 检查请求参数格式是否符合接口定义
