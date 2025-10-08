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

// Mapa pokoi gier
const gameRooms: Map<string, GameRoom> = new Map();

// Obsługa połączeń klientów
io.on('connection', (socket) => {
  console.log(`Użytkownik połączony: ${socket.id}`);
  
  // Dołączenie do lobby
  socket.on('joinLobby', (data: { playerName: string }) => {
    // Znalezienie lub utworzenie pokoju
    let gameRoom = findAvailableRoom();
    
    if (!gameRoom) {
      // Utworzenie nowego pokoju
      const roomId = generateRoomId();
      gameRoom = new GameRoom(roomId, io);
      gameRooms.set(roomId, gameRoom);
    }
    
    // Dołączenie gracza do pokoju
    gameRoom.addPlayer(socket.id, data.playerName);
    socket.join(gameRoom.getId());
    
    // Wysłanie ID pokoju do gracza
    socket.emit('roomId', gameRoom.getId());
    
    // Wysłanie listy graczy w pokoju
    socket.emit('playersListUpdate', gameRoom.getPlayersList());
    
    // Powiadomienie innych graczy o nowym graczu
    socket.to(gameRoom.getId()).emit('playersListUpdate', gameRoom.getPlayersList());
    
    // Rozpoczęcie gry po dołączeniu minimalnej liczby graczy (tu: 1)
    // Używamy długości listy graczy, by nie dodawać nowych metod do GameRoom
    if (!gameRoom.isGameStarted() && gameRoom.getPlayersList().length >= 1) {
      gameRoom.startGame();
      io.to(gameRoom.getId()).emit('gameStart');
    }
  });
  
  // Opuść lobby
  socket.on('leaveLobby', () => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.removePlayer(socket.id);
        
        // Jeśli pokój jest pusty, usuń go
        if (gameRoom.isEmpty()) {
          gameRoom.cleanup();
          gameRooms.delete(roomId);
        } else {
          // Powiadomienie pozostałych graczy
          io.to(roomId).emit('playersListUpdate', gameRoom.getPlayersList());
        }
      }
    }
  });
  
  // Dołączenie do gry
  socket.on('joinGame', () => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom && gameRoom.isGameStarted()) {
        // Wysłanie ID gracza
        socket.emit('playerId', socket.id);
        
        // Wysłanie aktualnego stanu gry
        socket.emit('gameStateUpdate', gameRoom.getGameState());
      }
    }
  });
  
  // Ruch gracza
  socket.on('playerMove', (data: { position: { x: number; y: number }, rotation: number, velocity: { x: number; y: number } }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.updatePlayerPosition(socket.id, data);
      }
    }
  });
  
  // Strzał gracza
  socket.on('shoot', (data: { position: { x: number; y: number }, direction: { x: number; y: number }, weapon: any }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.playerShoot(socket.id, data);
      }
    }
  });
  
  // Budowanie
  socket.on('buildRequest', (data: { type: any, position: { x: number; y: number } }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.buildStructure(socket.id, data.type, data.position);
      }
    }
  });
  
  // Rozpoczęcie zbierania surowca
  socket.on('startCollecting', (data: { resourceId: string, playerId: string }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.startCollecting(data.resourceId, data.playerId);
      }
    }
  });
  
  // Przerwanie zbierania surowca
  socket.on('stopCollecting', (data: { resourceId: string }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.stopCollecting(data.resourceId);
      }
    }
  });
  
  // Zakup w sklepie
  socket.on('buyItem', (data: { type: string, value: any, cost: number }) => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.buyItem(socket.id, data.type, data.value, data.cost);
      }
    }
  });
  
  // Żądanie aktualizacji złota
  socket.on('requestPlayerGold', () => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        const playerData = gameRoom.getPlayerData(socket.id);
        if (playerData) {
          socket.emit('playerGoldUpdate', playerData.gold);
        }
      }
    }
  });
  
  // Zakończenie fazy sklepu
  socket.on('shopPhaseEnd', () => {
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.endShopPhase();
      }
    }
  });
  
  // Rozłączenie gracza
  socket.on('disconnect', () => {
    console.log(`Użytkownik rozłączony: ${socket.id}`);
    
    const roomId = findPlayerRoom(socket.id);
    if (roomId) {
      const gameRoom = gameRooms.get(roomId);
      if (gameRoom) {
        gameRoom.removePlayer(socket.id);
        
        // Jeśli pokój jest pusty, usuń go
        if (gameRoom.isEmpty()) {
          gameRoom.cleanup();
          gameRooms.delete(roomId);
        } else {
          // Powiadomienie pozostałych graczy
          io.to(roomId).emit('playersListUpdate', gameRoom.getPlayersList());
        }
      }
    }
  });
});

// Znalezienie dostępnego pokoju
function findAvailableRoom(): GameRoom | null {
  for (const [_, room] of gameRooms) {
    if (!room.isFull() && !room.isGameStarted()) {
      return room;
    }
  }
  return null;
}

// Znalezienie pokoju gracza
function findPlayerRoom(playerId: string): string | null {
  for (const [roomId, room] of gameRooms) {
    if (room.hasPlayer(playerId)) {
      return roomId;
    }
  }
  return null;
}

// Generowanie ID pokoju
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8);
}

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});