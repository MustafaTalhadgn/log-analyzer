package infrastructure

import (
	"fmt"
	"log"
	"log-analyzer/internal/entities"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB() (*gorm.DB, error) {

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("TZ"),
	)

	var db *gorm.DB
	var err error

	// veritabanı dockerda geç kalktığı için 5 kere deneyecek döngü
	for i := 1; i <= 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			log.Println("Veritabanı bağlantısı başarılı!")
			break
		}
		log.Printf("Veritabanı bekleniyor  Hata: %v", err)
		time.Sleep(3 * time.Second)
	}

	if err != nil {
		return nil, fmt.Errorf("veritabanına bağlanılamadı: %w", err)
	}

	//Tablo oluşturma yeri
	log.Println("🔄 Tablolar oluşturuluyor (Migration)...")
	err = db.AutoMigrate(&entities.Alert{}, &entities.Rule{}, &entities.AnalysisJob{})
	if err != nil {
		return nil, fmt.Errorf("tablo oluşturma hatası: %w", err)
	}
	log.Println("Tablolar hazır.")

	return db, nil
}
