import * as ex from 'excalibur';
import { BuildingData, BuildingType } from '../../../shared/types';
import { ResourceManager } from '../managers/ResourceManager';
import { Bullet } from './Bullet';

export class Building extends ex.Actor {
  private data: BuildingData;
  private resourceManager: ResourceManager;
  private shootCooldown = 1000; // ms
  private lastShotTime = 0;
  private range = 300;
  private damage = 10;
  private healthBar: ex.Rectangle;

  constructor(data: BuildingData, resourceManager: ResourceManager) {
    super({
      pos: ex.vec(data.position.x, data.position.y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Fixed,
      color: ex.Color.Brown
    });
    
    this.data = data;
    this.resourceManager = resourceManager;
    
    // Ustawienie statystyk w zależności od typu
    this.setStatsByType();
    
    // Inicjalizacja paska HP
    this.healthBar = new ex.Rectangle({
      width: 40,
      height: 4,
      color: ex.Color.Red
    });
    
    this.addChild(this.healthBar);
    
    // Dodanie sprite'a budynku
    const buildingSprite = new ex.Sprite({
      image: this.getBuildingSprite(),
      destSize: { width: 32, height: 32 }
    });
    
    this.graphics.use(buildingSprite);
  }

  public onInitialize(engine: ex.Engine): void {
    // Obsługa kolizji
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Bullet && evt.other.getOwner() !== this) {
        this.takeDamage(evt.other.getDamage());
        evt.other.kill();
      }
    });
  }

  public onPreUpdate(engine: ex.Engine, delta: number): void {
    // Tylko wieżyczki strzelają
    if (this.isTurret()) {
      this.shootAtNearestZombie();
    }
  }

  private setStatsByType(): void {
    switch (this.data.type) {
      case BuildingType.Fence:
        this.range = 0;
        this.damage = 0;
        this.shootCooldown = 0;
        break;
      case BuildingType.Gate:
        this.range = 0;
        this.damage = 0;
        this.shootCooldown = 0;
        break;
      case BuildingType.BarbedWire:
        this.range = 0;
        this.damage = 5;
        this.shootCooldown = 500;
        break;
      case BuildingType.TurretRifle:
        this.range = 300;
        this.damage = 10;
        this.shootCooldown = 300;
        break;
      case BuildingType.TurretFlamethrower:
        this.range = 150;
        this.damage = 3;
        this.shootCooldown = 50;
        break;
      case BuildingType.TurretGrenade:
        this.range = 400;
        this.damage = 30;
        this.shootCooldown = 1500;
        break;
      case BuildingType.TurretPiercing:
        this.range = 500;
        this.damage = 15;
        this.shootCooldown = 1000;
        break;
      default:
        this.range = 0;
        this.damage = 0;
        this.shootCooldown = 0;
    }
  }

  private getBuildingSprite(): ex.ImageSource {
    switch (this.data.type) {
      case BuildingType.Fence:
        return this.resourceManager.getImage('fence');
      case BuildingType.Gate:
        return this.resourceManager.getImage('gate');
      case BuildingType.BarbedWire:
        return this.resourceManager.getImage('barbed_wire');
      case BuildingType.TurretRifle:
        return this.resourceManager.getImage('turret_rifle');
      case BuildingType.TurretFlamethrower:
        return this.resourceManager.getImage('turret_flamethrower');
      case BuildingType.TurretGrenade:
        return this.resourceManager.getImage('turret_grenade');
      case BuildingType.TurretPiercing:
        return this.resourceManager.getImage('turret_piercing');
      default:
        return this.resourceManager.getImage('fence');
    }
  }

  private isTurret(): boolean {
    return this.data.type === BuildingType.TurretRifle ||
           this.data.type === BuildingType.TurretFlamethrower ||
           this.data.type === BuildingType.TurretGrenade ||
           this.data.type === BuildingType.TurretPiercing;
  }

  private shootAtNearestZombie(): void {
    const now = Date.now();
    if (now - this.lastShotTime < this.shootCooldown) return;
    
    // Znalezienie najbliższego zombie w zasięgu
    const zombies = this.scene['zombies'] as Map<string, any>;
    let nearestZombie: any = null;
    let nearestDistance = this.range;
    
    zombies.forEach((zombie) => {
      const distance = this.pos.distance(zombie.pos);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestZombie = zombie;
      }
    });
    
    if (!nearestZombie) return;
    
    // Obliczenie kierunku do celu
    const direction = nearestZombie.pos.sub(this.pos).normalize();
    
    // Obrót w kierunku celu
    this.rotation = direction.toAngle();
    
    // Strzał
    this.shoot(direction);
    
    this.lastShotTime = now;
  }

  private shoot(direction: ex.Vector): void {
    // Utworzenie pocisku
    const bullet = new Bullet(
      this.pos.add(direction.scale(20)), // Start position
      direction,
      this.damage,
      this,
      this.resourceManager
    );
    
    this.scene.add(bullet);
    
    // Odtworzenie dźwięku strzału
    this.resourceManager.playSound('shoot');
    
    // Wysłanie informacji o strzale do serwera
    this.scene['multiplayerManager'].emit('turretShoot', {
      buildingId: this.data.id,
      position: { x: this.pos.x, y: this.pos.y },
      direction: { x: direction.x, y: direction.y }
    });
  }

  public takeDamage(amount: number): void {
    this.data.health -= amount;
    
    // Odtworzenie dźwięku trafienia
    this.resourceManager.playSound('hit');
    
    // Aktualizacja paska HP
    this.updateHealthBar();
    
    // Sprawdzenie, czy budynek nie został zniszczony
    if (this.data.health <= 0) {
      this.destroy();
    }
  }

  private updateHealthBar(): void {
    const healthPercent = this.data.health / this.data.maxHealth;
    this.healthBar.width = 40 * healthPercent;
    
    // Zmiana koloru paska HP w zależności od stanu zdrowia
    if (healthPercent > 0.6) {
      this.healthBar.color = ex.Color.Green;
    } else if (healthPercent > 0.3) {
      this.healthBar.color = ex.Color.Yellow;
    } else {
      this.healthBar.color = ex.Color.Red;
    }
  }

  private destroy(): void {
    // Wysłanie informacji o zniszczeniu budynku do serwera
    this.scene['multiplayerManager'].emit('buildingDestroyed', {
      buildingId: this.data.id
    });
    
    // Usunięcie budynku z gry
    this.kill();
  }

  public updateFromData(data: BuildingData): void {
    this.data = data;
    this.pos = ex.vec(data.position.x, data.position.y);
    
    // Aktualizacja paska HP
    this.updateHealthBar();
  }

  public getData(): BuildingData {
    return this.data;
  }
}