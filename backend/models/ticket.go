package models

import "time"

type TicketStatus string

type TicketPriority string

const (
	StatusRequest TicketStatus = "request"
	StatusDoing   TicketStatus = "doing"
	StatusReview  TicketStatus = "review"
	StatusDone    TicketStatus = "done"
)

const (
	PriorityLow    TicketPriority = "low"
	PriorityMedium TicketPriority = "medium"
	PriorityHigh   TicketPriority = "high"
	PriorityUrgent TicketPriority = "urgent"
)

type Ticket struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TicketCode  string         `json:"ticket_code" gorm:"size:40;not null;uniqueIndex"`
	Title       string         `json:"title" gorm:"size:255;not null"`
	Description string         `json:"description" gorm:"type:text;not null"`
	Location    string         `json:"location" gorm:"size:255;not null"`
	Status      TicketStatus   `json:"status" gorm:"type:varchar(20);not null;default:request"`
	Priority    TicketPriority `json:"priority" gorm:"type:varchar(20);not null;default:medium"`
	ImageURL    *string        `json:"image_url" gorm:"size:500"`

	RequesterID uint `json:"requester_id" gorm:"not null"`
	Requester   User `json:"requester" gorm:"foreignKey:RequesterID"`

	AssigneeID *uint `json:"assignee_id"`
	Assignee   *User `json:"assignee" gorm:"foreignKey:AssigneeID"`

	DepartmentID *uint       `json:"department_id"`
	Department   *Department `json:"department" gorm:"foreignKey:DepartmentID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func IsValidStatus(status TicketStatus) bool {
	switch status {
	case StatusRequest, StatusDoing, StatusReview, StatusDone:
		return true
	default:
		return false
	}
}

func IsValidPriority(priority TicketPriority) bool {
	switch priority {
	case PriorityLow, PriorityMedium, PriorityHigh, PriorityUrgent:
		return true
	default:
		return false
	}
}
