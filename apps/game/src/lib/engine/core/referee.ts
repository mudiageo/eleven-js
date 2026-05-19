import type { FoulSeverity, Vector3 } from "$lib/engine/core/ecs";
import { matchStore } from "$lib/game/match/match-store.svelte";

export class RefereeSystem {
  private readonly FOUL_VELOCITY_THRESHOLD = 4.0;

  // A simplified placeholder to assess a foul if we had full bounding boxes
  assessFoul(
    tacklerId: number,
    victimId: number,
    relativeVelocity: number,
    lateTackle: boolean,
  ): FoulSeverity {
    const tackler = matchStore.players.find((p) => p.id === tacklerId);
    const victim = matchStore.players.find((p) => p.id === victimId);

    if (!tackler || !victim || tackler.teamId === victim.teamId) return "NONE";

    const fromBehind = false; // Could be computed by dot product of facing vectors
    const dangerousHeight = false; // "studs up"

    if (dangerousHeight && fromBehind) return "RED";
    if (relativeVelocity > 8.0 && fromBehind) return "RED";
    if (fromBehind && relativeVelocity > this.FOUL_VELOCITY_THRESHOLD) return "YELLOW";
    if (lateTackle && relativeVelocity > 5.0) return "YELLOW";

    if (relativeVelocity > this.FOUL_VELOCITY_THRESHOLD) return "FOUL";

    return "NONE";
  }

  awardCard(playerId: number, severity: FoulSeverity) {
    const player = matchStore.players.find((p) => p.id === playerId);
    if (!player) return;

    if (severity === "YELLOW") {
      player.yellowCards++;
      if (player.yellowCards >= 2) {
        player.redCard = true;
        player.active = false;
      }
    } else if (severity === "RED") {
      player.redCard = true;
      player.active = false;
    }
  }
}

export const refereeSystem = new RefereeSystem();
