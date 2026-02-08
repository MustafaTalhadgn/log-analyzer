package main

import (
	"bufio"
	"fmt"
	"log"
	"log-analyzer/internal/entities"
	"log-analyzer/internal/repository"
	"log-analyzer/internal/service/analyses"
	"log-analyzer/internal/service/parser"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
)

type LogTarget struct {
	Path    string
	LogType string
}

var (
	rules           []entities.Rule
	analysisService *analyses.AnalysisService
	reportWriter    repository.ReportWriter
	targets         []LogTarget
)

func main() {
	initSystem()

	scanner := bufio.NewScanner(os.Stdin)

	for {
		printMenu()
		fmt.Print("Seçiminiz: ")

		if !scanner.Scan() {
			break
		}
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			fmt.Println("\n [MOD: 1] Geçmiş Dosya Analizi Başlatılıyor...")
			runAnalysis(false)

			fmt.Println("Menüye dönmek için Enter'a basın...")
			scanner.Scan()

		case "2":
			fmt.Println("\n  [MOD: 2] Canlı İzleme Modu Başlatılıyor (Durdurmak için Ctrl+C)...")
			runAnalysis(true)

		case "3":
			fmt.Println("Çıkış yapılıyor... 👋")
			os.Exit(0)

		default:
			fmt.Println("Geçersiz seçim, tekrar deneyin.")
		}
	}
}

func initSystem() {
	fmt.Println("Siber Güvenlik Log Analizörü Başlatılıyor...")

	rulesPath := getEnv("RULES_FILE_PATH", "/app/rules.yaml")
	reportPath := getEnv("REPORTS_DIR_PATH", "/app/reports") + "/security_report.csv"
	logBaseDir := "/var/log"

	ruleRepo := &repository.YamlRuleRepository{FilePath: rulesPath}
	var err error
	rules, err = ruleRepo.LoadRules()
	if err != nil {
		log.Fatalf("Kurallar yüklenemedi: %v", err)
	}
	fmt.Printf(" %d adet kural belleğe yüklendi.\n", len(rules))

	analysisService = analyses.NewAnalysisService(rules)
	reportWriter = repository.NewCSVReportWriter(reportPath)

	targets = []LogTarget{
		{Path: logBaseDir + "/auth.log", LogType: "auth"},
		{Path: logBaseDir + "/syslog", LogType: "syslog"},
		{Path: logBaseDir + "/nginx/access.log", LogType: "nginx"},
		{Path: logBaseDir + "/ufw.log", LogType: "ufw"},
	}
}

func printMenu() {
	fmt.Println("\n============================================")
	fmt.Println("  LOG ANALYZER - KONTROL PANELİ         ")
	fmt.Println("============================================")
	fmt.Println("1.Dosya Bazlı Analiz (Geçmiş Logları Tara ve Raporla)")
	fmt.Println("2.Gerçek Zamanlı İzleme (Canlı Tailing)")
	fmt.Println("3.Çıkış")
	fmt.Println("============================================")
}

func runAnalysis(follow bool) {
	var wg sync.WaitGroup
	stopChan := make(chan struct{})

	summary := entities.NewAnalysisSummary()

	if follow {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		go func() {
			<-sigChan
			fmt.Println("\n Canlı izleme durduruldu. Menüye dönülüyor...")
			close(stopChan)
		}()
	}

	for _, target := range targets {
		wg.Add(1)
		go func(t LogTarget) {
			defer wg.Done()

			processLogFile(t, follow, stopChan, summary)
		}(target)
	}

	if !follow {

		wg.Wait()
		fmt.Println("\nAnaliz tamamlandı!")

		summary.PrintReport()
	} else {

		<-stopChan
	}
}

func processLogFile(target LogTarget, follow bool, stopChan <-chan struct{}, summary *entities.AnalysisSummary) {
	logReader := repository.NewLogReader(target.Path, follow)
	lines, errChan := logReader.ReadLines()

	parserService, err := parser.NewParserService(target.LogType)
	if err != nil {
		fmt.Printf(" Parser hatası (%s): %v\n", target.Path, err)
		return
	}

	fmt.Printf("   -> İzleniyor: %s\n", target.Path)

	for {
		select {
		case <-stopChan:
			return
		case <-errChan:
		case line, ok := <-lines:
			if !ok {
				return
			}

			summary.AddLine()

			logEntry, err := parserService.ParseLogLine(line)
			if err != nil {
				continue
			}

			alert := analysisService.Analyze(logEntry)
			if alert != nil {

				summary.AddAlert(alert)

				fmt.Printf("\n🚨 [ALARM] [%s] %s\n", alert.Severity, alert.Message)
				fmt.Printf("   └── IP: %s | User: %s\n", alert.SourceIp, alert.SourceName)

				reportWriter.WriteAlert(alert)
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
