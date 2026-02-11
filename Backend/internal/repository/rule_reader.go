package repository

import (
	"log-analyzer/internal/entities"
	"os"

	"gopkg.in/yaml.v3"
)

func LoadRulesFromFile(filePath string) ([]entities.Rule, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	var config struct {
		Rules []entities.Rule `yaml:"rules"`
	}
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	return config.Rules, nil
}
