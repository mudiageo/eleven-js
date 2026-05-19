import { matchStore } from "$lib/game/match/match-store.svelte";

export class PlayerMechanics {
  static shoot(playerId: number, power: number, target: { x: number; y: number; z: number }) {
    const player = matchStore.players.find((p) => p.id === playerId);
    if (!player) return;

    // Direction vector
    const dirX = target.x - player.position.x;
    const dirY = target.y - matchStore.ball.position.y;
    const dirZ = target.z - player.position.z;

    // Normalize and scale by power
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    const impulseX = (dirX / length) * power;
    const impulseY = (dirY / length) * power;
    const impulseZ = (dirZ / length) * power;

    // We would dispatch this via event bus to the physics worker
    // For now we'll post directly if we had a reference, or use a global physics store
  }

  static pass(playerId: number, targetPlayerId: number, power: number) {
    const player = matchStore.players.find((p) => p.id === playerId);
    const targetPlayer = matchStore.players.find((p) => p.id === targetPlayerId);
    if (!player || !targetPlayer) return;

    const dirX = targetPlayer.position.x - player.position.x;
    const dirZ = targetPlayer.position.z - player.position.z;
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);

    const impulseX = (dirX / length) * power;
    const impulseZ = (dirZ / length) * power;
    const impulseY = power * 0.2; // slight loft

    // Dispatch to physics
  }
}
