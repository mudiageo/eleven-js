export type EntityId = number;

export type PositionRole =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "ST";

export interface PlayerStats {
  speed: number;
  acceleration: number;
  agility: number;
  strength: number;
  jumping: number;
  stamina: number;
  dribbling: number;
  ballControl: number;
  shortPassing: number;
  longPassing: number;
  crossing: number;
  finishing: number;
  shotPower: number;
  longShots: number;
  volleys: number;
  heading: number;
  defensiveAwareness: number;
  tackling: number;
  slidingTackle: number;
  interceptions: number;
  positioning: number;
  vision: number;
  reactions: number;
  composure: number;
  goalkeepingDiving?: number;
  goalkeepingHandling?: number;
  goalkeepingKicking?: number;
  goalkeepingPositioning?: number;
  goalkeepingReflexes?: number;
}

export type PlayerAction =
  | "IDLE"
  | "RUN"
  | "SPRINT"
  | "PASS"
  | "SHOOT"
  | "TACKLE"
  | "SLIDING_TACKLE"
  | "FALL"
  | "SAVE_DIVE"
  | "CELEBRATE";
export type FoulSeverity = "NONE" | "FOUL" | "YELLOW" | "RED";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface TransformComponent {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
}

export interface PlayerComponent {
  teamId: 0 | 1;
  positionRole: PositionRole;
  stats: PlayerStats;
  stamina: number; // 0–100
  actionState: PlayerAction;
  ballPossession: boolean;
  destinationNode: Vector3 | null;
  tacticSlot: number; // Index in formation
}

export interface BallComponent {
  spin: Vector3;
  lastTouchedBy: EntityId | null;
  inFlight: boolean;
  height: number;
}

export interface Entity {
  id: EntityId;
  components: Map<string, any>; // Relaxed type for components
}

// Strongly-typed game events
export type GameEvent =
  | { type: "GOAL"; scorer: EntityId; assist: EntityId | null; minute: number }
  | { type: "FOUL"; offender: EntityId; victim: EntityId; severity: FoulSeverity }
  | { type: "CARD"; player: EntityId; cardType: "yellow" | "red"; minute: number }
  | { type: "SUBSTITUTION"; off: EntityId; on: EntityId; teamId: number; minute: number }
  | { type: "KICKOFF"; teamId: number }
  | { type: "HALF_TIME" }
  | { type: "FULL_TIME" }
  | { type: "CORNER"; teamId: number }
  | { type: "THROW_IN"; teamId: number; position: Vector3 }
  | { type: "FREEKICK"; teamId: number; position: Vector3; direct: boolean }
  | { type: "PENALTY"; teamId: number; taker: EntityId }
  | { type: "OFFSIDE"; teamId: number }
  | { type: "SAVE"; goalkeeper: EntityId; shotPower: number }
  | { type: "INJURY"; player: EntityId; severity: "minor" | "major" }
  | { type: "BALL_OUT"; side: "left" | "right" | "goal-left" | "goal-right" }
  | { type: "PLAYER_SPRINT"; player: EntityId }
  | { type: "TACKLE_SUCCESS"; tackler: EntityId; victim: EntityId };
