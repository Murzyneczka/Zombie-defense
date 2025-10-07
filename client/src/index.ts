import * as ex from 'excalibur';
import { MainScene } from './scenes/MainScene';
import { LobbyScene } from './scenes/LobbyScene';
import { ShopScene } from './scenes/ShopScene';
import { MultiplayerManager } from './managers/MultiplayerManager';
import { ResourceManager } from './managers/ResourceManager';

// Konfiguracja silnika gry
const game = new ex.Engine({
  width: 1280,
  height: 720,
  displayMode: ex.DisplayMode.FitScreenAndFill,
  canvasElementId: 'game',
  backgroundColor: ex.Color.fromHex('#1a1a1a')
});

// Inicjalizacja menedżerów
const multiplayerManager = new MultiplayerManager();
const resourceManager = new ResourceManager();

// Dodanie scen do gry
game.addScene('lobby', new LobbyScene(multiplayerManager));
game.addScene('main', new MainScene(multiplayerManager, resourceManager));
game.addScene('shop', new ShopScene(multiplayerManager));

// Rozpoczęcie gry od sceny lobby
game.goToScene('lobby');

// Ukrycie ekranu ładowania
window.addEventListener('load', () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
});

// Obsługa błędów
game.on('initialize', () => {
  console.log('Gra zainicjalizowana');
});

game.on('start', () => {
  console.log('Gra rozpoczęta');
});

// Uruchomienie silnika gry
game.start().catch(err => {
  console.error('Błąd uruchomienia gry:', err);
});