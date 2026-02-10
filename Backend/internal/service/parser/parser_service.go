package parser

import (
	"fmt"
	"log-analyzer/internal/entities"
)

type ParserService interface {
	ParseLogLine(line string) (*entities.LogEntry, error)
}

func NewParserService(logType string) (ParserService, error) {
	switch logType {
	case "auth":
		return &AuthLogParser{}, nil
	case "syslog":
		return &SyslogParser{}, nil
	case "nginx":
		return &NginxLogParser{}, nil
	case "ufw":
		return &UfwLogParser{}, nil

	default:
		return nil, fmt.Errorf("desteklenmeyen log tipi: %s", logType)
	}
}
