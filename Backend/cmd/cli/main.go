package main

import (
	"log-analyzer/internal/api"
	"log-analyzer/internal/api/handlers"
	"log-analyzer/internal/api/websocket"
	"log-analyzer/internal/infrastructure"
	"log-analyzer/internal/logger"
	"log-analyzer/internal/repository"
	"log-analyzer/internal/service/analyses"
	"os"
)

type LogTarget struct {
	Path    string
	LogType string
}

func main() {
	// Initialize structured logger
	logger.Init()

	logger.Info("Starting Log Analyzer v2").
		Str("version", "2.0").
		Msg("Application startup")

	db, err := infrastructure.ConnectDB()
	if err != nil {
		logger.Fatal("Database connection failed").
			Err(err).
			Msg("Critical error")
	}

	logger.Info("Database connected successfully").Msg("")

	ruleRepo := repository.NewRuleRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	jobRepo := repository.NewAnalysisJobRepository(db)

	rulesPath := getEnv("RULES_FILE_PATH", "/app/rules.yaml")
	repository.SeedRules(ruleRepo, rulesPath)

	wsHub := websocket.NewHub()
	go wsHub.Run()

	logger.Info("WebSocket hub started").Msg("")

	analysisService := analyses.NewAnalysisService(ruleRepo, wsHub)

	go startBackgroundAnalysis(analysisService, alertRepo)

	alertHandler := handlers.NewAlertHandler(alertRepo)
	ruleHandler := handlers.NewRuleHandler(ruleRepo, analysisService)
	jobHandler := handlers.NewAnalysisJobHandler(jobRepo, alertRepo, analysisService)

	r := api.SetupRouter(alertHandler, ruleHandler, jobHandler, wsHub)

	logger.Info("API Server listening").
		Int("port", 8080).
		Msg("Server started")

	if err := r.Run(":8080"); err != nil {
		logger.Fatal("Server error").
			Err(err).
			Msg("Failed to start server")
	}
}

func startBackgroundAnalysis(service *analyses.AnalysisService, alertRepo *repository.AlertRepository) {
	logBaseDir := getEnv("LOG_FILE_PATH", "/var/log")

	targets := []LogTarget{
		{Path: logBaseDir + "/auth.log", LogType: "auth"},
		{Path: logBaseDir + "/syslog", LogType: "syslog"},
		{Path: logBaseDir + "/nginx/access.log", LogType: "nginx"},
		{Path: logBaseDir + "/ufw.log", LogType: "ufw"},
	}

	logger.Info("Background log analysis engine started").
		Int("target_count", len(targets)).
		Msg("Log monitoring active")

	for _, target := range targets {
		go processLogFile(target, service, alertRepo)
	}
}

func processLogFile(target LogTarget, service *analyses.AnalysisService, alertRepo *repository.AlertRepository) {

	logReader := repository.NewLogReader(target.Path, true)
	lines, errChan := logReader.ReadLines()

	logger.Info("Monitoring log file").
		Str("path", target.Path).
		Str("type", target.LogType).
		Msg("Log file watcher started")

	ctx := analyses.AnalysisContext{Source: "LIVE", Broadcast: true}
	if err := service.ProcessLines(lines, errChan, target.LogType, alertRepo, ctx); err != nil {
		logger.Error("Log processing error").
			Str("path", target.Path).
			Err(err).
			Msg("Failed to process log file")
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
