# 评论功能API文档

## 概述
评论功能模块提供评论的创建、读取功能。

## 接口列表

### 1. 获取文章评论

**接口地址**: `GET {{base_url}}/api/posts/{id}/comments`

**路径参数**:
- `id`: 文章ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取评论列表成功",
  "data": [
    {
      "id": 1,
      "content": "这是一条测试评论",
      "post_id": 1,
      "author_id": 1,
      "author": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com"
      },
      "created_at": "2024-10-21T10:00:00Z",
      "updated_at": "2024-10-21T10:00:00Z"
    }
  ]
}
```

**状态码**:
- `200`: 获取成功
- `404`: 文章不存在

### 2. 获取单个评论

**接口地址**: `GET {{base_url}}/api/comments/{id}`

**路径参数**:
- `id`: 评论ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取评论成功",
  "data": {
    "id": 1,
    "content": "这是一条测试评论",
    "post_id": 1,
    "author_id": 1,
    "author": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    },
    "created_at": "2024-10-21T10:00:00Z",
    "updated_at": "2024-10-21T10:00:00Z"
  }
}
```

**状态码**:
- `200`: 获取成功
- `404`: 评论不存在

### 3. 创建评论

**接口地址**: `POST {{base_url}}/api/posts/{id}/comments`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**路径参数**:
- `id`: 文章ID

**请求体**:
```json
{
  "content": "这是一条测试评论"
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "评论创建成功",
  "data": {
    "id": 1,
    "content": "这是一条测试评论",
    "post_id": 1,
    "author_id": 1,
    "created_at": "2024-10-21T10:00:00Z",
    "updated_at": "2024-10-21T10:00:00Z"
  }
}
```

**状态码**:
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `404`: 文章不存在

## 特殊字符处理

评论内容支持以下特殊字符：
- HTML标签: `<p>`, `<br>`, `<strong>`, `<em>`
- 特殊符号: `@`, `#`, `$`, `%`, `&`, `*`
- Unicode字符: `中文`, `日本語`, `한국어`
- 换行符: `\n`, `\r\n`

### 特殊字符测试示例

**HTML标签测试**:
```json
{
  "content": "<p>这是包含HTML标签的评论</p><br><strong>粗体文本</strong>"
}
```

**特殊符号测试**:
```json
{
  "content": "特殊符号测试: @username #hashtag $money %percent &amp; *star"
}
```

**Unicode测试**:
```json
{
  "content": "多语言测试: 中文 English 日本語 한국어 العربية"
}
```

## 测试脚本

### 创建评论后自动保存评论ID
```javascript
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.data && responseJson.data.id) {
        pm.environment.set('comment_id', responseJson.data.id);
        console.log('评论创建成功，评论ID:', responseJson.data.id);
    }
}
```

### 验证评论创建成功
```javascript
pm.test("评论创建成功", function () {
    pm.response.to.have.status(201);
    const responseJson = pm.response.json();
    pm.expect(responseJson.data).to.have.property('id');
    pm.expect(responseJson.data).to.have.property('content');
    pm.expect(responseJson.data).to.have.property('post_id');
});
```

### 验证评论内容长度限制
```javascript
pm.test("评论内容长度验证", function () {
    const responseJson = pm.response.json();
    if (pm.response.code === 400) {
        pm.expect(responseJson.message).to.include("评论内容不能超过1000个字符");
    }
});
```
