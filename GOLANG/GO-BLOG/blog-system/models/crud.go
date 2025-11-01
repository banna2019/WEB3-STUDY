package models

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserCRUD 用户CRUD操作
type UserCRUD struct {
	db *gorm.DB
}

// NewUserCRUD 创建用户CRUD实例
func NewUserCRUD(db *gorm.DB) *UserCRUD {
	return &UserCRUD{db: db}
}

// Create 创建用户
func (u *UserCRUD) Create(req *RegisterRequest) (*User, error) {
	// 检查用户名是否已存在
	var existingUser User
	if err := u.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if err := u.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("邮箱已存在")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	// 创建用户
	user := User{
		Username: req.Username,
		Password: string(hashedPassword),
		Email:    req.Email,
	}

	if err := u.db.Create(&user).Error; err != nil {
		return nil, errors.New("用户创建失败")
	}

	return &user, nil
}

// GetByUsername 根据用户名获取用户
func (u *UserCRUD) GetByUsername(username string) (*User, error) {
	var user User
	if err := u.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, errors.New("用户不存在")
	}
	return &user, nil
}

// VerifyPassword 验证密码
func (u *UserCRUD) VerifyPassword(user *User, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
}

// PostCRUD 文章CRUD操作
type PostCRUD struct {
	db *gorm.DB
}

// NewPostCRUD 创建文章CRUD实例
func NewPostCRUD(db *gorm.DB) *PostCRUD {
	return &PostCRUD{db: db}
}

// GetAll 获取所有文章
func (p *PostCRUD) GetAll() ([]Post, error) {
	var posts []Post
	if err := p.db.Preload("User").Order("created_at DESC").Find(&posts).Error; err != nil {
		return nil, errors.New("获取文章列表失败")
	}
	return posts, nil
}

// GetByID 根据ID获取文章
func (p *PostCRUD) GetByID(id uint) (*Post, error) {
	var post Post
	if err := p.db.Preload("User").Preload("Comments.User").First(&post, id).Error; err != nil {
		return nil, errors.New("文章不存在")
	}
	return &post, nil
}

// Create 创建文章
func (p *PostCRUD) Create(req *PostRequest, userID uint) (*Post, error) {
	post := Post{
		Title:   req.Title,
		Content: req.Content,
		Summary: req.Summary,
		UserID:  userID,
	}

	if err := p.db.Create(&post).Error; err != nil {
		return nil, errors.New("文章创建失败")
	}

	// 预加载用户信息
	p.db.Preload("User").First(&post, post.ID)
	return &post, nil
}

// Update 更新文章
func (p *PostCRUD) Update(id uint, req *PostRequest, userID uint) (*Post, error) {
	var post Post
	if err := p.db.First(&post, id).Error; err != nil {
		return nil, errors.New("文章不存在")
	}

	// 检查权限
	if post.UserID != userID {
		return nil, errors.New("无权限修改此文章")
	}

	// 更新文章
	post.Title = req.Title
	post.Content = req.Content
	post.Summary = req.Summary

	if err := p.db.Save(&post).Error; err != nil {
		return nil, errors.New("文章更新失败")
	}

	// 预加载用户信息
	p.db.Preload("User").First(&post, post.ID)
	return &post, nil
}

// Delete 删除文章
func (p *PostCRUD) Delete(id uint, userID uint) error {
	var post Post
	if err := p.db.First(&post, id).Error; err != nil {
		return errors.New("文章不存在")
	}

	// 检查权限
	if post.UserID != userID {
		return errors.New("无权限删除此文章")
	}

	if err := p.db.Delete(&post).Error; err != nil {
		return errors.New("文章删除失败")
	}

	return nil
}

// GetLastPost 获取最后一篇文章
func (p *PostCRUD) GetLastPost() (*Post, error) {
	var post Post
	if err := p.db.Order("id DESC").First(&post).Error; err != nil {
		return nil, errors.New("没有找到文章")
	}

	// 预加载用户信息
	p.db.Preload("User").First(&post, post.ID)
	return &post, nil
}

// CommentCRUD 评论CRUD操作
type CommentCRUD struct {
	db *gorm.DB
}

// NewCommentCRUD 创建评论CRUD实例
func NewCommentCRUD(db *gorm.DB) *CommentCRUD {
	return &CommentCRUD{db: db}
}

// GetByID 根据评论ID获取评论
func (c *CommentCRUD) GetByID(id uint) (*Comment, error) {
	var comment Comment
	if err := c.db.Preload("User").Preload("Post").First(&comment, id).Error; err != nil {
		return nil, errors.New("评论不存在")
	}
	return &comment, nil
}

// GetByPostID 根据文章ID获取评论
func (c *CommentCRUD) GetByPostID(postID uint) ([]Comment, error) {
	var comments []Comment
	if err := c.db.Preload("User").Where("post_id = ?", postID).Order("created_at ASC").Find(&comments).Error; err != nil {
		return nil, errors.New("获取评论列表失败")
	}
	return comments, nil
}

// Create 创建评论
func (c *CommentCRUD) Create(req *CommentRequest, userID uint, postID uint) (*Comment, error) {
	// 检查文章是否存在
	var post Post
	if err := c.db.First(&post, postID).Error; err != nil {
		return nil, errors.New("文章不存在")
	}

	comment := Comment{
		Content: req.Content,
		UserID:  userID,
		PostID:  postID,
	}

	if err := c.db.Create(&comment).Error; err != nil {
		return nil, errors.New("评论创建失败")
	}

	// 预加载用户信息
	c.db.Preload("User").First(&comment, comment.ID)
	return &comment, nil
}

// Update 更新评论
func (c *CommentCRUD) Update(id uint, req *CommentRequest, userID uint) (*Comment, error) {
	var comment Comment
	if err := c.db.First(&comment, id).Error; err != nil {
		return nil, errors.New("评论不存在")
	}

	// 检查权限：只有评论作者可以更新
	if comment.UserID != userID {
		return nil, errors.New("权限不足")
	}

	comment.Content = req.Content
	if err := c.db.Save(&comment).Error; err != nil {
		return nil, errors.New("评论更新失败")
	}

	// 预加载用户信息
	c.db.Preload("User").First(&comment, comment.ID)
	return &comment, nil
}

// Delete 删除评论
func (c *CommentCRUD) Delete(id uint, userID uint) error {
	var comment Comment
	if err := c.db.First(&comment, id).Error; err != nil {
		return errors.New("评论不存在")
	}

	// 检查权限：只有评论作者可以删除
	if comment.UserID != userID {
		return errors.New("权限不足")
	}

	if err := c.db.Delete(&comment).Error; err != nil {
		return errors.New("评论删除失败")
	}

	return nil
}
