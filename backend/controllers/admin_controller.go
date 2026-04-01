package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"crs-ticket-system/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminController struct {
	DB *gorm.DB
}

func NewAdminController(db *gorm.DB) *AdminController {
	return &AdminController{DB: db}
}

func (ac *AdminController) GetDepartments(c *gin.Context) {
	var departments []models.Department
	if err := ac.DB.Find(&departments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch departments"})
		return
	}
	c.JSON(http.StatusOK, departments)
}

func (ac *AdminController) CreateDepartment(c *gin.Context) {
	var payload struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	dept := models.Department{
		Name: strings.TrimSpace(payload.Name),
	}

	if err := ac.DB.Create(&dept).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create department"})
		return
	}

	c.JSON(http.StatusCreated, dept)
}

func (ac *AdminController) UpdateDepartment(c *gin.Context) {
	deptID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	var payload struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	if err := ac.DB.Model(&models.Department{}).
		Where("id = ?", uint(deptID)).
		Update("name", strings.TrimSpace(payload.Name)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update department"})
		return
	}

	var dept models.Department
	ac.DB.First(&dept, uint(deptID))
	c.JSON(http.StatusOK, dept)
}

func (ac *AdminController) DeleteDepartment(c *gin.Context) {
	deptID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	if err := ac.DB.Delete(&models.Department{}, uint(deptID)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete department"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "department deleted"})
}

func (ac *AdminController) GetUsers(c *gin.Context) {
	var users []models.User
	if err := ac.DB.Preload("Department").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (ac *AdminController) CreateUser(c *gin.Context) {
	var payload struct {
		Name         string `json:"name" binding:"required"`
		Email        string `json:"email" binding:"required"`
		Password     string `json:"password" binding:"required"`
		DepartmentID uint   `json:"department_id" binding:"required"`
		Role         string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "all fields are required"})
		return
	}

	role := models.UserRole(strings.ToLower(payload.Role))
	if role != models.RoleAdmin && role != models.RoleUser {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be admin or user"})
		return
	}

	var dept models.Department
	if err := ac.DB.First(&dept, payload.DepartmentID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "department not found"})
		return
	}

	user := models.User{
		Name:         strings.TrimSpace(payload.Name),
		Email:        strings.TrimSpace(payload.Email),
		PasswordHash: payload.Password,
		Role:         role,
		DepartmentID: payload.DepartmentID,
	}

	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	if err := ac.DB.Preload("Department").First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusCreated, user)
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (ac *AdminController) UpdateUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var payload struct {
		Name         string `json:"name"`
		Email        string `json:"email"`
		DepartmentID uint   `json:"department_id"`
		Role         string `json:"role"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	updates := map[string]interface{}{}
	if payload.Name != "" {
		updates["name"] = strings.TrimSpace(payload.Name)
	}
	if payload.Email != "" {
		updates["email"] = strings.TrimSpace(payload.Email)
	}
	if payload.DepartmentID > 0 {
		updates["department_id"] = payload.DepartmentID
	}
	if payload.Role != "" {
		updates["role"] = models.UserRole(strings.ToLower(payload.Role))
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	if err := ac.DB.Model(&models.User{}).Where("id = ?", uint(userID)).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	var user models.User
	ac.DB.Preload("Department").First(&user, uint(userID))
	c.JSON(http.StatusOK, user)
}

func (ac *AdminController) DeleteUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if err := ac.DB.Delete(&models.User{}, uint(userID)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
