import type { GameEvent } from "$lib/engine/core/ecs";
import type { Vector3, PlayerComponent, TransformComponent } from "$lib/engine/core/ecs";

export interface Ball {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
}

export interface Player {
  id: number;
  teamId: 0 | 1;
  position: Vector3;
  rotation: number;
  active: boolean;
  state: string;
  isControlled: boolean;
  yellowCards: number;
  redCard: boolean;
}

export interface MatchState {
  phase:
    | "PRE_MATCH"
    | "FIRST_HALF"
    | "HALF_TIME"
    | "SECOND_HALF"
    | "FULL_TIME"
    | "ET_1ST"
    | "ET_2ND"
    | "PENALTIES";
}

class MatchStore {
  // Reactive state
  homeScore = $state(0);
  awayScore = $state(0);
  minute = $state(0);
  addedTime = $state(0);
  phase = $state<MatchState["phase"]>("PRE_MATCH");
  players = $state<Player[]>([]);
  ball = $state<Ball>({
    position: { x: 0, y: 0.11, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });
  events = $state<GameEvent[]>([]);
  paused = $state(false);

  // Derived
  isLosing = $derived(this.homeScore < this.awayScore);

  addGoal(teamId: number) {
    if (teamId === 0) this.homeScore++;
    else this.awayScore++;
  }

  updatePhysics(buffer: Float32Array) {
    this.ball.position.x = buffer[0];
    this.ball.position.y = buffer[1];
    this.ball.position.z = buffer[2];
  }

  initPlayers() {
    const newPlayers: Player[] = [];

    // Simple 4-4-2 for Team 0 (Home)
    for (let i = 0; i < 11; i++) {
      newPlayers.push({
        id: i,
        teamId: 0,
        position: { x: (Math.random() - 0.5) * 60, y: 0.925, z: Math.random() * 50 },
        rotation: 0,
        isControlled: i === 10,
        active: true,
        state: "IDLE",
        yellowCards: 0,
        redCard: false,
      });
    }

    // Simple 4-4-2 for Team 1 (Away)
    for (let i = 11; i < 22; i++) {
      newPlayers.push({
        id: i,
        teamId: 1,
        position: { x: (Math.random() - 0.5) * 60, y: 0.925, z: -(Math.random() * 50) },
        rotation: Math.PI,
        isControlled: false,
        active: true,
        state: "IDLE",
        yellowCards: 0,
        redCard: false,
      });
    }

    this.players = newPlayers;
  }
}

export const matchStore = new MatchStore();
