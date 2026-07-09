import { Vector3 } from 'three'

export class BallState {
  rbRef: RapierRigidBody | null = $state(null);
  ref: RapierRigidBody | null = $derived(this.rbRef);
  position = { x: 0, y: 0.11, z: 0 };
  velocity = { x: 0, y: 0, z: 0 };
  radius =  0.11
  
  constructor() {
    
  }
    
  
  // Kick the ball in a direction with given force
  kick(direction: Vector3, force: number) {
    if (!this.rbRef) return
    const impulse = direction.clone().normalize().multiplyScalar(force)
    this.rbRef.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)
  }

  // Reset ball to centre spot
  reset() {
    if (!this.rbRef) return
    this.rbRef.setTranslation({ x: 0, y: BALL_RADIUS + 0.05, z: 0 }, true)
    this.rbRef.setLinvel({ x: 0, y: 0, z: 0 }, true)
    this.rbRef.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }
}

export const ballState = new BallState()