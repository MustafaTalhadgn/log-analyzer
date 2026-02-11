package repository

import (
	"log-analyzer/internal/entities"

	"gorm.io/gorm"
)

type RuleRepository struct {
	db *gorm.DB
}

func NewRuleRepository(db *gorm.DB) *RuleRepository {
	return &RuleRepository{db: db}
}

func (r *RuleRepository) Save(rule *entities.Rule) error {
	return r.db.Save(rule).Error
}

func (r *RuleRepository) GetAll() ([]entities.Rule, error) {
	var rules []entities.Rule
	result := r.db.Find(&rules)
	return rules, result.Error
}

func (r *RuleRepository) Delete(ruleId string) error {
	return r.db.Where("rule_id = ?", ruleId).Delete(&entities.Rule{}).Error
}
