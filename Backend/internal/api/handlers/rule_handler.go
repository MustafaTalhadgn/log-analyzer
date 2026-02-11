package handlers

import (
	"log-analyzer/internal/entities"
	"log-analyzer/internal/repository"
	"log-analyzer/internal/service/analyses"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RuleHandler struct {
	repo            *repository.RuleRepository
	analysisService *analyses.AnalysisService
}

func NewRuleHandler(repo *repository.RuleRepository, service *analyses.AnalysisService) *RuleHandler {
	return &RuleHandler{
		repo:            repo,
		analysisService: service,
	}
}

func (h *RuleHandler) GetRules(c *gin.Context) {
	rules, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kurallar getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, rules)
}

func (h *RuleHandler) CreateRule(c *gin.Context) {
	var rule entities.Rule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if rule.RuleId == "" {
		rule.RuleId = uuid.New().String()
	}

	if err := h.repo.Save(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kural kaydedilemedi"})
		return
	}

	h.analysisService.ReloadRules()

	c.JSON(http.StatusCreated, rule)
}

func (h *RuleHandler) DeleteRule(c *gin.Context) {
	id := c.Param("id")

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kural silinemedi"})
		return
	}

	h.analysisService.ReloadRules()

	c.JSON(http.StatusOK, gin.H{"message": "Kural silindi"})
}
