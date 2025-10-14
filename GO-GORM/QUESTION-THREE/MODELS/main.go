package main

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string     `gorm:"unique;not null;size:50;comment:用户名" json:"username"`
	Email     string     `gorm:"unique;not null;size:100;comment:邮箱" json:"email"`
	Password  string     `gorm:"not null;size:255;comment:密码" json:"-"`
	Nickname  string     `gorm:"size:50;comment:昵称" json:"nickname"`
	Avatar    string     `gorm:"size:255;comment:头像URL" json:"avatar"`
	Bio       string     `gorm:"type:text;comment:个人简介" json:"bio"`
	IsActive  bool       `gorm:"default:true;comment:是否激活" json:"is_active"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 一对多关系：一个用户可以发布多篇文章
	Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`
}

// Post 文章模型
type Post struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
	Content     string     `gorm:"type:longtext;not null;comment:文章内容" json:"content"`
	Summary     string     `gorm:"type:text;comment:文章摘要" json:"summary"`
	Slug        string     `gorm:"unique;size:255;comment:URL别名" json:"slug"`
	Status      string     `gorm:"default:'draft';size:20;comment:文章状态" json:"status"` // draft, published, archived
	ViewCount   int        `gorm:"default:0;comment:浏览次数" json:"view_count"`
	LikeCount   int        `gorm:"default:0;comment:点赞次数" json:"like_count"`
	IsTop       bool       `gorm:"default:false;comment:是否置顶" json:"is_top"`
	PublishedAt *time.Time `gorm:"comment:发布时间" json:"published_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：文章属于某个用户
	UserID uint `gorm:"not null;comment:用户ID" json:"user_id"`
	User   User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 一对多关系：一篇文章可以有多个评论
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// Comment 评论模型
type Comment struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string     `gorm:"type:text;not null;comment:评论内容" json:"content"`
	Status    string     `gorm:"default:'pending';size:20;comment:评论状态" json:"status"` // pending, approved, rejected
	IPAddress string     `gorm:"size:45;comment:IP地址" json:"ip_address"`
	UserAgent string     `gorm:"size:500;comment:用户代理" json:"user_agent"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 外键：评论属于某篇文章
	PostID uint `gorm:"not null;comment:文章ID" json:"post_id"`
	Post   Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`

	// 外键：评论可能属于某个用户（游客评论时为空）
	UserID *uint `gorm:"comment:用户ID" json:"user_id"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`

	// 自引用：支持评论回复
	ParentID *uint     `gorm:"comment:父评论ID" json:"parent_id"`
	Parent   *Comment  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Replies  []Comment `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"replies,omitempty"`
}

func main() {
	/*
	   博客系统模型定义和数据库表创建
	   流程：
	   1.定义数据库连接环境变量
	   2.检查数据库是否存在,不存在则创建
	   3.连接数据库
	   4.使用GORM自动迁移创建表结构
	   5.验证表创建结果
	   6.显示表结构信息
	*/
	// 1.批量定义数据库连接环境变量
	var (
		DB_USER     = "root"
		DB_PASSWORD = "root123456"
		DB_HOST     = "127.0.0.1"
		DB_PORT     = 3306
		DB_NAME     = "blog_system"
	)

	// 2.先判断数据库是否存在,不存在则创建
	fmt.Println("====== 检查数据库是否存在 ======")
	err := createDatabaseIfNotExists(DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
	if err != nil {
		panic(fmt.Sprintf("====== 创建数据库失败！: %v ======\n", err))
	}
	fmt.Println()

	// 3.连接数据库
	fmt.Println("====== 连接数据库 ======")
	db, err := connectToDatabase(DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)
	if err != nil {
		panic(fmt.Sprintf("====== 连接数据库失败！: %v ======\n", err))
	}
	fmt.Printf("====== 成功连接到数据库 '%s' ======\n", DB_NAME)
	fmt.Println()

	// 4.使用GORM自动迁移创建表结构
	fmt.Println("====== 开始创建博客系统表结构 ======")
	err = db.AutoMigrate(&User{}, &Post{}, &Comment{})
	if err != nil {
		panic(fmt.Sprintf("====== 创建表结构失败！: %v ======\n", err))
	}
	fmt.Println("====== 博客系统表结构创建成功 ======")
	fmt.Println()

	// 5.验证表创建结果
	fmt.Println("====== 验证表创建结果 ======")
	err = verifyTablesCreated(db)
	if err != nil {
		fmt.Printf("验证表创建失败: %v\n", err)
	} else {
		fmt.Println("====== 所有表创建验证通过 ======")
	}
	fmt.Println()

	// 6.显示表结构信息
	fmt.Println("====== 表结构信息 ======")
	showTableInfo(db)
}

// 检查数据库是否存在,不存在则创建
func createDatabaseIfNotExists(dbName, user, password, host string, port int) error {
	/*
	   // 传入参数：数据库名、用户名、密码、地址、端口
	   dbName: 数据库名
	   user: 用户名
	   password: 密码
	   host: 地址
	   port: 端口

	   返回值：错误信息

	   功能：检查数据库是否存在,不存在则创建

	   流程：
	   1.连接到MySQL服务器(不指定数据库)
	   2.检查数据库是否存在
	   3.如果数据库不存在,则创建
	   4.返回错误信息
	*/
	// 先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
	}

	// 检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("====== 检查数据库是否存在失败！: %v ======\n", err)
	}

	// 如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("====== 创建数据库失败！: %v ======\n", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	return nil
}

// 连接到数据库的统一方法
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
	/*
	   传入参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
	   返回值：数据库连接对象、错误信息
	   功能：连接到数据库
	   流程：
	   1.构建DSN
	   2.连接到数据库
	   3.返回数据库连接对象、错误信息
	*/

	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		if dbName == "" {
			return nil, fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
		} else {
			return nil, fmt.Errorf("====== 连接到数据库 '%s' 失败！: %v ======\n", dbName, err)
		}
	}
	return db, nil
}

// 验证表是否创建成功
func verifyTablesCreated(db *gorm.DB) error {
	/*
		传入参数：数据库连接对象
		返回值：错误信息
		功能：验证表是否创建成功
		流程：
		   1.验证表是否创建成功
		   2.返回错误信息
	*/

	tables := []string{"users", "posts", "comments"}
	for _, table := range tables {
		var count int64
		err := db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", table).Scan(&count).Error
		if err != nil {
			return fmt.Errorf("检查表 %s 失败: %v", table, err)
		}

		if count == 0 {
			return fmt.Errorf("表 %s 未创建", table)
		}

		fmt.Printf("✓ 表 %s 创建成功\n", table)
	}

	return nil
}

// 显示表结构信息
func showTableInfo(db *gorm.DB) {
	/*
		传入参数：数据库连接对象
		返回值：无
		功能：显示表结构信息
		流程：
		   1.显示表结构信息
	*/

	tables := []string{"users", "posts", "comments"}

	for _, table := range tables {
		fmt.Printf("\n--- %s 表结构 ---\n", table)

		var columns []struct {
			Field   string `gorm:"column:Field"`
			Type    string `gorm:"column:Type"`
			Null    string `gorm:"column:Null"`
			Key     string `gorm:"column:Key"`
			Default string `gorm:"column:Default"`
			Extra   string `gorm:"column:Extra"`
		}

		err := db.Raw("DESCRIBE " + table).Scan(&columns).Error
		if err != nil {
			fmt.Printf("获取表 %s 结构失败: %v\n", table, err)
			continue
		}

		fmt.Printf("%-20s %-20s %-5s %-10s %-15s %-10s\n", "字段名", "类型", "空值", "键", "默认值", "额外")
		fmt.Println(strings.Repeat("-", 80))

		for _, col := range columns {
			fmt.Printf("%-20s %-20s %-5s %-10s %-15s %-10s\n",
				col.Field, col.Type, col.Null, col.Key, col.Default, col.Extra)
		}
	}
}
