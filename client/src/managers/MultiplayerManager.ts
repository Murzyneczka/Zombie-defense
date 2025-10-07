import { io, Socket } from 'socket.io-client';
import { PlayerData, ZombieData, BuildingData, ResourceData, GameState } from '../../../shared/types';

export class MultiplayerManager {
  private socket: Socket;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Połączenie z serwerem
    this.socket = io('http://localhost:3000');
    
    // Nasłuchiwanie na zdarzenia serwera
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Odbieranie ID gracza
    this.socket.on('playerId', (playerId: string) => {
      this.emit('playerId', playerId);
    });
    
    // Odbieranie aktualizacji stanu gry
    this.socket.on('gameStateUpdate', (gameState: GameState) => {
      this.emit('gameStateUpdate', gameState);
    });
    
    // Odbieranie aktualizacji graczy
    this.socket.on('playerUpdate', (playerData: PlayerData) => {
      this.emit('playerUpdate', playerData);
    });
    
    // Odbieranie aktualizacji zombie
    this.socket.on('zombieUpdate', (zombieData: ZombieData) => {
      this.emit('zombieUpdate', zombieData);
    });
    
    // Odbieranie aktualizacji budynków
    this.socket.on('buildingUpdate', (buildingData: BuildingData) => {
      this.emit('buildingUpdate', buildingData);
    });
    
    // Odbieranie aktualizacji surowców
    this.socket.on('resourceUpdate', (resourceData: ResourceData) => {
      this.emit('resourceUpdate', resourceData);
    });
    
    // Odbieranie informacji o nowej fali
    this.socket.on('waveStart', (wave: number) => {
      this.emit('waveStart', wave);
    });
    
    // Odbieranie informacji o otwarciu sklepu
    this.socket.on('shopOpen', () => {
      this.emit('shopOpen');
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