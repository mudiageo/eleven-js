import type { PerspectiveCamera } from 'three'

export type CameraMode =
  | 'follow'          // chase cam behind player, looks at ball
  | 'follow-ball'     // orbits around the ball
  | 'broadcast'       // classic side-on TV, tracks player Z
  | 'broadcast-wide'  // full-pitch side-on
  | 'topdown'         // directly above, looking straight down
  | 'tactical'        // 45° elevated quarter-view
  | 'cinematic'       // low dramatic side-tracking
  | 'goalcam-north'   // behind north goal looking south
  | 'goalcam-south'   // behind south goal looking north
  | 'drone'           // slow auto-orbiting aerial

export const CAMERA_MODES: { value: CameraMode; label: string; icon: string }[] = [
  { value: 'follow',         label: 'Follow Player',   icon: '🎮' },
  { value: 'follow-ball',    label: 'Follow Ball',     icon: '⚽' },
  { value: 'broadcast',      label: 'Broadcast',       icon: '📺' },
  { value: 'broadcast-wide', label: 'Broadcast Wide',  icon: '🎥' },
  { value: 'topdown',        label: 'Top Down',        icon: '🗺️' },
  { value: 'tactical',       label: 'Tactical',        icon: '⚔️' },
  { value: 'cinematic',      label: 'Cinematic',       icon: '🎬' },
  { value: 'goalcam-north',  label: 'North Goal',      icon: '🥅' },
  { value: 'goalcam-south',  label: 'South Goal',      icon: '🥅' },
  { value: 'drone',          label: 'Drone',           icon: '🚁' },
]

const MODES = CAMERA_MODES.map(m => m.value)

export class CameraState {
  ref: PerspectiveCamera | null = $state(null);
  mode: CameraMode = $state('broadcast');
  // ── Lens
  fov: number      = $state(55)
  baseFov: number  = $state(55)   
  tightFov: number = $state(38)   // auto-applied when player is near goal
  near: number     = $state(0.1)
  far: number      = $state(1000)

  // ── Orbital offsets (applied on top of every mode's base) ─────────
  azimuth: number    = $state(0)    // radians, horizontal orbit
  elevation: number  = $state(0)    // radians, +up / −down
  baseHeight: number = $state(0)    // world Y added to all modes
  distance: number   = $state(1.0)  // multiplier on mode's base radius

  // ── Smoothing
  lerpFactor: number = $state(0.08)  // position lerp speed  0=frozen 1=instant
  lookLerp: number   = $state(0.10)  // lookAt lerp speed

  // ── Interaction
  sensitivity: number = $state(0.5)  // touch/mouse orbit sensitivity
  zoomSpeed: number   = $state(0.8)  // scroll zoom scale


  // ── Helpers ───────────────────────────────────────────────────────
  switchMode(mode: CameraMode | null = null) {
    if (mode) { this.mode = mode; return }
    const i = Math.max(0, MODES.indexOf(this.mode))
    this.mode = MODES[(i + 1) % MODES.length]
  }

  zoom(delta: number) {
    this.fov = Math.max(10, Math.min(120, this.fov + delta * this.zoomSpeed))
    if (this.ref) {
      this.ref.fov = this.fov
      this.ref.updateProjectionMatrix()
    }
  }

  resetFov() {
    this.fov = this.baseFov
  }

  /** Call in useTask hook; smoothly tightens FOV when player approaches goal */
  autoFov(playerDistToGoal: number) {
    const target = playerDistToGoal < 20 ? this.tightFov : this.baseFov
    this.fov += (target - this.fov) * 0.04
    if (this.ref) {
      this.ref.fov = this.fov
      this.ref.updateProjectionMatrix()
    }
  }
}

export const cameraState = new CameraState()