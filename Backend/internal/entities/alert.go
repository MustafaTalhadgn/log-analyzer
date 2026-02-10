package entities

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Alert struct {
	gorm.Model
	AlertId    string `json:"alert_id" gorm:"type:uuid;uniqueIndex;not null"`
	RuleId     string `json:"rule_id" gorm:"index"`
	RuleName   string `json:"rule_name"`
	Severity   string `json:"severity" gorm:"index"`
	Message    string `json:"message"`
	SourceIp   string `json:"source_ip" gorm:"index"`
	SourceName string `json:"source_name"`
	LogContent string `json:"log_content"`
	LogType    string `json:"log_type"`
}

// Constructor
func NewAlert(ruleId, ruleName, severity, message, sourceIp, sourceName, logContent, logType string) *Alert {
	return &Alert{
		AlertId:    uuid.New().String(),
		RuleId:     ruleId,
		RuleName:   ruleName,
		Severity:   severity,
		Message:    message,
		SourceIp:   sourceIp,
		SourceName: sourceName,
		LogContent: logContent,
		LogType:    logType,
	}
}

func (Alert) TableName() string {
	return "alerts"
}
