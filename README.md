docker-compose run --rm log-analyzer

Faz 1: Altyapı ve Migrasyon (Infrastructure)

Klasör yapısının yeni (gönderdiğin resimdeki) hale getirilmesi.

docker-compose.yml dosyasının güncellenip PostgreSQL servisinin eklenmesi.

Go modüllerinin yeni yapıya göre düzenlenmesi.

Faz 2: Veritabanı Katmanı (Backend - Database)

PostgreSQL tablolarının tasarlanması (Alerts tablosu).

Go tarafında veritabanı bağlantısının (GORM veya pgx ile) kurulması.

Mevcut ReportWriter interface'ine PostgresWriter implementasyonu yazılması. (Artık CSV yerine DB'ye yazacağız).

Faz 3: API Dönüşümü (Backend - API)

CLI yapısının (main.go içindeki döngünün) kaldırılması.

Yerine Gin Framework (veya standart library) ile bir HTTP Server kurulması.

Log analiz motorunun arka planda (Goroutine olarak) çalışmaya devam etmesi.

GET /api/alerts gibi endpointlerin yazılması.

Faz 4: WebSocket Entegrasyonu (Real-time)

Backend'e WebSocket handler eklenmesi.

Analiz motoru alarm ürettiğinde, bu alarmın WebSocket kanalına gönderilmesi.

Faz 5: Frontend İnşası (React + Vite)

React projesinin kurulması.

Basit bir Dashboard tasarımı (Navbar, Sidebar, Tablo).

Backend'den verilerin çekilmesi ve WebSocket dinlenmesi.