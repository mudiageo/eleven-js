import type { Player, Ball, MatchState } from '$lib/engine/core/types';
import { ballState } from '../components/ball/ball.svelte.ts'
import { PlayerState } from '../components/players/player.svelte.ts'
import { cameraState } from './camera.svelte.ts'

class MatchStore {
  // Reactive state
  homeScore = $state(0);
  awayScore = $state(0);
  minute = $state(0);
  phase = $state<MatchState['phase']>('PRE_MATCH');
  players = $state([]);
  ball = $state(ballState);
  camera = $state(cameraState);
  events = $state([]);
  paused = $state(false);
  speed = $state(1);
  
  // Derived
  isLosing = $derived(this.homeScore < this.awayScore);
  
  constructor() {
    const player = new PlayerState({ teamId: 1
    });
    player.ballPossession = true
    player.isControlled = true
    
    this.players.push(player)
  }
  
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
  
  get playerWithBall () {
    return this.players.find(p => p.ballPossession === true)
  }
  
  get controlledPlayer () {
    return this.players.find(p => p.isControlled === true)
  }
  
  input(input, data = null) {
  
    switch (input) {
      case 'shoot': {
        this.playerWithBall.triggerShoot()
        break;
      }
      case 'pass': {
        this.playerWithBall.triggerPass()
        break;
      }
      case 'move': {
        this.controlledPlayer.setMoveInput(data.x, data.z)
        break;
      }
    }
    
  }
  
  moveBall() {
    this.ball?.ref.applyImpulse({ x: 0.015, y:0, z: 0}, true)
    
  }
}

export const matchStore = new MatchStore();

interface Inout  {
    move:   { x: number; z: number }
    shoot:  void
    pass:   void
    tackle: void
    speed:  'walk' | 'run' | 'sprint'
    camera: CameraMode
    reset:  void
  }