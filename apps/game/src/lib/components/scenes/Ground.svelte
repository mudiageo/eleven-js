<script lang="ts">
  import { T } from '@threlte/core'
  import { AutoColliders, RigidBody, Collider } from '@threlte/rapier'
  import Goal from './Goal.svelte'
  
  import { matchState } from '$lib/state/match-store.svelte'
  
  // FIFA standard: 105m long, 68m wide
  export const PITCH_LENGTH = 105
  export const PITCH_WIDTH = 68

  // Derived measurements (all in metres)
  const HALF_L = PITCH_LENGTH / 2   // 52.5
  const HALF_W = PITCH_WIDTH / 2    // 34

  // Penalty area: 40.32m wide, 16.5m deep
  const PENALTY_W = 40.32
  const PENALTY_D = 16.5

  // Goal area (6-yard box): 18.32m wide, 5.5m deep
  const GOAL_AREA_W = 18.32
  const GOAL_AREA_D = 5.5

  // Centre circle radius: 9.15m
  const CENTRE_R = 9.15

  // Penalty spot: 11m from goal line
  const PENALTY_SPOT = 11

  // Corner arc radius: 1m
  const CORNER_R = 1

  const LINE_H = 0.2   // line sits just above pitch
  const LINE_T = 0.12   // line thickness

  function onGoalNorth() {
    matchState.scoreGoal('away')
  }
  function onGoalSouth() {
    matchState.scoreGoal('home')
  }

</script>
<T.Group position={[0, -0.5, 0]}>            
<!-- ─── Ground Collider ─────────────────────────────────────────────── -->
<RigidBody type="fixed">
  <Collider shape="cuboid" args={[PITCH_WIDTH/2, 0.15, PITCH_LENGTH/2]} friction={0.8}>
    <T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
      <T.BoxGeometry args={[PITCH_WIDTH, PITCH_LENGTH, 0.3]} />
      <T.MeshStandardMaterial color="#3a7d44" roughness={0.9} metalness={0} />
    </T.Mesh>
  </Collider>
</RigidBody>



<!-- ─── Boundary Lines ────────────────────────────────────────────────── -->
<!-- Touchlines (long sides) -->
<T.Mesh position={[-HALF_W, LINE_H, 0]} rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[LINE_T, PITCH_LENGTH + LINE_T]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>
<T.Mesh position={[HALF_W, LINE_H, 0]} rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[LINE_T, PITCH_LENGTH + LINE_T]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>

<!-- Goal lines (short ends) -->
<T.Mesh position={[0, LINE_H, -HALF_L]} rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[PITCH_WIDTH + LINE_T, LINE_T]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>
<T.Mesh position={[0, LINE_H, HALF_L]} rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[PITCH_WIDTH + LINE_T, LINE_T]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>

<!-- Halfway line -->
<T.Mesh position={[0, LINE_H, 0]} rotation.x={-Math.PI / 2}>
  <T.PlaneGeometry args={[PITCH_WIDTH, LINE_T]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>

<!-- ─── Centre Circle ────────────────────────────────────────────────── -->
<T.Mesh position={[0, LINE_H, 0]} rotation.x={-Math.PI / 2}>
  <T.RingGeometry args={[CENTRE_R - LINE_T / 2, CENTRE_R + LINE_T / 2, 64]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>

<!-- Centre spot -->
<T.Mesh position={[0, LINE_H, 0]} rotation.x={-Math.PI / 2}>
  <T.CircleGeometry args={[0.15, 16]} />
  <T.MeshBasicMaterial color="white" />
</T.Mesh>

<!-- ─── Penalty Areas ────────────────────────────────────────────────── -->
{#each [-1, 1] as side}
  {@const gz = side * HALF_L}
  {@const sign = -side}

  <!-- Penalty box outline (4 lines) -->
  <!-- Far edge (parallel to goal line) -->
  <T.Mesh position={[0, LINE_H, gz + sign * PENALTY_D]} rotation.x={-Math.PI / 2}>
    <T.PlaneGeometry args={[PENALTY_W, LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>
  <!-- Left side -->
  <T.Mesh
    position={[-(PENALTY_W / 2), LINE_H, gz + sign * (PENALTY_D / 2)]}
    rotation.x={-Math.PI / 2}
  >
    <T.PlaneGeometry args={[LINE_T, PENALTY_D + LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>
  <!-- Right side -->
  <T.Mesh
    position={[PENALTY_W / 2, LINE_H, gz + sign * (PENALTY_D / 2)]}
    rotation.x={-Math.PI / 2}
  >
    <T.PlaneGeometry args={[LINE_T, PENALTY_D + LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>

  <!-- Goal area (6yd box) -->
  <T.Mesh position={[0, LINE_H, gz + sign * GOAL_AREA_D]} rotation.x={-Math.PI / 2}>
    <T.PlaneGeometry args={[GOAL_AREA_W, LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>
  <T.Mesh
    position={[-(GOAL_AREA_W / 2), LINE_H, gz + sign * (GOAL_AREA_D / 2)]}
    rotation.x={-Math.PI / 2}
  >
    <T.PlaneGeometry args={[LINE_T, GOAL_AREA_D + LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>
  <T.Mesh
    position={[GOAL_AREA_W / 2, LINE_H, gz + sign * (GOAL_AREA_D / 2)]}
    rotation.x={-Math.PI / 2}
  >
    <T.PlaneGeometry args={[LINE_T, GOAL_AREA_D + LINE_T]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>

  <!-- Penalty spot -->
  <T.Mesh position={[0, LINE_H, gz + sign * PENALTY_SPOT]} rotation.x={-Math.PI / 2}>
    <T.CircleGeometry args={[0.15, 16]} />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>

  <!-- Penalty arc (outside penalty box, r=9.15 from spot) -->
  <T.Mesh position={[0, LINE_H, gz + sign * PENALTY_SPOT]} rotation.x={-Math.PI / 2}>
    <T.RingGeometry 
      args={[
        CENTRE_R - LINE_T / 2, 
        CENTRE_R + LINE_T / 2, 
        64, 
        1, 
        (side === -1 ? -Math.PI * 0.28 : Math.PI * 0.72) - Math.PI / 2, 
        Math.PI * 0.56
      ]} 
    />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>
{/each}

<!-- ─── Corner Arcs & Flags ───────────────────────────────────────────── -->
{#each [[-HALF_W, -HALF_L], [HALF_W, -HALF_L], [-HALF_W, HALF_L], [HALF_W, HALF_L]] as [cx, cz], i}
  <!-- Arc -->
  <T.Mesh position={[cx, LINE_H, cz]} rotation.x={-Math.PI / 2}>
    <T.RingGeometry
      args={[
        CORNER_R - LINE_T / 2,
        CORNER_R + LINE_T / 2,
        32, 1,
        (i === 0 ? 0 : i === 1 ? Math.PI / 2 : i === 2 ? -Math.PI / 2 : Math.PI),
        Math.PI / 2
      ]}
    />
    <T.MeshBasicMaterial color="white" />
  </T.Mesh>

  <!-- Corner flag pole -->
  <T.Mesh position={[cx, 0.75, cz]}>
    <T.CylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
    <T.MeshStandardMaterial color="#e8e8e8" />
  </T.Mesh>

  <!-- Flag -->
  <T.Mesh position={[cx + (cx < 0 ? 0.15 : -0.15), 1.35, cz]}>
    <T.PlaneGeometry args={[0.3, 0.2]} />
    <T.MeshBasicMaterial color={i % 2 === 0 ? '#e63946' : '#f4d03f'} side={2} />
  </T.Mesh>
{/each}

<!-- ─── Pitch stripe pattern (darker alternating bands) ──────────────── -->
<!--{#each Array(7) as _, i}-->
<!--  <T.Mesh-->
<!--    position.x={-HALF_W + (i * 2 + 1) * (PITCH_WIDTH / 14)}-->
<!--    position.y={-100}-->
<!--    rotation.x={-Math.PI / 2}-->
<!--  >-->
<!--    <T.PlaneGeometry args={[PITCH_WIDTH / 14, PITCH_LENGTH]} />-->
<!--    <T.MeshStandardMaterial color="#2d6b38" roughness={1} />-->
<!--  </T.Mesh>-->
<!--{/each}-->
      <Goal side={1}  ongoal={onGoalNorth} />
      <Goal side={-1} ongoal={onGoalSouth} />

</T.Group>

