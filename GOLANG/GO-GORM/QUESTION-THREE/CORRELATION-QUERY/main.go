package main

import (
	"fmt"
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
	Status      string     `gorm:"default:'draft';size:20;comment:文章状态" json:"status"`
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
	Status    string     `gorm:"default:'pending';size:20;comment:评论状态" json:"status"`
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
	   6.查询某个用户发布的所有文章及其对应的评论信息
	   7.查询评论数量最多的文章信息
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

	// 5.创建测试数据验证关联关系
	fmt.Println("====== 创建测试数据验证关联关系 ======")
	err = createTestData(db)
	if err != nil {
		fmt.Printf("创建测试数据失败: %v\n", err)
		return
	}
	fmt.Println("====== 测试数据创建成功 ======")
	fmt.Println()

	// 6.新增功能：查询用户alice发布的所有文章及其对应的评论信息
	// fmt.Println("====== 查询用户alice发布的所有文章及其对应的评论信息 ======")
	// err = queryUserPostsWithComments(db, "alice")
	// if err != nil {
	// 	fmt.Printf("查询用户文章失败: %v\n", err)
	// } else {
	// 	fmt.Println("====== 用户文章查询完成 ======")
	// }
	// fmt.Println()

	// 7.新增功能：查询评论数量最多的文章信息
	// fmt.Println("====== 查询评论数量最多的文章信息 ======")
	// err = queryMostCommentedPost(db)
	// if err != nil {
	// 	fmt.Printf("查询评论最多的文章失败: %v\n", err)
	// } else {
	// 	fmt.Println()
	// 	fmt.Println("====== 评论最多文章查询完成 ======")
	// }

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
	   1. 连接到MySQL服务器(不指定数据库)
	   2. 检查数据库是否存在
	   3. 如果数据库不存在,则创建
	   4. 返回错误信息
	*/
	// 1.先连接到MySQL服务器(不指定数据库)
	db, err := connectToDatabase(user, password, host, port, "")
	if err != nil {
		return fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
	}

	// 2.检查数据库是否存在
	var count int64
	err = db.Raw("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", dbName).Scan(&count).Error
	if err != nil {
		return fmt.Errorf("====== 检查数据库是否存在失败！: %v ======\n", err)
	}

	// 3.如果数据库不存在,则创建
	if count == 0 {
		err = db.Exec(fmt.Sprintf("CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)).Error
		if err != nil {
			return fmt.Errorf("====== 创建数据库失败！: %v ======\n", err)
		}
		fmt.Printf("====== 数据库 '%s' 创建成功 ======\n", dbName)
	} else {
		fmt.Printf("====== 数据库 '%s' 已存在 ======\n", dbName)
	}

	// 4.返回错误信息
	return nil
}

// 连接到数据库的统一方法
func connectToDatabase(user, password, host string, port int, dbName string) (*gorm.DB, error) {
	/*
	   传入参数：用户名、密码、地址、端口、数据库名(为空则不指定数据库)
	   返回值：数据库连接对象、错误信息
	   功能：连接到数据库
	   流程：
	   1. 构建DSN
	   2. 连接到数据库
	   3. 返回数据库连接对象、错误信息
	*/

	// 1.构建DSN
	var dsn string
	if dbName == "" {
		// 不指定数据库,连接到MySQL服务器
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port)
	} else {
		// 指定数据库
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
	}

	// 2.连接到数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		if dbName == "" {
			return nil, fmt.Errorf("====== 连接到MySQL服务器失败！: %v ======\n", err)
		} else {
			return nil, fmt.Errorf("====== 连接到数据库 '%s' 失败！: %v ======\n", dbName, err)
		}
	}

	// 3.返回数据库连接对象、错误信息
	return db, nil
}

// 创建测试数据验证关联关系
func createTestData(db *gorm.DB) error {
	/*
		传入参数：数据库连接对象
		返回值：错误信息
		功能：创建测试数据验证关联关系
		流程：
		   1. 创建用户
		   2. 创建文章
		   3. 创建评论
		   4. 创建评论回复
	*/

	// 1.创建用户
	fmt.Println("创建用户数据...")
	users := []User{
		{
			Username: "alice",
			Email:    "alice@example.com",
			Password: "password123",
			Nickname: "爱丽丝",
			Bio:      "热爱写作的程序员",
			IsActive: true,
		},
		{
			Username: "bob",
			Email:    "bob@example.com",
			Password: "password456",
			Nickname: "鲍勃",
			Bio:      "技术博客作者",
			IsActive: true,
		},
		{
			Username: "charlie",
			Email:    "charlie@example.com",
			Password: "password789",
			Nickname: "查理",
			Bio:      "评论爱好者",
			IsActive: true,
		},
	}

	for i := range users {
		if err := db.Create(&users[i]).Error; err != nil {
			return fmt.Errorf("创建用户失败: %v", err)
		}
		fmt.Printf("✓ 创建用户: %s (ID: %d)\n", users[i].Username, users[i].ID)
	}

	// 2.创建文章
	fmt.Println("\n创建文章数据...")
	now := time.Now()
	posts := []Post{
		{
			Title:       "Go语言入门指南",
			Content:     "Go语言是一门由Google开发的编程语言，具有简洁、高效、并发安全的特点...",
			Summary:     "介绍Go语言的基本概念和特性",
			Slug:        "go-language-guide",
			Status:      "published",
			ViewCount:   150,
			LikeCount:   25,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "GORM使用技巧",
			Content:     "GORM是Go语言中最流行的ORM库之一，提供了丰富的功能...",
			Summary:     "分享GORM的高级使用技巧",
			Slug:        "gorm-tips",
			Status:      "published",
			ViewCount:   200,
			LikeCount:   30,
			IsTop:       false,
			PublishedAt: &now,
			UserID:      users[0].ID, // Alice的文章
		},
		{
			Title:       "数据库设计最佳实践",
			Content:     "良好的数据库设计是应用程序成功的关键因素...",
			Summary:     "探讨数据库设计的原则和方法",
			Slug:        "database-design-best-practices",
			Status:      "published",
			ViewCount:   300,
			LikeCount:   45,
			IsTop:       true,
			PublishedAt: &now,
			UserID:      users[1].ID, // Bob的文章
		},
		{
			Title:     "博客系统架构设计",
			Content:   "设计一个可扩展的博客系统需要考虑多个方面...",
			Summary:   "分析博客系统的架构设计",
			Slug:      "blog-system-architecture",
			Status:    "draft",
			ViewCount: 0,
			LikeCount: 0,
			IsTop:     false,
			UserID:    users[1].ID, // Bob的草稿
		},
	}

	for i := range posts {
		if err := db.Create(&posts[i]).Error; err != nil {
			return fmt.Errorf("创建文章失败: %v", err)
		}
		fmt.Printf("✓ 创建文章: %s (ID: %d, 作者: %s)\n", posts[i].Title, posts[i].ID, users[posts[i].UserID-1].Username)
	}

	// 3.创建评论
	fmt.Println("\n创建评论数据...")
	comments := []Comment{
		{
			Content:   "这篇文章写得很好，学到了很多！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "感谢分享，期待更多关于Go的内容",
			Status:    "approved",
			IPAddress: "192.168.1.101",
			UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			PostID:    posts[0].ID,  // Go语言入门指南的评论
			UserID:    &users[1].ID, // Bob的评论
		},
		{
			Content:   "GORM确实很强大，感谢分享这些技巧",
			Status:    "approved",
			IPAddress: "192.168.1.102",
			UserAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
			PostID:    posts[1].ID,  // GORM使用技巧的评论
			UserID:    &users[2].ID, // Charlie的评论
		},
		{
			Content:   "数据库设计确实很重要，这篇文章很有价值",
			Status:    "approved",
			IPAddress: "192.168.1.103",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[2].ID,  // 数据库设计最佳实践的评论
			UserID:    &users[0].ID, // Alice的评论
		},
		{
			Content:   "游客评论：网站设计得很不错！",
			Status:    "pending",
			IPAddress: "192.168.1.104",
			UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
			PostID:    posts[2].ID, // 数据库设计最佳实践的评论
			UserID:    nil,         // 游客评论
		},
	}

	for i := range comments {
		if err := db.Create(&comments[i]).Error; err != nil {
			return fmt.Errorf("创建评论失败: %v", err)
		}
		author := "游客"
		if comments[i].UserID != nil {
			author = users[*comments[i].UserID-1].Username
		}
		fmt.Printf("✓ 创建评论: %s (ID: %d, 作者: %s)\n", safeSubstring(comments[i].Content, 20), comments[i].ID, author)
	}

	// 4.创建评论回复
	fmt.Println("\n创建评论回复数据...")
	replies := []Comment{
		{
			Content:   "谢谢你的支持！",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[0].ID, // 回复Charlie的评论
		},
		{
			Content:   "我会继续分享更多内容的",
			Status:    "approved",
			IPAddress: "192.168.1.100",
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			PostID:    posts[0].ID,
			UserID:    &users[0].ID,    // Alice回复
			ParentID:  &comments[1].ID, // 回复Bob的评论
		},
	}

	for i := range replies {
		if err := db.Create(&replies[i]).Error; err != nil {
			return fmt.Errorf("创建评论回复失败: %v", err)
		}
		fmt.Printf("✓ 创建回复: %s (ID: %d, 回复评论ID: %d)\n", replies[i].Content, replies[i].ID, *replies[i].ParentID)
	}

	return nil
}

// 安全截取字符串，避免越界
func safeSubstring(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// 查询指定用户发布的所有文章及其对应的评论信息
func queryUserPostsWithComments(db *gorm.DB, username string) error {
	/*
		功能：查询指定用户的所有文章及其评论信息
		参数：
		  - db: 数据库连接对象
		  - username: 用户名
		返回：错误信息
	*/

	// 1.查找用户
	var user User
	err := db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("用户 '%s' 不存在", username)
		}
		return fmt.Errorf("查询用户失败: %v", err)
	}

	fmt.Printf("✓ 找到用户: %s (ID: %d, 昵称: %s)\n", user.Username, user.ID, user.Nickname)

	// 2.查询用户的所有文章，并预加载评论信息
	var posts []Post
	err = db.Where("user_id = ?", user.ID).
		Preload("Comments").
		Preload("Comments.User").
		Order("created_at DESC").
		Find(&posts).Error
	if err != nil {
		return fmt.Errorf("查询用户文章失败: %v", err)
	}

	if len(posts) == 0 {
		fmt.Printf("！用户 '%s' 还没有发布任何文章\n", username)
		return nil
	}

	fmt.Printf("✓ 用户 '%s' 共发布了 %d 篇文章\n", username, len(posts))
	fmt.Println()

	// 3.显示每篇文章及其评论信息
	for i, post := range posts {
		fmt.Printf("====== 【文章 %d】%s ======\n", i+1, post.Title)
		fmt.Printf("内容摘要: %s\n", safeSubstring(post.Content, 50))
		fmt.Printf("状态: %s | 浏览次数: %d | 点赞数: %d\n", post.Status, post.ViewCount, post.LikeCount)
		fmt.Printf("发布时间: %s\n", post.CreatedAt.Format("2006-01-02 15:04:05"))

		// 显示评论信息
		if len(post.Comments) == 0 {
			fmt.Printf("暂无评论\n")
		} else {
			fmt.Printf("评论 (%d 条):\n", len(post.Comments))
			for j, comment := range post.Comments {
				author := "游客"
				if comment.User != nil {
					author = comment.User.Username
				}
				fmt.Printf("    %d. %s (作者: %s, 状态: %s)\n",
					j+1, safeSubstring(comment.Content, 40), author, comment.Status)
			}
		}
		fmt.Println()
	}

	return nil
}

// 查询评论数量最多的文章信息
func queryMostCommentedPost(db *gorm.DB) error {
	/*
		功能：查询评论数量最多的文章信息
		参数：
		  - db: 数据库连接对象
		返回：错误信息
	*/

	fmt.Println("====== 方式一: 使用子查询找到评论数量最多的文章... ======")
	var post Post
	err := db.Preload("User").
		Preload("Comments").
		Preload("Comments.User").
		Where("id = (SELECT post_id FROM comments WHERE deleted_at IS NULL GROUP BY post_id ORDER BY COUNT(*) DESC LIMIT 1)").
		First(&post).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("没有找到任何文章或评论数据")
		}
		return fmt.Errorf("查询评论最多的文章失败: %v", err)
	}

	fmt.Printf("✓ 找到评论最多的文章: %s\n", post.Title)
	fmt.Printf("作者: %s (ID: %d)\n", post.User.Username, post.User.ID)
	fmt.Printf("状态: %s | 浏览次数: %d | 点赞数: %d\n", post.Status, post.ViewCount, post.LikeCount)
	fmt.Printf("发布时间: %s\n", post.CreatedAt.Format("2006-01-02 15:04:05"))
	fmt.Printf("评论数量: %d 条\n", len(post.Comments))
	fmt.Println()

	// 显示评论详情
	if len(post.Comments) > 0 {
		fmt.Println("评论详情:")
		for i, comment := range post.Comments {
			author := "游客"
			if comment.User != nil {
				author = comment.User.Username
			}
			fmt.Printf("  %d.%s\n", i+1, comment.Content)
			fmt.Printf("     作者: %s | 状态: %s | 时间: %s\n",
				author, comment.Status, comment.CreatedAt.Format("2006-01-02 15:04:05"))
			fmt.Println()
		}
	}

	// 方法2: 使用原生SQL查询(备选方案)
	fmt.Println("====== 方式二: 使用原生SQL查询找到评论数量最多的文章... ======")
	fmt.Println("使用原生SQL查询验证结果:")
	var result struct {
		PostID       uint   `json:"post_id"`
		Title        string `json:"title"`
		Author       string `json:"author"`
		CommentCount int    `json:"comment_count"`
	}

	err = db.Raw(`
		SELECT p.id as post_id, p.title, u.username as author, COUNT(c.id) as comment_count
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
		WHERE p.deleted_at IS NULL
		GROUP BY p.id, p.title, u.username
		ORDER BY comment_count DESC
		LIMIT 1
	`).Scan(&result).Error

	if err != nil {
		fmt.Printf("！原生SQL查询失败: %v\n", err)
	} else {
		fmt.Printf("✓ SQL验证结果: 文章 '%s' (作者: %s) 有 %d 条评论\n",
			result.Title, result.Author, result.CommentCount)
	}

	return nil
}
