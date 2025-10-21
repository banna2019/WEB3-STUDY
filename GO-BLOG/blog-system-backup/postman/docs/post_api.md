# 文章管理API文档

## 概述
文章管理模块提供文章的创建、读取、更新、删除功能。

## 接口列表

### 1. 获取所有文章

**接口地址**: `GET {{base_url}}/api/posts`

**请求头**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "获取文章列表成功",
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "content": "文章内容",
      "summary": "文章摘要",
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

### 2. 获取单个文章

**接口地址**: `GET {{base_url}}/api/posts/{id}`

**路径参数**:
- `id`: 文章ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取文章成功",
  "data": {
    "id": 1,
    "title": "文章标题",
    "content": "文章内容",
    "summary": "文章摘要",
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
- `404`: 文章不存在

### 3. 创建文章

**接口地址**: `POST {{base_url}}/api/posts`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "title": "我的第一篇文章",
  "content": "这是文章的内容，包含详细的描述信息。",
  "summary": "文章摘要"
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "文章创建成功",
  "data": {
    "id": 1,
    "title": "我的第一篇文章",
    "content": "这是文章的内容，包含详细的描述信息。",
    "summary": "文章摘要",
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

### 4. 更新文章

**接口地址**: `PUT {{base_url}}/api/posts/{id}`

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
  "title": "更新后的文章标题",
  "content": "这是更新后的文章内容。",
  "summary": "更新后的文章摘要"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "文章更新成功",
  "data": {
    "id": 1,
    "title": "更新后的文章标题",
    "content": "这是更新后的文章内容。",
    "summary": "更新后的文章摘要",
    "author_id": 1,
    "created_at": "2024-10-21T10:00:00Z",
    "updated_at": "2024-10-21T11:00:00Z"
  }
}
```

**状态码**:
- `200`: 更新成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 无权限（非作者）
- `404`: 文章不存在

### 5. 删除文章

**接口地址**: `DELETE {{base_url}}/api/posts/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
- `id`: 文章ID

**响应示例**:
```json
{
  "code": 200,
  "message": "文章删除成功"
}
```

**状态码**:
- `200`: 删除成功
- `401`: 未授权
- `403`: 无权限（非作者）
- `404`: 文章不存在

## 测试脚本

### 创建文章后自动保存文章ID
```javascript
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.data && responseJson.data.id) {
        pm.environment.set('post_id', responseJson.data.id);
        console.log('文章创建成功，文章ID:', responseJson.data.id);
    }
}
```

### 验证文章创建成功
```javascript
pm.test("文章创建成功", function () {
    pm.response.to.have.status(201);
    const responseJson = pm.response.json();
    pm.expect(responseJson.data).to.have.property('id');
    pm.expect(responseJson.data).to.have.property('title');
    pm.expect(responseJson.data).to.have.property('content');
});
```
