import * as ex from 'excalibur';
import { PlayerData, WeaponType, ResourceType } from '../../../shared/types';
import { ResourceManager } from '../managers/ResourceManager';
import { Bullet } from './Bullet';

export class Player extends ex.Actor {
  private data: PlayerData;
  private resourceManager: ResourceManager;
  private speed = 150;
  private currentSpeed = 150;
  private isDashing = false;
  private dashCooldown = 1000; // ms
  private lastDashTime = 0;
  private weaponCooldowns: Map<WeaponType, number> = new Map();
  private lastShotTime = 0;
  private isLocalPlayer = false;
  private healthBar: ex.Rectangle;
  private staminaBar: ex.Rectangle;
  private nameTag: ex.Label;

  constructor(data: PlayerData, resourceManager: ResourceManager) {
    super({
      pos: ex.vec(data.position.x, data.position.y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active,
      color: ex.Color.Blue
    });
    
    this.data = data;
    this.resourceManager = resourceManager;
    this.isLocalPlayer = false; // Zostanie ustawione przez scenę
    
    // Inicjalizacja pasków HP i staminy
    this.healthBar = new ex.Rectangle({
      width: 40,
      height: 4,
      color: ex.Color.Red
    });
    
    this.staminaBar = new ex.Rectangle({
      width: 40,
      height: 4,
      color: ex.Color.Green
    });
    
    // Inicjalizacja tagu z nazwą gracza
    this.nameTag = new ex.Label({
      text: data.name,
      pos: ex.vec(0, -25),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 10,
        color: ex.Color.White
      })
    });
    
    // Bars and name tag will be rendered using graphics
    
    // Ustawienie cooldownów dla broni
    this.weaponCooldowns.set(WeaponType.Pistol, 300);
    this.weaponCooldowns.set(WeaponType.AssaultRifle, 100);
    this.weaponCooldowns.set(WeaponType.Sniper, 1000);
    this.weaponCooldowns.set(WeaponType.Shotgun, 700);
    this.weaponCooldowns.set(WeaponType.GrenadeLauncher, 800);
    this.weaponCooldowns.set(WeaponType.SMG, 80);
    
    // Dodanie sprite'a gracza
    const playerSprite = new ex.Sprite({
      image: resourceManager.getImage('player'),
      destSize: { width: 32, height: 32 }
    });
    
    this.graphics.use(playerSprite);
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
    if (!this.isLocalPlayer) return;
    
    // Obsługa ruchu
    this.handleMovement(engine, delta);
    
    // Obsługa celowania i strzelania
    this.handleAimingAndShooting(engine);
    
    // Regeneracja staminy
    this.regenerateStamina(delta);
    
    // Wysłanie aktualizacji pozycji do serwera
    this.sendPositionUpdate();
  }

  private handleMovement(engine: ex.Engine, delta: number): void {
    let vel = ex.vec(0, 0);
    
    // Ruch w przód/tył
    if (engine.input.keyboard.isHeld(ex.Input.Keys.W) || engine.input.keyboard.isHeld(ex.Input.Keys.Up)) {
      vel.y = -1;
    }
    if (engine.input.keyboard.isHeld(ex.Input.Keys.S) || engine.input.keyboard.isHeld(ex.Input.Keys.Down)) {
      vel.y = 1;
    }
    
    // Ruch w lewo/prawo
    if (engine.input.keyboard.isHeld(ex.Input.Keys.A) || engine.input.keyboard.isHeld(ex.Input.Keys.Left)) {
      vel.x = -1;
    }
    if (engine.input.keyboard.isHeld(ex.Input.Keys.D) || engine.input.keyboard.isHeld(ex.Input.Keys.Right)) {
      vel.x = 1;
    }
    
    // Normalizacja wektora ruchu
    if (vel.size > 0) {
      vel = vel.normalize();
    }
    
    // Wślizg (dash)
    if (engine.input.keyboard.wasPressed(ex.Input.Keys.Space) && !this.isDashing && this.data.stamina >= 20) {
      this.performDash();
    }
    
    // Zastosowanie prędkości
    this.vel = vel.scale(this.currentSpeed);
  }

  private handleAimingAndShooting(engine: ex.Engine): void {
    // Celowanie myszką
    const pointer = engine.input.pointers.primary;
    const worldPos = pointer.lastWorldPos;
    const direction = worldPos.sub(this.pos).normalize();
    
    // Obrót gracza w kierunku myszki
    this.rotation = direction.toAngle();
    
    // Strzelanie
    if (engine.input.pointers.primary.lastWorldPos) {
      // Check if mouse button is held down by checking if we have a world position
      const timeSinceLastShot = Date.now() - this.lastShotTime;
      const cooldown = this.weaponCooldowns.get(this.data.currentWeapon) || 300;
      if (timeSinceLastShot >= cooldown) {
        this.shoot(direction);
      }
    }
  }

  private performDash(): void {
    const now = Date.now();
    if (now - this.lastDashTime < this.dashCooldown) return;
    
    this.isDashing = true;
    this.currentSpeed = this.speed * 2.5;
    this.data.stamina -= 20;
    
    setTimeout(() => {
      this.isDashing = false;
      this.currentSpeed = this.speed;
    }, 200);
    
    this.lastDashTime = now;
  }

  private shoot(direction: ex.Vector): void {
    const now = Date.now();
    const cooldown = this.weaponCooldowns.get(this.data.currentWeapon) || 300;
    
    if (now - this.lastShotTime < cooldown) return;
    
    this.lastShotTime = now;
    
    // Utworzenie pocisku
    const bullet = new Bullet(
      this.pos.add(direction.scale(20)), // Start position
      direction,
      this.getWeaponDamage(),
      this,
      this.resourceManager
    );
    
    this.scene.add(bullet);
    
    // Odtworzenie dźwięku strzału
    this.resourceManager.playSound('shoot');
    
    // Wysłanie informacji o strzale do serwera
    const mainScene = this.scene as any;
    if (mainScene.multiplayerManager) {
      mainScene.multiplayerManager.emit('shoot', {
      position: { x: this.pos.x, y: this.pos.y },
      direction: { x: direction.x, y: direction.y },
      weapon: this.data.currentWeapon
      });
    }
  }

  private getWeaponDamage(): number {
    switch (this.data.currentWeapon) {
      case WeaponType.Pistol: return 10;
      case WeaponType.AssaultRifle: return 8;
      case WeaponType.Sniper: return 50;
      case WeaponType.Shotgun: return 15;
      case WeaponType.GrenadeLauncher: return 30;
      case WeaponType.SMG: return 5;
      default: return 10;
    }
  }

  private regenerateStamina(delta: number): void {
    if (this.data.stamina < this.data.maxStamina) {
      this.data.stamina = Math.min(
        this.data.maxStamina,
        this.data.stamina + (delta / 1000) * 5 // 5 staminy na sekundę
      );
    }
  }

  private sendPositionUpdate(): void {
    const mainScene = this.scene as any;
    if (mainScene.multiplayerManager) {
      mainScene.multiplayerManager.emit('playerMove', {
      position: { x: this.pos.x, y: this.pos.y },
      rotation: this.rotation,
      velocity: { x: this.vel.x, y: this.vel.y }
      });
    }
  }

  public takeDamage(amount: number): void {
    // Redukcja obrażeń przez pancerz
    const reducedDamage = Math.max(1, amount - this.data.armor);
    this.data.health -= reducedDamage;
    
    // Odtworzenie dźwięku trafienia
    this.resourceManager.playSound('hit');
    
    // Wysłanie informacji o otrzymaniu obrażeń do serwera
    const mainScene = this.scene as any;
    if (mainScene.multiplayerManager) {
      mainScene.multiplayerManager.emit('playerDamaged', {
      damage: reducedDamage,
      health: this.data.health
      });
    }
    
    // Aktualizacja paska HP
    this.updateHealthBar();
    
    // Sprawdzenie, czy gracz nie zginął
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

  private updateStaminaBar(): void {
    const staminaPercent = this.data.stamina / this.data.maxStamina;
    this.staminaBar.width = 40 * staminaPercent;
  }

  private die(): void {
    // Wysłanie informacji o śmierci do serwera
    const mainScene = this.scene as any;
    if (mainScene.multiplayerManager) {
      mainScene.multiplayerManager.emit('playerDied', {
      playerId: this.data.id
      });
    }
    
    // Respawn po 3 sekundach
    setTimeout(() => {
      this.respawn();
    }, 3000);
  }

  private respawn(): void {
    // Resetowanie statystyk
    this.data.health = this.data.maxHealth;
    this.data.stamina = this.data.maxStamina;
    
    // Ustawienie pozycji respawnu
    this.pos = ex.vec(2500, 2500); // Środek mapy
    
    // Aktualizacja pasków
    this.updateHealthBar();
    this.updateStaminaBar();
    
    // Wysłanie informacji o respawnie do serwera
    const mainScene = this.scene as any;
    if (mainScene.multiplayerManager) {
      mainScene.multiplayerManager.emit('playerRespawned', {
      position: { x: this.pos.x, y: this.pos.y }
      });
    }
  }

  public updateFromData(data: PlayerData): void {
    this.data = data;
    this.pos = ex.vec(data.position.x, data.position.y);
    this.rotation = data.rotation;
    
    // Aktualizacja pasków
    this.updateHealthBar();
    this.updateStaminaBar();
  }

  public setIsLocalPlayer(isLocal: boolean): void {
    this.isLocalPlayer = isLocal;
  }

  public getData(): PlayerData {
    return this.data;
  }
}