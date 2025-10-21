# 错误处理API文档

## 概述
错误处理模块提供统一的错误响应格式和HTTP状态码处理。

## 错误响应格式

所有错误响应都遵循统一的格式：

```json
{
  "code": 400,
  "message": "错误描述信息"
}
```

## HTTP状态码说明

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| `200` | 成功 | 请求处理成功 |
| `201` | 创建成功 | 资源创建成功 |
| `400` | 请求错误 | 参数错误、数据验证失败 |
| `401` | 未授权 | 未提供认证信息或认证失败 |
| `403` | 禁止访问 | 无权限执行操作 |
| `404` | 资源不存在 | 请求的资源不存在 |
| `409` | 冲突 | 资源已存在（如重复注册） |
| `500` | 服务器错误 | 内部服务器错误 |

## 常见错误场景

### 1. 用户认证错误

#### 重复用户注册
**请求**: `POST /api/register`
**响应**:
```json
{
  "code": 409,
  "message": "用户名或邮箱已存在"
}
```

#### 无效登录
**请求**: `POST /api/login`
**响应**:
```json
{
  "code": 401,
  "message": "用户名或密码错误"
}
```

#### 缺少认证令牌
**请求**: `POST /api/posts` (无Authorization头)
**响应**:
```json
{
  "code": 401,
  "message": "未提供认证令牌"
}
```

#### 无效认证令牌
**请求**: `POST /api/posts` (无效token)
**响应**:
```json
{
  "code": 401,
  "message": "认证令牌无效"
}
```

### 2. 资源访问错误

#### 文章不存在
**请求**: `GET /api/posts/99999`
**响应**:
```json
{
  "code": 404,
  "message": "文章不存在"
}
```

#### 评论不存在
**请求**: `GET /api/comments/99999`
**响应**:
```json
{
  "code": 404,
  "message": "评论不存在"
}
```

#### 获取不存在文章的评论
**请求**: `GET /api/posts/99999/comments`
**响应**:
```json
{
  "code": 404,
  "message": "文章不存在"
}
```

### 3. 权限错误

#### 无权限更新文章
**请求**: `PUT /api/posts/1` (非作者操作)
**响应**:
```json
{
  "code": 403,
  "message": "无权限操作此文章"
}
```

#### 无权限删除文章
**请求**: `DELETE /api/posts/1` (非作者操作)
**响应**:
```json
{
  "code": 403,
  "message": "无权限操作此文章"
}
```

### 4. 数据验证错误

#### 文章标题过长
**请求**: `POST /api/posts`
**请求体**:
```json
{
  "title": "这是一个超过200个字符的标题..." // 超过200字符
}
**响应**:
```json
{
  "code": 400,
  "message": "请求参数错误: Key: 'PostRequest.Title' Error:Field validation for 'Title' failed on the 'max' tag"
}
```

#### 评论内容为空
**请求**: `POST /api/posts/1/comments`
**请求体**:
```json
{
  "content": ""
}
**响应**:
```json
{
  "code": 400,
  "message": "评论内容不能为空"
}
```

#### 评论内容过长
**请求**: `POST /api/posts/1/comments`
**请求体**:
```json
{
  "content": "这是一个超过1000个字符的评论..." // 超过1000字符
}
**响应**:
```json
{
  "code": 400,
  "message": "评论内容不能超过1000个字符"
}
```

### 5. 服务器错误

#### 数据库连接错误
**响应**:
```json
{
  "code": 500,
  "message": "数据库连接失败"
}
```

#### JWT令牌生成失败
**响应**:
```json
{
  "code": 500,
  "message": "令牌生成失败"
}
```

## 测试脚本

### 验证错误响应格式
```javascript
pm.test("错误响应格式验证", function () {
    if (pm.response.code >= 400) {
        const responseJson = pm.response.json();
        pm.expect(responseJson).to.have.property('code');
        pm.expect(responseJson).to.have.property('message');
        pm.expect(responseJson.code).to.equal(pm.response.code);
    }
});
```

### 验证特定错误码
```javascript
pm.test("验证409冲突错误", function () {
    pm.response.to.have.status(409);
    const responseJson = pm.response.json();
    pm.expect(responseJson.message).to.include("已存在");
});
```

### 验证401未授权错误
```javascript
pm.test("验证401未授权错误", function () {
    pm.response.to.have.status(401);
    const responseJson = pm.response.json();
    pm.expect(responseJson.message).to.include("认证");
});
```

### 验证404资源不存在错误
```javascript
pm.test("验证404资源不存在错误", function () {
    pm.response.to.have.status(404);
    const responseJson = pm.response.json();
    pm.expect(responseJson.message).to.include("不存在");
});
```

### 验证403权限错误
```javascript
pm.test("验证403权限错误", function () {
    pm.response.to.have.status(403);
    const responseJson = pm.response.json();
    pm.expect(responseJson.message).to.include("权限");
});
```

## 错误处理最佳实践

1. **统一错误格式**: 所有错误响应都使用相同的JSON结构
2. **明确的错误信息**: 提供清晰、具体的错误描述
3. **适当的HTTP状态码**: 使用标准的HTTP状态码表示错误类型
4. **日志记录**: 服务器端记录详细的错误日志用于调试
5. **客户端处理**: 客户端根据错误码和消息进行相应的处理

## 调试建议

1. **查看服务器日志**: 检查服务器控制台输出的详细错误信息
2. **使用调试模式**: 确保Gin框架运行在debug模式下
3. **检查环境变量**: 确认所有必要的环境变量已正确设置
4. **验证数据库连接**: 确保数据库服务正常运行
5. **测试网络连接**: 确认客户端能够正常访问服务器
