package entities

type Rule struct {
	Id           string    `json:"id" yaml:"id"`
	Description  string    `json:"description" yaml:"description"`
	LogType      string    `json:"log_type" yaml:"log_type"`
	Match        Match     `json:"match" yaml:"match"`
	Extract      Extract   `json:"extract" yaml:"extract"`
	Threshold    Threshold `json:"threshold" yaml:"threshold"`
	Severity     string    `json:"severity" yaml:"severity"`
	AlertMessage string    `json:"alert_message" yaml:"alert_message"`
}

type Match struct {
	Type  string `json:"type" yaml:"type"`
	Value string `json:"value" yaml:"value"`
}
type Extract struct {
	IpRegex   string `json:"ip_regex" yaml:"ip_regex"`
	UserRegex string `json:"user_regex" yaml:"user_regex"`
}
type Threshold struct {
	Count         int `json:"count" yaml:"count"`
	WithinSeconds int `json:"within_seconds" yaml:"within_seconds"`
}
