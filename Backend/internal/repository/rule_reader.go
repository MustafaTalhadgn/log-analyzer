package repository

import (
	"log-analyzer/internal/entities"
	"os"

	"gopkg.in/yaml.v3"
)

type RuleRepository interface {
	LoadRules() ([]entities.Rule, error)
}
type YamlRuleRepository struct {
	FilePath string
}

func (r *YamlRuleRepository) LoadRules() ([]entities.Rule, error) {
	readfile, err := readFile(r.FilePath)
	if err != nil {
		return nil, err
	}
	rules, err := parseRules(readfile)
	if err != nil {
		return nil, err
	}
	return rules, nil
}

func readFile(filename string) ([]byte, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	return data, nil

}
func parseRules(data []byte) ([]entities.Rule, error) {

	var config entities.Config

	err := yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	return config.Rules, nil
}
