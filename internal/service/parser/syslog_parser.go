package parser

import (
	"fmt"
	"log-analyzer/internal/entities"
	"strings"

	"github.com/google/uuid"
)

type SyslogParser struct {
}

func (p *SyslogParser) ParseLogLine(line string) (*entities.LogEntry, error) {

	parts := strings.SplitN(line, " ", 4)
	if len(parts) < 4 {
		return nil, fmt.Errorf("log formatı geçersiz: %s", line)
	}
	parsedTime := TimeParser(parts[0], parts[1], parts[2])
	cleanMessage := parts[3]
	severity := "INFO"
	lowerLine := strings.ToLower(line)
	if strings.Contains(lowerLine, "error") || strings.Contains(lowerLine, "failed") || strings.Contains(lowerLine, "err") || strings.Contains(lowerLine, "panic") {
		severity = "ERROR"
	} else if strings.Contains(lowerLine, "warn") || strings.Contains(lowerLine, "warning") {
		severity = "WARN"
	}
	return &entities.LogEntry{
		Id:         uuid.New().String(),
		LogType:    "syslog",
		TimeStamp:  parsedTime,
		RawContent: line,
		Message:    cleanMessage,
		Severity:   severity,
	}, nil
}
