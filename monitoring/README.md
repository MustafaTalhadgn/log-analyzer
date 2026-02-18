# Grafana Monitoring Stack

Bu proje **Grafana + Loki + Prometheus + Promtail** stack'i kullanarak log aggregation ve monitoring sağlar.

## 🚀 Servisler

### 1. **Grafana** (Port: 3001)
- **URL**: http://localhost:3001
- **Kullanıcı Adı**: `admin`
- **Şifre**: `admin`
- Dashboard ve visualization platformu

### 2. **Loki** (Port: 3100)
- Log aggregation sistemi
- Backend'den gelen JSON logları toplar ve saklar

### 3. **Promtail**
- Docker container loglarını Loki'ye gönderir
- Backend'den stdout'a yazılan logları yakalar

### 4. **Prometheus** (Port: 9090)
- **URL**: http://localhost:9090
- Metrics collection için
- İleride backend'e /metrics endpoint eklenebilir

## 📊 Kullanım

### Grafana'ya Giriş
1. http://localhost:3001 adresine git
2. Kullanıcı adı: `admin`, Şifre: `admin`
3. İlk girişte şifre değiştirmeniz istenebilir (skip edebilirsiniz)

### Loki Datasource
Datasource otomatik olarak provisioning ile eklendi:
- **Name**: Loki
- **Type**: Loki
- **URL**: http://loki:3100

### Log Sorgulama

#### Explorer'da Log Görüntüleme
1. Grafana'da **Explore** menüsüne git
2. Datasource olarak **Loki** seç
3. Örnek sorgular:

```logql
# Tüm backend logları
{container="log_analyzer_backend"}

# Sadece alert oluşturma eventleri
{container="log_analyzer_backend"} |= "alert_created"

# Sadece ERROR level loglar
{container="log_analyzer_backend"} | json | level="error"

# Belirli bir IP'den gelen alert'ler
{container="log_analyzer_backend"} | json | source_ip="192.168.1.100"

# HTTP request logları
{container="log_analyzer_backend"} | json | event_type="http_request"

# Database operations
{container="log_analyzer_backend"} | json | event_type="database"

# Analysis job events
{container="log_analyzer_backend"} | json | event_type="analysis_job"
```

#### Dashboard Oluşturma
1. **Dashboards** > **New Dashboard** > **Add visualization**
2. Datasource: **Loki** seç
3. Query örnekleri:

**Panel 1: Alert Rate**
```logql
rate({container="log_analyzer_backend"} | json | event_type="alert_created" [5m])
```

**Panel 2: Error Count**
```logql
sum(count_over_time({container="log_analyzer_backend"} | json | level="error" [1h]))
```

**Panel 3: HTTP Requests by Status**
```logql
sum by (status) (count_over_time({container="log_analyzer_backend"} | json | event_type="http_request" [5m]))
```

**Panel 4: Alerts by Severity**
```logql
sum by (severity) (count_over_time({container="log_analyzer_backend"} | json | severity=~".+" [10m]))
```

## 🔍 Structured Logging

Backend zerolog kullanarak structured JSON logs üretiyor:

```json
{
  "level": "info",
  "service": "log-analyzer-backend",
  "event_type": "alert_created",
  "alert_id": "uuid",
  "severity": "CRITICAL",
  "rule_name": "SSH Brute Force",
  "source_ip": "192.168.1.100",
  "time": "2026-02-18T12:00:00Z",
  "message": "Alert Created"
}
```

### Event Types:
- `alert_created` - Yeni alert oluşturuldu
- `analysis_job` - Offline analiz job eventi
- `http_request` - HTTP request/response
- `database` - Database operasyonları

## 📦 Docker Volumes

```yaml
loki_data: Loki veri depolama
prometheus_data: Prometheus veri depolama
grafana_data: Grafana dashboards ve ayarlar
```

## 🛠️ Troubleshooting

### Loglar gelmiyor?
```bash
# Promtail loglarını kontrol et
docker compose logs promtail

# Loki loglarını kontrol et
docker compose logs loki

# Backend loglarını kontrol et
docker compose logs backend
```

### Grafana datasource bağlanamıyor?
- Container'lar aynı network'te olduğundan emin ol
- Loki'nin ayakta olduğunu kontrol et: `docker ps`

### Logları göremiyorum?
- Time range'i kontrol et (son 15 dakika, son 1 saat gibi)
- Label selector'ların doğru olduğundan emin ol

## 📈 İleri Seviye

### Alert Rules Ekleme
Loki'de alerting için `/monitoring/loki-config.yaml` dosyasına rule'lar eklenebilir.

### Metrics Endpoint (İsteğe Bağlı)
Backend'e Prometheus metrics endpoint eklemek için:
```go
import "github.com/prometheus/client_golang/prometheus/promhttp"

r.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

### Log Retention
Loki config'de retention policy ayarlanabilir:
```yaml
limits_config:
  retention_period: 720h  # 30 gün
```

## 🎯 Örnek Dashboard İçin
1. Grafana'ya giriş yap
2. Import Dashboard > Upload JSON file
3. `monitoring/dashboards/log-analyzer-dashboard.json` dosyasını import et (oluşturulacak)

---

**Not**: Production ortamında:
- Grafana admin şifresini değiştirin
- HTTPS kullanın
- Authentication ekleyin
- Log retention policy belirleyin
