import { io, Socket } from 'socket.io-client';
import { PlayerData, ZombieData, BuildingData, ResourceData, GameState } from '../../../shared/types';

export class MultiplayerManager {
  private socket: Socket;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Połączenie z serwerem - dynamiczne wykrywanie URL
    // W środowisku produkcyjnym użyje tego samego hosta co strona
    // W środowisku deweloperskim użyje localhost:3000
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    this.socket = io(serverUrl);
    
    // Nasłuchiwanie na zdarzenia serwera
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Odbieranie ID gracza
    this.socket.on('playerId', (playerId: string) => {
      this.triggerLocalListeners('playerId', playerId);
    });
    
    // Odbieranie aktualizacji stanu gry
    this.socket.on('gameStateUpdate', (gameState: GameState) => {
      this.triggerLocalListeners('gameStateUpdate', gameState);
    });
    
    // Odbieranie aktualizacji graczy
    this.socket.on('playerUpdate', (playerData: PlayerData) => {
      this.triggerLocalListeners('playerUpdate', playerData);
    });
    
    // Odbieranie aktualizacji zombie
    this.socket.on('zombieUpdate', (zombieData: ZombieData) => {
      this.triggerLocalListeners('zombieUpdate', zombieData);
    });
    
    // Odbieranie aktualizacji budynków
    this.socket.on('buildingUpdate', (buildingData: BuildingData) => {
      this.triggerLocalListeners('buildingUpdate', buildingData);
    });
    
    // Odbieranie aktualizacji surowców
    this.socket.on('resourceUpdate', (resourceData: ResourceData) => {
      this.triggerLocalListeners('resourceUpdate', resourceData);
    });
    
    // Odbieranie informacji o nowej fali
    this.socket.on('waveStart', (wave: number) => {
      this.triggerLocalListeners('waveStart', wave);
    });
    
    // Odbieranie informacji o otwarciu sklepu
    this.socket.on('shopOpen', () => {
      this.triggerLocalListeners('shopOpen');
    });
    
    // Odbieranie listy graczy
    this.socket.on('playersListUpdate', (players: string[]) => {
      this.triggerLocalListeners('playersListUpdate', players);
    });
    
    // Odbieranie informacji o rozpoczęciu gry
    this.socket.on('gameStart', () => {
      this.triggerLocalListeners('gameStart');
    });
    
    // Odbieranie aktualizacji złota gracza
    this.socket.on('playerGoldUpdate', (gold: number) => {
      this.triggerLocalListeners('playerGoldUpdate', gold);
    });
    
    // Obsługa błędów połączenia
    this.socket.on('connect_error', (error) => {
      console.error('Błąd połączenia z serwerem:', error);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Rozłączono z serwerem');
    });
  }

  public emit(event: string, data?: any): void {
    // Wysłanie zdarzenia do serwera
    this.socket.emit(event, data);
  }

  private triggerLocalListeners(event: string, data?: any): void {
    // Wywołanie lokalnych nasłuchiwaczy
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  public on(event: string, listener: Function): void {
    // Dodanie nasłuchiwacza zdarzenia
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)?.push(listener);
  }

  public off(event: string, listener: Function): void {
    // Usunięcie nasłuchiwacza zdarzenia
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public disconnect(): void {
    // Rozłączenie z serwerem
    this.socket.disconnect();
  }
}