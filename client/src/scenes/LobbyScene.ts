import * as ex from 'excalibur';
import { MultiplayerManager } from '../managers/MultiplayerManager';

export class LobbyScene extends ex.Scene {
  private multiplayerManager: MultiplayerManager;
  private playerName: string = 'Gracz';
  private joinButton!: ex.Actor;
  private playersList!: ex.Label;
  private titleLabel!: ex.Label;
  private background!: ex.Rectangle;
  private nameLabel!: ex.Label;

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
      text: 'ZOMBIE DEFENSE',
      pos: ex.vec(engine.drawWidth / 2, 100),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 30,
        color: ex.Color.Red
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.titleLabel);
    
    // Etykieta z nazwą gracza
    this.nameLabel = new ex.Label({
      text: `Nazwa: ${this.playerName}`,
      pos: ex.vec(engine.drawWidth / 2, 250),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 16,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.nameLabel);
    
    // Przycisk dołączenia
    this.joinButton = new ex.Actor({
      pos: ex.vec(engine.drawWidth / 2, 350),
      width: 200,
      height: 50,
      color: ex.Color.fromHex('#555555'),
      anchor: ex.Vector.Half
    });
    
    // Włączenie obsługi wskaźnika dla przycisku
    this.joinButton.pointer.useGraphicsBounds = true;
    
    const joinLabel = new ex.Label({
      text: 'DOŁĄCZ',
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 20,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.joinButton.addChild(joinLabel);
    this.add(this.joinButton);
    
    // Lista graczy
    this.playersList = new ex.Label({
      text: 'Gracze w lobby:',
      pos: ex.vec(engine.drawWidth / 2, 450),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 14,
        color: ex.Color.White
      }),
      anchor: ex.Vector.Half
    });
    
    this.add(this.playersList);
    
    // Obsługa zdarzeń
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Obsługa kliknięcia przycisku dołączenia
    this.joinButton.on('pointerdown', () => {
      console.log('Przycisk DOŁĄCZ kliknięty');
      this.joinGame(this.playerName);
    });
    
    // Nasłuchiwanie na aktualizacje listy graczy
    this.multiplayerManager.on('playersListUpdate', (players: string[]) => {
      this.updatePlayersList(players);
    });
    
    // Nasłuchiwanie na rozpoczęcie gry
    this.multiplayerManager.on('gameStart', () => {
      this.engine.goToScene('main');
    });
    
    // Obsługa klawiatury do zmiany nazwy gracza
    this.engine.input.keyboard.on('press', (evt) => {
      const keyName = ex.Input.Keys[evt.key]; // np. "KeyW", "Digit1", "Space"
      console.log('Klawisz naciśnięty:', keyName);

      const mappedChar = this.mapKeyNameToChar(keyName);
      if (mappedChar !== null) {
        if (this.playerName === 'Gracz') {
          this.playerName = mappedChar;
        } else if (this.playerName.length < 15) {
          this.playerName += mappedChar;
        }
        this.nameLabel.text = `Nazwa: ${this.playerName}`;
        return;
      }

      // Obsługa Backspace
      if (evt.key === ex.Input.Keys.Backspace && this.playerName.length > 0) {
        this.playerName = this.playerName.slice(0, -1);
        if (this.playerName.length === 0) {
          this.playerName = 'Gracz';
        }
        this.nameLabel.text = `Nazwa: ${this.playerName}`;
      }
    });
  }

  private mapKeyNameToChar(keyName: string): string | null {
    // Przekształca nazwy klawiszy Excalibur/DOM na pojedynczy znak
    // Przykłady: "KeyW" -> "W", "Digit3" -> "3", "Num7" -> "7", "Space" -> " "
    if (!keyName) return null;

    if (/^Key[A-Z]$/.test(keyName)) {
      return keyName.slice(3);
    }
    if (/^[A-Z]$/.test(keyName)) {
      return keyName;
    }
    if (/^Digit[0-9]$/.test(keyName)) {
      return keyName.slice(5);
    }
    if (/^Num[0-9]$/.test(keyName)) {
      return keyName.slice(3);
    }
    if (keyName === 'Space') {
      return ' ';
    }
    return null;
  }

  private joinGame(playerName: string): void {
    // Wysłanie żądania dołączenia do gry
    this.multiplayerManager.emit('joinLobby', { playerName });
  }

  private updatePlayersList(players: string[]): void {
    let playersText = 'Gracze w lobby:\n';
    
    players.forEach((player, index) => {
      playersText += `${index + 1}. ${player}\n`;
    });
    
    this.playersList.text = playersText;
  }

  public onActivate(): void {
    // Reset nazwy gracza
    this.playerName = 'Gracz';
    if (this.nameLabel) {
      this.nameLabel.text = `Nazwa: ${this.playerName}`;
    }
  }

  public onDeactivate(): void {
    // Wysłanie żądania opuszczenia lobby
    this.multiplayerManager.emit('leaveLobby');
  }
}