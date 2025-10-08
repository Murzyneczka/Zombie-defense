export enum WeaponType {
  Pistol,
  AssaultRifle,
  Sniper,
  Shotgun,
  GrenadeLauncher,
  SMG
}

export enum ResourceType {
  Wood,
  Stone,
  Iron,
  Gold
}

export enum BuildingType {
  Fence,
  Gate,
  BarbedWire,
  TurretRifle,
  TurretFlamethrower,
  TurretGrenade,
  TurretPiercing
}

export enum ZombieType {
  Basic,
  Fast,
  Tank,
  Spitter
}

export interface PlayerData {
  id: string;
  name: string;
  position: { x: number; y: number };
  rotation: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  weapons: WeaponType[];
  currentWeapon: WeaponType;
  resources: Map<ResourceType, number>;
  gold: number;
}

export interface ZombieData {
  id: string;
  type: ZombieType;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  target?: string; // ID gracza lub budowli
}

export interface BuildingData {
  id: string;
  type: BuildingType;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  owner: string; // ID gracza
}

export interface ResourceData {
  id: string;
  type: ResourceType;
  position: { x: number; y: number };
  amount: number;
}

export interface GameState {
  wave: number;
  timeUntilNextWave: number;
  isShopOpen: boolean;
  players: Map<string, PlayerData>;
  zombies: Map<string, ZombieData>;
  buildings: Map<string, BuildingData>;
  resources: Map<string, ResourceData>;
}