#!/bin/bash

# 长度限制测试脚本
BASE_URL="http://localhost:8088/api"
TIMESTAMP=$(date +%s)
TEST_USER="lengthtest_$TIMESTAMP"

echo "=== 长度限制测试 ==="
echo "测试用户: $TEST_USER"

# 等待服务器启动
sleep 5

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
        \"title\": \"长度限制测试文章\",
        \"content\": \"测试评论长度限制\"
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

# 4. 测试各种长度的评论
echo "4. 测试各种长度的评论..."

# 4.1 测试空评论
echo "4.1 测试空评论..."
empty_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": ""
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

empty_comment_code=$(echo "$empty_comment_response" | tail -n1)
echo "空评论响应状态码: $empty_comment_code"
if [ "$empty_comment_code" = "400" ]; then
    echo "✅ 空评论正确被拒绝"
else
    echo "❌ 空评论处理异常"
fi

# 4.2 测试1字符评论
echo "4.2 测试1字符评论..."
one_char_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "A"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

one_char_comment_code=$(echo "$one_char_comment_response" | tail -n1)
echo "1字符评论响应状态码: $one_char_comment_code"
if [ "$one_char_comment_code" = "201" ]; then
    echo "✅ 1字符评论处理成功"
else
    echo "❌ 1字符评论处理失败"
fi

# 4.3 测试1000字符评论（边界值）
echo "4.3 测试1000字符评论（边界值）..."
thousand_content=$(printf 'A%.0s' {1..1000})
thousand_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$thousand_content\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

thousand_comment_code=$(echo "$thousand_comment_response" | tail -n1)
echo "1000字符评论响应状态码: $thousand_comment_code"
if [ "$thousand_comment_code" = "201" ]; then
    echo "✅ 1000字符评论处理成功"
else
    echo "❌ 1000字符评论处理失败"
fi

# 4.4 测试1001字符评论（应该被拒绝）
echo "4.4 测试1001字符评论（应该被拒绝）..."
thousand_one_content=$(printf 'A%.0s' {1..1001})
thousand_one_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$thousand_one_content\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

thousand_one_comment_code=$(echo "$thousand_one_comment_response" | tail -n1)
thousand_one_comment_body=$(echo "$thousand_one_comment_response" | sed '$d')
echo "1001字符评论响应状态码: $thousand_one_comment_code"
echo "1001字符评论响应内容: $thousand_one_comment_body"
if [ "$thousand_one_comment_code" = "400" ]; then
    echo "✅ 1001字符评论正确被拒绝"
else
    echo "❌ 1001字符评论处理异常"
fi

# 4.5 测试2000字符评论（应该被拒绝）
echo "4.5 测试2000字符评论（应该被拒绝）..."
two_thousand_content=$(printf 'A%.0s' {1..2000})
two_thousand_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$two_thousand_content\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

two_thousand_comment_code=$(echo "$two_thousand_comment_response" | tail -n1)
echo "2000字符评论响应状态码: $two_thousand_comment_code"
if [ "$two_thousand_comment_code" = "400" ]; then
    echo "✅ 2000字符评论正确被拒绝"
else
    echo "❌ 2000字符评论处理异常"
fi

echo "=== 长度限制测试完成 ==="
