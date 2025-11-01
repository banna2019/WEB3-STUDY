#!/bin/bash

# JWT密钥生成脚本
# 使用方法: ./generate_jwt_secret.sh

echo "🔐 生成JWT密钥..."
echo ""

# 方法1: 使用OpenSSL
echo "方法1 - 使用OpenSSL:"
SECRET1=$(openssl rand -base64 64)
echo "JWT_SECRET=$SECRET1"
echo ""

# 方法2: 使用Go
echo "方法2 - 使用Go:"
cat > /tmp/generate_secret.go << 'EOF'
package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

func main() {
	b := make([]byte, 64)
	rand.Read(b)
	secret := base64.URLEncoding.EncodeToString(b)
	fmt.Println("JWT_SECRET=" + secret)
}
EOF

SECRET2=$(go run /tmp/generate_secret.go)
echo "$SECRET2"
rm /tmp/generate_secret.go
echo ""

# 方法3: 使用/dev/urandom
echo "方法3 - 使用/dev/urandom:"
SECRET3=$(head -c 64 /dev/urandom | base64 | tr -d '\n')
echo "JWT_SECRET=$SECRET3"
echo ""

echo "✅ 请选择其中一个密钥并更新您的.env文件"
echo "⚠️  注意: 请妥善保管您的JWT密钥，不要泄露给他人"
