import * as ex from 'excalibur';
import { ResourceManager } from '../managers/ResourceManager';

export class Bullet extends ex.Actor {
  private owner: ex.Actor;
  private damage: number;
  private resourceManager: ResourceManager;
  private lifetime = 2000; // ms
  private createdAt: number;

  constructor(
    position: ex.Vector,
    direction: ex.Vector,
    damage: number,
    owner: ex.Actor,
    resourceManager: ResourceManager
  ) {
    super({
      pos: position,
      width: 8,
      height: 8,
      collisionType: ex.CollisionType.Passive,
      color: ex.Color.Yellow
    });
    
    this.owner = owner;
    this.damage = damage;
    this.resourceManager = resourceManager;
    this.createdAt = Date.now();
    
    // Ustawienie prędkości pocisku
    const speed = 500;
    this.vel = direction.scale(speed);
    
    // Obrót pocisku w kierunku ruchu
    this.rotation = direction.toAngle();
    
    // Dodanie sprite'a pocisku
    const bulletSprite = new ex.Sprite({
      image: resourceManager.getImage('bullet'),
      destSize: { width: 8, height: 8 }
    });
    
    this.graphics.use(bulletSprite);
  }

  public onPreUpdate(engine: ex.Engine, delta: number): void {
    // Sprawdzenie, czy pocisk nie przekroczył swojego czasu życia
    if (Date.now() - this.createdAt > this.lifetime) {
      this.kill();
    }
  }

  public getDamage(): number {
    return this.damage;
  }

  public getOwner(): ex.Actor {
    return this.owner;
  }
}