import os
import time
import random
from datetime import datetime


LOG_DIR = "./test-logs"
AUTH_LOG = os.path.join(LOG_DIR, "auth.log")
NGINX_LOG = os.path.join(LOG_DIR, "nginx", "access.log")
SYSLOG = os.path.join(LOG_DIR, "syslog")
UFW_LOG = os.path.join(LOG_DIR, "ufw.log")


if not os.path.exists(os.path.join(LOG_DIR, "nginx")):
    os.makedirs(os.path.join(LOG_DIR, "nginx"))

def write_log(filepath, line):
    with open(filepath, "a") as f:
        f.write(line + "\n")
    print(f"[LOG EKLENDİ] {filepath} -> {line[:50]}...")

def get_time_syslog():
    return datetime.now().strftime("%b %d %H:%M:%S")

def get_time_nginx():
    return datetime.now().strftime("%d/%b/%Y:%H:%M:%S +0300")

# --- SALDIRI SENARYOLARI ---

def scenario_ssh_brute_force():
    # Kural: AUTH-001-FAST (5 deneme / 60 sn)
    ip = f"192.168.1.{random.randint(100, 200)}"
    user = "root"
    print(f"\n--- SSH Brute Force Başlatılıyor ({ip}) ---")
    for _ in range(6):
        timestamp = get_time_syslog()
        log = f"{timestamp} server sshd[{random.randint(1000,9999)}]: Failed password for {user} from {ip} port 22 ssh2"
        write_log(AUTH_LOG, log)
        time.sleep(0.5) # Hızlı saldırı

def scenario_nginx_sqli():
    # Kural: NGINX-WEB-ATTACK
    ip = f"10.10.10.{random.randint(10, 50)}"
    print(f"\n--- SQL Injection Saldırısı Başlatılıyor ({ip}) ---")
    payloads = [
        "GET /product?id=1 UNION SELECT 1,password FROM users",
        "GET /admin/login.php?user=' OR '1'='1",
        "GET /search?q=<script>alert('XSS')</script>"
    ]
    for payload in payloads:
        timestamp = get_time_nginx()
        log = f'{ip} - - [{timestamp}] "{payload} HTTP/1.1" 200 1234 "-" "Mozilla/5.0"'
        write_log(NGINX_LOG, log)
        time.sleep(1)

def scenario_ufw_port_scan():
    # Kural: UFW-PORT-SCAN (20 block / 60 sn)
    ip = f"45.33.22.{random.randint(10, 99)}"
    print(f"\n--- Port Tarama Saldırısı Başlatılıyor ({ip}) ---")
    for port in range(20, 45):
        timestamp = get_time_syslog()
        # UFW log formatı biraz karışıktır, senin regex'e uyan hali:
        log = f"{timestamp} server kernel: [12345.67] [UFW BLOCK] IN=eth0 OUT= MAC=00:00 SRC={ip} DST=192.168.1.5 LEN=40 TOS=0x00 PREC=0x00 TTL=242 ID=54321 PROTO=TCP SPT={random.randint(10000,60000)} DPT={port} WINDOW=1024 RES=0x00 SYN URGP=0"
        write_log(UFW_LOG, log)
        time.sleep(0.2)

def scenario_normal_traffic():
    print("\n--- Normal Trafik Oluşturuluyor ---")
    # SSH Başarılı
    write_log(AUTH_LOG, f"{get_time_syslog()} server sshd[222]: Accepted password for mustafa from 192.168.1.5 port 5555 ssh2")
    # Nginx Normal
    write_log(NGINX_LOG, f'192.168.1.5 - - [{get_time_nginx()}] "GET /index.html HTTP/1.1" 200 500 "-" "Chrome/90.0"')
    # Syslog Normal
    write_log(SYSLOG, f"{get_time_syslog()} server systemd[1]: Started Session 5 of user mustafa.")

# --- ANA DÖNGÜ ---
if __name__ == "__main__":
    print("Log Generator Başladı... (Çıkış için Ctrl+C)")
    print(f"Loglar buraya yazılıyor: {LOG_DIR}")
    
    try:
        while True:
            choice = random.choice(["normal", "ssh", "web", "ufw"])
            
            if choice == "normal":
                scenario_normal_traffic()
            elif choice == "ssh":
                scenario_ssh_brute_force()
            elif choice == "web":
                scenario_nginx_sqli()
            elif choice == "ufw":
                scenario_ufw_port_scan()
                
            sleep_time = random.randint(2, 5)
            print(f"Bekleniyor {sleep_time} sn...")
            time.sleep(sleep_time)
            
    except KeyboardInterrupt:
        print("\nLog üretimi durduruldu.")