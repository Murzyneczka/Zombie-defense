import * as ex from 'excalibur';
import { BuildingType, ResourceType } from '../../../shared/types';
import { ResourceManager } from '../managers/ResourceManager';

export class BuildMenu extends ex.Actor {
  private engine: ex.Engine;
  private resourceManager: ResourceManager;
  private selectedBuildingType: BuildingType | null = null;
  private buildingButtons: ex.Actor[] = [];
  private background!: ex.Rectangle;
  private titleLabel!: ex.Label;

  constructor(engine: ex.Engine, resourceManager: ResourceManager) {
    super({
      pos: ex.vec(engine.drawWidth / 2, engine.drawHeight / 2),
      width: 600,
      height: 400,
      anchor: ex.Vector.Half,
      collisionType: ex.CollisionType.PreventCollision
    });
    
    this.engine = engine;
    this.resourceManager = resourceManager;
    
    // Inicjalizacja elementów menu
    this.createBackground();
    this.createTitle();
    this.createBuildingButtons();
    
    // Hide by default
    this.graphics.visible = false;
  }

  private createBackground(): void {
    this.background = new ex.Rectangle({
      width: 600,
      height: 400,
      color: ex.Color.fromHex('#333333'),
      strokeColor: ex.Color.White,
      lineWidth: 2
    });
    
    // Background rendered via graphics API
  }

  private createTitle(): void {
    this.titleLabel = new ex.Label({
      text: 'BUDOWANIE',
      pos: ex.vec(0, -170),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 20,
        color: ex.Color.White
      })
    });
    
    this.addChild(this.titleLabel);
  }

  private createBuildingButtons(): void {
    const buildings = [
      { type: BuildingType.Fence, name: 'Płot', cost: { [ResourceType.Wood]: 10 } },
      { type: BuildingType.Gate, name: 'Brama', cost: { [ResourceType.Wood]: 15, [ResourceType.Iron]: 5 } },
      { type: BuildingType.BarbedWire, name: 'Drut Kolczasty', cost: { [ResourceType.Iron]: 10 } },
      { type: BuildingType.TurretRifle, name: 'Wieżyczka (Karabin)', cost: { [ResourceType.Iron]: 20, [ResourceType.Stone]: 10 } },
      { type: BuildingType.TurretFlamethrower, name: 'Wieżyczka (Miotacz Ognia)', cost: { [ResourceType.Iron]: 25, [ResourceType.Stone]: 15 } },
      { type: BuildingType.TurretGrenade, name: 'Wieżyczka (Granatnik)', cost: { [ResourceType.Iron]: 30, [ResourceType.Stone]: 20 } },
      { type: BuildingType.TurretPiercing, name: 'Wieżyczka (Przebijająca)', cost: { [ResourceType.Iron]: 35, [ResourceType.Stone]: 25 } }
    ];
    
    buildings.forEach((building, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const button = new ex.Actor({
        pos: ex.vec(-180 + col * 180, -100 + row * 100),
        width: 160,
        height: 80,
        color: ex.Color.fromHex('#555555')
      });
      
      // Dodanie nazwy budynku
      const nameLabel = new ex.Label({
        text: building.name,
        pos: ex.vec(0, -20),
        font: new ex.Font({
          family: 'Press Start 2P',
          size: 10,
          color: ex.Color.White
        })
      });
      
      // Dodanie kosztu
      let costText = 'Koszt: ';
      Object.entries(building.cost).forEach(([resourceType, amount]) => {
        const typeNum = parseInt(resourceType);
        costText += `${ResourceType[typeNum]}: ${amount} `;
      });
      
      const costLabel = new ex.Label({
        text: costText,
        pos: ex.vec(0, 10),
        font: new ex.Font({
          family: 'Press Start 2P',
          size: 8,
          color: ex.Color.Yellow
        })
      });
      
      button.addChild(nameLabel);
      button.addChild(costLabel);
      
      // Obsługa kliknięcia
      button.on('pointerdown', () => {
        this.selectBuildingType(building.type);
      });
      
      this.buildingButtons.push(button);
      this.addChild(button);
    });
  }

  private selectBuildingType(buildingType: BuildingType): void {
    this.selectedBuildingType = buildingType;
    
    // Zmiana koloru przycisków
    this.buildingButtons.forEach((button, index) => {
      const buildings = [
        BuildingType.Fence,
        BuildingType.Gate,
        BuildingType.BarbedWire,
        BuildingType.TurretRifle,
        BuildingType.TurretFlamethrower,
        BuildingType.TurretGrenade,
        BuildingType.TurretPiercing
      ];
      
      if (buildings[index] === buildingType) {
        button.color = ex.Color.fromHex('#777777');
      } else {
        button.color = ex.Color.fromHex('#555555');
      }
    });
  }

  public getSelectedBuildingType(): BuildingType | null {
    return this.selectedBuildingType;
  }
}