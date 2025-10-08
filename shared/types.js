"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZombieType = exports.BuildingType = exports.ResourceType = exports.WeaponType = void 0;
var WeaponType;
(function (WeaponType) {
    WeaponType[WeaponType["Pistol"] = 0] = "Pistol";
    WeaponType[WeaponType["AssaultRifle"] = 1] = "AssaultRifle";
    WeaponType[WeaponType["Sniper"] = 2] = "Sniper";
    WeaponType[WeaponType["Shotgun"] = 3] = "Shotgun";
    WeaponType[WeaponType["GrenadeLauncher"] = 4] = "GrenadeLauncher";
    WeaponType[WeaponType["SMG"] = 5] = "SMG";
})(WeaponType || (exports.WeaponType = WeaponType = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType[ResourceType["Wood"] = 0] = "Wood";
    ResourceType[ResourceType["Stone"] = 1] = "Stone";
    ResourceType[ResourceType["Iron"] = 2] = "Iron";
    ResourceType[ResourceType["Gold"] = 3] = "Gold";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var BuildingType;
(function (BuildingType) {
    BuildingType[BuildingType["Fence"] = 0] = "Fence";
    BuildingType[BuildingType["Gate"] = 1] = "Gate";
    BuildingType[BuildingType["BarbedWire"] = 2] = "BarbedWire";
    BuildingType[BuildingType["TurretRifle"] = 3] = "TurretRifle";
    BuildingType[BuildingType["TurretFlamethrower"] = 4] = "TurretFlamethrower";
    BuildingType[BuildingType["TurretGrenade"] = 5] = "TurretGrenade";
    BuildingType[BuildingType["TurretPiercing"] = 6] = "TurretPiercing";
})(BuildingType || (exports.BuildingType = BuildingType = {}));
var ZombieType;
(function (ZombieType) {
    ZombieType[ZombieType["Basic"] = 0] = "Basic";
    ZombieType[ZombieType["Fast"] = 1] = "Fast";
    ZombieType[ZombieType["Tank"] = 2] = "Tank";
    ZombieType[ZombieType["Spitter"] = 3] = "Spitter";
})(ZombieType || (exports.ZombieType = ZombieType = {}));
//# sourceMappingURL=types.js.map