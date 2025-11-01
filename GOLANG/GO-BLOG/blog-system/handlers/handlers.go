package handlers

import (
	"fmt"
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
			statusCode = http.StatusBadRequest // 改为400，表示客户端请求错误
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

// GetLastPost 获取最后一篇文章
// @Summary 获取最后一篇文章
// @Description 获取数据库中最后一篇文章的详细信息
// @Tags 文章管理
// @Accept json
// @Produce json
// @Success 200 {object} models.Response{data=models.Post} "获取成功"
// @Failure 404 {object} models.Response "没有找到文章"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /api/posts/last [get]
func (h *PostHandler) GetLastPost(c *gin.Context) {
	post, err := h.postCRUD.GetLastPost()
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "没有找到文章" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, models.Response{
			Code:    statusCode,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "获取最后一篇文章成功",
		Data:    post,
	})
}

// CommentHandler 评论处理器
type CommentHandler struct {
	commentCRUD *models.CommentCRUD
	postCRUD    *models.PostCRUD
}

// NewCommentHandler 创建评论处理器
func NewCommentHandler(commentCRUD *models.CommentCRUD, postCRUD *models.PostCRUD) *CommentHandler {
	return &CommentHandler{
		commentCRUD: commentCRUD,
		postCRUD:    postCRUD,
	}
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
			Code:    http.StatusBadRequest,
			Message: "无效的文章ID",
		})
		return
	}

	// 首先检查文章是否存在
	_, err = h.postCRUD.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Code:    http.StatusNotFound,
			Message: "文章不存在",
		})
		return
	}

	// 获取该文章的评论
	comments, err := h.commentCRUD.GetByPostID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	// 根据评论数量返回不同的响应
	if len(comments) == 0 {
		// 文章存在但没有评论
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "文章存在但暂无评论",
			Data:    []interface{}{}, // 返回空数组
		})
	} else {
		// 文章存在且有评论
		c.JSON(http.StatusOK, models.Response{
			Code:    http.StatusOK,
			Message: "获取评论列表成功",
			Data:    comments,
		})
	}
}

// GetCommentByID 根据评论ID获取评论详情
// @Summary 获取评论详情
// @Description 根据评论ID获取评论的详细信息
// @Tags 评论管理
// @Accept json
// @Produce json
// @Param id path int true "评论ID"
// @Success 200 {object} models.Response "获取成功"
// @Failure 400 {object} models.Response "无效的评论ID"
// @Failure 404 {object} models.Response "评论不存在"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Router /comments/{id} [get]
func (h *CommentHandler) GetCommentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    http.StatusBadRequest,
			Message: "无效的评论ID",
		})
		return
	}

	fmt.Printf("DEBUG: 查询评论ID %d\n", id)
	comment, err := h.commentCRUD.GetByID(uint(id))
	if err != nil {
		fmt.Printf("DEBUG: 评论不存在: %v\n", err)
		c.JSON(http.StatusNotFound, models.Response{
			Code:    http.StatusNotFound,
			Message: "评论不存在",
		})
		return
	}

	fmt.Printf("DEBUG: 找到评论，内容: %s\n", comment.Content)
	c.JSON(http.StatusOK, models.Response{
		Code:    http.StatusOK,
		Message: "获取评论成功",
		Data:    comment,
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

	// 手动验证评论内容长度
	if len(req.Content) == 0 {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "评论内容不能为空",
		})
		return
	}
	if len(req.Content) > 1000 {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "评论内容不能超过1000个字符",
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

	// 首先检查文章是否存在
	_, err = h.postCRUD.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Code:    404,
			Message: "文章不存在",
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

// UpdateComment 更新评论
// @Summary 更新评论
// @Description 更新指定ID的评论内容
// @Tags 评论管理
// @Accept json
// @Produce json
// @Param id path int true "评论ID"
// @Param request body models.CommentRequest true "评论更新请求"
// @Success 200 {object} models.Response{data=models.Comment} "更新成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "未授权"
// @Failure 403 {object} models.Response "权限不足"
// @Failure 404 {object} models.Response "评论不存在"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Security BearerAuth
// @Router /api/comments/{id} [put]
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	// 获取评论ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的评论ID",
		})
		return
	}

	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "未授权",
		})
		return
	}

	// 解析请求体
	var req models.CommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 手动验证评论内容长度
	if len(req.Content) < 1 || len(req.Content) > 1000 {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "评论内容长度必须在1-1000字符之间",
		})
		return
	}

	comment, err := h.commentCRUD.Update(uint(id), &req, userID.(uint))
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "评论不存在" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "权限不足" {
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
		Message: "评论更新成功",
		Data:    comment,
	})
}

// DeleteComment 删除评论
// @Summary 删除评论
// @Description 删除指定ID的评论
// @Tags 评论管理
// @Accept json
// @Produce json
// @Param id path int true "评论ID"
// @Success 200 {object} models.Response "删除成功"
// @Failure 400 {object} models.Response "请求参数错误"
// @Failure 401 {object} models.Response "未授权"
// @Failure 403 {object} models.Response "权限不足"
// @Failure 404 {object} models.Response "评论不存在"
// @Failure 500 {object} models.Response "服务器内部错误"
// @Security BearerAuth
// @Router /api/comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	// 获取评论ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "无效的评论ID",
		})
		return
	}

	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.Response{
			Code:    401,
			Message: "未授权",
		})
		return
	}

	err = h.commentCRUD.Delete(uint(id), userID.(uint))
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "评论不存在" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "权限不足" {
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
		Message: "评论删除成功",
	})
}
