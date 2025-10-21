#!/bin/bash

# 特殊字符处理测试脚本
BASE_URL="http://localhost:8088/api"
TIMESTAMP=$(date +%s)
TEST_USER="specialtest_$TIMESTAMP"

echo "=== 特殊字符处理测试 ==="
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
        \"title\": \"特殊字符测试文章\",
        \"content\": \"测试特殊字符处理\"
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

# 4. 测试各种特殊字符
echo "4. 测试各种特殊字符..."

# 4.1 基本特殊字符
echo "4.1 测试基本特殊字符..."
basic_special="测试特殊字符: !@#$%^&*()_+-=[]{}|;':\",./<>?~"
echo "测试字符串: $basic_special"

# 使用printf和单引号来避免shell解析问题
basic_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"测试特殊字符: !@#\$%^&*()_+-=[]{}|;':\\\",./<>?~\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

basic_comment_code=$(echo "$basic_comment_response" | tail -n1)
basic_comment_body=$(echo "$basic_comment_response" | sed '$d')

echo "基本特殊字符响应状态码: $basic_comment_code"
echo "基本特殊字符响应内容: $basic_comment_body"

if [ "$basic_comment_code" = "201" ]; then
    echo "✅ 基本特殊字符处理成功"
else
    echo "❌ 基本特殊字符处理失败"
fi

# 4.2 测试JSON转义字符
echo "4.2 测试JSON转义字符..."
json_special="测试JSON转义: \"quotes\" \\backslash\\ /forward/slash"
echo "测试字符串: $json_special"

json_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"测试JSON转义: \\\"quotes\\\" \\\\backslash\\\\ /forward/slash\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

json_comment_code=$(echo "$json_comment_response" | tail -n1)
json_comment_body=$(echo "$json_comment_response" | sed '$d')

echo "JSON转义字符响应状态码: $json_comment_code"
echo "JSON转义字符响应内容: $json_comment_body"

if [ "$json_comment_code" = "201" ]; then
    echo "✅ JSON转义字符处理成功"
else
    echo "❌ JSON转义字符处理失败"
fi

# 4.3 测试Unicode字符
echo "4.3 测试Unicode字符..."
unicode_special="测试Unicode: 🚀🌟💻🔥 中文标点：，。！？；："
echo "测试字符串: $unicode_special"

unicode_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"测试Unicode: 🚀🌟💻🔥 中文标点：，。！？；：\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

unicode_comment_code=$(echo "$unicode_comment_response" | tail -n1)
unicode_comment_body=$(echo "$unicode_comment_response" | sed '$d')

echo "Unicode字符响应状态码: $unicode_comment_code"
echo "Unicode字符响应内容: $unicode_comment_body"

if [ "$unicode_comment_code" = "201" ]; then
    echo "✅ Unicode字符处理成功"
else
    echo "❌ Unicode字符处理失败"
fi

# 4.4 测试SQL注入相关字符
echo "4.4 测试SQL注入相关字符..."
sql_special="测试SQL相关: '; DROP TABLE users; -- SELECT * FROM"
echo "测试字符串: $sql_special"

sql_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"测试SQL相关: '; DROP TABLE users; -- SELECT * FROM\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

sql_comment_code=$(echo "$sql_comment_response" | tail -n1)
sql_comment_body=$(echo "$sql_comment_response" | sed '$d')

echo "SQL相关字符响应状态码: $sql_comment_code"
echo "SQL相关字符响应内容: $sql_comment_body"

if [ "$sql_comment_code" = "201" ]; then
    echo "✅ SQL相关字符处理成功"
else
    echo "❌ SQL相关字符处理失败"
fi

# 5. 获取所有评论验证
echo "5. 获取所有评论验证..."
get_comments_response=$(curl -s -w "\n%{http_code}" -X GET \
    "$BASE_URL/posts/$POST_ID/comments")

get_comments_code=$(echo "$get_comments_response" | tail -n1)
get_comments_body=$(echo "$get_comments_response" | sed '$d')

echo "获取评论响应状态码: $get_comments_code"
echo "获取评论响应内容: $get_comments_body"

if [ "$get_comments_code" = "200" ]; then
    echo "✅ 评论列表获取成功"
    # 统计评论数量
    comment_count=$(echo "$get_comments_body" | grep -o '"id":[0-9]*' | wc -l)
    echo "评论数量: $comment_count"
else
    echo "❌ 评论列表获取失败"
fi

echo "=== 特殊字符处理测试完成 ==="
