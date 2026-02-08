package parser

import (
	"fmt"
	"log-analyzer/internal/entities"
	"strings"

	"github.com/google/uuid"
)

type UfwLogParser struct {
}

func (p *UfwLogParser) ParseLogLine(line string) (*entities.LogEntry, error) {

	parts := strings.SplitN(line, " ", 4)
	if len(parts) < 4 {
		return nil, fmt.Errorf("log formatı geçersiz: %s", line)
	}
	parsedTime := TimeParser(parts[0], parts[1], parts[2])
	cleanMessage := parts[3]
	severity := "INFO"
	lowerLine := strings.ToLower(line)
	if strings.Contains(lowerLine, "block") || strings.Contains(lowerLine, "denied") {
		severity = "WARN"
	} else if strings.Contains(lowerLine, "allow") || strings.Contains(lowerLine, "accepted") {
		severity = "SUCCESS"
	}

	return &entities.LogEntry{
		Id:         uuid.New().String(),
		LogType:    "ufw",
		TimeStamp:  parsedTime,
		RawContent: line,
		Message:    cleanMessage,
		Severity:   severity,
	}, nil
}
