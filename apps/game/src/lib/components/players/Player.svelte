<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { RigidBody, AutoColliders } from '@threlte/rapier'
  import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'
  import { Vector3, Euler, Quaternion } from 'three'
  import { matchStore }  from '$lib/state/match-store.svelte';
  

  // ── Props ─────────────────────────────────────────────────────────

	interface Props {
	  player: PlayerState;
	};

	let {
		player = $bindable(),
	}: Props = $props();
	
	const { speedMode, facingAngle, moveX, moveZ } = player;
	
	const moveInput = $derived({ x: player.moveX, z: player.moveZ });
	
	/** Ball rigid body ref so player can kick it */
	const ballRigidBody: RapierRigidBody = $derived(matchStore.ball.rbRef)

  // ── Constants
  const PLAYER_H   = 1.8    // capsule total height
  const PLAYER_R   = 0.35   // capsule radius
  const KICK_RANGE = 20.2    // metres within which player can kick ball
  const SHOOT_F    = 28     // shoot impulse magnitude
  const PASS_F     = 14     // pass impulse magnitude

  const SPEEDS: Record<typeof speedMode, number> = {
    walk:   3,
    run:    7,
    sprint: 12,
  }

  // ── State ─────────────────────────────────────────────────────────
  let rbRef: RapierRigidBody = $state()
  
  let visualRef: any
  let isGrounded = false

  const _vel     = new Vector3()
  const _dir     = new Vector3()
  const _ballPos = new Vector3()
  const _playPos = new Vector3()
  const _kickDir = new Vector3()

  // ── Kick helper ───────────────────────────────────────────────────
  function tryKick(force: number, loftAngle = 0) {
    if (!ballRigidBody || !rbRef) return

    const bt = ballRigidBody.translation()
    const pt = rbRef.translation()
    _ballPos.set(bt.x, bt.y, bt.z)
    _playPos.set(pt.x, pt.y, pt.z)

    const dist = _ballPos.distanceTo(_playPos)
    if (dist > KICK_RANGE) return

    _kickDir
      .set(Math.sin(player.facingAngle), 0, Math.cos(player.facingAngle))
      .normalize()

    // Add loft for shots
    _kickDir.y += loftAngle

    ballRigidBody.applyImpulse(
      {
        x: _kickDir.x * force,
        y: _kickDir.y * force,
        z: _kickDir.z * force,
      },
      true
    )
  }

  // ── Per-frame update ──────────────────────────────────────────────
  useTask((delta) => {
    if (!rbRef) return

    const speed = SPEEDS[speedMode]
    const hasInput = Math.abs(moveInput.x) > 0.01 || Math.abs(moveInput.z) > 0.01

    if (hasInput) {
      // Rotate to face movement direction
      player.facingAngle = Math.atan2(moveInput.x, moveInput.z)

      // Horizontal velocity
      _dir.set(moveInput.x, 0, moveInput.z).normalize().multiplyScalar(speed)
    } else {
      _dir.set(0, 0, 0)
    }

    // Preserve vertical velocity (gravity)
    const currentVel = rbRef.linvel()
    rbRef.setLinvel(
      { x: _dir.x, y: currentVel.y, z: _dir.z },
      true
    )

    // Sync exported position
    const t = rbRef.translation()
    player.position = [t.x, t.y, t.z]

    // Shoot / pass
    if (player.shootTriggered) {
      tryKick(SHOOT_F, 0.25)
      player.shootTriggered = false
    }
    if (player.passTriggered) {
      tryKick(PASS_F, 0.05)
      player.passTriggered = false
    }
  })
</script>

<RigidBody
  bind:rigidBody={rbRef}
  position={[0, PLAYER_H / 2 + 0.1, -5]}
  lockRotations
  linearDamping={5}
  oncreate={( ref ) => { rbRef = ref; player.ref = ref }}
>
  <AutoColliders shape="capsule" args={[PLAYER_R, PLAYER_H / 2 - PLAYER_R]}>
    <!-- Body group that rotates to face direction -->
    <T.Group bind:ref={visualRef} rotation.y={player.facingAngle}>

      <!-- Torso -->
      <T.Mesh position={[0, 0, 0]} castShadow>
        <T.CylinderGeometry args={[PLAYER_R * 0.55, PLAYER_R * 0.6, PLAYER_H * 0.45, 12]} />
        <T.MeshStandardMaterial color="#e63946" roughness={0.7} />
      </T.Mesh>

      <!-- Shorts -->
      <T.Mesh position={[0, -PLAYER_H * 0.25, 0]} castShadow>
        <T.CylinderGeometry args={[PLAYER_R * 0.6, PLAYER_R * 0.55, PLAYER_H * 0.18, 12]} />
        <T.MeshStandardMaterial color="#1d3557" roughness={0.8} />
      </T.Mesh>

      <!-- Head -->
      <T.Mesh position={[0, PLAYER_H * 0.36, 0]} castShadow>
        <T.SphereGeometry args={[PLAYER_R * 0.55, 16, 16]} />
        <T.MeshStandardMaterial color="#f4a261" roughness={0.8} />
      </T.Mesh>

      <!-- Left leg -->
      <T.Mesh position={[-PLAYER_R * 0.3, -PLAYER_H * 0.38, 0]} castShadow>
        <T.CylinderGeometry args={[PLAYER_R * 0.22, PLAYER_R * 0.2, PLAYER_H * 0.28, 8]} />
        <T.MeshStandardMaterial color="#f4a261" roughness={0.8} />
      </T.Mesh>

      <!-- Right leg -->
      <T.Mesh position={[PLAYER_R * 0.3, -PLAYER_H * 0.38, 0]} castShadow>
        <T.CylinderGeometry args={[PLAYER_R * 0.22, PLAYER_R * 0.2, PLAYER_H * 0.28, 8]} />
        <T.MeshStandardMaterial color="#f4a261" roughness={0.8} />
      </T.Mesh>

      <!-- Boots -->
      <T.Mesh position={[-PLAYER_R * 0.3, -PLAYER_H * 0.54, 0.04]}>
        <T.BoxGeometry args={[PLAYER_R * 0.3, PLAYER_R * 0.2, PLAYER_R * 0.55]} />
        <T.MeshStandardMaterial color="#1a1a1a" />
      </T.Mesh>
      <T.Mesh position={[PLAYER_R * 0.3, -PLAYER_H * 0.54, 0.04]}>
        <T.BoxGeometry args={[PLAYER_R * 0.3, PLAYER_R * 0.2, PLAYER_R * 0.55]} />
        <T.MeshStandardMaterial color="#1a1a1a" />
      </T.Mesh>

      <!-- Direction indicator (small arrow on chest) -->
      <T.Mesh position={[0, PLAYER_H * 0.1, PLAYER_R * 0.56]}>
        <T.ConeGeometry args={[0.06, 0.15, 6]} />
        <T.MeshBasicMaterial color="yellow" />
      </T.Mesh>
    </T.Group>
  </AutoColliders>
</RigidBody>