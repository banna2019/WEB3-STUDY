# JWT安全最佳实践

## 🔐 JWT_SECRET 安全要求

### 1. 密钥长度
- **最小长度**: 256位 (32字节)
- **推荐长度**: 512位 (64字节)
- **格式**: Base64编码的随机字节

### 2. 生成方法
```bash
# 推荐方法1: OpenSSL
openssl rand -base64 64

# 推荐方法2: 使用项目脚本
./generate_jwt_secret.sh

# 推荐方法3: Go程序
go run -c 'package main; import ("crypto/rand"; "encoding/base64"; "fmt"); func main() { b := make([]byte, 64); rand.Read(b); fmt.Println(base64.URLEncoding.EncodeToString(b)) }'
```

### 3. 安全存储
- ✅ 使用环境变量存储
- ✅ 不要硬编码在源代码中
- ✅ 不要提交到版本控制系统
- ✅ 生产环境使用密钥管理服务

### 4. 密钥轮换
- 🔄 定期更换JWT密钥
- 🔄 通知所有客户端更新
- 🔄 保留旧密钥一段时间用于验证

### 5. 环境分离
- 🏠 开发环境: 使用开发专用密钥
- 🧪 测试环境: 使用测试专用密钥
- 🚀 生产环境: 使用生产专用密钥

## ⚠️ 安全警告

### 不要做的事情:
- ❌ 使用默认密钥 `your_secret_key_change_in_production`
- ❌ 使用简单字符串如 `password`, `123456`
- ❌ 将密钥硬编码在代码中
- ❌ 将密钥提交到Git仓库
- ❌ 在日志中输出密钥
- ❌ 通过不安全的渠道传输密钥

### 必须做的事情:
- ✅ 使用强随机生成的密钥
- ✅ 通过环境变量配置
- ✅ 定期轮换密钥
- ✅ 监控密钥使用情况
- ✅ 使用HTTPS传输JWT令牌
- ✅ 设置合理的过期时间

## 🔍 密钥强度检查

### 检查密钥是否足够强:
1. **长度**: 至少64个字符
2. **随机性**: 包含大小写字母、数字、特殊字符
3. **唯一性**: 每个环境使用不同密钥
4. **保密性**: 只有授权人员知道

### 示例强密钥:
```
JWT_SECRET=SnAmOaj5f5Dyu4kwfHTfRuEfd3HgYJ5hCJihD_3NRO0zoC69S6Zs-QXNu6gG4nrvY0jfST92Td_LJKcI3Cc6kg==
```

### 示例弱密钥(不要使用):
```
JWT_SECRET=password
JWT_SECRET=123456
JWT_SECRET=your_secret_key_change_in_production
```
