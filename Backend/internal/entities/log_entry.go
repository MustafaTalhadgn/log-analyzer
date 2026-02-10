package entities

import "time"

type LogEntry struct {
	Id         string    `json:"id"`
	LogType    string    `json:"log_type"`
	TimeStamp  time.Time `json:"time_stamp"`
	Severity   string    `json:"severity"`
	LogIp      string    `json:"log_ip"`
	LogUser    string    `json:"log_user"`
	Method     string    `json:"method"`
	StatusCode int       `json:"status_code"`
	Message    string    `json:"message"`
	RawContent string    `json:"raw_content"`
}
