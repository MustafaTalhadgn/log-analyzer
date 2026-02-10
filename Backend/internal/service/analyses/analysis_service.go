package analyses

import (
	"log-analyzer/internal/entities"
	"strings"

	"regexp"
	"sync"
	"time"
)

type AnalysisService struct {
	Rules             []entities.Rule
	alertHistory      map[string][]time.Time
	matchRegexCache   map[string]*regexp.Regexp
	extractRegexCache map[string]*regexp.Regexp
	mu                sync.Mutex
}

func NewAnalysisService(rules []entities.Rule) *AnalysisService {
	analyses := &AnalysisService{
		Rules:             rules,
		alertHistory:      make(map[string][]time.Time),
		matchRegexCache:   make(map[string]*regexp.Regexp),
		extractRegexCache: make(map[string]*regexp.Regexp),
	}

	for _, rule := range rules {

		if rule.Match.Type == "regex" && rule.Match.Value != "" {
			re, err := regexp.Compile(rule.Match.Value)
			if err == nil {
				analyses.matchRegexCache[rule.RuleId] = re
			}
		}

		if rule.Extract.IpRegex != "" {
			re, err := regexp.Compile(rule.Extract.IpRegex)
			if err == nil {
				analyses.extractRegexCache[rule.RuleId+"_IP"] = re
			}
		}

		if rule.Extract.UserRegex != "" {
			re, err := regexp.Compile(rule.Extract.UserRegex)
			if err == nil {
				analyses.extractRegexCache[rule.RuleId+"_User"] = re
			}
		}
	}
	return analyses
}

func (s *AnalysisService) Analyze(entry *entities.LogEntry) *entities.Alert {

	for _, rule := range s.Rules {
		if entry.LogType != rule.LogType {
			continue
		}

		if !s.isMatch(rule, entry) {
			continue
		}
		s.extractDetails(entry, rule)
		entry.Severity = rule.Severity

		if s.checkThreshold(rule, entry) {
			return entities.NewAlert(
				rule.RuleId,
				rule.Description,
				rule.Severity,
				rule.AlertMessage,
				entry.LogIp,
				entry.LogUser,
				entry.RawContent,
				entry.LogType,
			)
		}
	}
	return nil

}

func (s *AnalysisService) isMatch(rule entities.Rule, entry *entities.LogEntry) bool {
	switch rule.Match.Type {
	case "keyword":
		return strings.Contains(entry.Message, rule.Match.Value)

	case "regex":
		re, exists := s.matchRegexCache[rule.RuleId]
		if !exists {
			return false
		}
		return re.MatchString(entry.Message)

	default:
		return false
	}
}

func (s *AnalysisService) extractDetails(entry *entities.LogEntry, rule entities.Rule) {
	if re, ok := s.extractRegexCache[rule.RuleId+"_IP"]; ok {
		match := re.FindStringSubmatch(entry.Message)
		if len(match) > 1 {
			entry.LogIp = match[1]
		}
	}

	if re, ok := s.extractRegexCache[rule.RuleId+"_User"]; ok {
		match := re.FindStringSubmatch(entry.Message)
		if len(match) > 1 {
			entry.LogUser = match[len(match)-1]
		}
	}
}

func (s *AnalysisService) checkThreshold(rule entities.Rule, entry *entities.LogEntry) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if rule.Threshold.Count <= 1 {
		return true
	}

	key := rule.RuleId

	if entry.LogIp != "" {
		key += ":" + entry.LogIp
	}

	now := entry.TimeStamp

	history, exists := s.alertHistory[key]

	if !exists {
		history = []time.Time{}
	}

	history = append(history, now)

	cutoff := now.Add(-time.Duration(rule.Threshold.WithinSeconds) * time.Second)
	validHistory := []time.Time{}
	for _, t := range history {
		if t.After(cutoff) {
			validHistory = append(validHistory, t)
		}
	}
	s.alertHistory[key] = validHistory

	if len(validHistory) >= rule.Threshold.Count {
		s.alertHistory[key] = []time.Time{}
		return true
	}
	return false
}
