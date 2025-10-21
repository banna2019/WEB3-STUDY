package main

import (
	"log"

	"blog-system/config"
	"blog-system/database"
	"blog-system/docs"
	"blog-system/handlers"
	"blog-system/models"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title 个人博客系统API
// @version 1.0
// @description 基于Go语言、Gin框架和GORM库开发的个人博客系统后端API文档
// @termsOfService http://swagger.io/terms/

// @contact.name API支持
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT认证，格式: Bearer {token}

func main() {
	// 初始化Swagger文档
	docs.SwaggerInfo.Title = "个人博客系统API"
	docs.SwaggerInfo.Description = "基于Go语言、Gin框架和GORM库开发的个人博客系统后端API文档"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.BasePath = "/api"
	docs.SwaggerInfo.Schemes = []string{"http", "https"}

	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	database.InitDB(cfg)
	defer database.CloseDB()

	// 自动迁移数据库表结构
	if err := models.AutoMigrate(database.GetDB()); err != nil {
		log.Fatal("数据库迁移失败:", err)
	}

	// 设置路由
	r := handlers.SetupRoutes(database.GetDB(), cfg)

	// 添加Swagger路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 启动服务器
	log.Printf("🚀 服务器启动在 %s", cfg.GetServerAddr())
	log.Printf("📚 Swagger文档地址: http://%s/swagger/index.html", cfg.GetServerAddr())
	log.Printf("🔧 运行模式: %s", cfg.App.Env)
	log.Printf("📊 日志级别: %s", cfg.Log.Level)
	log.Printf("🌐 API基础路径: /api")
	log.Printf("🔐 JWT过期时间: %d小时", cfg.JWT.ExpireHours)
	log.Printf("💾 数据库: %s@%s:%d/%s", cfg.Database.Username, cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)
	log.Fatal(r.Run(cfg.GetServerAddr()))
}
