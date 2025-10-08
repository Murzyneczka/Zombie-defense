# Zombie Defense - Multiplayer Game

Gra 2D Multiplayer Zombie Defense zbudowana z użyciem TypeScript, Excalibur.js i Socket.IO.

## Architektura

Projekt składa się z trzech głównych folderów:
- **client/** - Aplikacja kliencka (frontend)
- **server/** - Serwer gry (backend)
- **shared/** - Współdzielone typy i definicje

## Wymagania

- Node.js v16 lub nowszy
- npm lub yarn

## Instalacja

### 1. Instalacja zależności klienta
```bash
cd client
npm install
```

### 2. Instalacja zależności serwera
```bash
cd server
npm install
```

## Uruchomienie lokalne (Development)

### Opcja A: Osobne procesy (Zalecane dla rozwoju)

1. W jednym terminalu - uruchom klienta:
```bash
cd client
npm run dev
```
Klient będzie dostępny pod adresem: `http://localhost:8080`

2. W drugim terminalu - uruchom serwer:
```bash
cd server
npm run dev
```
Serwer nasłuchuje na porcie: `3000`

### Opcja B: Połączona wersja (symulacja produkcji)

```bash
cd server
npm run build:all
npm start
```
Gra będzie dostępna pod adresem: `http://localhost:3000`

## Wdrożenie na VPS (Produkcja)

### 1. Zbuduj projekt
```bash
# W głównym katalogu projektu
cd client
npm install
npm run build

cd ../server
npm install
npm run build
```

### 2. Skopiuj pliki na VPS
Przenieś następujące foldery i pliki na VPS:
- `server/dist/` - skompilowany serwer
- `server/node_modules/` - zależności serwera
- `server/package.json` - konfiguracja serwera
- `client/dist/` - skompilowany klient
- `shared/` - współdzielone typy

### 3. Struktura katalogów na VPS
```
/home/user/zombie-defense/
├── server/
│   ├── dist/
│   ├── node_modules/
│   └── package.json
├── client/
│   └── dist/
└── shared/
```

### 4. Uruchom serwer na VPS
```bash
cd server
PORT=3000 node dist/server.js
```

### 5. Użyj Process Managera (Zalecane)

Aby serwer działał w tle i uruchamiał się automatycznie, użyj PM2:

```bash
# Instalacja PM2 globalnie
npm install -g pm2

# Uruchomienie serwera
cd server
pm2 start dist/server.js --name "zombie-defense"

# Zapisz konfigurację PM2
pm2 save

# Ustaw autostart po restarcie systemu
pm2 startup
```

### 6. Konfiguracja portu

Domyślnie serwer nasłuchuje na porcie 3000. Możesz zmienić port używając zmiennej środowiskowej:

```bash
PORT=8080 node dist/server.js
```

lub z PM2:

```bash
pm2 start dist/server.js --name "zombie-defense" -- --port 8080
```

### 7. Dostęp do gry

Po uruchomieniu serwera na VPS, gra będzie dostępna pod adresem:
```
http://TWOJ_IP_VPS:3000
```

lub jeśli masz domenę:
```
http://twoja-domena.com:3000
```

### 8. Konfiguracja Firewall

Upewnij się, że port serwera (domyślnie 3000) jest otwarty w firewalu:

```bash
# UFW (Ubuntu)
sudo ufw allow 3000

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 9. Opcjonalnie: Nginx jako Reverse Proxy

Dla lepszej wydajności i bezpieczeństwa, możesz użyć Nginx jako reverse proxy:

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
    }
}
```

## Komendy pomocnicze

### Klient
- `npm run build` - Buduje wersję produkcyjną
- `npm run dev` - Uruchamia serwer deweloperski z hot-reload
- `npm start` - Uruchamia serwer deweloperski

### Serwer
- `npm run build` - Kompiluje TypeScript do JavaScript
- `npm run build:client` - Buduje klienta
- `npm run build:all` - Buduje klienta i serwer
- `npm start` - Uruchamia serwer produkcyjny
- `npm run dev` - Uruchamia serwer deweloperski z auto-restart

## Rozwiązywanie problemów

### Klient nie może połączyć się z serwerem
- Sprawdź czy serwer działa: `pm2 status` lub `pm2 logs zombie-defense`
- Sprawdź czy port jest otwarty w firewalu
- Sprawdź logi przeglądarki (F12 -> Console)

### Błędy CORS
- Upewnij się, że CORS jest poprawnie skonfigurowany w `server/src/server.ts`
- Serwer obecnie akceptuje połączenia z dowolnego źródła (`origin: "*"`)

### Port już używany
```bash
# Znajdź proces używający portu
lsof -i :3000

# Zatrzymaj proces
kill -9 PID
```

## Bezpieczeństwo

W środowisku produkcyjnym rozważ:
1. Ograniczenie CORS do konkretnych domen
2. Użycie HTTPS (certyfikat SSL)
3. Wdrożenie rate limiting
4. Monitorowanie i logowanie

## Licencja

[Twoja licencja]