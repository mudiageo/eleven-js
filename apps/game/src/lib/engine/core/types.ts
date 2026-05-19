export type Vector3 = { x: number; y: number; z: number };

export interface Player {
  id: number;
  teamId: number;
  position: Vector3;
  rotation: number; // Y-axis rotation in radians
  isControlled: boolean;
  showLabel?: boolean;
  active: boolean;
  yellowCards: number;
  redCard: boolean;
  state: "IDLE" | "RUN" | "TACKLE" | "PASS" | "SHOOT" | "FALL";
  stamina: number;
  // Basic stats for early implementation
  stats: {
    speed: number;
    stamina: number;
    strength: number;
  };
}

export interface Ball {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3; // Spin
}

export interface MatchState {
  phase:
    | "PRE_MATCH"
    | "FIRST_HALF"
    | "HALF_TIME"
    | "SECOND_HALF"
    | "FULL_TIME"
    | "EXTRA_TIME"
    | "PENALTIES";
  minute: number;
  addedTime: number;
  homeScore: number;
  awayScore: number;
  paused: boolean;
}

export interface GameEvent {
  type: string;
  payload: any;
  timestamp: number;
}
