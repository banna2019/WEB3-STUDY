package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config 应用配置结构
type Config struct {
	// 数据库配置
	Database DatabaseConfig

	// 服务器配置
	Server ServerConfig

	// JWT配置
	JWT JWTConfig

	// 日志配置
	Log LogConfig

	// 应用配置
	App AppConfig
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host      string
	Port      int
	Username  string
	Password  string
	Name      string
	Charset   string
	ParseTime bool
	Loc       string
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port string
	Host string
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret      []byte
	ExpireHours int
}

// LogConfig 日志配置
type LogConfig struct {
	Level  string
	Format string
}

// AppConfig 应用配置
type AppConfig struct {
	Name    string
	Version string
	Env     string
}

// Load 加载配置
func Load() *Config {
	// 尝试加载.env文件
	if err := godotenv.Load(); err != nil {
		log.Println("未找到.env文件，使用系统环境变量")
	}

	return &Config{
		Database: DatabaseConfig{
			Host:      getEnv("DB_HOST", "localhost"),
			Port:      getEnvAsInt("DB_PORT", 3306),
			Username:  getEnv("DB_USERNAME", "root"),
			Password:  getEnv("DB_PASSWORD", "password"),
			Name:      getEnv("DB_NAME", "blog_system"),
			Charset:   getEnv("DB_CHARSET", "utf8mb4"),
			ParseTime: getEnvAsBool("DB_PARSE_TIME", true),
			Loc:       getEnv("DB_LOC", "Local"),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
		},
		JWT: JWTConfig{
			Secret:      []byte(getEnv("JWT_SECRET", "your_secret_key_change_in_production")),
			ExpireHours: getEnvAsInt("JWT_EXPIRE_HOURS", 24),
		},
		Log: LogConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
		App: AppConfig{
			Name:    getEnv("APP_NAME", "Blog System"),
			Version: getEnv("APP_VERSION", "1.0.0"),
			Env:     getEnv("APP_ENV", "development"),
		},
	}
}

// GetDSN 获取数据库连接字符串
func (c *Config) GetDSN() string {
	return c.Database.Username + ":" + c.Database.Password + "@tcp(" +
		c.Database.Host + ":" + strconv.Itoa(c.Database.Port) + ")/" +
		c.Database.Name + "?charset=" + c.Database.Charset +
		"&parseTime=" + strconv.FormatBool(c.Database.ParseTime) +
		"&loc=" + c.Database.Loc
}

// GetServerAddr 获取服务器地址
func (c *Config) GetServerAddr() string {
	return c.Server.Host + ":" + c.Server.Port
}

// GetJWTExpireTime 获取JWT过期时间
func (c *Config) GetJWTExpireTime() time.Duration {
	return time.Duration(c.JWT.ExpireHours) * time.Hour
}

// 辅助函数
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
