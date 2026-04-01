package models

import "time"

type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

type User struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Name         string     `json:"name" gorm:"size:120;not null"`
	Email        string     `json:"email" gorm:"size:255;not null;uniqueIndex"`
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	Role         UserRole   `json:"role" gorm:"type:varchar(20);not null;default:user"`
	DepartmentID uint       `json:"department_id" gorm:"not null;index"`
	Department   Department `json:"department" gorm:"foreignKey:DepartmentID"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
