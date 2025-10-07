import { PlayerData, ZombieData, BuildingData, ResourceData, GameState, WeaponType, ResourceType, BuildingType, ZombieType } from '../../shared/types';
import { ZombieAI } from './ZombieAI';

export class GameRoom {
  private id: string;
  private players: Map<string, PlayerData> = new Map();
  private zombies: Map<string, ZombieData> = new Map();
  private buildings: Map<string, BuildingData> = new Map();
  private resources: Map<string, ResourceData> = new Map();
  private gameStarted = false;
  private wave = 1;
  private timeUntilNextWave = 300; // 5 minut w sekundach
  private isShopOpen = false;
  private zombieAI: ZombieAI;
  private waveTimer: NodeJS.Timeout | null = null;
  private shopTimer: NodeJS.Timeout | null = null;
  private collectingResources: Map<string, string> = new Map(); // resourceId -> playerId

  constructor(id: string) {
    this.id = id;
    this.zombieAI = new ZombieAI();
  }

  public getId(): string {
    return this.id;
  }

  public addPlayer(playerId: string, playerName: string): void {
    const playerData: PlayerData = {
      id: playerId,
      name: playerName,
      position: { x: 2500, y: 2500 }, // Środek mapy
      rotation: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      armor: 0,
      weapons: [WeaponType.Pistol],
      currentWeapon: WeaponType.Pistol,
      resources: new Map([
        [ResourceType.Wood, 0],
        [ResourceType.Stone, 0],
        [ResourceType.Iron, 0]
      ]),
      gold: 50
    };
    
    this.players.set(playerId, playerData);
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  public isFull(): boolean {
    return this.players.size >= 4;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public isGameStarted(): boolean {
    return this.gameStarted;
  }

  public startGame(): void {
    this.gameStarted = true;
    
    // Wygenerowanie początkowych surowców
    this.generateResources();
    
    // Uruchomienie timera fali
    this.startWaveTimer();
  }

  public getPlayersList(): string[] {
    return Array.from(this.players.values()).map(player => player.name);
  }

  public getPlayerData(playerId: string): PlayerData | null {
    return this.players.get(playerId) || null;
  }

  public getGameState(): GameState {
    return {
      wave: this.wave,
      timeUntilNextWave: this.timeUntilNextWave,
      isShopOpen: this.isShopOpen,
      players: this.players,
      zombies: this.zombies,
      buildings: this.buildings,
      resources: this.resources
    };
  }

  public updatePlayerPosition(playerId: string, data: { position: { x: number; y: number }, rotation: number, velocity: { x: number; y: number } }): void {
    const player = this.players.get(playerId);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
    }
  }

  public playerShoot(playerId: string, data: { position: { x: number; y: number }, direction: { x: number; y: number }, weapon: WeaponType }): void {
    // Logika strzału jest obsługiwana po stronie klienta
    // Serwer tylko waliduje i rozgłasza informacje
  }

  public buildStructure(playerId: string, buildingType: BuildingType, position: { x: number; y: number }): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Sprawdzenie, czy gracz ma wystarczająco surowców
    const cost = this.getBuildingCost(buildingType);
    let canBuild = true;
    
    cost.forEach((amount, resourceType) => {
      const playerResource = player.resources.get(resourceType) || 0;
      if (playerResource < amount) {
        canBuild = false;
      }
    });
    
    if (!canBuild) return;
    
    // Pobranie surowców
    cost.forEach((amount, resourceType) => {
      const currentAmount = player.resources.get(resourceType) || 0;
      player.resources.set(resourceType, currentAmount - amount);
    });
    
    // Utworzenie budynku
    const buildingId = this.generateId();
    const buildingData: BuildingData = {
      id: buildingId,
      type: buildingType,
      position: position,
      health: this.getBuildingMaxHealth(buildingType),
      maxHealth: this.getBuildingMaxHealth(buildingType),
      owner: playerId
    };
    
    this.buildings.set(buildingId, buildingData);
  }

  public startCollecting(resourceId: string, playerId: string): void {
    this.collectingResources.set(resourceId, playerId);
  }

  public stopCollecting(resourceId: string): void {
    this.collectingResources.delete(resourceId);
  }

  public buyItem(playerId: string, itemType: string, itemValue: any, cost: number): void {
    const player = this.players.get(playerId);
    if (!player || player.gold < cost) return;
    
    // Pobranie złota
    player.gold -= cost;
    
    // Dodanie przedmiotu
    if (itemType === 'weapon') {
      if (!player.weapons.includes(itemValue)) {
        player.weapons.push(itemValue);
      }
      player.currentWeapon = itemValue;
    } else if (itemType === 'resource') {
      const currentAmount = player.resources.get(itemValue.type) || 0;
      player.resources.set(itemValue.type, currentAmount + itemValue.amount);
    }
  }

  public endShopPhase(): void {
    this.isShopOpen = false;
    
    // Uruchomienie nowej fali
    this.startWave();
  }

  private generateResources(): void {
    const resourceTypes = [ResourceType.Wood, ResourceType.Stone, ResourceType.Iron];
    const resourceCount = 20; // Liczba surowców na mapie
    
    for (let i = 0; i < resourceCount; i++) {
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const position = this.getRandomPosition();
      
      const resourceId = this.generateId();
      const resourceData: ResourceData = {
        id: resourceId,
        type: resourceType,
        position: position,
        amount: 10
      };
      
      this.resources.set(resourceId, resourceData);
    }
  }

  private startWaveTimer(): void {
    this.waveTimer = setInterval(() => {
      this.timeUntilNextWave--;
      
      if (this.timeUntilNextWave <= 0) {
        // Rozpoczęcie nowej fali
        this.startWave();
      }
    }, 1000);
  }

  private startWave(): void {
    // Zresetowanie timera
    this.timeUntilNextWave = 300; // 5 minut
    
    // Generowanie zombie
    this.spawnZombies();
    
    // Inkrementacja numeru fali
    this.wave++;
  }

  private spawnZombies(): void {
    const zombieCount = 5 + this.wave * 2; // Zwiększająca się liczba zombie
    const zombieTypes = [ZombieType.Basic, ZombieType.Fast, ZombieType.Tank, ZombieType.Spitter];
    
    for (let i = 0; i < zombieCount; i++) {
      // Losowanie typu zombie (większość to podstawowe)
      let zombieType = ZombieType.Basic;
      const rand = Math.random();
      
      if (this.wave > 2 && rand < 0.2) {
        zombieType = ZombieType.Fast;
      } else if (this.wave > 4 && rand < 0.1) {
        zombieType = ZombieType.Tank;
      } else if (this.wave > 6 && rand < 0.05) {
        zombieType = ZombieType.Spitter;
      }
      
      // Losowa pozycja na krawędzi mapy
      const position = this.getRandomEdgePosition();
      
      const zombieId = this.generateId();
      const zombieData: ZombieData = {
        id: zombieId,
        type: zombieType,
        position: position,
        health: this.getZombieMaxHealth(zombieType),
        maxHealth: this.getZombieMaxHealth(zombieType)
      };
      
      this.zombies.set(zombieId, zombieData);
    }
  }

  private getRandomPosition(): { x: number; y: number } {
    return {
      x: Math.random() * 4800 + 100, // 100-4900
      y: Math.random() * 4800 + 100  // 100-4900
    };
  }

  private getRandomEdgePosition(): { x: number; y: number } {
    const edge = Math.floor(Math.random() * 4);
    
    switch (edge) {
      case 0: // Góra
        return { x: Math.random() * 5000, y: 50 };
      case 1: // Prawo
        return { x: 4950, y: Math.random() * 5000 };
      case 2: // Dół
        return { x: Math.random() * 5000, y: 4950 };
      case 3: // Lewo
        return { x: 50, y: Math.random() * 5000 };
      default:
        return { x: 2500, y: 2500 };
    }
  }

  private getBuildingCost(buildingType: BuildingType): Map<ResourceType, number> {
    const cost = new Map<ResourceType, number>();
    
    switch (buildingType) {
      case BuildingType.Fence:
        cost.set(ResourceType.Wood, 10);
        break;
      case BuildingType.Gate:
        cost.set(ResourceType.Wood, 15);
        cost.set(ResourceType.Iron, 5);
        break;
      case BuildingType.BarbedWire:
        cost.set(ResourceType.Iron, 10);
        break;
      case BuildingType.TurretRifle:
        cost.set(ResourceType.Iron, 20);
        cost.set(ResourceType.Stone, 10);
        break;
      case BuildingType.TurretFlamethrower:
        cost.set(ResourceType.Iron, 25);
        cost.set(ResourceType.Stone, 15);
        break;
      case BuildingType.TurretGrenade:
        cost.set(ResourceType.Iron, 30);
        cost.set(ResourceType.Stone, 20);
        break;
      case BuildingType.TurretPiercing:
        cost.set(ResourceType.Iron, 35);
        cost.set(ResourceType.Stone, 25);
        break;
    }
    
    return cost;
  }

  private getBuildingMaxHealth(buildingType: BuildingType): number {
    switch (buildingType) {
      case BuildingType.Fence:
        return 50;
      case BuildingType.Gate:
        return 100;
      case BuildingType.BarbedWire:
        return 25;
      case BuildingType.TurretRifle:
        return 75;
      case BuildingType.TurretFlamethrower:
        return 75;
      case BuildingType.TurretGrenade:
        return 75;
      case BuildingType.TurretPiercing:
        return 75;
      default:
        return 50;
    }
  }

  private getZombieMaxHealth(zombieType: ZombieType): number {
    switch (zombieType) {
      case ZombieType.Basic:
        return 50;
      case ZombieType.Fast:
        return 30;
      case ZombieType.Tank:
        return 150;
      case ZombieType.Spitter:
        return 40;
      default:
        return 50;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}