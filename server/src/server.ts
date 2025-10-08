import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import path from 'path';
import { GameRoom } from './GameRoom';
import { PlayerData, ZombieData, BuildingData, ResourceData, GameState } from '../../shared/types';

// Utworzenie aplikacji Express
const app = express();
const httpServer = createServer(app);

// Konfiguracja Socket.IO z CORS dla wszystkich origin (dla produkcji)
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Akceptuj połączenia z dowolnego źródła
    methods: ["GET", "POST"]
  }
});

// Serwowanie plików statycznych klienta
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Obsługa wszystkich pozostałych ścieżek - przekierowanie do index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Jeden globalny pokój gry (upraszczamy system)
const gameRoom: GameRoom = new GameRoom('global', io);

// Obsługa połączeń klientów
io.on('connection', (socket) => {
  console.log(`Użytkownik połączony: ${socket.id}`);
  
  // Dołączenie do gry (z nazwą gracza)
  socket.on('joinGame', (data: { playerName: string }) => {
    const name = data?.playerName || 'Gracz';
    // Dodaj gracza do globalnego pokoju
    gameRoom.addPlayer(socket.id, name);
    socket.join(gameRoom.getId());

    // Wyślij graczowi ID oraz natychmiastowy stan gry
    socket.emit('playerId', socket.id);
    socket.emit('gameStateUpdate', gameRoom.getGameState());

    // Powiadom innych o aktualizacji listy graczy (jeśli gdzieś używane)
    io.to(gameRoom.getId()).emit('playersListUpdate', gameRoom.getPlayersList());

    // Jeśli gra nie wystartowała, uruchom ją i poinformuj dołączającego
    if (!gameRoom.isGameStarted()) {
      gameRoom.startGame();
    }
    // Przekaż zdarzenie startu gry tylko do tego gniazda (nowy gracz przejdzie do sceny)
    socket.emit('gameStart');
  });
  
  // Odejście gracza (opcjonalnie z lobby)
  socket.on('leaveLobby', () => {
    gameRoom.removePlayer(socket.id);
    io.to(gameRoom.getId()).emit('playersListUpdate', gameRoom.getPlayersList());
  });
  
  // Kompatybilność: jeżeli ktoś wyśle stare 'joinLobby', potraktuj jako joinGame bez nazwy
  socket.on('joinLobby', (data: { playerName: string }) => {
    const name = data?.playerName || 'Gracz';
    gameRoom.addPlayer(socket.id, name);
    socket.join(gameRoom.getId());
    socket.emit('playerId', socket.id);
    socket.emit('gameStateUpdate', gameRoom.getGameState());
    io.to(gameRoom.getId()).emit('playersListUpdate', gameRoom.getPlayersList());
    if (!gameRoom.isGameStarted()) {
      gameRoom.startGame();
    }
    socket.emit('gameStart');
  });
  
  // Ruch gracza
  socket.on('playerMove', (data: { position: { x: number; y: number }, rotation: number, velocity: { x: number; y: number } }) => {
    gameRoom.updatePlayerPosition(socket.id, data);
  });
  
  // Strzał gracza
  socket.on('shoot', (data: { position: { x: number; y: number }, direction: { x: number; y: number }, weapon: any }) => {
    gameRoom.playerShoot(socket.id, data);
  });
  
  // Budowanie
  socket.on('buildRequest', (data: { type: any, position: { x: number; y: number } }) => {
    gameRoom.buildStructure(socket.id, data.type, data.position);
  });
  
  // Rozpoczęcie zbierania surowca
  socket.on('startCollecting', (data: { resourceId: string, playerId: string }) => {
    gameRoom.startCollecting(data.resourceId, data.playerId);
  });
  
  // Przerwanie zbierania surowca
  socket.on('stopCollecting', (data: { resourceId: string }) => {
    gameRoom.stopCollecting(data.resourceId);
  });
  
  // Zakup w sklepie
  socket.on('buyItem', (data: { type: string, value: any, cost: number }) => {
    gameRoom.buyItem(socket.id, data.type, data.value, data.cost);
  });
  
  // Żądanie aktualizacji złota
  socket.on('requestPlayerGold', () => {
    const playerData = gameRoom.getPlayerData(socket.id);
    if (playerData) {
      socket.emit('playerGoldUpdate', playerData.gold);
    }
  });
  
  // Zakończenie fazy sklepu
  socket.on('shopPhaseEnd', () => {
    gameRoom.endShopPhase();
  });
  
  // Rozłączenie gracza
  socket.on('disconnect', () => {
    console.log(`Użytkownik rozłączony: ${socket.id}`);
    gameRoom.removePlayer(socket.id);
    io.to(gameRoom.getId()).emit('playersListUpdate', gameRoom.getPlayersList());
  });
});


// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});