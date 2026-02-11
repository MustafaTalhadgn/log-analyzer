package handlers

import (
	"log-analyzer/internal/repository"
	"net/http"

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
