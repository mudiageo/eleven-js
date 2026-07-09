<script lang="ts">
  import { T } from '@threlte/core'
  
  import type { Quaternion, Vector3 } from 'three'
  import { SphereGeometry, MeshStandardMaterial, MathUtils } from 'three'
    import { RigidBody, AutoColliders } from '@threlte/rapier'
  import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat'
    import { matchStore }  from '$lib/state/match-store.svelte';
  

  // FIFA standard ball: circumference 68–70cm → radius ~0.11m
  interface Props {
    position: Vector3
    quaternion: Quaternion
    ball: BallState
    
  }
  let { position, quaternion, ball = $bindable(matchStore.ball) }: Props = $props()

  const BALL_RADIUS = ball.radius;
  
  let rbRef: RapierRigidBody

  // Rotation for visual spin (Rapier handles physics rotation separately)
  let meshRef: any
  
  function applyMagnusForce(ball: BallState): Vector3 {
  // F_magnus = 0.5 * ρ * Cl * A * |v|² * (ω̂ × v̂)
  const rho = 1.225;       // Air density kg/m³
  const Cl = 0.35;         // Lift coefficient (football)
  const A = Math.PI * 0.11 * 0.11; // Cross-section area
  
  const speed = ball.velocity.length();
  const spinDir = ball.angularVelocity.clone().normalize();
  const velDir = ball.velocity.clone().normalize();
  
  const magnusDir = spinDir.cross(velDir);
  const magnitude = 0.5 * rho * Cl * A * speed * speed;
  
  return magnusDir.multiplyScalar(magnitude);
}
</script>

 <T.Group
  position={position.toArray()}
  quaternion={quaternion.toArray()}
>


<RigidBody
  bind:rigidBody={ball.rbRef}
  type="dynamic"
  position={[0, BALL_RADIUS + 201, 0]}
  mass={5}
  
  linearDamping={0.4}
  angularDamping={0.3}
  restitution={0.65}
  friction={0.6}
  oncreate={( ref ) => {
    rbRef = ref
    matchStore.ball.ref = ref
  }}
>
  <AutoColliders shape="ball" restitution={0.65} friction={0.6}>
    <T.Mesh bind:ref={meshRef} castShadow receiveShadow >
      <T.SphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <!-- Black & white pentagon pattern approximated via mesh + material -->
      <T.MeshStandardMaterial
        color="#f5f5f5"
        roughness={0.6}
        metalness={0.0}
        envMapIntensity={0.5}
      />
    </T.Mesh>

    <!-- Black pentagon patches (6 visible quads distributed on sphere) -->
    {#each [
      [0, 0, BALL_RADIUS],
      [0, 0, -BALL_RADIUS],
      [BALL_RADIUS, 0, 0],
      [-BALL_RADIUS, 0, 0],
      [0, BALL_RADIUS, 0],
      [0, -BALL_RADIUS, 0],
    ] as [px, py, pz], i}
      <T.Mesh
        position={[px * 0.97, py * 0.97, pz * 0.97]}
        lookAt={[px * 2, py * 2, pz * 2]}
      >
        <T.CircleGeometry args={[BALL_RADIUS * 0.4, 5]} />
        <T.MeshStandardMaterial
          color="#1a1a1a"
          roughness={0.7}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </T.Mesh>
    {/each}
  </AutoColliders>
</RigidBody>
</T.Group>