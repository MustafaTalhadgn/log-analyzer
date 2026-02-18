package handlers

import (
	"encoding/csv"
	"fmt"
	"log-analyzer/internal/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct {
	repo *repository.AlertRepository
}

func NewAlertHandler(repo *repository.AlertRepository) *AlertHandler {
	return &AlertHandler{repo: repo}
}

func (h *AlertHandler) GetAlerts(c *gin.Context) {
	jobId := c.Query("job_id")
	if jobId != "" {
		// Offline analiz sonuçları: job_id'ye göre filtrele
		alerts, err := h.repo.GetByJobID(jobId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Alarmlar getirilemedi"})
			return
		}
		c.JSON(http.StatusOK, alerts)
		return
	}

	// Canlı veriler: AnalysisJobID IS NULL
	alerts, err := h.repo.GetAllLive(100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alarmlar getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AlertHandler) GetStats(c *gin.Context) {
	// Dashboard sadece canlı verilerin istatistikleri alacak
	stats, err := h.repo.GetSeverityStatsLive()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "İstatistikler alınamadı"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AlertHandler) GetDailyStats(c *gin.Context) {
	daysParam := c.DefaultQuery("days", "7")
	days, err := strconv.Atoi(daysParam)
	if err != nil || days <= 0 || days > 30 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "days parametresi 1-30 aralığında olmalı"})
		return
	}

	// Sadece canlı verilerin günlük istatistikleri
	results, err := h.repo.GetDailyAlertCountsLive(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Günlük istatistikler alınamadı"})
		return
	}

	countsByDay := make(map[string]int64)
	for _, r := range results {
		dayKey := r.Day.In(time.Local).Format("2006-01-02")
		countsByDay[dayKey] = r.Count
	}

	// Son N günü (bugün dahil) doldur, boş günleri 0 ile göster.
	series := make([]gin.H, 0, days)
	start := time.Now().In(time.Local).Truncate(24*time.Hour).AddDate(0, 0, -(days - 1))
	for i := 0; i < days; i++ {
		day := start.AddDate(0, 0, i)
		key := day.Format("2006-01-02")
		series = append(series, gin.H{
			"date":  key,
			"count": countsByDay[key],
		})
	}

	c.JSON(http.StatusOK, series)
}

// MarkAlertReviewed marks an alert as reviewed
func (h *AlertHandler) MarkAlertReviewed(c *gin.Context) {
	alertId := c.Param("alert_id")
	if alertId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert_id parametresi zorunlu"})
		return
	}

	if err := h.repo.MarkAsReviewed(alertId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert reviewed olarak işaretlenemedi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert reviewed olarak işaretlendi"})
}

// MarkAlertUnreviewed marks an alert as unreviewed
func (h *AlertHandler) MarkAlertUnreviewed(c *gin.Context) {
	alertId := c.Param("alert_id")
	if alertId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert_id parametresi zorunlu"})
		return
	}

	if err := h.repo.MarkAsUnreviewed(alertId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert unreviewed olarak işaretlenemedi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert unreviewed olarak işaretlendi"})
}

// ExportAlerts exports all live alerts in CSV or JSON format
func (h *AlertHandler) ExportAlerts(c *gin.Context) {
	format := c.DefaultQuery("format", "csv")

	alerts, err := h.repo.GetAllForExport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alarmlar dışa aktarılamadı"})
		return
	}

	if format == "json" {
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=alerts_%s.json", time.Now().Format("20060102_150405")))
		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, alerts)
		return
	}

	// CSV export
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=alerts_%s.csv", time.Now().Format("20060102_150405")))
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write CSV header
	header := []string{
		"Alert ID", "Rule ID", "Rule Name", "Severity", "Message",
		"Source IP", "Source Name", "Log Type", "Source", "Reviewed",
		"Created At", "Log Content",
	}
	if err := writer.Write(header); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "CSV başlığı yazılamadı"})
		return
	}

	// Write data rows
	for _, alert := range alerts {
		reviewedStr := "No"
		if alert.Reviewed {
			reviewedStr = "Yes"
		}

		record := []string{
			alert.AlertId,
			alert.RuleId,
			alert.RuleName,
			alert.Severity,
			alert.Message,
			alert.SourceIp,
			alert.SourceName,
			alert.LogType,
			alert.Source,
			reviewedStr,
			alert.CreatedAt.Format(time.RFC3339),
			alert.LogContent,
		}
		if err := writer.Write(record); err != nil {
			continue
		}
	}
}
