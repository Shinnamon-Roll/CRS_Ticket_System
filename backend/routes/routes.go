package routes

import (
	"crs-ticket-system/backend/controllers"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAPIRoutes(router *gin.Engine, db *gorm.DB) {
	ticketController := controllers.NewTicketController(db)
	userController := controllers.NewUserController(db)

	api := router.Group("/api")
	{
		api.GET("/tickets", ticketController.GetTickets)
		api.GET("/tickets/:id", ticketController.GetTicketByID)
		api.POST("/tickets", ticketController.CreateTicket)
		api.PATCH("/tickets/:id/status", ticketController.UpdateTicketStatus)
		api.PATCH("/tickets/:id/assign", ticketController.AssignTicket)
		api.GET("/users", userController.GetUsers)
	}
}
