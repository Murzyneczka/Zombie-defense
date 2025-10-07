import * as ex from 'excalibur';

export class ResourceManager {
  private images: Map<string, ex.ImageSource> = new Map();
  private sounds: Map<string, ex.Sound> = new Map();
  private loadedImages = 0;
  private totalImages = 0;
  private loadedSounds = 0;
  private totalSounds = 0;
  private onAllLoadedCallback: (() => void) | null = null;

  public loadImage(name: string, path: string): void {
    if (this.images.has(name)) return;
    
    this.totalImages++;
    const image = new ex.ImageSource(path);
    
    image.load().then(() => {
      this.loadedImages++;
      this.checkAllLoaded();
    });
    
    this.images.set(name, image);
  }

  public loadSound(name: string, path: string): void {
    if (this.sounds.has(name)) return;
    
    this.totalSounds++;
    const sound = new ex.Sound(path);
    
    sound.load().then(() => {
      this.loadedSounds++;
      this.checkAllLoaded();
    });
    
    this.sounds.set(name, sound);
  }

  public getImage(name: string): ex.ImageSource {
    const image = this.images.get(name);
    if (!image) {
      throw new Error(`Obraz '${name}' nie został załadowany`);
    }
    return image;
  }

  public getSound(name: string): ex.Sound {
    const sound = this.sounds.get(name);
    if (!sound) {
      throw new Error(`Dźwięk '${name}' nie został załadowany`);
    }
    return sound;
  }

  public playSound(name: string, volume: number = 0.5): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play(volume);
    }
  }

  public onAllLoaded(callback: () => void): void {
    this.onAllLoadedCallback = callback;
    this.checkAllLoaded();
  }

  private checkAllLoaded(): void {
    if (
      this.loadedImages === this.totalImages &&
      this.loadedSounds === this.totalSounds &&
      this.onAllLoadedCallback
    ) {
      this.onAllLoadedCallback();
      this.onAllLoadedCallback = null;
    }
  }

  public getLoadProgress(): number {
    const total = this.totalImages + this.totalSounds;
    const loaded = this.loadedImages + this.loadedSounds;
    
    if (total === 0) return 1;
    
    return loaded / total;
  }
}