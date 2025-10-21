# 构建阶段
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o blog-system main.go

# 运行阶段
FROM alpine:latest

# 安装ca-certificates用于HTTPS请求
RUN apk --no-cache add ca-certificates

# 创建非root用户
RUN adduser -D -s /bin/sh appuser

# 设置工作目录
WORKDIR /app

# 复制构建的二进制文件
COPY --from=builder /app/blog-system .

# 更改文件所有者
RUN chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV SERVER_PORT=8080
ENV SERVER_HOST=0.0.0.0
ENV DB_HOST=mysql
ENV DB_PORT=3306
ENV DB_USERNAME=root
ENV DB_PASSWORD=password
ENV DB_NAME=blog_system

# 启动应用
CMD ["./blog-system"]
