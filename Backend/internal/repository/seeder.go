package repository

import (
	"log"
)

func SeedRules(ruleRepo *RuleRepository, yamlpath string) {
	existingRules, err := ruleRepo.GetAll()
	if err != nil {
		log.Printf("Kural kontrolü sırasında hata oluştu: %v", err)
		return
	}
	if len(existingRules) > 0 {
		log.Printf("Veritabanında zaten %d kural var, seeding atlanıyor.", len(existingRules))
		return
	}

	log.Println("Veritabanında kural bulunamadı, varsayılan kurallar ekleniyor...")

	rules, err := LoadRulesFromFile(yamlpath)
	if err != nil {
		log.Printf("Kurallar dosyadan yüklenirken hata oluştu: %v", err)
		return
	}
	count := 0
	for _, rule := range rules {
		err := ruleRepo.Save(&rule)
		if err != nil {
			log.Printf("Kurallar kaydedilirken hata oluştu: %v", err)
		} else {
			count++
		}
	}
	log.Printf("%d kurallar veritabanına eklendi.", count)
}
