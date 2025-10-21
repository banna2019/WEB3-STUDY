#!/bin/bash

# 简化的评论功能测试脚本
BASE_URL="http://localhost:8088/api"
TIMESTAMP=$(date +%s)
TEST_USER="testuser_$TIMESTAMP"

echo "=== 简化评论功能测试 ==="
echo "测试用户: $TEST_USER"

# 1. 注册用户
echo "1. 注册用户..."
register_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USER\",
        \"email\": \"$TEST_USER@example.com\",
        \"password\": \"password123\"
    }" \
    "$BASE_URL/register")

echo "注册响应: $register_response"

# 2. 登录获取JWT
echo "2. 登录获取JWT..."
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USER\",
        \"password\": \"password123\"
    }" \
    "$BASE_URL/login")

echo "登录响应: $login_response"

# 提取JWT token
JWT_TOKEN=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "JWT Token: ${JWT_TOKEN:0:50}..."

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ 无法获取JWT token"
    exit 1
fi

# 3. 创建文章
echo "3. 创建文章..."
create_post_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"title\": \"测试文章\",
        \"content\": \"测试内容\"
    }" \
    "$BASE_URL/posts")

create_post_code=$(echo "$create_post_response" | tail -n1)
create_post_body=$(echo "$create_post_response" | sed '$d')

echo "创建文章响应: $create_post_body"
echo "创建文章状态码: $create_post_code"

if [ "$create_post_code" != "201" ]; then
    echo "❌ 文章创建失败"
    exit 1
fi

# 提取文章ID
POST_ID=$(echo $create_post_body | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "文章ID: $POST_ID"

if [ -z "$POST_ID" ]; then
    echo "❌ 无法提取文章ID"
    exit 1
fi

# 4. 创建评论
echo "4. 创建评论..."
create_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"这是一条测试评论\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

create_comment_code=$(echo "$create_comment_response" | tail -n1)
create_comment_body=$(echo "$create_comment_response" | sed '$d')

echo "创建评论响应: $create_comment_body"
echo "创建评论状态码: $create_comment_code"

if [ "$create_comment_code" = "201" ]; then
    echo "✅ 评论创建成功"
else
    echo "❌ 评论创建失败"
fi

# 5. 获取评论列表
echo "5. 获取评论列表..."
get_comments_response=$(curl -s -w "\n%{http_code}" -X GET \
    "$BASE_URL/posts/$POST_ID/comments")

get_comments_code=$(echo "$get_comments_response" | tail -n1)
get_comments_body=$(echo "$get_comments_response" | sed '$d')

echo "获取评论响应: $get_comments_body"
echo "获取评论状态码: $get_comments_code"

if [ "$get_comments_code" = "200" ]; then
    echo "✅ 评论列表获取成功"
else
    echo "❌ 评论列表获取失败"
fi

# 6. 测试不存在文章的评论
echo "6. 测试不存在文章的评论..."
nonexistent_response=$(curl -s -w "\n%{http_code}" -X GET \
    "$BASE_URL/posts/99999/comments")

nonexistent_code=$(echo "$nonexistent_response" | tail -n1)
nonexistent_body=$(echo "$nonexistent_response" | sed '$d')

echo "不存在文章评论响应: $nonexistent_body"
echo "不存在文章评论状态码: $nonexistent_code"

if [ "$nonexistent_code" = "404" ]; then
    echo "✅ 不存在文章评论正确返回404"
else
    echo "❌ 不存在文章评论状态码错误: $nonexistent_code"
fi

echo "=== 测试完成 ==="
