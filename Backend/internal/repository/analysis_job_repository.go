package repository

import (
	"log-analyzer/internal/entities"

	"gorm.io/gorm"
)

type AnalysisJobRepository struct {
	db *gorm.DB
}

func NewAnalysisJobRepository(db *gorm.DB) *AnalysisJobRepository {
	return &AnalysisJobRepository{db: db}
}

func (r *AnalysisJobRepository) Create(job *entities.AnalysisJob) error {
	return r.db.Create(job).Error
}

func (r *AnalysisJobRepository) UpdateStatus(jobId string, status string) error {
	return r.db.Model(&entities.AnalysisJob{}).Where("job_id = ?", jobId).Update("status", status).Error
}

func (r *AnalysisJobRepository) GetAll() ([]entities.AnalysisJob, error) {
	var jobs []entities.AnalysisJob
	result := r.db.Order("upload_date desc").Find(&jobs)
	return jobs, result.Error
}

func (r *AnalysisJobRepository) GetByJobID(jobId string) (*entities.AnalysisJob, error) {
	var job entities.AnalysisJob
	result := r.db.Where("job_id = ?", jobId).First(&job)
	if result.Error != nil {
		return nil, result.Error
	}
	return &job, nil
}

func (r *AnalysisJobRepository) DeleteByJobID(jobId string) error {
	// Önce bu job'a ait alertleri sil
	if err := r.db.Where("analysis_job_id = ?", jobId).Delete(&entities.Alert{}).Error; err != nil {
		return err
	}
	// Sonra job'u sil
	return r.db.Where("job_id = ?", jobId).Delete(&entities.AnalysisJob{}).Error
}
