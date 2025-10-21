package models

import (
	"time"

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
	PostCount int        `gorm:"default:0;comment:文章数量统计" json:"post_count"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 一对多关系：一个用户可以发布多篇文章
	Posts []Post `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"posts,omitempty"`

	// 一对多关系：一个用户可以发表多个评论
	Comments []Comment `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// Post 文章模型
type Post struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Title     string     `gorm:"not null;size:200;comment:文章标题" json:"title"`
	Content   string     `gorm:"not null;type:longtext;comment:文章内容" json:"content"`
	Summary   string     `gorm:"size:500;comment:文章摘要" json:"summary"`
	Status    string     `gorm:"default:published;size:20;comment:文章状态" json:"status"`
	UserID    uint       `gorm:"not null;index;comment:作者ID" json:"user_id"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 多对一关系：多篇文章属于一个用户
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 一对多关系：一篇文章可以有多个评论
	Comments []Comment `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

// Comment 评论模型
type Comment struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Content   string     `gorm:"not null;type:text;comment:评论内容" json:"content"`
	UserID    uint       `gorm:"not null;index;comment:评论者ID" json:"user_id"`
	PostID    uint       `gorm:"not null;index;comment:文章ID" json:"post_id"`
	CreatedAt time.Time  `gorm:"autoCreateTime;comment:创建时间" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime;comment:更新时间" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index;comment:删除时间" json:"deleted_at,omitempty"`

	// 多对一关系：多个评论属于一个用户
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`

	// 多对一关系：多个评论属于一篇文章
	Post Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE" json:"post,omitempty"`
}

// 请求结构体
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type PostRequest struct {
	Title   string `json:"title" binding:"required,max=200"`
	Content string `json:"content" binding:"required"`
	Summary string `json:"summary"`
}

type CommentRequest struct {
	Content string `json:"content" binding:"required,max=1000"`
}

// 响应结构体
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// AutoMigrate 自动迁移数据库表结构
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&User{}, &Post{}, &Comment{})
}
