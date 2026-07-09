import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'

export type SpeedMode = 'walk' | 'run' | 'sprint'
export type ActionState = 'idle' | 'running' | 'shooting' | 'passing' | 'tackling'

export class PlayerState {
  id: any;
  rigidBody: RapierRigidBody | null = $state(null)
  teamId: 0 | 1 = $state(0);
  
  
  x: number = $state(0)
  y: number = $state(0)
  z: number = $state(-5)

  // ── Movement input (from InputManager)	 Movement direction from input, normalised [-1..1] 
  moveX: number = $state(0)
  moveZ: number = $state(0)
  
  ballPossession: boolean = $state(false)
  isControlled: boolean = $state(false)
  

  speedMode: SpeedMode = $state('run')
  readonly speeds: Record<SpeedMode, number> = { walk: 3, run: 7, sprint: 12 }

  // ── Actions (edge-triggered flags, consumed in useTask) ──────────
  shootTriggered: boolean  = $state(false)
  passTriggered: boolean   = $state(false)
  tackleTriggered: boolean = $state(false)

  // ── Visual state
  action: ActionState = $state('idle')
  facingAngle: number = $state(0)     // radians Y-axis rotation

  // ── Stats
  stamina: number = $state(100)       // 0–100
  goals: number   = $state(0)
  shots: number   = $state(0)
  passes: number  = $state(0)

  // ── Kit
  shirtColor: string  = $state('#e63946')
  shortsColor: string = $state('#1d3557')
  skinColor: string   = $state('#f4a261')
  bootColor: string   = $state('#1a1a1a')
  
  constructor(data) {
    this.teamId = data?.teamId || 1;
    this.id = crypto.randomUUID();
  }
  
  // ── Derived
  get position(): [number, number, number] {
    return [this.x, this.y, this.z]
  }

  get speed(): number {
    return this.speeds[this.speedMode]
  }

  get isMoving(): boolean {
    return Math.abs(this.moveX) > 0.01 || Math.abs(this.moveZ) > 0.01
  }

  get staminaLow(): boolean {
    return this.stamina < 25
  }

  // ── Mutators
  set position(position: [number, number, number]) {
    this.x = position[0]; this.y = position[1]; this.z = position[2]
  }
  
  setPosition(x: number, y: number, z: number) {
    this.x = x; this.y = y; this.z = z
  }

  setMoveInput(x: number, z: number) {
    this.moveX = x; this.moveZ = z
  }

  setSpeed(mode: SpeedMode) {
    this.speedMode = mode
  }

  triggerShoot() {
    this.shootTriggered = true
    this.shots++
    this.action = 'shooting'
  }

  triggerPass() {
    this.passTriggered = true
    this.passes++
    this.action = 'passing'
  }

  triggerTackle() {
    this.tackleTriggered = true
    this.action = 'tackling'
  }

  consumeShoot(): boolean {
    if (!this.shootTriggered) return false
    this.shootTriggered = false
    return true
  }

  consumePass(): boolean {
    if (!this.passTriggered) return false
    this.passTriggered = false
    return true
  }

  consumeTackle(): boolean {
    if (!this.tackleTriggered) return false
    this.tackleTriggered = false
    return true
  }

  /** Drain stamina on sprint, recover on walk/idle */
  tickStamina(delta: number) {
    if (this.speedMode === 'sprint' && this.isMoving) {
      this.stamina = Math.max(0, this.stamina - delta * 8)
      // Force to run if exhausted
      if (this.stamina === 0) this.speedMode = 'run'
    } else {
      const rate = this.isMoving ? 4 : 12
      this.stamina = Math.min(100, this.stamina + delta * rate)
    }
  }

  scoreGoal() {
    this.goals++
  }

  reset() {
    this.x = 0; this.y = 0; this.z = -5
    this.moveX = 0; this.moveZ = 0
    this.shootTriggered = false
    this.passTriggered  = false
    this.tackleTriggered = false
    this.action = 'idle'
    this.stamina = 100
    if (this.rigidBody) {
      this.rigidBody.setTranslation({ x: 0, y: 1.0, z: -5 }, true)
      this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
      this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  }
}

export const playerState = new PlayerState()