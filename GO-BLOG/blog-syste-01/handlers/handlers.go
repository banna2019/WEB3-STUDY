package handlers

import (
	"net/http"
	"strconv"

	"blog-system/auth"
	"blog-system/models"

	"github.com/gin-gonic/gin"
)

// UserHandler 用户处理器
type UserHandler struct {
	userCRUD   *models.UserCRUD
	jwtManager *auth.JWTManager
}

// NewUserHandler 创建用户处理器
func NewUserHandler(userCRUD *models.UserCRUD, jwtManager *auth.JWTManager) *UserHandler {
	return &UserHandler{
		userCRUD:   userCRUD,
		jwtManager: jwtManager,
	}
}

// Register 用户注册
// @Summary 用户注册
// @Description 创建新用户账户
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "注册信息"
// @Success 201 {object} models.Response "注册成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 409 {object} models.Response "用户名或邮箱已存在"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	user, err := h.userCRUD.Create(&req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "用户名已存在" || err.Error() == "邮箱已存在" {
			statusCode = http.StatusConflict
		}
		c.JSON(statusCode, models.Response{
			Code:    statusCode,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Code:    201,
		Message: "用户注册成功",
		Data: gin.H{
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// Login 用户登录
// @Summary 用户登录
// @Description 用户登录获取JWT令牌
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "登录信息"
// @Success 200 {object} models.Response "登录成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "用户名或密码错误"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	user, err := h.userCRUD.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "用户名或密码错误",
		})
		return
	}

	if err := h.userCRUD.VerifyPassword(user, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "用户名或密码错误",
		})
		return
	}

	token, err := h.jwtManager.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "令牌生成失败",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "登录成功",
		Data: gin.H{
			"token":    token,
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// PostHandler 文章处理器
type PostHandler struct {
	postCRUD *models.PostCRUD
}

// NewPostHandler 创建文章处理器
func NewPostHandler(postCRUD *models.PostCRUD) *PostHandler {
	return &PostHandler{postCRUD: postCRUD}
}

// GetAllPosts 获取所有文章
// @Summary 获取所有文章
// @Description 获取文章列表，按创建时间倒序排列
// @Tags 文章管理
// @Accept json
// @Produce json
// @Success 200 {object} models.Response "获取成功"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /posts [get]
func (h *PostHandler) GetAllPosts(c *gin.Context) {
	posts, err := h.postCRUD.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "获取文章列表成功",
		Data:    posts,
	})
}

// GetPostByID 根据ID获取文章
// @Summary 获取单个文章
// @Description 根据文章ID获取文章详情，包含评论信息
// @Tags 文章管理
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} models.Response "获取成功"
// @Failure 400 {object} models.Response "无效的文章ID"
// @Failure 404 {object} models.Response "文章不存在"
// @Router /posts/{id} [get]
func (h *PostHandler) GetPostByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的文章ID",
		})
		return
	}

	post, err := h.postCRUD.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "获取文章成功",
		Data:    post,
	})
}

// CreatePost 创建文章
// @Summary 创建文章
// @Description 创建新文章，需要JWT认证
// @Tags 文章管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.PostRequest true "文章信息"
// @Success 201 {object} models.Response "创建成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "未授权"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /posts [post]
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req models.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	userID, err := auth.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "获取用户信息失败",
		})
		return
	}

	post, err := h.postCRUD.Create(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Code:    201,
		Message: "文章创建成功",
		Data:    post,
	})
}

// UpdatePost 更新文章
// @Summary 更新文章
// @Description 更新文章内容，只有作者可以修改
// @Tags 文章管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "文章ID"
// @Param request body models.PostRequest true "文章信息"
// @Success 200 {object} models.Response "更新成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "未授权"
// @Failure 403 {object} models.Response "无权限修改此文章"
// @Failure 404 {object} models.Response "文章不存在"
// @Router /posts/{id} [put]
func (h *PostHandler) UpdatePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的文章ID",
		})
		return
	}

	var req models.PostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	userID, err := auth.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "获取用户信息失败",
		})
		return
	}

	post, err := h.postCRUD.Update(uint(id), &req, userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "文章不存在" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "无权限修改此文章" {
			statusCode = http.StatusForbidden
		}
		c.JSON(statusCode, models.Response{
			Code:    statusCode,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "文章更新成功",
		Data:    post,
	})
}

// DeletePost 删除文章
// @Summary 删除文章
// @Description 删除文章，只有作者可以删除
// @Tags 文章管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "文章ID"
// @Success 200 {object} models.Response "删除成功"
// @Failure 400 {object} models.Response "无效的文章ID"
// @Failure 401 {object} models.Response "未授权"
// @Failure 403 {object} models.Response "无权限删除此文章"
// @Failure 404 {object} models.Response "文章不存在"
// @Router /posts/{id} [delete]
func (h *PostHandler) DeletePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的文章ID",
		})
		return
	}

	userID, err := auth.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "获取用户信息失败",
		})
		return
	}

	err = h.postCRUD.Delete(uint(id), userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "文章不存在" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "无权限删除此文章" {
			statusCode = http.StatusForbidden
		}
		c.JSON(statusCode, models.Response{
			Code:    statusCode,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "文章删除成功",
	})
}

// CommentHandler 评论处理器
type CommentHandler struct {
	commentCRUD *models.CommentCRUD
}

// NewCommentHandler 创建评论处理器
func NewCommentHandler(commentCRUD *models.CommentCRUD) *CommentHandler {
	return &CommentHandler{commentCRUD: commentCRUD}
}

// GetPostComments 获取文章评论
// @Summary 获取文章评论
// @Description 获取指定文章的所有评论
// @Tags 评论管理
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} models.Response "获取成功"
// @Failure 400 {object} models.Response "无效的文章ID"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /posts/{id}/comments [get]
func (h *CommentHandler) GetPostComments(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的文章ID",
		})
		return
	}

	comments, err := h.commentCRUD.GetByPostID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "获取评论列表成功",
		Data:    comments,
	})
}

// CreateComment 创建评论
// @Summary 创建评论
// @Description 为指定文章创建评论，需要JWT认证
// @Tags 评论管理
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "文章ID"
// @Param request body models.CommentRequest true "评论信息"
// @Success 201 {object} models.Response "创建成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "未授权"
// @Failure 404 {object} models.Response "文章不存在"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /posts/{id}/comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的文章ID",
		})
		return
	}

	var req models.CommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	userID, err := auth.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "获取用户信息失败",
		})
		return
	}

	comment, err := h.commentCRUD.Create(&req, userID, uint(id))
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "文章不存在" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, models.Response{
			Code:    statusCode,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Code:    201,
		Message: "评论创建成功",
		Data:    comment,
	})
}
