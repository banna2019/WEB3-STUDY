## 一、博客系统模块化架构说明

### 1.1.架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        main.go                               │
│                     (程序入口)                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    handlers/                                │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   handlers.go    │  │    routes.go     │                  │
│  │  (业务逻辑处理)   │  │   (路由配置)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   middleware/                               │
│  ┌─────────────────┐                                        │
│  │   common.go      │                                        │
│  │  (通用中间件)     │                                        │
│  └─────────────────┘                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                     auth/                                    │
│  ┌─────────────────┐                                        │
│  │     jwt.go       │                                        │
│  │  (JWT认证)       │                                        │
│  └─────────────────┘                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                    models/                                  │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   structs.go     │  │     crud.go      │                  │
│  │  (数据结构)      │  │  (CRUD操作)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   database/                                  │
│  ┌─────────────────┐                                        │
│  │     init.go      │                                        │
│  │  (数据库连接)     │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

```bash
blog-system/
├── main.go                              # 主程序入口
├── go.mod                               # Go模块依赖管理
├── go.sum                               # 依赖校验文件
├── README.md                            # 项目说明文档
├── Dockerfile                           # Docker容器化配置
├── docker-compose.yml                   # Docker Compose配置
├── .gitignore                           # Git忽略文件配置
├── generate_jwt_secret.sh               # JWT密钥生成脚本
├── env.example                          # 环境变量配置示例
├── init_data_source/                    # 项目原始数据目录
│   ├── init.sql                         # 项目数据库和表SCHEMA
│   └── insert_test_data.sql             # 测试数据插入脚本
├── docs/                               # Swagger API文档
│   ├── docs.go                        # Swagger文档生成文件
│   ├── swagger.json                   # Swagger JSON文档
│   └── swagger.yaml                   # Swagger YAML文档
├── database/                            # 数据库模块
│   └── init.go                          # 数据库初始化和连接管理
├── models/                              # 数据模型模块
│   ├── structs.go                       # 数据结构定义
│   └── crud.go                          # CRUD操作实现
├── auth/                                # 认证模块
│   └── jwt.go                           # JWT认证相关功能
├── middleware/                           # 中间件模块
│   └── common.go                        # 通用中间件
└── handlers/                            # 处理器模块
    ├── handlers.go                       # 业务逻辑处理器
    └── routes.go                        # 路由配置
```



### 1.2.模块职责

#### 1.`main.go` - 程序入口
- 初始化数据库连接
- 执行数据库迁移
- 启动`HTTP`服务器
- 协调各个模块



#### 2.`config`/ - 配置管理模块

- **`config.go`**: 环境变量配置管理
- 支持`.env`文件和环境变量
- 提供数据库、服务器、`JWT`等配置



#### 3.`database`/ - 数据库模块

- **`init.go`**: `MySQL`数据库连接初始化、配置管理
- 提供全局数据库连接实例
- 支持数据库连接池配置



#### 4.`models`/ - 数据模型模块

- **`structs.go`**: 定义所有数据结构(`User`、`Post`、`Comment`)和请求/响应结构体
- **`crud.go`**: 实现所有`CRUD`操作，包括用户、文章、评论的增删改查
- 封装了业务逻辑和数据访问层



#### 5.`auth`/ - 认证模块

- **`jwt.go`**:  `JWT`令牌的生成、解析和验证
- 提供认证中间件和用户信息提取功能
- 支持配置化的`JWT`密钥和过期时间



#### 6.`middleware`/ - 中间件模块

- **`common.go`**: 通用中间件(`CORS`、日志、恢复)
- 可复用的中间件组件
- 统一处理横切关注点



#### 7.`handlers`/ - 处理器模块

- **`handlers.go`**: 业务逻辑处理器，处理`HTTP`请求
- **`routes.go`**: 路由配置和中间件绑定
- 分离了路由配置和业务逻辑



#### 8.`docs`/ - `API`文档模块

- **`docs.go`**: `Swagger`文档生成文件
- **`swagger.json`**: `Swagger JSON`格式文档
- **`swagger.yaml`**: `Swagger YAML`格式文档
- 自动生成的`API`文档，支持在线测试



#### 9.架构优势

- **职责分离**: 每个模块专注于特定功能
- **易于维护**: 模块间低耦合，便于独立修改
- **可扩展性**: 新功能可以独立模块形式添加
- **可测试性**: 每个模块可以独立进行单元测试
- **代码复用**: 模块化设计便于代码复用



### 1.3.数据流向

```
HTTP请求 → handlers → auth(认证) → models → database → SQLite
    ↓
HTTP响应 ← handlers ← models ← database ← SQLite
```



### 1.4.模块间依赖关系

- **`main.go`** 依赖: `database`, `handlers`, `models`
- **`handlers`** 依赖: `auth`, `middleware`, `models`
- **`auth`** 依赖: 无外部依赖
- **`models`** 依赖: `database`
- **`middleware`** 依赖: 无外部依赖
- **`database`** 依赖: 无外部依赖



### 1.5.设计原则

1. **单一职责**: 每个模块只负责一个特定功能
2. **依赖倒置**: 高层模块不依赖低层模块的具体实现
3. **接口隔离**: 模块间通过明确的接口进行交互
4. **开闭原则**: 对扩展开放,对修改封闭
5. **低耦合高内聚**: 模块内部紧密相关,模块间松散耦合



## 二、`JWT`安全最佳实践

### 2.1.`JWT_SECRET`安全要求

#### 1.密钥长度

- **最小长度**: 256位 (32字节)
- **推荐长度**: 512位 (64字节)
- **格式**: `Base64`编码的随机字节



#### 2.生成方法

```bash
# 推荐方法1: OpenSSL
openssl rand -base64 64

# 推荐方法2: 使用项目脚本
./generate_jwt_secret.sh

# 推荐方法3: Go程序
go run -c 'package main; import ("crypto/rand"; "encoding/base64"; "fmt"); func main() { b := make([]byte, 64); rand.Read(b); fmt.Println(base64.URLEncoding.EncodeToString(b)) }'
```



#### 3.安全存储

- 使用环境变量存储
- 不要硬编码在源代码中
- 不要提交到版本控制系统
- 生产环境使用密钥管理服务



#### 4.密钥轮换

- 定期更换`JWT`密钥
- 通知所有客户端更新
- 保留旧密钥一段时间用于验证



#### 5.环境分离

- 开发环境: 使用开发专用密钥
- 测试环境: 使用测试专用密钥
- 生产环境: 使用生产专用密钥



### 2.2.安全警告

#### 不要做的事情

- 使用默认密钥 `your_secret_key_change_in_production`
- 使用简单字符串如 `password`, `123456`
- 将密钥硬编码在代码中
- 将密钥提交到`Git`仓库
- 在日志中输出密钥
- 通过不安全的渠道传输密钥



#### 必须做的事情

- 使用强随机生成的密钥
- 通过环境变量配置
- 定期轮换密钥
- 监控密钥使用情况
- 使用`HTTPS`传输`JWT`令牌
- 设置合理的过期时间



### 2.3.密钥强度检查

#### 检查密钥是否足够强

- **1.长度**: 至少64个字符
- **2.随机性**: 包含大小写字母、数字、特殊字符
- **3.唯一性**: 每个环境使用不同密钥
- **4.保密性**: 只有授权人员知道



#### 示例强密钥

```
JWT_SECRET=SnAmOaj5f5Dyu4kwfHTfRuEfd3HgYJ5hCJihD_3NRO0zoC69S6Zs-QXNu6gG4nrvY0jfST92Td_LJKcI3Cc6kg==
```



### 2.4.示例弱密钥(不要使用)

```bash
JWT_SECRET=password
JWT_SECRET=123456
JWT_SECRET=your_secret_key_change_in_production
```





## 三、`Swagger API`文档使用说明

### 3.1.概述

> 本项目集成了`Swagger API`文档,提供了完整的`API`接口文档和在线测试功能.



### 3.2.快速开始

#### 1.启动服务

```bash
go run main.go
```



#### 2.访问`Swagger`文档

> 打开浏览器访问: `http://localhost:8080/swagger/index.html`



### 3.3.`Swagger`功能特性

#### 在线测试

- 直接在浏览器中测试`API`接口
- 无需安装额外工具
- 实时查看请求和响应



#### 参数验证

- 自动验证请求参数格式
- 显示必填和可选参数
- 提供参数类型和示例



#### 认证支持

- 支持JWT Bearer Token认证
- 一键设置认证信息
- 自动在请求头中添加认证信息



#### 响应示例

- 提供完整的请求和响应示例
- 显示所有可能的响应状态码
- 包含错误信息说明



#### 接口分组

- 按功能模块分组显示接口
- 用户管理、文章管理、评论管理
- 清晰的接口分类



### 3.4.接口分组

#### 用户管理

- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录



#### 文章管理

- `GET /api/posts` - 获取所有文章
- `GET /api/posts/{id}` - 获取单个文章
- `POST /api/posts` - 创建文章 (需要认证)
- `PUT /api/posts/{id}` - 更新文章 (需要认证)
- `DELETE /api/posts/{id}` - 删除文章 (需要认证)



#### 评论管理

- `GET /api/posts/{id}/comments` - 获取文章评论
- `POST /api/posts/{id}/comments` - 创建评论 (需要认证)



### 3.5.认证使用

#### 1.获取`JWT Token`

- 1.使用 `POST /api/login` 接口登录
- 2.复制响应中的 `token` 字段



#### 2.设置认证

- 1.点击`Swagger`页面右上角的"Authorize"按钮
- 2.在弹出框中输入: `Bearer {your_token}`
- 3.点击"Authorize"确认



#### 3.测试需要认证的接口

- 设置认证后,所有需要认证的接口都会自动在请求头中添加 `Authorization: Bearer {token}`



### 3.6.测试流程

#### 完整测试流程

- **1.注册用户**
  - 使用 `POST /api/register` 接口
  - 填写用户名、密码、邮箱



- **2.用户登录**
  - 使用 `POST /api/login` 接口
  - 复制返回的`token`



- **3.设置认证**
  - 点击 "Authorize" 按钮
  - 输入 `Bearer {token}`



- **4.创建文章**
  - 使用 `POST /api/posts` 接口
  - 填写文章标题和内容



- **5.获取文章列表**
  - 使用 `GET /api/posts` 接口
  - 查看创建的文章



- **6.创建评论**
  - 使用 `POST /api/posts/{id}/comments` 接口
  - 填写评论内容



- **7.查看评论**
  - 使用 `GET /api/posts/{id}/comments` 接口
  - 查看文章的评论



### 3.7.开发说明

#### 生成`Swagger`文档

```bash
# 安装swag工具
go install github.com/swaggo/swag/cmd/swag@latest

# 生成文档
swag init

# 重新生成文档(修改注释后)
swag init -g main.go
```



#### `Swagger`注释格式

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



### 3.8.文件结构

```
docs/
├── docs.go        # Swagger文档生成文件
├── swagger.json   # Swagger JSON格式文档
└── swagger.yaml   # Swagger YAML格式文档
```



### 3.9.更新文档

> 当修改`API`接口或添加新接口时,需要重新生成`Swagger`文档

```bash
# 重新生成文档
swag init

# 重启服务
go run main.go
```



### 3.10.最佳实践

- **1.保持注释更新**: 修改接口时及时更新`Swagger`注释
- **2.提供示例**: 为复杂参数提供示例值
- **3.错误码说明**: 详细说明各种错误情况
- **4.版本管理**: 使用版本号管理`API`变更
- **5.测试覆盖**: 确保所有接口都有对应的测试用例

