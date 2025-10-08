export declare enum WeaponType {
    Pistol = 0,
    AssaultRifle = 1,
    Sniper = 2,
    Shotgun = 3,
    GrenadeLauncher = 4,
    SMG = 5
}
export declare enum ResourceType {
    Wood = 0,
    Stone = 1,
    Iron = 2,
    Gold = 3
}
export declare enum BuildingType {
    Fence = 0,
    Gate = 1,
    BarbedWire = 2,
    TurretRifle = 3,
    TurretFlamethrower = 4,
    TurretGrenade = 5,
    TurretPiercing = 6
}
export declare enum ZombieType {
    Basic = 0,
    Fast = 1,
    Tank = 2,
    Spitter = 3
}
export interface PlayerData {
    id: string;
    name: string;
    position: {
        x: number;
        y: number;
    };
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
    position: {
        x: number;
        y: number;
    };
    health: number;
    maxHealth: number;
    target?: string;
}
export interface BuildingData {
    id: string;
    type: BuildingType;
    position: {
        x: number;
        y: number;
    };
    health: number;
    maxHealth: number;
    owner: string;
}
export interface ResourceData {
    id: string;
    type: ResourceType;
    position: {
        x: number;
        y: number;
    };
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
//# sourceMappingURL=types.d.ts.map