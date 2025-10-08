import * as ex from 'excalibur';
import { PlayerData, WeaponType, ResourceType } from '../../../shared/types';

export class HUD extends ex.Actor {
  private engine: ex.Engine;
  private waveLabel!: ex.Label;
  private timeLabel!: ex.Label;
  private healthLabel!: ex.Label;
  private staminaLabel!: ex.Label;
  private resourcesLabels: Map<ResourceType, ex.Label> = new Map();
  private goldLabel!: ex.Label;
  private weaponIcons: ex.Actor[] = [];
  private currentWeaponIndicator!: ex.Rectangle;

  constructor(engine: ex.Engine) {
    super({
      pos: ex.vec(0, 0),
      width: engine.drawWidth,
      height: engine.drawHeight,
      collisionType: ex.CollisionType.PreventCollision
    });
    
    this.engine = engine;
    
    // Inicjalizacja elementów HUD
    this.createWaveLabel();
    this.createTimeLabel();
    this.createHealthLabel();
    this.createStaminaLabel();
    this.createResourcesLabels();
    this.createGoldLabel();
    this.createWeaponIcons();
    this.createCurrentWeaponIndicator();
  }

  private createWaveLabel(): void {
    this.waveLabel = new ex.Label({
      text: 'Fala: 1',
      pos: ex.vec(20, 20),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 16,
        color: ex.Color.White
      })
    });
    
    this.addChild(this.waveLabel);
  }

  private createTimeLabel(): void {
    this.timeLabel = new ex.Label({
      text: 'Następna fala: 5:00',
      pos: ex.vec(20, 50),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 12,
        color: ex.Color.White
      })
    });
    
    this.addChild(this.timeLabel);
  }

  private createHealthLabel(): void {
    this.healthLabel = new ex.Label({
      text: 'HP: 100/100',
      pos: ex.vec(20, this.engine.drawHeight - 80),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 12,
        color: ex.Color.Red
      })
    });
    
    this.addChild(this.healthLabel);
  }

  private createStaminaLabel(): void {
    this.staminaLabel = new ex.Label({
      text: 'Stamina: 100/100',
      pos: ex.vec(20, this.engine.drawHeight - 50),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 12,
        color: ex.Color.Green
      })
    });
    
    this.addChild(this.staminaLabel);
  }

  private createResourcesLabels(): void {
    const resources = [
      { type: ResourceType.Wood, name: 'Wood', color: ex.Color.fromHex('#8B4513') },
      { type: ResourceType.Stone, name: 'Stone', color: ex.Color.Gray },
      { type: ResourceType.Iron, name: 'Iron', color: ex.Color.DarkGray }
    ];
    
    resources.forEach((resource, index) => {
      const label = new ex.Label({
        text: `${resource.name}: 0`,
        pos: ex.vec(this.engine.drawWidth - 200, 20 + index * 30),
        font: new ex.Font({
          family: 'Press Start 2P',
          size: 12,
          color: resource.color
        })
      });
      
      this.resourcesLabels.set(resource.type, label);
      this.addChild(label);
    });
  }

  private createGoldLabel(): void {
    this.goldLabel = new ex.Label({
      text: 'Gold: 0',
      pos: ex.vec(this.engine.drawWidth - 200, 110),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 12,
        color: ex.Color.Yellow
      })
    });
    
    this.addChild(this.goldLabel);
  }

  private createWeaponIcons(): void {
    const weapons = [
      WeaponType.Pistol,
      WeaponType.AssaultRifle,
      WeaponType.Shotgun
    ];
    
    weapons.forEach((weapon, index) => {
      const icon = new ex.Actor({
        pos: ex.vec(this.engine.drawWidth / 2 - 60 + index * 60, this.engine.drawHeight - 50),
        width: 40,
        height: 40,
        color: ex.Color.DarkGray
      });
      
      // Dodanie numeru broni
      const numberLabel = new ex.Label({
        text: `${index + 1}`,
        pos: ex.vec(0, -20),
        font: new ex.Font({
          family: 'Press Start 2P',
          size: 10,
          color: ex.Color.White
        })
      });
      
      icon.addChild(numberLabel);
      this.weaponIcons.push(icon);
      this.addChild(icon);
    });
  }

  private createCurrentWeaponIndicator(): void {
    this.currentWeaponIndicator = new ex.Rectangle({
      width: 44,
      height: 44,
      color: ex.Color.Transparent,
      strokeColor: ex.Color.White,
      lineWidth: 2
    });
    
    // Indicator will be drawn separately
  }

  public updateWave(wave: number): void {
    this.waveLabel.text = `Fala: ${wave}`;
  }

  public updateTimeUntilNextWave(seconds: number): void {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timeLabel.text = `Następna fala: ${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  public updateHealth(health: number, maxHealth: number): void {
    this.healthLabel.text = `HP: ${health}/${maxHealth}`;
  }

  public updateStamina(stamina: number, maxStamina: number): void {
    this.staminaLabel.text = `Stamina: ${stamina}/${maxStamina}`;
  }

  public updateResources(resources: Map<ResourceType, number>): void {
    resources.forEach((amount, type) => {
      const label = this.resourcesLabels.get(type);
      if (label) {
        const typeName = ResourceType[type];
        label.text = `${typeName}: ${amount}`;
      }
    });
  }

  public updateGold(gold: number): void {
    this.goldLabel.text = `Gold: ${gold}`;
  }

  public updateWeapons(weapons: WeaponType[], currentWeapon: WeaponType): void {
    // Aktualizacja ikon broni
    weapons.forEach((weapon, index) => {
      if (index < this.weaponIcons.length) {
        const icon = this.weaponIcons[index];
        // Tutaj można dodać logikę zmiany koloru w zależności od typu broni
      }
    });
    
    // Aktualizacja wskaźnika aktualnej broni
    const currentIndex = weapons.indexOf(currentWeapon);
    if (currentIndex >= 0 && currentIndex < this.weaponIcons.length) {
      const icon = this.weaponIcons[currentIndex];
      // Position update handled separately
    }
  }

  public updatePlayerData(playerData: PlayerData): void {
    this.updateHealth(playerData.health, playerData.maxHealth);
    this.updateStamina(playerData.stamina, playerData.maxStamina);
    this.updateResources(playerData.resources);
    this.updateGold(playerData.gold);
    this.updateWeapons(playerData.weapons, playerData.currentWeapon);
  }
}