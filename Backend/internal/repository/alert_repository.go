package repository

import (
	"log-analyzer/internal/entities"

	"gorm.io/gorm"
)

type AlertRepository struct {
	db *gorm.DB
}

func NewAlertRepository(db *gorm.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) Create(alert *entities.Alert) error {
	return r.db.Create(alert).Error
}

func (r *AlertRepository) GetAll(limit int) ([]entities.Alert, error) {
	var alerts []entities.Alert
	result := r.db.Order("created_at desc").Limit(limit).Find(&alerts)
	return alerts, result.Error
}

func (r *AlertRepository) GetSeverityStats() (map[string]int64, error) {
	var results []struct {
		Severity string
		Count    int64
	}

	err := r.db.Model(&entities.Alert{}).Select("severity, count(*) as count").Group("severity").Scan(&results).Error

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.Severity] = r.Count
	}
	return stats, err
}
