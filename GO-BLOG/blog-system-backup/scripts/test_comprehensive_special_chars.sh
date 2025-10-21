#!/bin/bash

# 全面的特殊字符处理测试脚本
BASE_URL="http://localhost:8088/api"
TIMESTAMP=$(date +%s)
TEST_USER="comprehensive_$TIMESTAMP"

echo "=== 全面特殊字符处理测试 ==="
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
        \"title\": \"全面特殊字符测试文章\",
        \"content\": \"测试各种特殊字符处理\"
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

# 4. 测试各种特殊字符场景
echo "4. 测试各种特殊字符场景..."

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
empty_comment_body=$(echo "$empty_comment_response" | sed '$d')

echo "空评论响应状态码: $empty_comment_code"
if [ "$empty_comment_code" = "400" ]; then
    echo "✅ 空评论正确被拒绝"
else
    echo "❌ 空评论处理异常"
fi

# 4.2 测试超长评论
echo "4.2 测试超长评论..."
long_content=$(printf 'A%.0s' {1..1001})  # 1001个字符
long_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$long_content\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

long_comment_code=$(echo "$long_comment_response" | tail -n1)
long_comment_body=$(echo "$long_comment_response" | sed '$d')

echo "超长评论响应状态码: $long_comment_code"
if [ "$long_comment_code" = "400" ]; then
    echo "✅ 超长评论正确被拒绝"
else
    echo "❌ 超长评论处理异常"
fi

# 4.3 测试各种特殊字符组合
echo "4.3 测试各种特殊字符组合..."

# 测试1: HTML标签
echo "测试HTML标签..."
html_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "测试HTML标签: <script>alert('"'"'xss'"'"')</script> <img src=x onerror=alert(1)>"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

html_comment_code=$(echo "$html_comment_response" | tail -n1)
html_comment_body=$(echo "$html_comment_response" | sed '$d')

echo "HTML标签评论响应状态码: $html_comment_code"
if [ "$html_comment_code" = "201" ]; then
    echo "✅ HTML标签评论处理成功"
else
    echo "❌ HTML标签评论处理失败"
fi

# 测试2: SQL注入字符
echo "测试SQL注入字符..."
sql_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "测试SQL注入: '\''; DROP TABLE users; -- SELECT * FROM users WHERE id = 1 OR 1=1"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

sql_comment_code=$(echo "$sql_comment_response" | tail -n1)
sql_comment_body=$(echo "$sql_comment_response" | sed '$d')

echo "SQL注入评论响应状态码: $sql_comment_code"
if [ "$sql_comment_code" = "201" ]; then
    echo "✅ SQL注入评论处理成功"
else
    echo "❌ SQL注入评论处理失败"
fi

# 测试3: Unicode表情符号
echo "测试Unicode表情符号..."
emoji_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "测试表情符号: 😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧🥴😇🤠🤡🥳🥺🤥🤫🤭🧐🤓😈👿💀☠️👹👺🤖👽👾"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

emoji_comment_code=$(echo "$emoji_comment_response" | tail -n1)
emoji_comment_body=$(echo "$emoji_comment_response" | sed '$d')

echo "表情符号评论响应状态码: $emoji_comment_code"
if [ "$emoji_comment_code" = "201" ]; then
    echo "✅ 表情符号评论处理成功"
else
    echo "❌ 表情符号评论处理失败"
fi

# 测试4: 换行符和制表符
echo "测试换行符和制表符..."
newline_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "测试换行符:\n第一行\n第二行\n\t制表符缩进\n\r回车符"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

newline_comment_code=$(echo "$newline_comment_response" | tail -n1)
newline_comment_body=$(echo "$newline_comment_response" | sed '$d')

echo "换行符评论响应状态码: $newline_comment_code"
if [ "$newline_comment_code" = "201" ]; then
    echo "✅ 换行符评论处理成功"
else
    echo "❌ 换行符评论处理失败"
fi

# 测试5: 各种标点符号
echo "测试各种标点符号..."
punctuation_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "content": "测试标点符号: ！@#￥%……&*（）——+｜{}【】；：\"''《》？，。、~`"
    }' \
    "$BASE_URL/posts/$POST_ID/comments")

punctuation_comment_code=$(echo "$punctuation_comment_response" | tail -n1)
punctuation_comment_body=$(echo "$punctuation_comment_response" | sed '$d')

echo "标点符号评论响应状态码: $punctuation_comment_code"
if [ "$punctuation_comment_code" = "201" ]; then
    echo "✅ 标点符号评论处理成功"
else
    echo "❌ 标点符号评论处理失败"
fi

# 5. 获取所有评论验证
echo "5. 获取所有评论验证..."
get_comments_response=$(curl -s -w "\n%{http_code}" -X GET \
    "$BASE_URL/posts/$POST_ID/comments")

get_comments_code=$(echo "$get_comments_response" | tail -n1)
get_comments_body=$(echo "$get_comments_response" | sed '$d')

echo "获取评论响应状态码: $get_comments_code"
if [ "$get_comments_code" = "200" ]; then
    echo "✅ 评论列表获取成功"
    # 统计评论数量
    comment_count=$(echo "$get_comments_body" | grep -o '"id":[0-9]*' | wc -l)
    echo "评论数量: $comment_count"
else
    echo "❌ 评论列表获取失败"
fi

echo "=== 全面特殊字符处理测试完成 ==="
