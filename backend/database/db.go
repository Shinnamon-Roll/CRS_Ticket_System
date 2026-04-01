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
	if err := db.AutoMigrate(&models.User{}, &models.Ticket{}); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	if err := seedUsers(db); err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}

	return nil
}

func seedUsers(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	users := []models.User{
		{Name: "IT Admin", Role: models.RoleAdmin, Department: "IT"},
		{Name: "Finance User", Role: models.RoleUser, Department: "Finance"},
		{Name: "HR User", Role: models.RoleUser, Department: "HR"},
	}

	return db.Create(&users).Error
}
