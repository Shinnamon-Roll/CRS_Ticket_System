package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"crs-ticket-system/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	imageURL, err := saveUploadedImage(c, "chat_uploads")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if text == "" && imageURL == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "text or image is required"})
		return
	}

	var textPtr *string
	if text != "" {
		textPtr = &text
	}

	message := models.ChatMessage{
		TicketID:    ticket.ID,
		SenderID:    userID,
		MessageText: textPtr,
		ImageURL:    imageURL,
	}

	if err := cc.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save chat message"})
		return
	}

	if err := cc.DB.Preload("Sender").First(&message, message.ID).Error; err != nil {
		c.JSON(http.StatusCreated, message)
		return
	}

	cc.hub.broadcast(ticket.ID, chatEvent{Type: "message.created", Message: message})
	c.JSON(http.StatusCreated, message)
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

	if ticket.AssigneeID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "chat is available after ticket is assigned"})
		return nil, 0, false
	}

	return &ticket, uint(userID64), true
}

func (cc *ChatController) isTicketParticipant(ticket *models.Ticket, userID uint) bool {
	if ticket == nil || ticket.AssigneeID == nil {
		return false
	}
	return ticket.RequesterID == userID || *ticket.AssigneeID == userID
}

func saveUploadedImage(c *gin.Context, folder string) (*string, error) {
	file, err := c.FormFile("image")
	if err != nil {
		if err == http.ErrMissingFile {
			return nil, nil
		}
		return nil, fmt.Errorf("invalid image upload")
	}

	if file.Size > 10*1024*1024 {
		return nil, fmt.Errorf("image size must not exceed 10MB")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowed[ext] {
		return nil, fmt.Errorf("image must be .jpg, .jpeg, .png, or .webp")
	}

	if err := os.MkdirAll(folder, 0755); err != nil {
		return nil, fmt.Errorf("failed to prepare upload directory")
	}

	fileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.NewString(), ext)
	dst := filepath.Join(folder, fileName)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		return nil, fmt.Errorf("failed to save image")
	}

	url := "/" + folder + "/" + fileName
	return &url, nil
}
