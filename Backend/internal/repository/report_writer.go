package repository

import (
	"encoding/csv"
	"fmt"
	"log-analyzer/internal/entities"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type ReportWriter interface {
	WriteAlert(alert *entities.Alert) error
}

type CSVReportWriter struct {
	filePath string
	mu       sync.Mutex
}

func NewCSVReportWriter(filePath string) *CSVReportWriter {
	return &CSVReportWriter{
		filePath: filePath,
	}
}

func (w *CSVReportWriter) WriteAlert(alert *entities.Alert) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	dir := filepath.Dir(w.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("rapor dizini oluşturulamadı (%s): %w", dir, err)
	}

	fileExists := false
	if _, err := os.Stat(w.filePath); err == nil {
		fileExists = true
	}

	file, err := os.OpenFile(w.filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("rapor dosyası açılamadı (%s): %w", w.filePath, err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if !fileExists {
		header := []string{"Id", "RuleId", "RuleName", "Severity", "Message", "SourceIp", "SourceName", "CreatedAt", "LogContent", "LogType"}
		if err := writer.Write(header); err != nil {
			return fmt.Errorf("Başlık Yazılamadı: %v", err)
		}
	}

	record := []string{
		alert.AlertId,
		alert.RuleId,
		alert.RuleName,
		alert.Severity,
		alert.Message,
		alert.SourceIp,
		alert.SourceName,
		alert.CreatedAt.Format(time.RFC3339),
		alert.LogContent,
		alert.LogType,
	}
	if err := writer.Write(record); err != nil {
		return fmt.Errorf("Kayıt Yazılamadı: %v", err)
	}
	return nil
}
