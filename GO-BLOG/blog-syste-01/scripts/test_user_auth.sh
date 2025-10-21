#!/bin/bash
# 用户认证与授权测试脚本
# 文件: scripts/test_user_auth.sh

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
TEST_USERNAME="testuser_$(date +%s)"
TEST_EMAIL="testuser_$(date +%s)@example.com"
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
    
    echo -e "${YELLOW}执行测试: $test_name${NC}"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$BASE_URL$endpoint")
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
    echo -e "${PURPLE}用户认证与授权测试总结${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！用户认证与授权功能正常${NC}"
        exit 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，需要检查相关功能${NC}"
        exit 1
    fi
}

# 主测试流程
echo -e "${PURPLE}========================================${NC}"
echo -e "${PURPLE}用户认证与授权功能测试${NC}"
echo -e "${PURPLE}========================================${NC}"
echo "测试时间: $(date)"
echo "测试URL: $BASE_URL"
echo "测试用户: $TEST_USERNAME"
echo ""

# 1. 用户注册测试
print_step "1" "用户注册功能测试"

# 1.1 正常注册
api_request "POST" "/register" "{
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"email\": \"$TEST_EMAIL\"
}" "201" "用户正常注册"

# 1.2 重复用户名注册
api_request "POST" "/register" "{
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"email\": \"testuser2@example.com\"
}" "400" "重复用户名注册"

# 1.3 重复邮箱注册
api_request "POST" "/register" "{
    \"username\": \"testuser2\",
    \"password\": \"$TEST_PASSWORD\",
    \"email\": \"$TEST_EMAIL\"
}" "400" "重复邮箱注册"

# 1.4 无效数据注册
api_request "POST" "/register" "{
    \"username\": \"\",
    \"password\": \"\",
    \"email\": \"\"
}" "400" "无效数据注册"

echo ""

# 2. 用户登录测试
print_step "2" "用户登录功能测试"

# 2.1 正常登录
echo -e "${YELLOW}执行测试: 用户正常登录${NC}"
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
    print_result "用户正常登录" "PASS" "成功获取JWT token"
    echo "JWT Token: ${JWT_TOKEN:0:50}..."
else
    print_result "用户正常登录" "FAIL" "未获取到JWT token"
fi

# 2.2 错误用户名登录
api_request "POST" "/login" "{
    \"username\": \"nonexistent_user\",
    \"password\": \"$TEST_PASSWORD\"
}" "401" "错误用户名登录"

# 2.3 错误密码登录
api_request "POST" "/login" "{
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"wrongpassword\"
}" "401" "错误密码登录"

# 2.4 无效数据登录
api_request "POST" "/login" "{
    \"username\": \"\",
    \"password\": \"\"
}" "400" "无效数据登录"

echo ""

# 3. JWT认证测试
print_step "3" "JWT认证功能测试"

if [ -n "$JWT_TOKEN" ]; then
    # 3.1 有效JWT访问受保护接口
    echo -e "${YELLOW}执行测试: 有效JWT访问受保护接口${NC}"
    protected_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{
            \"title\": \"测试文章\",
            \"content\": \"这是一篇测试文章\",
            \"summary\": \"测试摘要\"
        }" \
        "$BASE_URL/posts")
    
    protected_code=$(echo "$protected_response" | tail -n1)
    protected_body=$(echo "$protected_response" | head -n -1)
    
    echo "响应状态码: $protected_code"
    echo "响应内容: $protected_body"
    
    if [ "$protected_code" = "201" ]; then
        print_result "有效JWT访问受保护接口" "PASS" "成功创建文章"
    else
        print_result "有效JWT访问受保护接口" "FAIL" "状态码: $protected_code"
    fi
    
    # 3.2 无效JWT访问受保护接口
    echo -e "${YELLOW}执行测试: 无效JWT访问受保护接口${NC}"
    invalid_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer invalid_token" \
        -d "{
            \"title\": \"测试文章\",
            \"content\": \"这是一篇测试文章\"
        }" \
        "$BASE_URL/posts")
    
    invalid_code=$(echo "$invalid_response" | tail -n1)
    invalid_body=$(echo "$invalid_response" | head -n -1)
    
    echo "响应状态码: $invalid_code"
    echo "响应内容: $invalid_body"
    
    if [ "$invalid_code" = "401" ]; then
        print_result "无效JWT访问受保护接口" "PASS" "正确拒绝无效token"
    else
        print_result "无效JWT访问受保护接口" "FAIL" "状态码: $invalid_code"
    fi
    
    # 3.3 无JWT访问受保护接口
    echo -e "${YELLOW}执行测试: 无JWT访问受保护接口${NC}"
    no_auth_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"测试文章\",
            \"content\": \"这是一篇测试文章\"
        }" \
        "$BASE_URL/posts")
    
    no_auth_code=$(echo "$no_auth_response" | tail -n1)
    no_auth_body=$(echo "$no_auth_response" | head -n -1)
    
    echo "响应状态码: $no_auth_code"
    echo "响应内容: $no_auth_body"
    
    if [ "$no_auth_code" = "401" ]; then
        print_result "无JWT访问受保护接口" "PASS" "正确拒绝无认证请求"
    else
        print_result "无JWT访问受保护接口" "FAIL" "状态码: $no_auth_code"
    fi
else
    echo -e "${RED}⚠️ 跳过JWT认证测试，因为未获取到有效token${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 3))
    TOTAL_TESTS=$((TOTAL_TESTS + 3))
fi

echo ""

# 4. 密码加密验证
print_step "4" "密码加密存储验证"

echo -e "${YELLOW}执行测试: 密码加密存储验证${NC}"
echo "注意: 此测试需要直接查询数据库验证密码是否加密存储"
echo "建议手动检查数据库中用户密码是否为加密后的哈希值"
print_result "密码加密存储验证" "INFO" "需要手动验证数据库中的密码字段"

echo ""

# 显示测试总结
show_summary
