package auth

import (
	"errors"
	"net/http"
	"time"

	"blog-system/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Claims JWT声明
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// JWTManager JWT管理器
type JWTManager struct {
	secret      []byte
	expireHours int
}

// NewJWTManager 创建JWT管理器
func NewJWTManager(cfg *config.Config) *JWTManager {
	return &JWTManager{
		secret:      cfg.JWT.Secret,
		expireHours: cfg.JWT.ExpireHours,
	}
}

// GenerateToken 生成JWT令牌
func (j *JWTManager) GenerateToken(userID uint, username string) (string, error) {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(j.expireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(j.secret)
	if err != nil {
		return "", errors.New("令牌生成失败")
	}

	return tokenString, nil
}

// ParseToken 解析JWT令牌
func (j *JWTManager) ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return j.secret, nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("无效的认证令牌")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("无效的认证令牌")
	}

	return claims, nil
}

// AuthMiddleware JWT认证中间件
func (j *JWTManager) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "缺少认证令牌",
			})
			c.Abort()
			return
		}

		// 移除 "Bearer " 前缀
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// 解析JWT
		claims, err := j.ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "无效的认证令牌",
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

// GetUserID 从上下文中获取用户ID
func GetUserID(c *gin.Context) (uint, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, errors.New("用户ID不存在")
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, errors.New("用户ID类型错误")
	}

	return id, nil
}

// GetUsername 从上下文中获取用户名
func GetUsername(c *gin.Context) (string, error) {
	username, exists := c.Get("username")
	if !exists {
		return "", errors.New("用户名不存在")
	}

	name, ok := username.(string)
	if !ok {
		return "", errors.New("用户名类型错误")
	}

	return name, nil
}
