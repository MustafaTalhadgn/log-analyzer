package handlers

import (
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

	alerts, err := h.repo.GetAll(100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alarmlar getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AlertHandler) GetStats(c *gin.Context) {
	stats, err := h.repo.GetSeverityStats()
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

	results, err := h.repo.GetDailyAlertCounts(days)
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
