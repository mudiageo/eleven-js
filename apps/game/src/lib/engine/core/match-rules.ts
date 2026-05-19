import { matchStore } from "$lib/game/match/match-store.svelte";

export class MatchRules {
  static checkOffside(passerTeamId: number, passTimeZ: number) {
    const defenders = matchStore.players
      .filter((p) => p.teamId !== passerTeamId)
      .map((p) => p.position.z);

    // Assuming team 0 defends negative Z and attacks positive Z
    // Invert check if team 1 attacks negative Z
    const directionMultiplier = passerTeamId === 0 ? 1 : -1;
    defenders.sort((a, b) => (b - a) * directionMultiplier); // Sort by depth toward defending goal

    const offsideLine = defenders[1] ?? defenders[0];

    // Find attackers past the line
    const offsidePlayers = matchStore.players.filter((p) => {
      if (p.teamId !== passerTeamId) return false;
      // Simplified logic assuming positive Z for team 0 is attacking direction
      if (passerTeamId === 0) {
        return p.position.z > offsideLine && p.position.z > passTimeZ;
      } else {
        return p.position.z < offsideLine && p.position.z < passTimeZ;
      }
    });

    return offsidePlayers;
  }
}
