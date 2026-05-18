import type { Player, Ball, MatchState } from '$lib/engine/core/types';


class MatchStore {
  // Reactive state
  homeScore = $state(0);
  awayScore = $state(0);
  minute = $state(0);
  phase = $state<MatchState['phase']>('PRE_MATCH');
  players = $state<Player[]>([]);
  ball = $state<Ball>({ position: { x: 0, y: 0.11, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, ref: null });
  camera = $state({ref: null});
  events = $state([]);
  paused = $state(false);
  
  // Derived
  isLosing = $derived(this.homeScore < this.awayScore);
  
  addGoal(scorer: Player) {
    if (scorer.teamId === 0) this.homeScore++;
    else this.awayScore++;
    // trigger commentary, celebration, etc.
  }
  
  updatePhysics(buffer: Float32Array) {
    this.ball.position.x = buffer[0];
    this.ball.position.y = buffer[1];
    this.ball.position.z = buffer[2];
  }
  
  moveBall() {
    this.ball?.ref.applyImpulse({ x: 0.015, y:0, z: 0}, true)
    
  }
}

export const matchStore = new MatchStore();