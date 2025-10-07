import { ZombieData, PlayerData, BuildingData } from '../../shared/types';

export class ZombieAI {
  // Prosta implementacja AI dla zombie
  // W rzeczywistej grze można użyć bardziej zaawansowanych algorytmów, np. A*
  
  public updateZombieTarget(
    zombie: ZombieData, 
    players: Map<string, PlayerData>, 
    buildings: Map<string, BuildingData>
  ): string | null {
    // Znalezienie najbliższego gracza
    let nearestPlayer: PlayerData | null = null;
    let nearestPlayerDistance = Infinity;
    
    players.forEach((player) => {
      const distance = this.calculateDistance(zombie.position, player.position);
      if (distance < nearestPlayerDistance) {
        nearestPlayerDistance = distance;
        nearestPlayer = player;
      }
    });
    
    // Znalezienie najbliższej budowli
    let nearestBuilding: BuildingData | null = null;
    let nearestBuildingDistance = Infinity;
    
    buildings.forEach((building) => {
      const distance = this.calculateDistance(zombie.position, building.position);
      if (distance < nearestBuildingDistance) {
        nearestBuildingDistance = distance;
        nearestBuilding = building;
      }
    });
    
    // Wybór celu (gracz lub budynek)
    if (nearestPlayer && nearestPlayerDistance < 500) { // Zasięg widzenia graczy
      return nearestPlayer.id;
    } else if (nearestBuilding && nearestBuildingDistance < 300) { // Zasięg widzenia budynków
      return nearestBuilding.id;
    }
    
    return null;
  }
  
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}