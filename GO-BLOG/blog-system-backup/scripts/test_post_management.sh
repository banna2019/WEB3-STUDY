#!/bin/bash
# 文章管理功能测试脚本
# 文件: scripts/test_post_management.sh

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
TEST_USERNAME="posttest_$(date +%s)"
TEST_EMAIL="posttest_$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
JWT_TOKEN=""
POST_ID=""

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
    echo -e "${PURPLE}文章管理功能测试总结${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！文章管理功能正常${NC}"
        exit 0
    else
        echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，需要检查相关功能${NC}"
        exit 1
    fi
}

# 函数：用户注册和登录
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
echo -e "${PURPLE}文章管理功能测试${NC}"
echo -e "${PURPLE}========================================${NC}"
echo "测试时间: $(date)"
echo "测试URL: $BASE_URL"
echo "测试用户: $TEST_USERNAME"
echo ""

# 设置测试用户
setup_user

# 1. 文章创建功能测试
print_step "1" "文章创建功能测试"

# 1.1 已认证用户创建文章
echo -e "${YELLOW}执行测试: 已认证用户创建文章${NC}"
create_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{
        \"title\": \"测试文章标题\",
        \"content\": \"这是一篇测试文章的内容，用于验证文章创建功能。\",
        \"summary\": \"测试文章摘要\"
    }" \
    "$BASE_URL/posts")

create_code=$(echo "$create_response" | tail -n1)
create_body=$(echo "$create_response" | sed '$d')

echo "响应状态码: $create_code"
echo "响应内容: $create_body"

if [ "$create_code" = "201" ]; then
    print_result "已认证用户创建文章" "PASS" "成功创建文章"
    # 提取文章ID
    POST_ID=$(echo $create_body | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "创建的文章ID: $POST_ID"
else
    print_result "已认证用户创建文章" "FAIL" "状态码: $create_code"
fi

# 1.2 未认证用户创建文章
api_request "POST" "/posts" "{
    \"title\": \"未认证用户文章\",
    \"content\": \"这是未认证用户尝试创建的文章\"
}" "401" "未认证用户创建文章"

# 1.3 无效数据创建文章
api_request "POST" "/posts" "{
    \"title\": \"\",
    \"content\": \"\"
}" "400" "无效数据创建文章" "$JWT_TOKEN"

# 1.4 缺少必填字段创建文章
api_request "POST" "/posts" "{
    \"title\": \"只有标题的文章\"
}" "400" "缺少内容字段创建文章" "$JWT_TOKEN"

echo ""

# 2. 文章读取功能测试
print_step "2" "文章读取功能测试"

# 2.1 获取所有文章列表
api_request "GET" "/posts" "" "200" "获取所有文章列表"

# 2.2 获取单个文章详情
if [ -n "$POST_ID" ]; then
    api_request "GET" "/posts/$POST_ID" "" "200" "获取单个文章详情"
else
    print_result "获取单个文章详情" "INFO" "跳过测试，因为未创建文章"
fi

# 2.3 获取不存在的文章
api_request "GET" "/posts/99999" "" "404" "获取不存在的文章"

echo ""

# 3. 文章更新功能测试
print_step "3" "文章更新功能测试"

if [ -n "$POST_ID" ]; then
    # 3.1 文章作者更新自己的文章
    api_request "PUT" "/posts/$POST_ID" "{
        \"title\": \"更新后的文章标题\",
        \"content\": \"这是更新后的文章内容\",
        \"summary\": \"更新后的摘要\"
    }" "200" "文章作者更新自己的文章" "$JWT_TOKEN"
    
    # 3.2 验证文章是否已更新
    echo -e "${YELLOW}执行测试: 验证文章更新结果${NC}"
    verify_response=$(curl -s -X GET "$BASE_URL/posts/$POST_ID")
    echo "更新后的文章内容: $verify_response"
    
    if echo "$verify_response" | grep -q "更新后的文章标题"; then
        print_result "验证文章更新结果" "PASS" "文章内容已成功更新"
    else
        print_result "验证文章更新结果" "FAIL" "文章内容未更新"
    fi
else
    print_result "文章作者更新自己的文章" "INFO" "跳过测试，因为未创建文章"
fi

# 3.3 未认证用户更新文章
if [ -n "$POST_ID" ]; then
    api_request "PUT" "/posts/$POST_ID" "{
        \"title\": \"未认证用户尝试更新\",
        \"content\": \"未认证用户尝试更新的内容\"
    }" "401" "未认证用户更新文章"
else
    print_result "未认证用户更新文章" "INFO" "跳过测试，因为未创建文章"
fi

# 3.4 更新不存在的文章
api_request "PUT" "/posts/99999" "{
    \"title\": \"更新不存在的文章\",
    \"content\": \"尝试更新不存在的文章\"
}" "404" "更新不存在的文章" "$JWT_TOKEN"

echo ""

# 4. 文章删除功能测试
print_step "4" "文章删除功能测试"

if [ -n "$POST_ID" ]; then
    # 4.1 文章作者删除自己的文章
    api_request "DELETE" "/posts/$POST_ID" "" "200" "文章作者删除自己的文章" "$JWT_TOKEN"
    
    # 4.2 验证文章是否已删除
    echo -e "${YELLOW}执行测试: 验证文章删除结果${NC}"
    verify_delete_response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/posts/$POST_ID")
    verify_delete_code=$(echo "$verify_delete_response" | tail -n1)
    
    echo "删除验证响应状态码: $verify_delete_code"
    
    if [ "$verify_delete_code" = "404" ]; then
        print_result "验证文章删除结果" "PASS" "文章已成功删除"
    else
        print_result "验证文章删除结果" "FAIL" "文章未删除，状态码: $verify_delete_code"
    fi
else
    print_result "文章作者删除自己的文章" "INFO" "跳过测试，因为未创建文章"
fi

# 4.3 未认证用户删除文章
api_request "DELETE" "/posts/1" "" "401" "未认证用户删除文章"

# 4.4 删除不存在的文章
api_request "DELETE" "/posts/99999" "" "404" "删除不存在的文章" "$JWT_TOKEN"

echo ""

# 5. 权限控制测试
print_step "5" "权限控制测试"

# 创建第二个用户进行权限测试
echo -e "${YELLOW}创建第二个用户进行权限测试...${NC}"
TEST_USERNAME2="posttest2_$(date +%s)"
TEST_EMAIL2="posttest2_$(date +%s)@example.com"

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
    
    # 第二个用户创建文章
    echo -e "${YELLOW}第二个用户创建文章...${NC}"
    create_response2=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN2" \
        -d "{
            \"title\": \"第二个用户的文章\",
            \"content\": \"这是第二个用户创建的文章\",
            \"summary\": \"第二个用户的文章摘要\"
        }" \
        "$BASE_URL/posts")
    
    create_code2=$(echo "$create_response2" | tail -n1)
    create_body2=$(echo "$create_response2" | sed '$d')
    
    echo "第二个用户创建文章响应: $create_body2"
    
    if [ "$create_code2" = "201" ]; then
        POST_ID2=$(echo $create_body2 | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "第二个用户创建的文章ID: $POST_ID2"
        
        # 第一个用户尝试更新第二个用户的文章
        if [ -n "$POST_ID2" ]; then
            api_request "PUT" "/posts/$POST_ID2" "{
                \"title\": \"第一个用户尝试更新第二个用户的文章\",
                \"content\": \"这是第一个用户尝试更新的内容\"
            }" "403" "第一个用户更新第二个用户的文章" "$JWT_TOKEN"
            
            # 第一个用户尝试删除第二个用户的文章
            api_request "DELETE" "/posts/$POST_ID2" "" "403" "第一个用户删除第二个用户的文章" "$JWT_TOKEN"
        fi
    else
        print_result "第二个用户创建文章" "FAIL" "状态码: $create_code2"
    fi
else
    echo -e "${RED}✗ 第二个用户设置失败${NC}"
    print_result "权限控制测试" "INFO" "跳过测试，因为第二个用户设置失败"
fi

echo ""

# 显示测试总结
show_summary
