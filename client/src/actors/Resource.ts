import * as ex from 'excalibur';
import { ResourceData, ResourceType } from '../../../shared/types';
import { ResourceManager } from '../managers/ResourceManager';

export class Resource extends ex.Actor {
  private data: ResourceData;
  private resourceManager: ResourceManager;
  private collectCooldown = 1000; // ms
  private lastCollectTime = 0;
  private isBeingCollected = false;
  private collectProgress = 0;
  private collectBar: ex.Rectangle;
  private collectBarBg: ex.Rectangle;

  constructor(data: ResourceData, resourceManager: ResourceManager) {
    super({
      pos: ex.vec(data.position.x, data.position.y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Passive,
      color: ex.Color.Yellow
    });
    
    this.data = data;
    this.resourceManager = resourceManager;
    
    // Inicjalizacja paska postępu zbierania
    this.collectBarBg = new ex.Rectangle({
      width: 40,
      height: 4,
      color: ex.Color.Black
    });
    
    this.collectBar = new ex.Rectangle({
      width: 0,
      height: 4,
      color: ex.Color.Green
    });
    
    this.addChild(this.collectBarBg);
    this.addChild(this.collectBar);
    
    // Dodanie sprite'a surowca
    const resourceSprite = new ex.Sprite({
      image: this.getResourceSprite(),
      destSize: { width: 32, height: 32 }
    });
    
    this.graphics.use(resourceSprite);
  }

  public onInitialize(engine: ex.Engine): void {
    // Obsługa kolizji z graczem
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Player) {
        this.startCollecting(evt.other);
      }
    });
    
    this.on('collisionend', (evt) => {
      if (evt.other instanceof Player) {
        this.stopCollecting();
      }
    });
  }

  public onPreUpdate(engine: ex.Engine, delta: number): void {
    if (this.isBeingCollected) {
      this.updateCollectProgress(delta);
    }
  }

  private getResourceSprite(): ex.ImageSource {
    switch (this.data.type) {
      case ResourceType.Wood:
        return this.resourceManager.getImage('wood');
      case ResourceType.Stone:
        return this.resourceManager.getImage('stone');
      case ResourceType.Iron:
        return this.resourceManager.getImage('iron');
      case ResourceType.Gold:
        return this.resourceManager.getImage('gold');
      default:
        return this.resourceManager.getImage('wood');
    }
  }

  private startCollecting(player: any): void {
    this.isBeingCollected = true;
    this.collectProgress = 0;
    
    // Wysłanie żądania zbierania do serwera
    this.scene['multiplayerManager'].emit('startCollecting', {
      resourceId: this.data.id,
      playerId: player.getData().id
    });
  }

  private stopCollecting(): void {
    this.isBeingCollected = false;
    this.collectProgress = 0;
    this.updateCollectBar();
    
    // Wysłanie informacji o przerwaniu zbierania do serwera
    this.scene['multiplayerManager'].emit('stopCollecting', {
      resourceId: this.data.id
    });
  }

  private updateCollectProgress(delta: number): void {
    const now = Date.now();
    if (now - this.lastCollectTime < this.collectCooldown) return;
    
    this.lastCollectTime = now;
    this.collectProgress += 0.2; // 20% na raz
    
    this.updateCollectBar();
    
    // Sprawdzenie, czy surowiec został zebrany
    if (this.collectProgress >= 1.0) {
      this.collect();
    }
  }

  private updateCollectBar(): void {
    this.collectBar.width = 40 * this.collectProgress;
    
    // Zmiana koloru paska w zależności od postępu
    if (this.collectProgress > 0.6) {
      this.collectBar.color = ex.Color.Green;
    } else if (this.collectProgress > 0.3) {
      this.collectBar.color = ex.Color.Yellow;
    } else {
      this.collectBar.color = ex.Color.Red;
    }
  }

  private collect(): void {
    // Odtworzenie dźwięku zbierania
    this.resourceManager.playSound('collect');
    
    // Wysłanie informacji o zebraniu surowca do serwera
    this.scene['multiplayerManager'].emit('resourceCollected', {
      resourceId: this.data.id
    });
    
    // Usunięcie surowca z gry
    this.kill();
  }

  public updateFromData(data: ResourceData): void {
    this.data = data;
    this.pos = ex.vec(data.position.x, data.position.y);
  }

  public getData(): ResourceData {
    return this.data;
  }
}