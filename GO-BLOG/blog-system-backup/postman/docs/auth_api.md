# 用户认证API文档

## 概述
用户认证模块提供用户注册、登录和JWT令牌管理功能。

## 接口列表

### 1. 用户注册

**接口地址**: `POST {{base_url}}/api/register`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "用户注册成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**状态码**:
- `201`: 注册成功
- `400`: 请求参数错误
- `409`: 用户名或邮箱已存在

### 2. 用户登录

**接口地址**: `POST {{base_url}}/api/login`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**状态码**:
- `200`: 登录成功
- `400`: 请求参数错误
- `401`: 用户名或密码错误

## 测试脚本

### 注册后自动保存用户ID
```javascript
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.data && responseJson.data.user_id) {
        pm.environment.set('user_id', responseJson.data.user_id);
        console.log('用户注册成功，用户ID:', responseJson.data.user_id);
    }
}
```

### 登录后自动保存JWT令牌
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    if (responseJson.data && responseJson.data.token) {
        pm.environment.set('jwt_token', responseJson.data.token);
        pm.environment.set('user_id', responseJson.data.user_id);
        console.log('登录成功，Token:', responseJson.data.token);
    }
}
```
