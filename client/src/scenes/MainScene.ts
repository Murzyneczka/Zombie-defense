import * as ex from 'excalibur';
import { Player } from '../actors/Player';
import { Zombie } from '../actors/Zombie';
import { Building } from '../actors/Building';
import { Resource } from '../actors/Resource';
import { HUD } from '../ui/HUD';
import { BuildMenu } from '../ui/BuildMenu';
import { MultiplayerManager } from '../managers/MultiplayerManager';
import { ResourceManager } from '../managers/ResourceManager';
import { PlayerData, ZombieData, BuildingData, ResourceData, GameState } from '../../../shared/types';

export class MainScene extends ex.Scene {
  private multiplayerManager: MultiplayerManager;
  private resourceManager: ResourceManager;
  private players: Map<string, Player> = new Map();
  private zombies: Map<string, Zombie> = new Map();
  private buildings: Map<string, Building> = new Map();
  private resources: Map<string, Resource> = new Map();
  private hud: HUD;
  private buildMenu: BuildMenu;
  private localPlayerId: string;
  private gameState: GameState;
  private camera: ex.Camera;
  private map: ex.TileMap;
  private isBuildMenuOpen = false;

  constructor(multiplayerManager: MultiplayerManager, resourceManager: ResourceManager) {
    super();
    this.multiplayerManager = multiplayerManager;
    this.resourceManager = resourceManager;
    this.gameState = {
      wave: 1,
      timeUntilNextWave: 300, // 5 minut w sekundach
      isShopOpen: false,
      players: new Map(),
      zombies: new Map(),
      buildings: new Map(),
      resources: new Map()
    };
  }

  public onInitialize(engine: ex.Engine): void {
    // Utworzenie mapy
    this.createMap(engine);
    
    // Inicjalizacja HUD
    this.hud = new HUD(engine);
    this.add(this.hud);
    
    // Inicjalizacja menu budowania
    this.buildMenu = new BuildMenu(engine, this.resourceManager);
    this.buildMenu.visible = false;
    this.add(this.buildMenu);
    
    // Konfiguracja kamery
    this.camera = this.camera;
    
    // Nasłuchiwanie na zdarzenia multiplayer
    this.setupMultiplayerListeners();
    
    // Obsługa inputu
    this.setupInput(engine);
    
    // Wczytanie zasobów
    this.loadResources();
  }

  private createMap(engine: ex.Engine): void {
    // Utworzenie mapy kafelkowej
    const tileWidth = 32;
    const tileHeight = 32;
    const columns = Math.ceil(5000 / tileWidth);
    const rows = Math.ceil(5000 / tileHeight);
    
    this.map = new ex.TileMap({
      pos: ex.vec(0, 0),
      tileWidth: tileWidth,
      tileHeight: tileHeight,
      columns: columns,
      rows: rows
    });
    
    // Wypełnienie mapy losowymi kafelkami
    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const tileType = Math.random() > 0.9 ? 1 : 0; // 10% szans na przeszkodę
        this.map.getTile(x, y).addGraphic(tileType === 1 ? 
          new ex.Sprite({
            image: this.resourceManager.getImage('rock'),
            destSize: { width: tileWidth, height: tileHeight }
          }) : 
          new ex.Sprite({
            image: this.resourceManager.getImage('grass'),
            destSize: { width: tileWidth, height: tileHeight }
          })
        );
        
        if (tileType === 1) {
          this.map.getTile(x, y).solid = true;
        }
      }
    }
    
    this.add(this.map);
  }

  private setupMultiplayerListeners(): void {
    // Odbieranie aktualizacji stanu gry
    this.multiplayerManager.on('gameStateUpdate', (gameState: GameState) => {
      this.updateGameState(gameState);
    });
    
    // Odbieranie aktualizacji graczy
    this.multiplayerManager.on('playerUpdate', (playerData: PlayerData) => {
      this.updatePlayer(playerData);
    });
    
    // Odbieranie aktualizacji zombie
    this.multiplayerManager.on('zombieUpdate', (zombieData: ZombieData) => {
      this.updateZombie(zombieData);
    });
    
    // Odbieranie aktualizacji budynków
    this.multiplayerManager.on('buildingUpdate', (buildingData: BuildingData) => {
      this.updateBuilding(buildingData);
    });
    
    // Odbieranie aktualizacji surowców
    this.multiplayerManager.on('resourceUpdate', (resourceData: ResourceData) => {
      this.updateResource(resourceData);
    });
    
    // Odbieranie informacji o nowej fali
    this.multiplayerManager.on('waveStart', (wave: number) => {
      this.gameState.wave = wave;
      this.hud.updateWave(wave);
    });
    
    // Odbieranie informacji o otwarciu sklepu
    this.multiplayerManager.on('shopOpen', () => {
      this.gameState.isShopOpen = true;
      this.engine.goToScene('shop');
    });
    
    // Odbieranie ID lokalnego gracza
    this.multiplayerManager.on('playerId', (playerId: string) => {
      this.localPlayerId = playerId;
    });
  }

  private setupInput(engine: ex.Engine): void {
    // Obsługa klawiatury
    engine.input.keyboard.on('press', (evt) => {
      if (evt.key === ex.Input.Keys.B) {
        this.toggleBuildMenu();
      }
    });
    
    // Obsługa myszy
    engine.input.pointer.on('down', (evt) => {
      if (this.isBuildMenuOpen && evt.button === ex.Input.PointerButton.Left) {
        this.handleBuildPlacement(engine);
      }
    });
  }

  private loadResources(): void {
    // Wczytanie zasobów graficznych
    this.resourceManager.loadImage('player', '/assets/player.png');
    this.resourceManager.loadImage('zombie_basic', '/assets/zombie_basic.png');
    this.resourceManager.loadImage('zombie_fast', '/assets/zombie_fast.png');
    this.resourceManager.loadImage('zombie_tank', '/assets/zombie_tank.png');
    this.resourceManager.loadImage('zombie_spitter', '/assets/zombie_spitter.png');
    this.resourceManager.loadImage('fence', '/assets/fence.png');
    this.resourceManager.loadImage('gate', '/assets/gate.png');
    this.resourceManager.loadImage('barbed_wire', '/assets/barbed_wire.png');
    this.resourceManager.loadImage('turret_rifle', '/assets/turret_rifle.png');
    this.resourceManager.loadImage('turret_flamethrower', '/assets/turret_flamethrower.png');
    this.resourceManager.loadImage('turret_grenade', '/assets/turret_grenade.png');
    this.resourceManager.loadImage('turret_piercing', '/assets/turret_piercing.png');
    this.resourceManager.loadImage('wood', '/assets/wood.png');
    this.resourceManager.loadImage('stone', '/assets/stone.png');
    this.resourceManager.loadImage('iron', '/assets/iron.png');
    this.resourceManager.loadImage('gold', '/assets/gold.png');
    this.resourceManager.loadImage('grass', '/assets/grass.png');
    this.resourceManager.loadImage('rock', '/assets/rock.png');
    this.resourceManager.loadImage('bullet', '/assets/bullet.png');
    
    // Wczytanie dźwięków
    this.resourceManager.loadSound('shoot', '/assets/shoot.wav');
    this.resourceManager.loadSound('zombie_growl', '/assets/zombie_growl.wav');
    this.resourceManager.loadSound('build', '/assets/build.wav');
    this.resourceManager.loadSound('collect', '/assets/collect.wav');
    this.resourceManager.loadSound('hit', '/assets/hit.wav');
  }

  private updateGameState(gameState: GameState): void {
    this.gameState = gameState;
    
    // Aktualizacja HUD
    this.hud.updateWave(gameState.wave);
    this.hud.updateTimeUntilNextWave(gameState.timeUntilNextWave);
    
    // Aktualizacja wszystkich obiektów
    gameState.players.forEach((playerData) => this.updatePlayer(playerData));
    gameState.zombies.forEach((zombieData) => this.updateZombie(zombieData));
    gameState.buildings.forEach((buildingData) => this.updateBuilding(buildingData));
    gameState.resources.forEach((resourceData) => this.updateResource(resourceData));
  }

  private updatePlayer(playerData: PlayerData): void {
    let player = this.players.get(playerData.id);
    
    if (!player) {
      // Utworzenie nowego gracza
      player = new Player(playerData, this.resourceManager);
      this.players.set(playerData.id, player);
      this.add(player);
      
      // Jeśli to lokalny gracz, ustaw kamerę
      if (playerData.id === this.localPlayerId) {
        this.camera.strategy.lockToActor(player);
      }
    } else {
      // Aktualizacja istniejącego gracza
      player.updateFromData(playerData);
    }
  }

  private updateZombie(zombieData: ZombieData): void {
    let zombie = this.zombies.get(zombieData.id);
    
    if (!zombie) {
      // Utworzenie nowego zombie
      zombie = new Zombie(zombieData, this.resourceManager);
      this.zombies.set(zombieData.id, zombie);
      this.add(zombie);
    } else {
      // Aktualizacja istniejącego zombie
      zombie.updateFromData(zombieData);
    }
  }

  private updateBuilding(buildingData: BuildingData): void {
    let building = this.buildings.get(buildingData.id);
    
    if (!building) {
      // Utworzenie nowego budynku
      building = new Building(buildingData, this.resourceManager);
      this.buildings.set(buildingData.id, building);
      this.add(building);
    } else {
      // Aktualizacja istniejącego budynku
      building.updateFromData(buildingData);
    }
  }

  private updateResource(resourceData: ResourceData): void {
    let resource = this.resources.get(resourceData.id);
    
    if (!resource) {
      // Utworzenie nowego surowca
      resource = new Resource(resourceData, this.resourceManager);
      this.resources.set(resourceData.id, resource);
      this.add(resource);
    } else {
      // Aktualizacja istniejącego surowca
      resource.updateFromData(resourceData);
    }
  }

  private toggleBuildMenu(): void {
    this.isBuildMenuOpen = !this.isBuildMenuOpen;
    this.buildMenu.visible = this.isBuildMenuOpen;
  }

  private handleBuildPlacement(engine: ex.Engine): void {
    if (!this.isBuildMenuOpen) return;
    
    const selectedBuildingType = this.buildMenu.getSelectedBuildingType();
    if (!selectedBuildingType) return;
    
    const mousePos = engine.input.pointer.lastScreenPos;
    const worldPos = this.camera.screenToWorldCoords(mousePos);
    
    // Wysłanie żądania budowania do serwera
    this.multiplayerManager.emit('buildRequest', {
      type: selectedBuildingType,
      position: { x: worldPos.x, y: worldPos.y }
    });
    
    // Odtworzenie dźwięku budowania
    this.resourceManager.playSound('build');
    
    // Zamknięcie menu budowania
    this.toggleBuildMenu();
  }

  public onActivate(): void {
    // Wysłanie żądania dołączenia do gry
    this.multiplayerManager.emit('joinGame');
  }

  public onDeactivate(): void {
    // Wysłanie żądania opuszczenia gry
    this.multiplayerManager.emit('leaveGame');
  }
}