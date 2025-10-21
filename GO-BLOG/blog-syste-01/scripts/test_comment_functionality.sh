#!/bin/bash
# 评论功能测试脚本
# 文件: scripts/test_comment_functionality.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试配置
BASE_URL="http://localhost:8088/api"
TEST_USERNAME="commenttest_$(date +%s)"
TEST_EMAIL="commenttest_$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
JWT_TOKEN=""
POST_ID=""
COMMENT_ID=""

# 函数：打印测试步骤
print_step() {
    local step=$1
    local description=$2
    echo -e "${BLUE}=== 步骤 $step: $description ===${NC}"
}

# 函数：打印测试结果
print_result() {
    local test_name=$1
    local status=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ $test_name: 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "INFO" ]; then
        echo -e "${CYAN}ℹ $test_name: 信息${NC}"
    else
        echo -e "${RED}✗ $test_name: 失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    if [ -n "$details" ]; then
        echo -e "${CYAN}详情: $details${NC}"
    fi
    echo ""
}

# 函数：执行API请求
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    local auth_header=$6
    
    echo -e "${YELLOW}执行测试: $test_name${NC}"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Authorization: Bearer $auth_header" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                "$BASE_URL$endpoint")
        fi
    fi
    
    # 分离响应体和状态码
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo "响应状态码: $http_code"
    echo "响应内容: $response_body"
    
    if [ "$http_code" = "$expected_status" ]; then
        print_result "$test_name" "PASS" "状态码匹配: $http_code"
        return 0
    else
        print_result "$test_name" "FAIL" "期望状态码: $expected_status, 实际状态码: $http_code"
        return 1
    fi
}

# 函数：显示测试总结
show_summary() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}评论功能测试总结${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！评论功能正常${NC}"
        exit 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，需要检查相关功能${NC}"
        exit 1
    fi
}

# 函数：设置测试环境
setup_test_environment() {
    echo -e "${YELLOW}设置测试环境...${NC}"
    
    # 注册用户
    register_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TEST_USERNAME\",
            \"password\": \"$TEST_PASSWORD\",
            \"email\": \"$TEST_EMAIL\"
        }" \
        "$BASE_URL/register")
    
    echo "注册响应: $register_response"
    
    # 登录获取token
    login_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TEST_USERNAME\",
            \"password\": \"$TEST_PASSWORD\"
        }" \
        "$BASE_URL/login")
    
    echo "登录响应: $login_response"
    
    # 提取JWT token
    JWT_TOKEN=$(echo $login_response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$JWT_TOKEN" ]; then
        echo -e "${GREEN}✓ 用户设置成功，获取到JWT token${NC}"
        echo "JWT Token: ${JWT_TOKEN:0:50}..."
    else
        echo -e "${RED}✗ 用户设置失败，未获取到JWT token${NC}"
        exit 1
    fi
    
    # 创建测试文章
    echo -e "${YELLOW}创建测试文章...${NC}"
    create_post_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{
            \"title\": \"评论测试文章\",
            \"content\": \"这是一篇用于测试评论功能的文章。\",
            \"summary\": \"评论测试文章摘要\"
        }" \
        "$BASE_URL/posts")
    
    create_post_code=$(echo "$create_post_response" | tail -n1)
    create_post_body=$(echo "$create_post_response" | head -n -1)
    
    echo "创建文章响应: $create_post_body"
    
    if [ "$create_post_code" = "201" ]; then
        POST_ID=$(echo $create_post_body | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✓ 测试文章创建成功，文章ID: $POST_ID${NC}"
    else
        echo -e "${RED}✗ 测试文章创建失败，状态码: $create_post_code${NC}"
        exit 1
    fi
    
    echo ""
}

# 主测试流程
echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}评论功能测试${NC}"
echo -e "${PURPLE}========================================${NC}"
echo "测试时间: $(date)"
echo "测试URL: $BASE_URL"
echo "测试用户: $TEST_USERNAME"
echo ""

# 设置测试环境
setup_test_environment

# 1. 评论创建功能测试
print_step "1" "评论创建功能测试"

# 1.1 已认证用户创建评论
echo -e "${YELLOW}执行测试: 已认证用户创建评论${NC}"
create_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"这是一条测试评论，用于验证评论创建功能。\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

create_comment_code=$(echo "$create_comment_response" | tail -n1)
create_comment_body=$(echo "$create_comment_response" | head -n -1)

echo "响应状态码: $create_comment_code"
echo "响应内容: $create_comment_body"

if [ "$create_comment_code" = "201" ]; then
    print_result "已认证用户创建评论" "PASS" "成功创建评论"
    # 提取评论ID
    COMMENT_ID=$(echo $create_comment_body | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "创建的评论ID: $COMMENT_ID"
else
    print_result "已认证用户创建评论" "FAIL" "状态码: $create_comment_code"
fi

# 1.2 未认证用户创建评论
api_request "POST" "/posts/$POST_ID/comments" "{
    \"content\": \"未认证用户尝试创建的评论\"
}" "401" "未认证用户创建评论"

# 1.3 无效数据创建评论
api_request "POST" "/posts/$POST_ID/comments" "{
    \"content\": \"\"
}" "400" "无效数据创建评论" "$JWT_TOKEN"

# 1.4 缺少内容字段创建评论
api_request "POST" "/posts/$POST_ID/comments" "{
    \"title\": \"只有标题的评论\"
}" "400" "缺少内容字段创建评论" "$JWT_TOKEN"

# 1.5 对不存在的文章创建评论
api_request "POST" "/posts/99999/comments" "{
    \"content\": \"对不存在文章的评论\"
}" "404" "对不存在的文章创建评论" "$JWT_TOKEN"

echo ""

# 2. 评论读取功能测试
print_step "2" "评论读取功能测试"

# 2.1 获取文章的所有评论列表
api_request "GET" "/posts/$POST_ID/comments" "" "200" "获取文章的所有评论列表"

# 2.2 获取不存在文章的评论列表
api_request "GET" "/posts/99999/comments" "" "404" "获取不存在文章的评论列表"

# 2.3 验证评论内容
if [ -n "$COMMENT_ID" ]; then
    echo -e "${YELLOW}执行测试: 验证评论内容${NC}"
    comments_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/comments")
    echo "文章评论列表: $comments_response"
    
    if echo "$comments_response" | grep -q "这是一条测试评论"; then
        print_result "验证评论内容" "PASS" "评论内容正确显示"
    else
        print_result "验证评论内容" "FAIL" "评论内容未正确显示"
    fi
else
    print_result "验证评论内容" "INFO" "跳过测试，因为未创建评论"
fi

echo ""

# 3. 多用户评论测试
print_step "3" "多用户评论测试"

# 创建第二个用户
echo -e "${YELLOW}创建第二个用户进行多用户评论测试...${NC}"
TEST_USERNAME2="commenttest2_$(date +%s)"
TEST_EMAIL2="commenttest2_$(date +%s)@example.com"

# 注册第二个用户
register_response2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME2\",
        \"password\": \"$TEST_PASSWORD\",
        \"email\": \"$TEST_EMAIL2\"
    }" \
    "$BASE_URL/register")

echo "第二个用户注册响应: $register_response2"

# 第二个用户登录
login_response2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME2\",
        \"password\": \"$TEST_PASSWORD\"
    }" \
    "$BASE_URL/login")

echo "第二个用户登录响应: $login_response2"

# 提取第二个用户的JWT token
JWT_TOKEN2=$(echo $login_response2 | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$JWT_TOKEN2" ]; then
    echo -e "${GREEN}✓ 第二个用户设置成功${NC}"
    
    # 第二个用户创建评论
    echo -e "${YELLOW}第二个用户创建评论...${NC}"
    create_comment2_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN2" \
        -d "{
            \"content\": \"这是第二个用户创建的评论。\"
        }" \
        "$BASE_URL/posts/$POST_ID/comments")
    
    create_comment2_code=$(echo "$create_comment2_response" | tail -n1)
    create_comment2_body=$(echo "$create_comment2_response" | head -n -1)
    
    echo "第二个用户创建评论响应: $create_comment2_body"
    
    if [ "$create_comment2_code" = "201" ]; then
        print_result "第二个用户创建评论" "PASS" "第二个用户成功创建评论"
        
        # 验证两个用户的评论都存在
        echo -e "${YELLOW}验证多用户评论...${NC}"
        all_comments_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/comments")
        echo "所有评论: $all_comments_response"
        
        comment_count=$(echo "$all_comments_response" | grep -o '"id":[0-9]*' | wc -l)
        echo "评论数量: $comment_count"
        
        if [ "$comment_count" -ge 2 ]; then
            print_result "验证多用户评论" "PASS" "多个用户的评论都正确显示"
        else
            print_result "验证多用户评论" "FAIL" "评论数量不足，期望至少2条，实际$comment_count条"
        fi
    else
        print_result "第二个用户创建评论" "FAIL" "状态码: $create_comment2_code"
    fi
else
    echo -e "${RED}✗ 第二个用户设置失败${NC}"
    print_result "多用户评论测试" "INFO" "跳过测试，因为第二个用户设置失败"
fi

echo ""

# 4. 评论数据验证测试
print_step "4" "评论数据验证测试"

# 4.1 长评论测试
echo -e "${YELLOW}执行测试: 长评论测试${NC}"
long_comment="这是一条很长的评论，用于测试系统对长评论的处理能力。"$(printf 'A%.0s' {1..500})
long_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$long_comment\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

long_comment_code=$(echo "$long_comment_response" | tail -n1)
long_comment_body=$(echo "$long_comment_response" | head -n -1)

echo "长评论响应状态码: $long_comment_code"
echo "长评论响应内容: $long_comment_body"

if [ "$long_comment_code" = "201" ]; then
    print_result "长评论测试" "PASS" "系统正确处理长评论"
else
    print_result "长评论测试" "FAIL" "状态码: $long_comment_code"
fi

# 4.2 特殊字符评论测试
echo -e "${YELLOW}执行测试: 特殊字符评论测试${NC}"
special_comment="这是一条包含特殊字符的评论：!@#$%^&*()_+-=[]{}|;':\",./<>?`~"
special_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$special_comment\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

special_comment_code=$(echo "$special_comment_response" | tail -n1)
special_comment_body=$(echo "$special_comment_response" | head -n -1)

echo "特殊字符评论响应状态码: $special_comment_code"
echo "特殊字符评论响应内容: $special_comment_body"

if [ "$special_comment_code" = "201" ]; then
    print_result "特殊字符评论测试" "PASS" "系统正确处理特殊字符评论"
else
    print_result "特殊字符评论测试" "FAIL" "状态码: $special_comment_code"
fi

# 4.3 中文评论测试
echo -e "${YELLOW}执行测试: 中文评论测试${NC}"
chinese_comment="这是一条中文评论，测试系统对中文字符的支持。包含标点符号：，。！？；："
chinese_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"content\": \"$chinese_comment\"
    }" \
    "$BASE_URL/posts/$POST_ID/comments")

chinese_comment_code=$(echo "$chinese_comment_response" | tail -n1)
chinese_comment_body=$(echo "$chinese_comment_response" | head -n -1)

echo "中文评论响应状态码: $chinese_comment_code"
echo "中文评论响应内容: $chinese_comment_body"

if [ "$chinese_comment_code" = "201" ]; then
    print_result "中文评论测试" "PASS" "系统正确处理中文评论"
else
    print_result "中文评论测试" "FAIL" "状态码: $chinese_comment_code"
fi

echo ""

# 5. 评论关联关系测试
print_step "5" "评论关联关系测试"

# 5.1 验证评论与用户的关联
echo -e "${YELLOW}执行测试: 验证评论与用户的关联${NC}"
comments_with_user_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/comments")
echo "包含用户信息的评论列表: $comments_with_user_response"

if echo "$comments_with_user_response" | grep -q '"user"'; then
    print_result "验证评论与用户的关联" "PASS" "评论正确关联用户信息"
else
    print_result "验证评论与用户的关联" "FAIL" "评论未关联用户信息"
fi

# 5.2 验证评论与文章的关联
echo -e "${YELLOW}执行测试: 验证评论与文章的关联${NC}"
if echo "$comments_with_user_response" | grep -q '"post_id"'; then
    print_result "验证评论与文章的关联" "PASS" "评论正确关联文章ID"
else
    print_result "验证评论与文章的关联" "FAIL" "评论未关联文章ID"
fi

echo ""

# 6. 边界条件测试
print_step "6" "边界条件测试"

# 6.1 空文章评论测试
echo -e "${YELLOW}执行测试: 空文章评论测试${NC}"
empty_post_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/comments")
comment_count=$(echo "$empty_post_response" | grep -o '"id":[0-9]*' | wc -l)

if [ "$comment_count" -gt 0 ]; then
    print_result "空文章评论测试" "PASS" "文章有评论，数量: $comment_count"
else
    print_result "空文章评论测试" "INFO" "文章暂无评论"
fi

# 6.2 大量评论测试
echo -e "${YELLOW}执行测试: 大量评论测试${NC}"
echo "创建多条评论..."
for i in {1..5}; do
    bulk_comment_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{
            \"content\": \"批量评论测试 $i\"
        }" \
        "$BASE_URL/posts/$POST_ID/comments")
    
    bulk_comment_code=$(echo "$bulk_comment_response" | tail -n1)
    if [ "$bulk_comment_code" = "201" ]; then
        echo "批量评论 $i 创建成功"
    else
        echo "批量评论 $i 创建失败，状态码: $bulk_comment_code"
    fi
done

# 验证批量评论
final_comments_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/comments")
final_comment_count=$(echo "$final_comments_response" | grep -o '"id":[0-9]*' | wc -l)
echo "最终评论数量: $final_comment_count"

if [ "$final_comment_count" -ge 5 ]; then
    print_result "大量评论测试" "PASS" "系统正确处理大量评论，数量: $final_comment_count"
else
    print_result "大量评论测试" "FAIL" "评论数量不足，期望至少5条，实际$final_comment_count条"
fi

echo ""

# 显示测试总结
show_summary
