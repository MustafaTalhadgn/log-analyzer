package handlers

import (
	"log-analyzer/internal/entities"
	"log-analyzer/internal/repository"
	"log-analyzer/internal/service/analyses"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AnalysisJobHandler struct {
	jobRepo         *repository.AnalysisJobRepository
	alertRepo       *repository.AlertRepository
	analysisService *analyses.AnalysisService
}

func NewAnalysisJobHandler(jobRepo *repository.AnalysisJobRepository, alertRepo *repository.AlertRepository, analysisService *analyses.AnalysisService) *AnalysisJobHandler {
	return &AnalysisJobHandler{
		jobRepo:         jobRepo,
		alertRepo:       alertRepo,
		analysisService: analysisService,
	}
}

func (h *AnalysisJobHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dosya alinamadi"})
		return
	}
	defer file.Close()

	logType := c.PostForm("log_type")
	if logType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "log_type zorunlu"})
		return
	}

	job := entities.NewAnalysisJob(header.Filename)
	if err := h.jobRepo.Create(job); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Is kaydi olusturulamadi"})
		return
	}

	ctx := analyses.AnalysisContext{
		Source:        "OFFLINE",
		AnalysisJobID: &job.JobId,
		Broadcast:     false,
		StopOnError:   true,
	}

	lines, errChan := analyses.ReadLinesFromReader(file)
	if err := h.analysisService.ProcessLines(lines, errChan, logType, h.alertRepo, ctx); err != nil {
		_ = h.jobRepo.UpdateStatus(job.JobId, "FAILED")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dosya analiz edilemedi"})
		return
	}

	_ = h.jobRepo.UpdateStatus(job.JobId, "COMPLETED")
	c.JSON(http.StatusOK, job)
}

func (h *AnalysisJobHandler) GetJobs(c *gin.Context) {
	jobs, err := h.jobRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Is listesi getirilemedi"})
		return
	}
	c.JSON(http.StatusOK, jobs)
}
