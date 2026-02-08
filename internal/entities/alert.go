package entities

import (
	"time"

	"github.com/google/uuid"
)

type Alert struct {
	Id         string    `json:"id"`
	RuleId     string    `json:"rule_id"`
	RuleName   string    `json:"rule_name"`
	Severity   string    `json:"severity"`
	Message    string    `json:"message"`
	SourceIp   string    `json:"source_ip"`
	SourceName string    `json:"source_name"`
	CreatedAt  time.Time `json:"created_at"`
	LogContent string    `json:"log_content"`
	LogType    string    `json:"log_type"`
}

func NewAlert(ruleId, ruleName, severity, message, sourceIp, sourceName, logContent, logType string) *Alert {
	return &Alert{
		Id:         uuid.New().String(),
		RuleId:     ruleId,
		RuleName:   ruleName,
		Severity:   severity,
		Message:    message,
		SourceIp:   sourceIp,
		SourceName: sourceName,
		CreatedAt:  time.Now(),
		LogContent: logContent,
		LogType:    logType,
	}
}
