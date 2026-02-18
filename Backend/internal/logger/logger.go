package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var Logger zerolog.Logger

// Initialize the global logger
func Init() {
	// JSON output for production (Loki will parse this)
	output := os.Stdout

	// If you want pretty output for local development, use:
	// output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}

	Logger = zerolog.New(output).
		Level(zerolog.InfoLevel).
		With().
		Timestamp().
		Caller().
		Str("service", "log-analyzer-backend").
		Logger()

	// Set global logger
	log.Logger = Logger

	Logger.Info().Msg("Logger initialized")
}

// Info logs an info message
func Info(msg string) *zerolog.Event {
	return Logger.Info()
}

// Debug logs a debug message
func Debug(msg string) *zerolog.Event {
	return Logger.Debug()
}

// Warn logs a warning message
func Warn(msg string) *zerolog.Event {
	return Logger.Warn()
}

// Error logs an error message
func Error(msg string) *zerolog.Event {
	return Logger.Error()
}

// Fatal logs a fatal message and exits
func Fatal(msg string) *zerolog.Event {
	return Logger.Fatal()
}

// WithFields creates a logger with additional fields
func WithFields(fields map[string]interface{}) zerolog.Logger {
	ctx := Logger.With()
	for key, value := range fields {
		ctx = ctx.Interface(key, value)
	}
	return ctx.Logger()
}

// HTTPRequestLogger creates a logger for HTTP requests
func HTTPRequestLogger(method, path, ip string, statusCode int, latency time.Duration) {
	Logger.Info().
		Str("method", method).
		Str("path", path).
		Str("ip", ip).
		Int("status", statusCode).
		Dur("latency", latency).
		Msg("HTTP Request")
}

// AlertLogger logs alert creation
func AlertLogger(alertID, severity, ruleName, sourceIP string) {
	Logger.Info().
		Str("alert_id", alertID).
		Str("severity", severity).
		Str("rule_name", ruleName).
		Str("source_ip", sourceIP).
		Str("event_type", "alert_created").
		Msg("Alert Created")
}

// JobLogger logs analysis job events
func JobLogger(jobID, status, filename string) {
	Logger.Info().
		Str("job_id", jobID).
		Str("status", status).
		Str("filename", filename).
		Str("event_type", "analysis_job").
		Msg("Analysis Job")
}

// DBLogger logs database operations
func DBLogger(operation, table string, duration time.Duration, err error) {
	event := Logger.Info()
	if err != nil {
		event = Logger.Error().Err(err)
	}

	event.
		Str("operation", operation).
		Str("table", table).
		Dur("duration", duration).
		Str("event_type", "database").
		Msg("Database Operation")
}
