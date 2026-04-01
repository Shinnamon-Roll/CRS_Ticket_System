package routes

import (
	"crs-ticket-system/backend/controllers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAPIRoutes(router *gin.Engine, db *gorm.DB) {
	ticketController := controllers.NewTicketController(db)
	userController := controllers.NewUserController(db)
	chatController := controllers.NewChatController(db)
	adminController := controllers.NewAdminController(db)
	reportController := controllers.NewReportController(db)

	api := router.Group("/api")
	{
		// Tickets
		api.GET("/tickets", ticketController.GetTickets)
		api.GET("/tickets/:id", ticketController.GetTicketByID)
		api.POST("/tickets", ticketController.CreateTicket)
		api.PATCH("/tickets/:id/status", ticketController.UpdateTicketStatus)
		api.PATCH("/tickets/:id/assign", ticketController.AssignTicket)
		api.GET("/tickets/:id/chat-messages", chatController.GetTicketMessages)
		api.POST("/tickets/:id/chat-messages", chatController.CreateTicketMessage)

		// Users & Departments (Admin)
		api.GET("/users", userController.GetUsers)
		api.GET("/admin/departments", adminController.GetDepartments)
		api.POST("/admin/departments", adminController.CreateDepartment)
		api.PATCH("/admin/departments/:id", adminController.UpdateDepartment)
		api.DELETE("/admin/departments/:id", adminController.DeleteDepartment)
		api.GET("/admin/users", adminController.GetUsers)
		api.POST("/admin/users", adminController.CreateUser)
		api.PATCH("/admin/users/:id", adminController.UpdateUser)
		api.DELETE("/admin/users/:id", adminController.DeleteUser)

		// Reports
		api.GET("/admin/reports/overall", reportController.GetOverallStats)
		api.GET("/admin/reports/departments/:department_id", reportController.GetDepartmentStats)
	}

	router.GET("/ws/tickets/:id/chat", chatController.TicketChatWS)
}
