package entities

import (
	"fmt"
	"sync"
)

type AnalysisSummary struct {
	TotalLines     int
	TotalAlerts    int
	SeverityCounts map[string]int
	IPCounts       map[string]int
	RuleCounts     map[string]int
	mu             sync.Mutex
}

func NewAnalysisSummary() *AnalysisSummary {
	return &AnalysisSummary{
		SeverityCounts: make(map[string]int),
		IPCounts:       make(map[string]int),
		RuleCounts:     make(map[string]int),
	}
}

func (s *AnalysisSummary) AddLine() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.TotalLines++
}

func (s *AnalysisSummary) AddAlert(alert *Alert) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.TotalAlerts++
	s.SeverityCounts[alert.Severity]++
	s.RuleCounts[alert.RuleId]++

	if alert.SourceIp != "" {
		s.IPCounts[alert.SourceIp]++
	}
}

func (s *AnalysisSummary) GetTopAttacker() (string, int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	topIP := "Yok"
	maxCount := 0

	for ip, count := range s.IPCounts {
		if count > maxCount {
			maxCount = count
			topIP = ip
		}
	}
	return topIP, maxCount
}

func (s *AnalysisSummary) PrintReport() {
	topIP, topIPCount := s.GetTopAttacker()

	fmt.Println("\n=============================================")
	fmt.Println("         ANALİZ ÖZET RAPORU            ")
	fmt.Println("=============================================")
	fmt.Printf("Toplam Okunan Satır  : %d\n", s.TotalLines)
	fmt.Printf("Toplam Üretilen Alarm: %d\n", s.TotalAlerts)
	fmt.Println("---------------------------------------------")
	fmt.Printf("Kritik Alarmlar    : %d\n", s.SeverityCounts["CRITICAL"])
	fmt.Printf("Uyarı Alarmlar     : %d\n", s.SeverityCounts["WARNING"])
	fmt.Println("---------------------------------------------")
	fmt.Printf("En Çok Saldıran IP   : %s (%d Saldırı)\n", topIP, topIPCount)

}
