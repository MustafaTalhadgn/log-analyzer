 # Log Analyzer

Gercek zamanli log analizi, alarm uretimi ve gorsel dashboard. Uc katmanli mimari (Go backend + React frontend + izleme stack) ile hem canli akisi hem de offline analizleri yonetir. Bu repo, uretim odakli bir guvenlik log analiz platformunu uctan uca hayata gecirir.

## Neden ilgi cekici?

- Gercek zamanli alarmlar: WebSocket uzerinden anlik bildirim.
- Veri kaliciligi: PostgreSQL ile kalici alert arşivi.
- Gozden gecirme akisi: Alert review/unreview mantigi.
- Disari aktarim: CSV ve JSON export.
- Izlenebilirlik: Prometheus + Grafana + Loki entegre monitoring.
- Offline analiz: Dosya bazli toplu analiz ve raporlama.

## Mimari

- Backend (Go): Log parse, kural motoru, alert uretimi, API ve WebSocket.
- Frontend (React + Vite): Dashboard, alert listesi, durum rozetleri, export.
- Database (PostgreSQL): Alert ve analiz metadatasi.
- Observability: Prometheus, Grafana, Loki, Promtail.

## Ozellikler

- Coklu log parser: syslog, nginx, ufw, authlog.
- Kural tabanli alarm uretimi (rules.yaml).
- Canli analiz + offline job bazli analiz.
- Alert review akisi (review/unreview).
- CSV/JSON export.
- Gercek zamanli UI guncellemeleri.

## Hizli Baslangic

### Gereksinimler

- Docker ve Docker Compose

### Calistirma (Docker)

```bash
docker compose up --build -d
```

### Servisler

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100

## Kullanim Akisi

1. Loglar promtail ile toplanir ve loki uzerinden goruntulenebilir.
2. Backend loglari parse eder, kurallari calistirir ve alert uretir.
3. Alertler PostgreSQL'e yazilir ve WebSocket ile aninda UI'ya iletilir.
4. UI uzerinden alertler incelenir, review/unreview yapilir.
5. Gerektiginde CSV veya JSON olarak disari aktarilir.

## API Ozet
g
- GET /api/alerts
- PUT /api/alerts/:alert_id/review
- PUT /api/alerts/:alert_id/unreview
- GET /api/alerts/export/:format (csv | json)

## Yapilanlar (v2)

- Alert review sistemi
- Alert export (CSV/JSON)
- WebSocket tabanli gercek zamanli bildirim
- Monitoring stack (Grafana, Prometheus, Loki)

Detayli teknik notlar icin [v2_RELEASE_NOTES.md](v2_RELEASE_NOTES.md) dosyasina bakabilirsiniz.

## Klasor Yapisi

```
Backend/   # Go backend, API, parser, repository
Frontend/  # React + Vite UI
monitoring/# Grafana, Prometheus, Loki konfigurasyonlari
test-logs/ # Ornek log dosyalari
```

## Ornek Log Uretimi

```bash
python generate_logs.py
```

## Gelistirme Notlari

- Backend konfigurasyonu icin [Backend/rules.yaml](Backend/rules.yaml)
- Frontend API istemcisi: Frontend/src/shared/api/client.js
- WebSocket entegrasyonu: Frontend/src/shared/hooks/useWebSocket.js

## Isgorenlere Not

Bu proje, gercek bir guvenlik log analiz akisini uctan uca kurgular: toplama, analiz, alarm, gorsellestirme ve raporlama. Amacim, uretim seviyesinde bir sistem kurup, gercek zamanli veri akisinda stabil calisan, olceklenebilir bir mimariyi gostermekti.

## Lisans

MIT