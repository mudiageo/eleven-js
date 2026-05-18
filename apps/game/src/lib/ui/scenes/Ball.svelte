<script
  lang="ts"
  module
>
  const geometry = new SphereGeometry(1)
  const material = new MeshStandardMaterial()
  
</script>
<script lang="ts">
  import { T } from '@threlte/core'
  import { Collider, RigidBody, type ContactEvent } from '@threlte/rapier'
 
  import type { Quaternion, Vector3 } from 'three'
  import { SphereGeometry, MeshStandardMaterial, MathUtils } from 'three'
  
  interface Props {
    position: Vector3
    quaternion: Quaternion
  }
  let { position, quaternion }: Props = $props()
    import { matchStore }  from '$lib/state/match-store.svelte';
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
    bind:rigidBody={matchStore.ball.ref}
    type="dynamic"
    angularDamping={0.5} 
    linearDamping={0.3}
    mass={0.5}
    
  >
    
    <Collider
       shape="ball" args={[0.11]} restitution={0.65} friction={0.5}
    />
    <T.Mesh
      castShadow
      receiveShadow
      {geometry}
      {material}
    />
  </RigidBody>
</T.Group>
