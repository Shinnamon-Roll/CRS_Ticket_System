package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"crs-ticket-system/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type ChatController struct {
	DB  *gorm.DB
	hub *ticketHub
}

type chatEvent struct {
	Type    string             `json:"type"`
	Message models.ChatMessage `json:"message"`
}

func NewChatController(db *gorm.DB) *ChatController {
	return &ChatController{
		DB:  db,
		hub: newTicketHub(),
	}
}

func (cc *ChatController) GetTicketMessages(c *gin.Context) {
	ticket, userID, ok := cc.authorizeTicketParticipant(c)
	if !ok {
		return
	}

	if !cc.isTicketParticipant(ticket, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only requester and assignee can view chat"})
		return
	}

	var messages []models.ChatMessage
	if err := cc.DB.
		Where("ticket_id = ?", ticket.ID).
		Preload("Sender").
		Order("created_at asc").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch chat messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (cc *ChatController) CreateTicketMessage(c *gin.Context) {
	ticket, userID, ok := cc.authorizeTicketParticipant(c)
	if !ok {
		return
	}

	if !cc.isTicketParticipant(ticket, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only requester and assignee can send messages"})
		return
	}

	text := strings.TrimSpace(c.PostForm("text"))
	imageURLs, err := saveImagesFromFields(c, "chat_uploads", []string{"images", "image"})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if text == "" && len(imageURLs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "text or image is required"})
		return
	}

	var createdMessages []models.ChatMessage

	if len(imageURLs) == 0 {
		var textPtr *string
		if text != "" {
			textCopy := text
			textPtr = &textCopy
		}

		message := models.ChatMessage{
			TicketID:    ticket.ID,
			SenderID:    userID,
			MessageText: textPtr,
		}

		if err := cc.DB.Create(&message).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save chat message"})
			return
		}
		createdMessages = append(createdMessages, message)
	} else {
		for i, imageURL := range imageURLs {
			urlCopy := imageURL
			var textPtr *string
			if i == 0 && text != "" {
				textCopy := text
				textPtr = &textCopy
			}

			message := models.ChatMessage{
				TicketID:    ticket.ID,
				SenderID:    userID,
				MessageText: textPtr,
				ImageURL:    &urlCopy,
			}

			if err := cc.DB.Create(&message).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save chat message"})
				return
			}
			createdMessages = append(createdMessages, message)
		}
	}

	for i := range createdMessages {
		if err := cc.DB.Preload("Sender").First(&createdMessages[i], createdMessages[i].ID).Error; err != nil {
			continue
		}
		cc.hub.broadcast(ticket.ID, chatEvent{Type: "message.created", Message: createdMessages[i]})
	}

	if len(createdMessages) == 1 {
		c.JSON(http.StatusCreated, createdMessages[0])
		return
	}

	c.JSON(http.StatusCreated, gin.H{"messages": createdMessages})
}

func (cc *ChatController) TicketChatWS(c *gin.Context) {
	ticket, userID, ok := cc.authorizeTicketParticipant(c)
	if !ok {
		return
	}

	if !cc.isTicketParticipant(ticket, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only requester and assignee can join chat"})
		return
	}

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	cc.hub.addClient(ticket.ID, userID, conn)
	defer func() {
		cc.hub.removeClient(ticket.ID, conn)
		_ = conn.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			return
		}
	}
}

func (cc *ChatController) authorizeTicketParticipant(c *gin.Context) (*models.Ticket, uint, bool) {
	ticketID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return nil, 0, false
	}

	userID64, err := strconv.ParseUint(c.Query("user_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query is required"})
		return nil, 0, false
	}

	var ticket models.Ticket
	if err := cc.DB.First(&ticket, uint(ticketID64)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
			return nil, 0, false
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load ticket"})
		return nil, 0, false
	}

	return &ticket, uint(userID64), true
}

func (cc *ChatController) isTicketParticipant(ticket *models.Ticket, userID uint) bool {
	if ticket == nil {
		return false
	}
	if ticket.RequesterID == userID {
		return true
	}
	if ticket.AssigneeID != nil && *ticket.AssigneeID == userID {
		return true
	}
	return false
}
