import * as ex from 'excalibur';
import { ZombieData, ZombieType } from '../../../shared/types';
import { ResourceManager } from '../managers/ResourceManager';

export class Zombie extends ex.Actor {
  private data: ZombieData;
  private resourceManager: ResourceManager;
  private speed: number;
  private damage: number;
  private attackCooldown = 1000; // ms
  private lastAttackTime = 0;
  private healthBar: ex.Rectangle;

  constructor(data: ZombieData, resourceManager: ResourceManager) {
    super({
      pos: ex.vec(data.position.x, data.position.y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active,
      color: ex.Color.DarkGray
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
    
    // Dodanie sprite'a zombie
    const zombieSprite = new ex.Sprite({
      image: this.getZombieSprite(),
      destSize: { width: 32, height: 32 }
    });
    
    this.graphics.use(zombieSprite);
  }

  public onInitialize(engine: ex.Engine): void {
    // Obsługa kolizji
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Player) {
        this.attack(evt.other);
      }
    });
  }

  public onPreUpdate(engine: ex.Engine, delta: number): void {
    // Ruch w kierunku celu
    if (this.data.target) {
      this.moveTowardsTarget(delta);
    }
  }

  private setStatsByType(): void {
    switch (this.data.type) {
      case ZombieType.Basic:
        this.speed = 50;
        this.damage = 10;
        break;
      case ZombieType.Fast:
        this.speed = 120;
        this.damage = 5;
        break;
      case ZombieType.Tank:
        this.speed = 30;
        this.damage = 20;
        break;
      case ZombieType.Spitter:
        this.speed = 40;
        this.damage = 15;
        break;
      default:
        this.speed = 50;
        this.damage = 10;
    }
  }

  private getZombieSprite(): ex.ImageSource {
    switch (this.data.type) {
      case ZombieType.Basic:
        return this.resourceManager.getImage('zombie_basic');
      case ZombieType.Fast:
        return this.resourceManager.getImage('zombie_fast');
      case ZombieType.Tank:
        return this.resourceManager.getImage('zombie_tank');
      case ZombieType.Spitter:
        return this.resourceManager.getImage('zombie_spitter');
      default:
        return this.resourceManager.getImage('zombie_basic');
    }
  }

  private moveTowardsTarget(delta: number): void {
    // Znalezienie celu (gracza lub budynku)
    let targetActor: ex.Actor | null = null;
    
    // Sprawdzenie graczy
    const players = this.scene['players'] as Map<string, any>;
    if (players.has(this.data.target)) {
      targetActor = players.get(this.data.target);
    }
    
    // Sprawdzenie budynków
    if (!targetActor) {
      const buildings = this.scene['buildings'] as Map<string, any>;
      if (buildings.has(this.data.target)) {
        targetActor = buildings.get(this.data.target);
      }
    }
    
    if (!targetActor) return;
    
    // Obliczenie kierunku do celu
    const direction = targetActor.pos.sub(this.pos).normalize();
    
    // Obrót w kierunku celu
    this.rotation = direction.toAngle();
    
    // Ruch w kierunku celu
    this.vel = direction.scale(this.speed);
  }

  private attack(target: Player): void {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) return;
    
    this.lastAttackTime = now;
    
    // Zadanie obrażeń celowi
    target.takeDamage(this.damage);
    
    // Odtworzenie dźwięku ataku
    this.resourceManager.playSound('zombie_growl');
    
    // Wysłanie informacji o ataku do serwera
    this.scene['multiplayerManager'].emit('zombieAttack', {
      zombieId: this.data.id,
      targetId: target.getData().id,
      damage: this.damage
    });
  }

  public takeDamage(amount: number): void {
    this.data.health -= amount;
    
    // Aktualizacja paska HP
    this.updateHealthBar();
    
    // Sprawdzenie, czy zombie nie zginęło
    if (this.data.health <= 0) {
      this.die();
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

  private die(): void {
    // Wysłanie informacji o śmierci zombie do serwera
    this.scene['multiplayerManager'].emit('zombieDied', {
      zombieId: this.data.id
    });
    
    // Usunięcie zombie z gry
    this.kill();
  }

  public updateFromData(data: ZombieData): void {
    this.data = data;
    this.pos = ex.vec(data.position.x, data.position.y);
    
    // Aktualizacja paska HP
    this.updateHealthBar();
  }

  public getData(): ZombieData {
    return this.data;
  }
}