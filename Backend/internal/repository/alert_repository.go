package repository

import (
	"log-analyzer/internal/entities"
	"time"

	"gorm.io/gorm"
)

type AlertRepository struct {
	db *gorm.DB
}

type DailyAlertCount struct {
	Day   time.Time
	Count int64
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

func (r *AlertRepository) GetDailyAlertCounts(days int) ([]DailyAlertCount, error) {
	if days <= 0 {
		return []DailyAlertCount{}, nil
	}

	var results []DailyAlertCount
	err := r.db.Raw(
		"SELECT date_trunc('day', created_at) AS day, count(*) AS count "+
			"FROM alerts "+
			"WHERE created_at >= now() - (? * interval '1 day') "+
			"GROUP BY day "+
			"ORDER BY day",
		days,
	).Scan(&results).Error

	return results, err
}
