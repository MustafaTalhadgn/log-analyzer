package handlers

import (
	"log-analyzer/internal/entities"
	"log-analyzer/internal/logger"
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

	logger.JobLogger(job.JobId, "PENDING", job.Filename)

	ctx := analyses.AnalysisContext{
		Source:        "OFFLINE",
		AnalysisJobID: &job.JobId,
		Broadcast:     false,
		StopOnError:   true,
	}

	lines, errChan := analyses.ReadLinesFromReader(file)
	if err := h.analysisService.ProcessLines(lines, errChan, logType, h.alertRepo, ctx); err != nil {
		_ = h.jobRepo.UpdateStatus(job.JobId, "FAILED")
		logger.JobLogger(job.JobId, "FAILED", job.Filename)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dosya analiz edilemedi"})
		return
	}

	_ = h.jobRepo.UpdateStatus(job.JobId, "COMPLETED")
	logger.JobLogger(job.JobId, "COMPLETED", job.Filename)
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

func (h *AnalysisJobHandler) DeleteJob(c *gin.Context) {
	jobId := c.Param("job_id")
	if jobId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "job_id parametresi zorunlu"})
		return
	}

	if err := h.jobRepo.DeleteByJobID(jobId); err != nil {
		logger.Error("Failed to delete job").
			Str("job_id", jobId).
			Err(err).
			Msg("Job deletion error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Is silinemedi"})
		return
	}

	logger.Info("Job deleted").
		Str("job_id", jobId).
		Msg("Job successfully deleted")

	c.JSON(http.StatusOK, gin.H{"message": "Is basariyla silindi"})
}
