#!/bin/bash

# Skrypt deployment dla VPS
# Użycie: ./deploy.sh

echo "🚀 Rozpoczynam deployment Zombie Defense..."

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Instalacja zależności klienta
echo -e "${BLUE}📦 Instalacja zależności klienta...${NC}"
cd client
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd instalacji zależności klienta${NC}"
    exit 1
fi

# 2. Budowanie klienta
echo -e "${BLUE}🔨 Budowanie klienta...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd budowania klienta${NC}"
    exit 1
fi

# 3. Instalacja zależności serwera
echo -e "${BLUE}📦 Instalacja zależności serwera...${NC}"
cd ../server
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd instalacji zależności serwera${NC}"
    exit 1
fi

# 4. Budowanie serwera
echo -e "${BLUE}🔨 Budowanie serwera...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd budowania serwera${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build zakończony pomyślnie!${NC}"
echo ""
echo -e "${BLUE}📋 Następne kroki:${NC}"
echo "1. Uruchom serwer: cd server && npm start"
echo "2. Lub użyj PM2: cd server && pm2 start dist/server.js --name zombie-defense"
echo "3. Gra będzie dostępna pod adresem: http://TWOJ_IP:3000"
echo ""
echo -e "${GREEN}🎮 Miłej gry!${NC}"