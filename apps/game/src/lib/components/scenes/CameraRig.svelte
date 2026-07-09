<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { PerspectiveCamera, Vector3 } from 'three'
  import { matchStore } from '$lib/state/match-store.svelte'
  import { cameraState } from '$lib/state/camera.svelte'


  interface Props {
    playerPosition?: [number, number, number]
    ballPosition?:   { x: number; y: number; z: number }
  }
  let {
    playerPosition = [0, 0, 0],
    ballPosition   = { x: 0, y: 0, z: 0 },
  }: Props = $props()

  // ── scratch vectors (never re-allocated) ─────────────────────────
  const _desired  = new Vector3()
  const _current  = new Vector3()
  const _lookDes  = new Vector3()
  const _lookCur  = new Vector3()
  const _offset   = new Vector3()

  const HALF_L = 52.5

  // Apply azimuth/elevation/distance offset on top of a base position
  function applyOrbit(
    base: Vector3,
    target: Vector3,
    baseRadius: number,
  ) {
    const r   = baseRadius * cameraState.distance
    const az  = cameraState.azimuth
    const el  = cameraState.elevation
    _offset.set(
      Math.sin(az) * Math.cos(el) * r,
      Math.sin(el) * r + cameraState.baseHeight,
      Math.cos(az) * Math.cos(el) * r,
    )
    _desired.copy(target).add(_offset)
    // if base was already set, blend; otherwise use as-is
    _desired.lerp(base.add(_offset), 0)  // orbit always overrides base XZ
  }

  useTask(() => {
    if (!cameraState.ref || cameraState.paused) return

    const [px, py, pz] = playerPosition
    const { x: bx, y: by, z: bz } = ballPosition
  

    switch (cameraState.mode) {

      case 'follow': {
        // Chase-cam: sit behind player relative to their last move dir,
        // slightly elevated, look toward the ball
        if (bx != 0 || py != 0 || pz != 0 ) console.log(px,py,pz,bx,by,bz)
        const r = 14 * cameraState.distance
        _desired.set(
          px + Math.sin(cameraState.azimuth) * r,
          py + 8 + cameraState.baseHeight + cameraState.elevation * 20,
          pz + Math.cos(cameraState.azimuth) * r,
        )
        _lookDes.set(bx, by + 1, bz)
        break
      }

      case 'follow-ball': {
        // Orbit around the ball at fixed elevation
        const r = 12 * cameraState.distance
        const el = 0.45 + cameraState.elevation
        _desired.set(
          bx + Math.sin(cameraState.azimuth) * Math.cos(el) * r,
          by + Math.sin(el) * r + cameraState.baseHeight,
          bz + Math.cos(cameraState.azimuth) * Math.cos(el) * r,
        )
        _lookDes.set(bx, by, bz)
        break
      }

      case 'broadcast': {
        // Side-on, tracks player Z, camera on the far touchline
        const h = 18 * cameraState.distance
        _desired.set(
          -55 + cameraState.azimuth * 10,
          h + cameraState.baseHeight,
          pz * 0.5 + cameraState.elevation * 10,
        )
        _lookDes.set(0, 0, pz * 0.5)
        break
      }

      case 'broadcast-wide': {
        const h = 28 * cameraState.distance
        _desired.set(
          -70 + cameraState.azimuth * 10,
          h + cameraState.baseHeight,
          0,
        )
        _lookDes.set(0, 0, 0)
        break
      }

      case 'topdown': {
        const h = 85 * cameraState.distance
        _desired.set(
          cameraState.azimuth * 20,
          h + cameraState.baseHeight,
          cameraState.elevation * 20,
        )
        _lookDes.set(0, 0, 0)
        break
      }

      case 'tactical': {
        // 45° elevated side-angle, full pitch visible
        const r = 75 * cameraState.distance
        const el = Math.PI / 4 + cameraState.elevation
        _desired.set(
          -Math.cos(el) * r + cameraState.azimuth * 10,
          Math.sin(el) * r + cameraState.baseHeight,
          0,
        )
        _lookDes.set(0, 0, 0)
        break
      }

      case 'cinematic': {
        // Low, slow side-tracking — dramatic angle
        const h = 4 + cameraState.baseHeight
        _desired.set(
          -38 + Math.sin(cameraState.azimuth) * 5,
          h + cameraState.elevation * 5,
          pz * 0.6,
        )
        _lookDes.set(px, 1.2, pz)
        break
      }

      case 'goalcam-north': {
        _desired.set(
          cameraState.azimuth * 8,
          6 + cameraState.baseHeight + cameraState.elevation * 10,
          HALF_L + 10 * cameraState.distance,
        )
        _lookDes.set(0, 2, HALF_L)
        break
      }

      case 'goalcam-south': {
        _desired.set(
          cameraState.azimuth * 8,
          6 + cameraState.baseHeight + cameraState.elevation * 10,
          -(HALF_L + 10 * cameraState.distance),
        )
        _lookDes.set(0, 2, -HALF_L)
        break
      }

      case 'drone': {
        // High aerial orbit around pitch centre
        const r = 90 * cameraState.distance
        const el = 0.8 + cameraState.elevation
        const t = Date.now() * 0.0001 // slow auto-orbit
        const az = t + cameraState.azimuth
        _desired.set(
          Math.sin(az) * Math.cos(el) * r,
          Math.sin(el) * r + cameraState.baseHeight,
          Math.cos(az) * Math.cos(el) * r,
        )
        _lookDes.set(0, 0, 0)
        break
      }
    }

    // ── smooth lerp toward desired ────────────────────────────────
    _current.lerp(_desired,  cameraState.lerpFactor)
    _lookCur.lerp(_lookDes,  cameraState.lookLerp)

    cameraState.ref.position.copy(_current)
    cameraState.ref.lookAt(_lookCur)

    // ── sync fov ─────────────────────────────────────────────────
    if (Math.abs(cameraState.ref.fov - cameraState.fov) > 0.01) {
      cameraState.ref.fov += (cameraState.fov - cameraState.ref.fov) * 0.06
      cameraState.ref.updateProjectionMatrix()
    }
  })
</script>

<T.PerspectiveCamera
  bind:ref={cameraState.ref}
  makeDefault
  position={[0, 22, 52]}
  fov={cameraState.fov}
  far={cameraState.far}
  near={cameraState.near}
  oncreate={(ref) => {
  
  ref.lookAt(0,0,0)
    
    cameraState.ref = ref
    // Initialise position immediately
    const [px, , pz] = playerPosition
    // ref.position.set(px, 8, pz - 10)
    ref.position.set(px - 50, 18, pz * 0.4)
    _current.copy(ref.position)
    _lookCur.set(0, 0, 0)
  }}
>
  <OrbitControls/>
  
</T.PerspectiveCamera>


