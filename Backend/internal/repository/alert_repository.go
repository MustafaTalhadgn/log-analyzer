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

func (r *AlertRepository) GetByJobID(jobId string) ([]entities.Alert, error) {
	var alerts []entities.Alert
	result := r.db.Where("analysis_job_id = ?", jobId).Order("created_at desc").Find(&alerts)
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

// Sadece canlı verileri döndüren method (AnalysisJobID IS NULL)
func (r *AlertRepository) GetAllLive(limit int) ([]entities.Alert, error) {
	var alerts []entities.Alert
	result := r.db.Where("analysis_job_id IS NULL").Order("created_at desc").Limit(limit).Find(&alerts)
	return alerts, result.Error
}

// Sadece canlı verilerin severity istatistikleri
func (r *AlertRepository) GetSeverityStatsLive() (map[string]int64, error) {
	var results []struct {
		Severity string
		Count    int64
	}

	err := r.db.Model(&entities.Alert{}).Where("analysis_job_id IS NULL").Select("severity, count(*) as count").Group("severity").Scan(&results).Error

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.Severity] = r.Count
	}
	return stats, err
}

// Sadece canlı verilerin günlük alert sayıları
func (r *AlertRepository) GetDailyAlertCountsLive(days int) ([]DailyAlertCount, error) {
	if days <= 0 {
		return []DailyAlertCount{}, nil
	}

	var results []DailyAlertCount
	err := r.db.Raw(
		"SELECT date_trunc('day', created_at) AS day, count(*) AS count "+
			"FROM alerts "+
			"WHERE analysis_job_id IS NULL "+
			"AND created_at >= now() - (? * interval '1 day') "+
			"GROUP BY day "+
			"ORDER BY day",
		days,
	).Scan(&results).Error

	return results, err
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

// MarkAsReviewed marks an alert as reviewed
func (r *AlertRepository) MarkAsReviewed(alertId string) error {
	return r.db.Model(&entities.Alert{}).
		Where("alert_id = ?", alertId).
		Update("reviewed", true).Error
}

// MarkAsUnreviewed marks an alert as unreviewed
func (r *AlertRepository) MarkAsUnreviewed(alertId string) error {
	return r.db.Model(&entities.Alert{}).
		Where("alert_id = ?", alertId).
		Update("reviewed", false).Error
}

// GetAllForExport retrieves all live alerts for export (no limit)
func (r *AlertRepository) GetAllForExport() ([]entities.Alert, error) {
	var alerts []entities.Alert
	result := r.db.Where("analysis_job_id IS NULL").
		Order("created_at desc").
		Find(&alerts)
	return alerts, result.Error
}
