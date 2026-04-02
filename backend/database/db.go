package database

import (
	"fmt"
	"log"
	"os"
	"strings"

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
		// Existing SQLite files from older schema may fail with NOT NULL add-column errors.
		if strings.Contains(err.Error(), "Cannot add a NOT NULL column") {
			log.Printf("warning: sqlite migration incompatible with old schema, recreating database file: %v", err)
			sqlDB, _ := db.DB()
			if sqlDB != nil {
				_ = sqlDB.Close()
			}
			_ = os.Remove(sqlitePath)

			db, err = gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{})
			if err != nil {
				return nil, fmt.Errorf("failed to recreate SQLite fallback database: %w", err)
			}
			if err := migrateAndSeed(db); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
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
	departmentNames := []string{"IT Support", "Accounting", "Front Office", "IT Network"}
	for _, name := range departmentNames {
		var dept models.Department
		if err := db.Where("name = ?", name).First(&dept).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&models.Department{Name: name}).Error; err != nil {
					return err
				}
				continue
			}
			return err
		}
	}

	var adminDept models.Department
	if err := db.Where("name = ?", "IT Support").First(&adminDept).Error; err != nil {
		return err
	}

	// Keep one guaranteed admin login required by user: email=admin password=admin.
	var admin models.User
	err := db.Where("email = ?", "admin").First(&admin).Error
	if err == gorm.ErrRecordNotFound {
		err = db.Where("role = ?", models.RoleAdmin).Order("id asc").First(&admin).Error
	}

	if err == gorm.ErrRecordNotFound {
		adminDeptID := adminDept.ID
		admin = models.User{
			Name:         "System Admin",
			Email:        "admin",
			PasswordHash: "admin",
			LegacyDept:   adminDept.Name,
			Role:         models.RoleAdmin,
			DepartmentID: &adminDeptID,
		}
		if err := db.Create(&admin).Error; err != nil {
			return err
		}
	} else if err != nil {
		return err
	} else {
		adminDeptID := adminDept.ID
		updates := map[string]interface{}{
			"name":          "System Admin",
			"email":         "admin",
			"password_hash": "admin",
			"department":    adminDept.Name,
			"role":          models.RoleAdmin,
			"department_id": adminDeptID,
		}
		if err := db.Model(&models.User{}).Where("id = ?", admin.ID).Updates(updates).Error; err != nil {
			return err
		}
	}

	return nil
}
