package database

import (
	"fmt"
	"log"
	"os"

	"crs-ticket-system/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func Connect() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn != "" {
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
		if err == nil {
			if err := migrateAndSeed(db); err != nil {
				return nil, err
			}
			return db, nil
		}

		log.Printf("warning: failed to connect PostgreSQL, fallback to SQLite: %v", err)
	}

	sqlitePath := os.Getenv("SQLITE_PATH")
	if sqlitePath == "" {
		sqlitePath = "crs_ticket_system.db"
	}

	db, err := gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect SQLite fallback database: %w", err)
	}

	if err := migrateAndSeed(db); err != nil {
		return nil, err
	}

	log.Printf("info: using SQLite fallback database at %s", sqlitePath)
	return db, nil
}

func migrateAndSeed(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.Department{},
		&models.User{},
		&models.Ticket{},
		&models.ChatMessage{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	if err := seedDeparttmentsAndUsers(db); err != nil {
		return fmt.Errorf("failed to seed departments and users: %w", err)
	}

	return nil
}

func seedDeparttmentsAndUsers(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Department{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	departments := []models.Department{
		{Name: "IT Support"},
		{Name: "Accounting"},
		{Name: "Front Office"},
		{Name: "IT Network"},
	}

	if err := db.Create(&departments).Error; err != nil {
		return err
	}

	hashPassword := func(pwd string) string {
		return pwd
	}

	var depts []models.Department
	if err := db.Find(&depts).Error; err != nil {
		return err
	}

	users := []models.User{
		{
			Name:         "System Admin",
			Email:        "admin@crs.local",
			PasswordHash: hashPassword("admin123"),
			Role:         models.RoleAdmin,
			DepartmentID: depts[0].ID,
		},
		{
			Name:         "IT Support Staff",
			Email:        "it@crs.local",
			PasswordHash: hashPassword("it123"),
			Role:         models.RoleUser,
			DepartmentID: depts[0].ID,
		},
		{
			Name:         "Accounting Staff",
			Email:        "accounting@crs.local",
			PasswordHash: hashPassword("accounting123"),
			Role:         models.RoleUser,
			DepartmentID: depts[1].ID,
		},
		{
			Name:         "Front Office Staff",
			Email:        "frontoffice@crs.local",
			PasswordHash: hashPassword("frontoffice123"),
			Role:         models.RoleUser,
			DepartmentID: depts[2].ID,
		},
	}

	return db.Create(&users).Error
}
