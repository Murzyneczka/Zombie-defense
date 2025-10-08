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
    let nearestPlayerId: string | null = null;
    let nearestPlayerDistance = Infinity;
    
    players.forEach((player) => {
      const distance = this.calculateDistance(zombie.position, player.position);
      if (distance < nearestPlayerDistance) {
        nearestPlayerDistance = distance;
        nearestPlayerId = player.id;
      }
    });
    
    // Znalezienie najbliższej budowli
    let nearestBuildingId: string | null = null;
    let nearestBuildingDistance = Infinity;
    
    buildings.forEach((building) => {
      const distance = this.calculateDistance(zombie.position, building.position);
      if (distance < nearestBuildingDistance) {
        nearestBuildingDistance = distance;
        nearestBuildingId = building.id;
      }
    });
    
    // Wybór celu (gracz lub budynek)
    if (nearestPlayerId && nearestPlayerDistance < 500) { // Zasięg widzenia graczy
      return nearestPlayerId;
    } else if (nearestBuildingId && nearestBuildingDistance < 300) { // Zasięg widzenia budynków
      return nearestBuildingId;
    }
    
    return null;
  }
  
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}