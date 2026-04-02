package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"crs-ticket-system/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TicketController struct {
	DB *gorm.DB
}

func NewTicketController(db *gorm.DB) *TicketController {
	return &TicketController{DB: db}
}

func (tc *TicketController) GetTickets(c *gin.Context) {
	var tickets []models.Ticket

	userIDStr := c.Query("user_id")
	var userID uint
	var user models.User

	if userIDStr != "" {
		if id, err := strconv.ParseUint(userIDStr, 10, 64); err == nil {
			userID = uint(id)
			if err := tc.DB.Preload("Department").First(&user, userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
				return
			}
		}
	}

	query := tc.DB.Preload("Requester").Preload("Assignee").Preload("Department").Order("created_at desc")

	if userID > 0 && user.Role == models.RoleUser {
		query = query.Where(
			"(requester_id = ? OR assignee_id = ? OR requester_id IN (SELECT id FROM users WHERE department_id = ?))",
			userID, userID, user.DepartmentID,
		)
	}

	if keyword := strings.TrimSpace(c.Query("q")); keyword != "" {
		like := "%" + strings.ToLower(keyword) + "%"
		query = query.Where(
			"LOWER(ticket_code) LIKE ? OR LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ?",
			like, like, like, like,
		)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if location := strings.TrimSpace(c.Query("location")); location != "" {
		query = query.Where("LOWER(location) LIKE ?", "%"+strings.ToLower(location)+"%")
	}
	if requesterID := c.Query("requester_id"); requesterID != "" {
		if id, err := strconv.ParseUint(requesterID, 10, 64); err == nil {
			query = query.Where("requester_id = ?", uint(id))
		}
	}
	if assigneeID := c.Query("assignee_id"); assigneeID != "" {
		if id, err := strconv.ParseUint(assigneeID, 10, 64); err == nil {
			query = query.Where("assignee_id = ?", uint(id))
		}
	}

	if err := query.Find(&tickets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

func (tc *TicketController) GetTicketByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	var ticket models.Ticket
	if err := tc.DB.Preload("Requester").Preload("Assignee").Preload("Department").First(&ticket, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ticket"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func (tc *TicketController) CreateTicket(c *gin.Context) {
	title := strings.TrimSpace(c.PostForm("title"))
	description := strings.TrimSpace(c.PostForm("description"))
	location := strings.TrimSpace(c.PostForm("location"))
	priorityInput := strings.TrimSpace(c.DefaultPostForm("priority", string(models.PriorityMedium)))
	statusInput := strings.TrimSpace(c.DefaultPostForm("status", string(models.StatusRequest)))
	requesterIDInput := strings.TrimSpace(c.PostForm("requester_id"))
	assigneeIDInput := strings.TrimSpace(c.PostForm("assignee_id"))
	departmentIDInput := strings.TrimSpace(c.PostForm("department_id"))

	if title == "" || description == "" || location == "" || requesterIDInput == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, description, location and requester_id are required"})
		return
	}

	requesterID64, err := strconv.ParseUint(requesterIDInput, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requester_id must be a number"})
		return
	}
	requesterID := uint(requesterID64)

	priority := models.TicketPriority(strings.ToLower(priorityInput))
	if !models.IsValidPriority(priority) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid priority"})
		return
	}

	status := models.TicketStatus(strings.ToLower(statusInput))
	if !models.IsValidStatus(status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	var requester models.User
	if err := tc.DB.First(&requester, requesterID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requester not found"})
		return
	}

	var assigneeID *uint
	if assigneeIDInput != "" {
		parsedID, err := strconv.ParseUint(assigneeIDInput, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "assignee_id must be a number"})
			return
		}
		tmp := uint(parsedID)
		var assignee models.User
		if err := tc.DB.First(&assignee, tmp).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "assignee not found"})
			return
		}
		assigneeID = &tmp
	}

	var departmentID *uint
	if departmentIDInput != "" {
		parsedID, err := strconv.ParseUint(departmentIDInput, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "department_id must be a number"})
			return
		}
		tmp := uint(parsedID)
		var department models.Department
		if err := tc.DB.First(&department, tmp).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "department not found"})
			return
		}
		departmentID = &tmp
	}

	imageURL, err := saveTicketUploadedImage(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ticket := models.Ticket{
		TicketCode:   generateTicketCode(),
		Title:        title,
		Description:  description,
		Location:     location,
		Status:       status,
		Priority:     priority,
		ImageURL:     imageURL,
		RequesterID:  requesterID,
		AssigneeID:   assigneeID,
		DepartmentID: departmentID,
	}

	if err := tc.DB.Create(&ticket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ticket"})
		return
	}

	if err := tc.DB.Preload("Requester").Preload("Assignee").Preload("Department").First(&ticket, ticket.ID).Error; err != nil {
		c.JSON(http.StatusCreated, ticket)
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func generateTicketCode() string {
	return fmt.Sprintf("CRS-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)
}

func (tc *TicketController) UpdateTicketStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	var payload struct {
		Status models.TicketStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}

	payload.Status = models.TicketStatus(strings.ToLower(string(payload.Status)))
	if !models.IsValidStatus(payload.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	result := tc.DB.Model(&models.Ticket{}).Where("id = ?", uint(id)).Update("status", payload.Status)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}

	var ticket models.Ticket
	if err := tc.DB.Preload("Requester").Preload("Assignee").First(&ticket, uint(id)).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "status updated"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func (tc *TicketController) AssignTicket(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	var payload struct {
		AssigneeID uint `json:"assignee_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "assignee_id is required"})
		return
	}

	var assignee models.User
	if err := tc.DB.First(&assignee, payload.AssigneeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "assignee not found"})
		return
	}

	result := tc.DB.Model(&models.Ticket{}).Where("id = ?", uint(id)).Update("assignee_id", payload.AssigneeID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign ticket"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}

	var ticket models.Ticket
	if err := tc.DB.Preload("Requester").Preload("Assignee").First(&ticket, uint(id)).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "ticket assigned"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func saveTicketUploadedImage(c *gin.Context) (*string, error) {
	return saveSingleImageFromField(c, "image", "uploads")
}
