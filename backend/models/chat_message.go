package models

import "time"

type ChatMessage struct {
	ID uint `json:"id" gorm:"primaryKey"`

	TicketID uint   `json:"ticket_id" gorm:"not null;index"`
	Ticket   Ticket `json:"-" gorm:"foreignKey:TicketID"`

	SenderID uint `json:"sender_id" gorm:"not null;index"`
	Sender   User `json:"sender" gorm:"foreignKey:SenderID"`

	MessageText *string `json:"message_text" gorm:"type:text"`
	ImageURL    *string `json:"image_url" gorm:"size:500"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
