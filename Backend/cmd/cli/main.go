package main

import (
	"fmt"
	"log"
	"log-analyzer/internal/api"
	"log-analyzer/internal/api/handlers"
	"log-analyzer/internal/api/websocket"
	"log-analyzer/internal/infrastructure"
	"log-analyzer/internal/repository"
	"log-analyzer/internal/service/analyses"
	"log-analyzer/internal/service/parser"
	"os"
)

type LogTarget struct {
	Path    string
	LogType string
}

func main() {
	fmt.Println(" Log Analyzer v2 Başlatılıyor...")

	db, err := infrastructure.ConnectDB()
	if err != nil {
		log.Fatalf(" Kritik Hata: Veritabanına bağlanılamadı: %v", err)
	}

	ruleRepo := repository.NewRuleRepository(db)
	alertRepo := repository.NewAlertRepository(db)

	rulesPath := getEnv("RULES_FILE_PATH", "/app/rules.yaml")
	repository.SeedRules(ruleRepo, rulesPath)

	wsHub := websocket.NewHub()
	go wsHub.Run()

	analysisService := analyses.NewAnalysisService(ruleRepo, wsHub)

	go startBackgroundAnalysis(analysisService, alertRepo)

	alertHandler := handlers.NewAlertHandler(alertRepo)
	ruleHandler := handlers.NewRuleHandler(ruleRepo, analysisService)

	r := api.SetupRouter(alertHandler, ruleHandler, wsHub)

	fmt.Println(" API Sunucusu 8080 portunda dinleniyor...")

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Sunucu hatası: %v", err)
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

	fmt.Println(" Log izleme motoru arka planda çalışıyor...")

	for _, target := range targets {
		go processLogFile(target, service, alertRepo)
	}
}

func processLogFile(target LogTarget, service *analyses.AnalysisService, alertRepo *repository.AlertRepository) {

	logReader := repository.NewLogReader(target.Path, true)
	lines, errChan := logReader.ReadLines()

	parserService, err := parser.NewParserService(target.LogType)
	if err != nil {
		fmt.Printf("Parser hatası (%s): %v\n", target.Path, err)
		return
	}

	fmt.Printf("İzleniyor: %s\n", target.Path)

	for {
		select {
		case err := <-errChan:
			if err != nil {

			}
		case line, ok := <-lines:
			if !ok {
				return
			}

			logEntry, err := parserService.ParseLogLine(line)
			if err != nil {
				continue
			}

			alert := service.Analyze(logEntry)
			if alert != nil {

				fmt.Printf("\n [ALARM] [%s] %s (IP: %s)\n", alert.Severity, alert.Message, alert.SourceIp)

				if err := alertRepo.Create(alert); err != nil {
					fmt.Printf(" Alarm veritabanına yazılamadı: %v\n", err)
				}
			}
		}
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
