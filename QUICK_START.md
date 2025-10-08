# Quick Start - Zombie Defense na VPS

## Szybki start dla VPS

### 1️⃣ Przygotowanie projektu
```bash
# Sklonuj repozytorium lub przenieś pliki na VPS
git clone [ADRES_REPO] zombie-defense
cd zombie-defense

# LUB przenieś pliki poprzez SCP/SFTP
```

### 2️⃣ Automatyczny build
```bash
# Uruchom skrypt deployment
./deploy.sh
```

Skrypt automatycznie:
- ✅ Zainstaluje wszystkie zależności
- ✅ Zbuduje klienta (wersja produkcyjna)
- ✅ Zbuduje serwer (wersja produkcyjna)

### 3️⃣ Uruchomienie serwera

**Opcja A - Prosty start (do testów):**
```bash
cd server
npm start
```

**Opcja B - PM2 (ZALECANE dla produkcji):**
```bash
cd server
npm install -g pm2  # Zainstaluj PM2 globalnie (raz)

# Metoda 1: Użyj pliku konfiguracyjnego (zalecane)
pm2 start ecosystem.config.js

# LUB Metoda 2: Uruchom bezpośrednio
pm2 start dist/server.js --name zombie-defense

pm2 save  # Zapisz konfigurację
pm2 startup  # Autostart po restarcie serwera
```

### 4️⃣ Zarządzanie PM2
```bash
pm2 status                    # Sprawdź status
pm2 logs zombie-defense       # Zobacz logi
pm2 restart zombie-defense    # Restart aplikacji
pm2 stop zombie-defense       # Zatrzymaj
pm2 delete zombie-defense     # Usuń z PM2
```

### 5️⃣ Konfiguracja Firewall
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3000
sudo ufw status

# CentOS/RHEL (Firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 6️⃣ Dostęp do gry
Otwórz przeglądarkę i wejdź na:
```
http://TWOJ_IP_VPS:3000
```

## Zmiana portu

Jeśli chcesz użyć innego portu:

```bash
# Metoda 1: Zmienna środowiskowa
PORT=8080 npm start

# Metoda 2: Plik .env
cd server
cp .env.example .env
# Edytuj plik .env i ustaw PORT=8080

# Metoda 3: PM2
pm2 start dist/server.js --name zombie-defense -i 1 -- --port=8080
```

## Troubleshooting

### Problem: Port zajęty
```bash
# Znajdź proces
sudo lsof -i :3000

# Zabij proces
sudo kill -9 [PID]
```

### Problem: Nie można połączyć się z gry
1. Sprawdź czy serwer działa: `pm2 status`
2. Sprawdź logi: `pm2 logs zombie-defense`
3. Sprawdź firewall: `sudo ufw status`
4. Sprawdź port w przeglądarce: `http://IP:3000`

### Problem: Błędy podczas buildu
```bash
# Wyczyść cache i przebuduj
cd client
rm -rf node_modules dist
npm install
npm run build

cd ../server
rm -rf node_modules dist
npm install
npm run build
```

## Aktualizacja gry

Po zmianach w kodzie:
```bash
# Ponowny build
./deploy.sh

# Restart serwera
pm2 restart zombie-defense
```

## Nginx Reverse Proxy (Opcjonalnie)

Jeśli chcesz używać domeny bez portu (np. `http://twoja-domena.com`):

1. Zainstaluj Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Utwórz konfigurację:
```bash
sudo nano /etc/nginx/sites-available/zombie-defense
```

3. Dodaj:
```nginx
server {
    listen 80;
    server_name twoja-domena.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

4. Aktywuj konfigurację:
```bash
sudo ln -s /etc/nginx/sites-available/zombie-defense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Bezpieczeństwo

### SSL/HTTPS z Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d twoja-domena.com
```

### Monitoring
```bash
# Monitoruj zasoby
pm2 monit

# Dashboard PM2 (opcjonalnie)
pm2 install pm2-server-monit
```

## Wsparcie

W razie problemów sprawdź:
- Pełną dokumentację: `README.md`
- Logi serwera: `pm2 logs zombie-defense`
- Logi przeglądarki: F12 → Console