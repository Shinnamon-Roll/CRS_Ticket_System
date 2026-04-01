package controllers

import (
	"net/http"
	"strconv"

	"crs-ticket-system/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ReportController struct {
	DB *gorm.DB
}

type DepartmentStats struct {
	DepartmentID   uint   `json:"department_id"`
	DepartmentName string `json:"department_name"`
	TotalTickets   int64  `json:"total_tickets"`
	NewTickets     int64  `json:"new_tickets"`
	DoingTickets   int64  `json:"doing_tickets"`
	ReviewTickets  int64  `json:"review_tickets"`
	DoneTickets    int64  `json:"done_tickets"`
	HighPriority   int64  `json:"high_priority"`
	UrgentPriority int64  `json:"urgent_priority"`
}

type OverallStats struct {
	TotalTickets   int64             `json:"total_tickets"`
	NewTickets     int64             `json:"new_tickets"`
	DoingTickets   int64             `json:"doing_tickets"`
	ReviewTickets  int64             `json:"review_tickets"`
	DoneTickets    int64             `json:"done_tickets"`
	HighPriority   int64             `json:"high_priority"`
	UrgentPriority int64             `json:"urgent_priority"`
	ByDepartment   []DepartmentStats `json:"by_department"`
}

func NewReportController(db *gorm.DB) *ReportController {
	return &ReportController{DB: db}
}

func (rc *ReportController) GetOverallStats(c *gin.Context) {
	stats := OverallStats{}

	rc.DB.Model(&models.Ticket{}).Count(&stats.TotalTickets)
	rc.DB.Model(&models.Ticket{}).Where("status = ?", models.StatusRequest).Count(&stats.NewTickets)
	rc.DB.Model(&models.Ticket{}).Where("status = ?", models.StatusDoing).Count(&stats.DoingTickets)
	rc.DB.Model(&models.Ticket{}).Where("status = ?", models.StatusReview).Count(&stats.ReviewTickets)
	rc.DB.Model(&models.Ticket{}).Where("status = ?", models.StatusDone).Count(&stats.DoneTickets)
	rc.DB.Model(&models.Ticket{}).Where("priority IN ?", []string{string(models.PriorityHigh), string(models.PriorityUrgent)}).Count(&stats.HighPriority)
	rc.DB.Model(&models.Ticket{}).Where("priority = ?", models.PriorityUrgent).Count(&stats.UrgentPriority)

	var depts []models.Department
	if err := rc.DB.Find(&depts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}

	for _, dept := range depts {
		deptStats := DepartmentStats{
			DepartmentID:   dept.ID,
			DepartmentName: dept.Name,
		}

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ?", dept.ID).
			Count(&deptStats.TotalTickets)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.status = ?", dept.ID, models.StatusRequest).
			Count(&deptStats.NewTickets)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.status = ?", dept.ID, models.StatusDoing).
			Count(&deptStats.DoingTickets)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.status = ?", dept.ID, models.StatusReview).
			Count(&deptStats.ReviewTickets)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.status = ?", dept.ID, models.StatusDone).
			Count(&deptStats.DoneTickets)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.priority IN ?", dept.ID, []string{string(models.PriorityHigh), string(models.PriorityUrgent)}).
			Count(&deptStats.HighPriority)

		rc.DB.Model(&models.Ticket{}).
			Joins("JOIN users ON tickets.requester_id = users.id").
			Where("users.department_id = ? AND tickets.priority = ?", dept.ID, models.PriorityUrgent).
			Count(&deptStats.UrgentPriority)

		stats.ByDepartment = append(stats.ByDepartment, deptStats)
	}

	c.JSON(http.StatusOK, stats)
}

func (rc *ReportController) GetDepartmentStats(c *gin.Context) {
	deptID, err := strconv.ParseUint(c.Param("department_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid department id"})
		return
	}

	var dept models.Department
	if err := rc.DB.First(&dept, uint(deptID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "department not found"})
		return
	}

	stats := DepartmentStats{
		DepartmentID:   dept.ID,
		DepartmentName: dept.Name,
	}

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ?", deptID).
		Count(&stats.TotalTickets)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.status = ?", deptID, models.StatusRequest).
		Count(&stats.NewTickets)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.status = ?", deptID, models.StatusDoing).
		Count(&stats.DoingTickets)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.status = ?", deptID, models.StatusReview).
		Count(&stats.ReviewTickets)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.status = ?", deptID, models.StatusDone).
		Count(&stats.DoneTickets)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.priority IN ?", deptID, []string{string(models.PriorityHigh), string(models.PriorityUrgent)}).
		Count(&stats.HighPriority)

	rc.DB.Model(&models.Ticket{}).
		Joins("JOIN users ON tickets.requester_id = users.id").
		Where("users.department_id = ? AND tickets.priority = ?", deptID, models.PriorityUrgent).
		Count(&stats.UrgentPriority)

	c.JSON(http.StatusOK, stats)
}
