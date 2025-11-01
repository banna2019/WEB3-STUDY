package database

import (
	"log"

	"blog-system/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB 全局数据库连接
var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB(cfg *config.Config) {
	var err error

	// 配置GORM日志
	logLevel := logger.Silent
	switch cfg.Log.Level {
	case "info":
		logLevel = logger.Info
	case "warn":
		logLevel = logger.Warn
	case "error":
		logLevel = logger.Error
	}

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	// 连接MySQL数据库
	DB, err = gorm.Open(mysql.Open(cfg.GetDSN()), gormConfig)
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 获取底层的sql.DB对象进行连接池配置
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("获取数据库连接失败:", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(10)   // 设置空闲连接池中连接的最大数量
	sqlDB.SetMaxOpenConns(100)  // 设置打开数据库连接的最大数量
	sqlDB.SetConnMaxLifetime(0) // 设置连接可复用的最大时间

	log.Println("MySQL数据库连接成功")
}

// GetDB 获取数据库连接实例
func GetDB() *gorm.DB {
	return DB
}

// CloseDB 关闭数据库连接
func CloseDB() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
