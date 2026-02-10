package parser

import (
	"log-analyzer/internal/entities"
	"strings"
	"time"

	"github.com/google/uuid"
)

type NginxLogParser struct{}

func (p *NginxLogParser) ParseLogLine(line string) (*entities.LogEntry, error) {

	parsedTime := time.Now()

	startIdx := strings.Index(line, "[")
	endIdx := strings.Index(line, "]")

	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		timeStr := line[startIdx+1 : endIdx]
		layout := "02/Jan/2006:15:04:05 -0700"
		t, err := time.Parse(layout, timeStr)
		if err == nil {
			parsedTime = t
		}
	}

	severity := "INFO"
	lowerLine := strings.ToLower(line)
	if strings.Contains(lowerLine, "404") || strings.Contains(lowerLine, "500") || strings.Contains(lowerLine, "error") {
		severity = "ERROR"
	}

	return &entities.LogEntry{
		Id:         uuid.New().String(),
		LogType:    "nginx",
		TimeStamp:  parsedTime,
		RawContent: line,
		Message:    line,
		Severity:   severity,
	}, nil
}
