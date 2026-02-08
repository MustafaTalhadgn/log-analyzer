package parser

import (
	"fmt"
	"time"
)

func TimeParser(month, day, timeStr string) time.Time {
	timeStrFull := fmt.Sprintf("%d %s %s %s", time.Now().Year(), month, day, timeStr)
	layout := "2006 Jan 2 15:04:05"
	parsedTime, err := time.ParseInLocation(layout, timeStrFull, time.Local)
	if err != nil {
		return time.Now()
	}

	return parsedTime
}
