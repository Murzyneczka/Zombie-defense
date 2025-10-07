import * as ex from 'excalibur';
import { MultiplayerManager } from '../managers/MultiplayerManager';

export class LobbyScene extends ex.Scene {
  private multiplayerManager: MultiplayerManager;
  private playerNameInput: ex.Input.TextInput;
  private joinButton: ex.Actor;
  private playersList: ex.Label;
  private titleLabel: ex.Label;
  private background: ex.Rectangle;

  constructor(multiplayerManager: MultiplayerManager) {
    super();
    this.multiplayerManager = multiplayerManager;
  }

  public onInitialize(engine: ex.Engine): void {
    // Tło
    this.background = new ex.Rectangle({
      width: engine.drawWidth,
      height: engine.drawHeight,
      color: ex.Color.fromHex('#1a1a1a')
    });
    
    this.add(this.background);
    
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
    
    // Pole tekstowe na nazwę gracza
    this.playerNameInput = new ex.Input.TextInput({
      pos: ex.vec(engine.drawWidth / 2, 250),
      font: new ex.Font({
        family: 'Press Start 2P',
        size: 16,
        color: ex.Color.White
      }),
      placeholder: 'Wpisz nazwę gracza',
      anchor: ex.Vector.Half
    });
    
    this.add(this.playerNameInput);
    
    // Przycisk dołączenia
    this.joinButton = new ex.Actor({
      pos: ex.vec(engine.drawWidth / 2, 350),
      width: 200,
      height: 50,
      color: ex.Color.fromHex('#555555'),
      anchor: ex.Vector.Half
    });
    
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
      const playerName = this.playerNameInput.value || 'Gracz';
      this.joinGame(playerName);
    });
    
    // Nasłuchiwanie na aktualizacje listy graczy
    this.multiplayerManager.on('playersListUpdate', (players: string[]) => {
      this.updatePlayersList(players);
    });
    
    // Nasłuchiwanie na rozpoczęcie gry
    this.multiplayerManager.on('gameStart', () => {
      this.engine.goToScene('main');
    });
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
    // Wysłanie żądania dołączenia do lobby
    this.multiplayerManager.emit('joinLobby', { playerName: 'Gracz' });
  }

  public onDeactivate(): void {
    // Wysłanie żądania opuszczenia lobby
    this.multiplayerManager.emit('leaveLobby');
  }
}