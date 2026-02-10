package entities

import (
	"gorm.io/gorm"
)

type Rule struct {
	gorm.Model
	RuleId       string `json:"rule_id" yaml:"id" gorm:"uniqueIndex;not null"`
	Description  string `json:"description" yaml:"description"`
	LogType      string `json:"log_type" yaml:"log_type"`
	Severity     string `json:"severity" yaml:"severity"`
	AlertMessage string `json:"alert_message" yaml:"alert_message"`

	// gorm embedded yaptık
	Match     Match     `json:"match" yaml:"match" gorm:"embedded;embeddedPrefix:match_"`
	Extract   Extract   `json:"extract" yaml:"extract" gorm:"embedded;embeddedPrefix:extract_"`
	Threshold Threshold `json:"threshold" yaml:"threshold" gorm:"embedded;embeddedPrefix:threshold_"`
}

type Match struct {
	Type  string `json:"type" yaml:"type"`
	Value string `json:"value" yaml:"value"`
}

type Extract struct {
	IpRegex   string `json:"ip_regex" yaml:"ip_regex"`
	UserRegex string `json:"user_regex" yaml:"user_regex"`
}

type Threshold struct {
	Count         int `json:"count" yaml:"count"`
	WithinSeconds int `json:"within_seconds" yaml:"within_seconds"`
}

func (Rule) TableName() string {
	return "rules"
}
