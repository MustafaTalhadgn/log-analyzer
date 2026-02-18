package entities

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Alert struct {
	gorm.Model
	AlertId        string       `json:"alert_id" gorm:"type:uuid;uniqueIndex;not null"`
	RuleId         string       `json:"rule_id" gorm:"index"`
	RuleName       string       `json:"rule_name"`
	Severity       string       `json:"severity" gorm:"index"`
	Message        string       `json:"message"`
	SourceIp       string       `json:"source_ip" gorm:"index"`
	SourceName     string       `json:"source_name"`
	LogContent     string       `json:"log_content"`
	LogType        string       `json:"log_type"`
	Source         string       `json:"source" gorm:"index"`
	Reviewed       bool         `json:"reviewed" gorm:"default:false;index"`
	AnalysisJobID  *string      `json:"analysis_job_id,omitempty" gorm:"type:uuid;index"`
	AnalysisJobRef *AnalysisJob `json:"analysis_job,omitempty" gorm:"foreignKey:AnalysisJobID;references:JobId"`
}

// Constructor
func NewAlert(ruleId, ruleName, severity, message, sourceIp, sourceName, logContent, logType, source string, analysisJobID *string) *Alert {
	return &Alert{
		AlertId:       uuid.New().String(),
		RuleId:        ruleId,
		RuleName:      ruleName,
		Severity:      severity,
		Message:       message,
		SourceIp:      sourceIp,
		SourceName:    sourceName,
		LogContent:    logContent,
		LogType:       logType,
		Source:        source,
		AnalysisJobID: analysisJobID,
	}
}

func (Alert) TableName() string {
	return "alerts"
}
