import * as ex from 'excalibur';
import { MultiplayerManager } from '../managers/MultiplayerManager';
import { WeaponType, ResourceType } from '../../../shared/types';

export class ShopScene extends ex.Scene {
  private multiplayerManager: MultiplayerManager;
  private shopItems: ShopItem[] = [];
  private playerGold = 0;
  private goldLabel!: ex.Label;
  private titleLabel!: ex.Label;
  private background!: ex.Rectangle;
  private timeLabel!: ex.Label;
  private shopTime = 60; // sekund
  private shopTimer!: ex.Timer;

  constructor(multiplayerManager: MultiplayerManager) {
    super();
    this.multiplayerManager = multiplayerManager;
  }

  public onInitialize(engine: ex.Engine): void {
    // Create background using a rectangle graphic
    const bgRect = new ex.Rectangle({
      width: engine.drawWidth,
      height: engine.drawHeight,
      color: ex.Color.fromHex('#1a1a1a')
    });
    
    // Create an actor for the background
    this.background = bgRect;
    const bgActor = new ex.Actor({
      pos: ex.vec(0, 0),
      width: engine.drawWidth,
      height: engine.drawHeight,
      anchor: ex.vec(0, 0)
    });
    bgActor.graphics.use(bgRect);
    this.add(bgActor);
    
    // Tytuł
    this.titleLabel = new ex.Label({
      text: 'SKLEP',
      pos: ex.vec(engine.drawWidth / 2, 50),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 30,
        color: ex.Color.Yellow
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.titleLabel);
    
    // Etykieta złota
    this.goldLabel = new ex.Label({
      text: 'Gold: 0',
      pos: ex.vec(engine.drawWidth / 2, 100),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 16,
        color: ex.Color.Yellow
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.goldLabel);
    
    // Etykieta czasu
    this.timeLabel = new ex.Label({
      text: `Czas: ${this.shopTime}`,
      pos: ex.vec(engine.drawWidth / 2, 150),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 16,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.timeLabel);
    
    // Inicjalizacja przedmiotów w sklepie
    this.initializeShopItems();
    
    // Inicjalizacja timera
    this.shopTimer = new ex.Timer({
      fcn: () => this.updateShopTime(),
      interval: 1000,
      repeats: true
    });
    
    this.add(this.shopTimer);
    
    // Nasłuchiwanie na aktualizacje złota gracza
    this.multiplayerManager.on('playerGoldUpdate', (gold: number) => {
      this.updatePlayerGold(gold);
    });
  }

  private initializeShopItems(): void {
    // Przedmioty do kupienia
    const items = [
      { type: 'weapon', name: 'Pistolet', cost: 50, value: WeaponType.Pistol },
      { type: 'weapon', name: 'Karabin', cost: 150, value: WeaponType.AssaultRifle },
      { type: 'weapon', name: 'Snajperka', cost: 200, value: WeaponType.Sniper },
      { type: 'weapon', name: 'Strzelba', cost: 120, value: WeaponType.Shotgun },
      { type: 'weapon', name: 'Granatnik', cost: 250, value: WeaponType.GrenadeLauncher },
      { type: 'weapon', name: 'SMG', cost: 100, value: WeaponType.SMG },
      { type: 'resource', name: 'Wood (10)', cost: 20, value: { type: ResourceType.Wood, amount: 10 } },
      { type: 'resource', name: 'Stone (10)', cost: 30, value: { type: ResourceType.Stone, amount: 10 } },
      { type: 'resource', name: 'Iron (10)', cost: 40, value: { type: ResourceType.Iron, amount: 10 } }
    ];
    
    items.forEach((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const shopItem = new ShopItem(
        this.engine,
        item,
        ex.vec(200 + col * 300, 250 + row * 120),
        () => this.buyItem(item)
      );
      
      this.shopItems.push(shopItem);
      this.add(shopItem);
    });
  }

  private updateShopTime(): void {
    this.shopTime--;
    this.timeLabel.text = `Czas: ${this.shopTime}`;
    
    if (this.shopTime <= 0) {
      // Zakończenie czasu sklepu
      this.endShopPhase();
    }
  }

  private endShopPhase(): void {
    // Zatrzymanie timera
    this.shopTimer.stop();
    
    // Powrót do głównej sceny
    this.engine.goToScene('main');
    
    // Wysłanie informacji o zakończeniu fazy sklepu
    this.multiplayerManager.emit('shopPhaseEnd');
  }

  private buyItem(item: any): void {
    if (this.playerGold < item.cost) {
      // Brak wystarczającej ilości złota
      console.log('Brak wystarczającej ilości złota');
      return;
    }
    
    // Wysłanie żądania zakupu do serwera
    this.multiplayerManager.emit('buyItem', {
      type: item.type,
      value: item.value,
      cost: item.cost
    });
  }

  private updatePlayerGold(gold: number): void {
    this.playerGold = gold;
    this.goldLabel.text = `Gold: ${gold}`;
    
    // Aktualizacja stanu przycisków w sklepie
    this.shopItems.forEach(shopItem => {
      shopItem.updateAffordability(gold);
    });
  }

  public onActivate(): void {
    // Uruchomienie timera
    this.shopTimer.start();
    
    // Wysłanie żądania o aktualizację złota
    this.multiplayerManager.emit('requestPlayerGold');
  }

  public onDeactivate(): void {
    // Zatrzymanie timera
    this.shopTimer.stop();
  }
}

class ShopItem extends ex.Actor {
  private engine: ex.Engine;
  private item: any;
  private buyCallback: () => void;
  private nameLabel: ex.Label;
  private costLabel: ex.Label;
  private buyButton: ex.Actor;
  private isAffordable = true;

  constructor(engine: ex.Engine, item: any, position: ex.Vector, buyCallback: () => void) {
    super({
      pos: position,
      width: 250,
      height: 100,
      anchor: ex.vec(0, 0)
    });
    
    this.engine = engine;
    this.item = item;
    this.buyCallback = buyCallback;
    
    // Tło
    // Background will be rendered via graphics
    
    // Nazwa przedmiotu
    this.nameLabel = new ex.Label({
      text: item.name,
      pos: ex.vec(125, 20),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 12,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.addChild(this.nameLabel);
    
    // Koszt
    this.costLabel = new ex.Label({
      text: `Cena: ${item.cost} Gold`,
      pos: ex.vec(125, 45),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 10,
        color: ex.Color.Yellow
      }),
      anchor: ex.Vector.Half
    });
    
    this.addChild(this.costLabel);
    
    // Przycisk kupna
    this.buyButton = new ex.Actor({
      pos: ex.vec(125, 75),
      width: 100,
      height: 20,
      color: ex.Color.fromHex('#555555'),
      anchor: ex.Vector.Half
    });
    
    const buyLabel = new ex.Label({
      text: 'KUP',
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 10,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.buyButton.addChild(buyLabel);
    this.addChild(this.buyButton);
    
    // Obsługa kliknięcia
    this.buyButton.on('pointerdown', () => {
      if (this.isAffordable) {
        this.buyCallback();
      }
    });
  }

  public updateAffordability(playerGold: number): void {
    this.isAffordable = playerGold >= this.item.cost;
    
    if (this.isAffordable) {
      this.buyButton.color = ex.Color.fromHex('#555555');
    } else {
      this.buyButton.color = ex.Color.fromHex('#222222');
    }
  }
}