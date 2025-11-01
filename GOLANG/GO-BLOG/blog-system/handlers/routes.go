package handlers

import (
	"blog-system/auth"
	"blog-system/config"
	"blog-system/middleware"
	"blog-system/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes 设置路由
func SetupRoutes(db *gorm.DB, cfg *config.Config) *gin.Engine {
	// 设置Gin模式
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		// 开发环境使用debug模式
		gin.SetMode(gin.DebugMode)
	}

	// 创建Gin路由
	r := gin.Default()

	// 中间件
	if cfg.App.Env == "production" {
		r.Use(middleware.LoggerMiddleware())
	} else {
		// 开发环境使用详细的debug日志
		r.Use(middleware.DebugLoggerMiddleware())
	}
	r.Use(middleware.RecoveryMiddleware())
	r.Use(middleware.CORSMiddleware())

	// 创建CRUD实例
	userCRUD := models.NewUserCRUD(db)
	postCRUD := models.NewPostCRUD(db)
	commentCRUD := models.NewCommentCRUD(db)

	// 创建JWT管理器
	jwtManager := auth.NewJWTManager(cfg)

	// 创建处理器实例
	userHandler := NewUserHandler(userCRUD, jwtManager)
	postHandler := NewPostHandler(postCRUD)
	commentHandler := NewCommentHandler(commentCRUD, postCRUD)

	// 根路径欢迎页面
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "欢迎使用个人博客系统API",
			"version": "1.0.0",
			"docs":    "/swagger/index.html",
			"api":     "/api",
			"endpoints": gin.H{
				"posts":    "GET /api/posts",
				"register": "POST /api/register",
				"login":    "POST /api/login",
			},
		})
	})

	// 路由组
	api := r.Group("/api")
	{
		// 公开路由（仅用户注册和登录）
		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)

		// 需要认证的路由
		authGroup := api.Group("/")
		authGroup.Use(jwtManager.AuthMiddleware())
		{
			// 文章管理
			authGroup.GET("/posts", postHandler.GetAllPosts)
			authGroup.GET("/latest-post", postHandler.GetLastPost)
			authGroup.GET("/posts/:id", postHandler.GetPostByID)
			authGroup.POST("/posts", postHandler.CreatePost)
			authGroup.PUT("/posts/:id", postHandler.UpdatePost)
			authGroup.DELETE("/posts/:id", postHandler.DeletePost)

			// 评论管理
			authGroup.GET("/posts/:id/comments", commentHandler.GetPostComments)
			authGroup.GET("/comments/:id", commentHandler.GetCommentByID)
			authGroup.POST("/posts/:id/comments", commentHandler.CreateComment)
			authGroup.PUT("/comments/:id", commentHandler.UpdateComment)
			authGroup.DELETE("/comments/:id", commentHandler.DeleteComment)
		}
	}

	return r
}
