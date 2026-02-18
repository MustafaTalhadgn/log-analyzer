package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AnalysisJob struct {
	gorm.Model
	JobId      string    `json:"job_id" gorm:"type:uuid;uniqueIndex;not null"`
	Filename   string    `json:"filename"`
	Status     string    `json:"status" gorm:"index"`
	UploadDate time.Time `json:"upload_date"`
	Alerts     []Alert   `json:"alerts,omitempty" gorm:"foreignKey:AnalysisJobID;references:JobId"`
}

func NewAnalysisJob(filename string) *AnalysisJob {
	return &AnalysisJob{
		JobId:      uuid.New().String(),
		Filename:   filename,
		Status:     "PENDING",
		UploadDate: time.Now(),
	}
}

func (AnalysisJob) TableName() string {
	return "analysis_jobs"
}
