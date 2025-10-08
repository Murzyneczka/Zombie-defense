# Deployment Checklist - Zombie Defense

## ✅ Lista kontrolna przed wdrożeniem na VPS

### 1. Przygotowanie lokalne

- [ ] Kod został przetestowany lokalnie
- [ ] Wszystkie zmiany zostały commitowane do git
- [ ] Dependencies są aktualne (`npm install` w client/ i server/)

### 2. Build projektu

```bash
# Automatyczny build
./deploy.sh

# LUB manualnie:
cd client && npm install && npm run build
cd ../server && npm install && npm run build
```

**Sprawdź czy istnieją:**
- [ ] `client/dist/` (zawiera index.html, bundle.js)
- [ ] `server/dist/` (zawiera server.js i inne pliki .js)

### 3. Przesłanie plików na VPS

**Metoda A - Git:**
```bash
# Na VPS
git clone [URL_REPO] zombie-defense
cd zombie-defense
./deploy.sh
```

**Metoda B - SCP:**
```bash
# Z lokalnego komputera
scp -r client/dist user@VPS_IP:/home/user/zombie-defense/client/
scp -r server/dist user@VPS_IP:/home/user/zombie-defense/server/
scp -r server/node_modules user@VPS_IP:/home/user/zombie-defense/server/
scp -r shared user@VPS_IP:/home/user/zombie-defense/
scp server/package.json user@VPS_IP:/home/user/zombie-defense/server/
```

**Metoda C - rsync (zalecane):**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ user@VPS_IP:/home/user/zombie-defense/
```

### 4. Konfiguracja VPS

- [ ] Node.js jest zainstalowany (v16+): `node --version`
- [ ] npm jest zainstalowany: `npm --version`
- [ ] Port 3000 jest wolny: `sudo lsof -i :3000`
- [ ] Firewall pozwala na połączenia: `sudo ufw allow 3000`

### 5. Instalacja dependencies na VPS

```bash
cd /home/user/zombie-defense/server
npm install --production
```

### 6. Uruchomienie serwera

**Opcja A - PM2 (zalecane):**
```bash
npm install -g pm2
cd server
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Postępuj zgodnie z instrukcjami
```

**Opcja B - systemd:**
```bash
# Edytuj ścieżki w pliku
sudo nano server/zombie-defense.service

# Skopiuj do systemd
sudo cp server/zombie-defense.service /etc/systemd/system/

# Uruchom
sudo systemctl daemon-reload
sudo systemctl enable zombie-defense
sudo systemctl start zombie-defense
```

### 7. Weryfikacja

- [ ] Serwer działa: `pm2 status` lub `systemctl status zombie-defense`
- [ ] Logi są czyste: `pm2 logs zombie-defense` lub `journalctl -u zombie-defense`
- [ ] Strona ładuje się: `http://VPS_IP:3000`
- [ ] WebSocket działa (sprawdź w konsoli przeglądarki)
- [ ] Możesz dołączyć do lobby
- [ ] Gra startuje poprawnie

### 8. Opcjonalne - Nginx & SSL

**Nginx:**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/zombie-defense
# (Skopiuj konfigurację z QUICK_START.md)
sudo ln -s /etc/nginx/sites-available/zombie-defense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 9. Monitoring

- [ ] PM2 monitoring: `pm2 monit`
- [ ] Disk space: `df -h`
- [ ] Memory: `free -m`
- [ ] CPU: `top`

### 10. Backup

- [ ] Skonfiguruj regularne backupy
- [ ] Przetestuj proces restore

## 🚀 Szybkie komendy

```bash
# Status
pm2 status

# Logi
pm2 logs zombie-defense --lines 100

# Restart
pm2 restart zombie-defense

# Update po zmianach
cd /home/user/zombie-defense
git pull
./deploy.sh
pm2 restart zombie-defense

# Rollback
pm2 delete zombie-defense
cd /home/user/zombie-defense
git checkout [poprzedni-commit]
./deploy.sh
pm2 start server/ecosystem.config.js
```

## 🐛 Troubleshooting

### Serwer nie startuje
```bash
pm2 logs zombie-defense  # Sprawdź logi
node server/dist/server.js  # Uruchom manualnie aby zobaczyć błędy
```

### Błąd EADDRINUSE (port zajęty)
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
```

### Brak połączenia WebSocket
- Sprawdź firewall: `sudo ufw status`
- Sprawdź CORS w server.ts
- Sprawdź URL w konsoli przeglądarki (F12)

### 502 Bad Gateway (Nginx)
```bash
sudo systemctl status zombie-defense  # Sprawdź czy serwer działa
sudo nginx -t  # Sprawdź konfigurację Nginx
sudo tail -f /var/log/nginx/error.log  # Sprawdź logi
```

## 📊 Metryki wydajności

Zalecane minimum dla VPS:
- **CPU:** 1 core
- **RAM:** 1GB (2GB zalecane)
- **Disk:** 10GB
- **Bandwidth:** 100 Mbps

## 🔒 Bezpieczeństwo

- [ ] Zmień domyślne porty SSH
- [ ] Użyj klucza SSH zamiast hasła
- [ ] Zainstaluj fail2ban
- [ ] Skonfiguruj automatyczne aktualizacje bezpieczeństwa
- [ ] Użyj HTTPS (Let's Encrypt)
- [ ] Ograniczenie CORS do konkretnych domen (w produkcji)
- [ ] Rate limiting w aplikacji

## 📝 Notatki

Dodatkowe notatki dla Twojego konkretnego deployment:
- Adres VPS: ______________________
- Domena: __________________________
- Port: ____________________________
- Manager: PM2 / systemd / inny: ___________
- Data ostatniego update: __________