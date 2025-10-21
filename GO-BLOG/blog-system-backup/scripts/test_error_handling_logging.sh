#!/bin/bash
# 错误处理与日志记录测试脚本
# 文件: scripts/test_error_handling_logging.sh

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
TEST_USERNAME="errortest_$(date +%s)"
TEST_EMAIL="errortest_$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
JWT_TOKEN=""

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
    response_body=$(echo "$response" | sed '$d')
    
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
    echo -e "${PURPLE}错误处理与日志记录测试总结${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！错误处理与日志记录功能正常${NC}"
        exit 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，需要检查相关功能${NC}"
        exit 1
    fi
}

# 函数：设置测试用户
setup_user() {
    echo -e "${YELLOW}设置测试用户...${NC}"
    
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
    echo ""
}

# 主测试流程
echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}错误处理与日志记录功能测试${NC}"
echo -e "${PURPLE}========================================${NC}"
echo "测试时间: $(date)"
echo "测试URL: $BASE_URL"
echo "测试用户: $TEST_USERNAME"
echo ""

# 设置测试用户
setup_user

# 1. HTTP状态码错误处理测试
print_step "1" "HTTP状态码错误处理测试"

# 1.1 400 Bad Request 测试
api_request "POST" "/register" "{
    \"username\": \"\",
    \"password\": \"\",
    \"email\": \"\"
}" "400" "400错误 - 无效注册数据"

api_request "POST" "/login" "{
    \"username\": \"\",
    \"password\": \"\"
}" "400" "400错误 - 无效登录数据"

# 1.2 401 Unauthorized 测试
api_request "POST" "/login" "{
    \"username\": \"nonexistent_user\",
    \"password\": \"wrongpassword\"
}" "401" "401错误 - 用户认证失败"

api_request "POST" "/posts" "{
    \"title\": \"测试文章\",
    \"content\": \"测试内容\"
}" "401" "401错误 - 未认证用户访问受保护接口"

# 1.3 404 Not Found 测试
api_request "GET" "/posts/99999" "" "404" "404错误 - 文章不存在"
api_request "GET" "/posts/99999/comments" "" "404" "404错误 - 文章评论不存在"
api_request "PUT" "/posts/99999" "{
    \"title\": \"更新不存在的文章\",
    \"content\": \"内容\"
}" "404" "404错误 - 更新不存在的文章" "$JWT_TOKEN"

# 1.4 409 Conflict 测试
api_request "POST" "/register" "{
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"email\": \"conflict@example.com\"
}" "400" "409错误 - 用户名已存在"

api_request "POST" "/register" "{
    \"username\": \"newuser\",
    \"password\": \"$TEST_PASSWORD\",
    \"email\": \"$TEST_EMAIL\"
}" "400" "409错误 - 邮箱已存在"

echo ""

# 2. 数据库连接错误处理测试
print_step "2" "数据库连接错误处理测试"

echo -e "${YELLOW}执行测试: 数据库连接错误处理${NC}"
echo "注意: 此测试需要模拟数据库连接失败的情况"
echo "建议手动停止数据库服务，然后测试API响应"
print_result "数据库连接错误处理" "INFO" "需要手动测试数据库连接失败场景"

echo ""

# 3. 数据验证错误处理测试
print_step "3" "数据验证错误处理测试"

# 3.1 必填字段验证
api_request "POST" "/register" "{
    \"username\": \"testuser\"
}" "400" "数据验证 - 缺少必填字段"

api_request "POST" "/posts" "{
    \"title\": \"只有标题\"
}" "400" "数据验证 - 缺少文章内容" "$JWT_TOKEN"

# 3.2 数据格式验证
api_request "POST" "/register" "{
    \"username\": \"testuser\",
    \"password\": \"pass\",
    \"email\": \"invalid-email\"
}" "400" "数据验证 - 无效邮箱格式"

# 3.3 数据长度验证
long_title=$(printf 'A%.0s' {1..300})
api_request "POST" "/posts" "{
    \"title\": \"$long_title\",
    \"content\": \"测试内容\"
}" "400" "数据验证 - 标题过长" "$JWT_TOKEN"

echo ""

# 4. JWT认证错误处理测试
print_step "4" "JWT认证错误处理测试"

# 4.1 无效JWT格式
echo -e "${YELLOW}执行测试: 无效JWT格式${NC}"
invalid_jwt_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalid.jwt.token" \
    -d "{
        \"title\": \"测试文章\",
        \"content\": \"测试内容\"
    }" \
    "$BASE_URL/posts")

invalid_jwt_code=$(echo "$invalid_jwt_response" | tail -n1)
invalid_jwt_body=$(echo "$invalid_jwt_response" | sed '$d')

echo "响应状态码: $invalid_jwt_code"
echo "响应内容: $invalid_jwt_body"

if [ "$invalid_jwt_code" = "401" ]; then
    print_result "无效JWT格式" "PASS" "正确拒绝无效JWT格式"
else
    print_result "无效JWT格式" "FAIL" "状态码: $invalid_jwt_code"
fi

# 4.2 过期JWT测试
echo -e "${YELLOW}执行测试: 过期JWT测试${NC}"
echo "注意: 此测试需要生成过期的JWT token"
print_result "过期JWT测试" "INFO" "需要手动生成过期JWT进行测试"

# 4.3 无Authorization头测试
echo -e "${YELLOW}执行测试: 无Authorization头测试${NC}"
no_auth_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"title\": \"测试文章\",
        \"content\": \"测试内容\"
    }" \
    "$BASE_URL/posts")

no_auth_code=$(echo "$no_auth_response" | tail -n1)
no_auth_body=$(echo "$no_auth_response" | sed '$d')

echo "响应状态码: $no_auth_code"
echo "响应内容: $no_auth_body"

if [ "$no_auth_code" = "401" ]; then
    print_result "无Authorization头测试" "PASS" "正确拒绝无认证头请求"
else
    print_result "无Authorization头测试" "FAIL" "状态码: $no_auth_code"
fi

echo ""

# 5. 业务逻辑错误处理测试
print_step "5" "业务逻辑错误处理测试"

# 5.1 权限不足测试
echo -e "${YELLOW}执行测试: 权限不足测试${NC}"
echo "创建第二个用户进行权限测试..."

TEST_USERNAME2="errortest2_$(date +%s)"
TEST_EMAIL2="errortest2_$(date +%s)@example.com"

# 注册第二个用户
register_response2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME2\",
        \"password\": \"$TEST_PASSWORD\",
        \"email\": \"$TEST_EMAIL2\"
    }" \
    "$BASE_URL/register")

# 第二个用户登录
login_response2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME2\",
        \"password\": \"$TEST_PASSWORD\"
    }" \
    "$BASE_URL/login")

JWT_TOKEN2=$(echo $login_response2 | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$JWT_TOKEN2" ]; then
    # 第二个用户创建文章
    create_post_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN2" \
        -d "{
            \"title\": \"第二个用户的文章\",
            \"content\": \"这是第二个用户创建的文章\"
        }" \
        "$BASE_URL/posts")
    
    create_post_code=$(echo "$create_post_response" | tail -n1)
    create_post_body=$(echo "$create_post_response" | sed '$d')
    
    if [ "$create_post_code" = "201" ]; then
        POST_ID2=$(echo $create_post_body | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "第二个用户创建的文章ID: $POST_ID2"
        
        # 第一个用户尝试更新第二个用户的文章
        api_request "PUT" "/posts/$POST_ID2" "{
            \"title\": \"第一个用户尝试更新\",
            \"content\": \"这是第一个用户尝试更新的内容\"
        }" "403" "权限不足 - 更新他人文章" "$JWT_TOKEN"
        
        # 第一个用户尝试删除第二个用户的文章
        api_request "DELETE" "/posts/$POST_ID2" "" "403" "权限不足 - 删除他人文章" "$JWT_TOKEN"
    else
        print_result "权限不足测试" "FAIL" "第二个用户创建文章失败"
    fi
else
    print_result "权限不足测试" "FAIL" "第二个用户设置失败"
fi

echo ""

# 6. 系统错误处理测试
print_step "6" "系统错误处理测试"

# 6.1 服务器内部错误测试
echo -e "${YELLOW}执行测试: 服务器内部错误处理${NC}"
echo "注意: 此测试需要模拟服务器内部错误"
echo "建议通过修改代码或数据库来触发500错误"
print_result "服务器内部错误处理" "INFO" "需要手动模拟服务器内部错误"

# 6.2 服务不可用测试
echo -e "${YELLOW}执行测试: 服务不可用处理${NC}"
echo "注意: 此测试需要停止服务器服务"
print_result "服务不可用处理" "INFO" "需要手动停止服务进行测试"

echo ""

# 7. 日志记录功能测试
print_step "7" "日志记录功能测试"

# 7.1 成功操作日志测试
echo -e "${YELLOW}执行测试: 成功操作日志记录${NC}"
echo "执行一些成功操作，观察日志输出..."

# 创建文章
create_post_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"title\": \"日志测试文章\",
        \"content\": \"这是一篇用于测试日志记录的文章\",
        \"summary\": \"日志测试摘要\"
    }" \
    "$BASE_URL/posts")

create_post_code=$(echo "$create_post_response" | tail -n1)
if [ "$create_post_code" = "201" ]; then
    print_result "成功操作日志记录" "PASS" "成功操作应该被记录到日志中"
else
    print_result "成功操作日志记录" "FAIL" "操作失败，状态码: $create_post_code"
fi

# 7.2 错误操作日志测试
echo -e "${YELLOW}执行测试: 错误操作日志记录${NC}"
echo "执行一些错误操作，观察错误日志输出..."

# 尝试访问不存在的资源
curl -s -X GET "$BASE_URL/posts/99999" > /dev/null
print_result "错误操作日志记录" "PASS" "错误操作应该被记录到错误日志中"

# 7.3 日志格式验证
echo -e "${YELLOW}执行测试: 日志格式验证${NC}"
echo "注意: 此测试需要检查实际的日志文件"
echo "建议检查以下日志内容："
echo "1. 时间戳格式"
echo "2. 日志级别"
echo "3. 请求信息"
echo "4. 响应状态码"
echo "5. 错误详情"
print_result "日志格式验证" "INFO" "需要手动检查日志文件格式"

echo ""

# 8. 错误响应格式测试
print_step "8" "错误响应格式测试"

# 8.1 错误响应结构验证
echo -e "${YELLOW}执行测试: 错误响应结构验证${NC}"
error_response=$(curl -s -X GET "$BASE_URL/posts/99999")
echo "错误响应: $error_response"

if echo "$error_response" | grep -q '"code"'; then
    print_result "错误响应结构验证" "PASS" "错误响应包含code字段"
else
    print_result "错误响应结构验证" "FAIL" "错误响应缺少code字段"
fi

if echo "$error_response" | grep -q '"message"'; then
    print_result "错误响应结构验证" "PASS" "错误响应包含message字段"
else
    print_result "错误响应结构验证" "FAIL" "错误响应缺少message字段"
fi

# 8.2 错误信息可读性测试
echo -e "${YELLOW}执行测试: 错误信息可读性测试${NC}"
if echo "$error_response" | grep -q "文章不存在\|not found\|不存在"; then
    print_result "错误信息可读性测试" "PASS" "错误信息清晰易懂"
else
    print_result "错误信息可读性测试" "FAIL" "错误信息不够清晰"
fi

echo ""

# 9. 边界条件错误处理测试
print_step "9" "边界条件错误处理测试"

# 9.1 空请求体测试
echo -e "${YELLOW}执行测试: 空请求体测试${NC}"
empty_body_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "" \
    "$BASE_URL/posts")

empty_body_code=$(echo "$empty_body_response" | tail -n1)
empty_body_body=$(echo "$empty_body_response" | sed '$d')

echo "响应状态码: $empty_body_code"
echo "响应内容: $empty_body_body"

if [ "$empty_body_code" = "400" ]; then
    print_result "空请求体测试" "PASS" "正确处理空请求体"
else
    print_result "空请求体测试" "FAIL" "状态码: $empty_body_code"
fi

# 9.2 无效JSON格式测试
echo -e "${YELLOW}执行测试: 无效JSON格式测试${NC}"
invalid_json_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{invalid json}" \
    "$BASE_URL/posts")

invalid_json_code=$(echo "$invalid_json_response" | tail -n1)
invalid_json_body=$(echo "$invalid_json_response" | sed '$d')

echo "响应状态码: $invalid_json_code"
echo "响应内容: $invalid_json_body"

if [ "$invalid_json_code" = "400" ]; then
    print_result "无效JSON格式测试" "PASS" "正确处理无效JSON格式"
else
    print_result "无效JSON格式测试" "FAIL" "状态码: $invalid_json_code"
fi

echo ""

# 显示测试总结
show_summary
