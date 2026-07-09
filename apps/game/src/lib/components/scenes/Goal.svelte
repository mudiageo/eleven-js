<script lang="ts">
  import { T } from '@threlte/core'
  import { RigidBody, Collider } from '@threlte/rapier'


  /** Which end: 1 = positive Z, -1 = negative Z */
  let { side = 1 }: { side: 1 | -1 } = $props()


  // FIFA standard goal: 7.32m wide, 2.44m high, ~2.44m deep
  const GOAL_W   = 7.32
  const GOAL_H   = 2.44
  const GOAL_D   = 2.44   // net depth
  const POST_R   = 0.06   // 12cm diameter posts (FIFA spec max 12cm)
  const NET_SEGS = 12     // net subdivisions per axis

  const HALF_W   = GOAL_W / 2
  const HALF_L   = 52.5   // from Pitch.svelte

  // Goal sits on the goal line
  const gz = side * HALF_L
  // Net goes inward (away from pitch)
  const netDir = side   // positive or negative Z direction

  // Post positions
  const posts = [
    { x: -HALF_W, label: 'left'  },
    { x:  HALF_W, label: 'right' },
  ]

  // Net rope segments (vertical posts of net)
  const netVerticals: { x: number; z: number }[] = []
  for (let i = 0; i <= NET_SEGS; i++) {
    const x = -HALF_W + (i / NET_SEGS) * GOAL_W
    netVerticals.push({ x, z: gz + netDir * GOAL_D })
  }

  // Net horizontal rows
  const netHorizontals: { y: number; z: number }[] = []
  for (let j = 0; j <= NET_SEGS; j++) {
    const y = (j / NET_SEGS) * GOAL_H
    netHorizontals.push({ y, z: gz })
  }

  function handleGoal() {
const match = {}
    match?.goal()
  }
</script>

<T.Group>
  <!-- ─── Posts & Crossbar ─────────────────────────────────────────── -->

<RigidBody type="fixed">
  <!-- Left post -->
  <T.Group position={[-HALF_W, GOAL_H / 2, gz]}>
    <Collider shape="cylinder" args={[GOAL_H / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_H, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Right post -->
  <T.Group position={[HALF_W, GOAL_H / 2, gz]}>
    <Collider shape="cylinder" args={[GOAL_H / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_H, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Crossbar -->
  <T.Group position={[0, GOAL_H, gz]} rotation.z={Math.PI / 2}>
    <Collider shape="cylinder" args={[GOAL_W / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_W, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Back post (rear of net) left -->
  <T.Group position={[-HALF_W, GOAL_H / 2, gz + netDir * GOAL_D]}>
    <Collider shape="cylinder" args={[GOAL_H / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_H, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Back post (rear of net) right -->
  <T.Group position={[HALF_W, GOAL_H / 2, gz + netDir * GOAL_D]}>
    <Collider shape="cylinder" args={[GOAL_H / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_H, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Top bar rear -->
  <T.Group position={[0, GOAL_H, gz + netDir * GOAL_D]} rotation.z={Math.PI / 2}>
    <Collider shape="cylinder" args={[GOAL_W / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_W, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Side bars (connecting front to back) left -->
  <T.Group position={[-HALF_W, GOAL_H, gz + netDir * (GOAL_D / 2)]} rotation.x={Math.PI / 2}>
    <Collider shape="cylinder" args={[GOAL_D / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_D, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>

  <!-- Side bars right -->
  <T.Group position={[HALF_W, GOAL_H, gz + netDir * (GOAL_D / 2)]} rotation.x={Math.PI / 2}>
    <Collider shape="cylinder" args={[GOAL_D / 2, POST_R]} />
    <T.Mesh castShadow>
      <T.CylinderGeometry args={[POST_R, POST_R, GOAL_D, 12]} />
      <T.MeshStandardMaterial color="white" roughness={0.3} metalness={0.4} />
    </T.Mesh>
  </T.Group>
</RigidBody>
 

  <!-- ─── Net (visual mesh only) ────────────────────────────────────── -->
  <!-- Back net face -->
  <T.Mesh position={[0, GOAL_H / 2, gz + netDir * GOAL_D]}>
    <T.PlaneGeometry args={[GOAL_W, GOAL_H, NET_SEGS, NET_SEGS]} />
    <T.MeshStandardMaterial
      color="#ffffff"
      opacity={0.35}
      transparent
      wireframe
      side={2}
    />
  </T.Mesh>

  <!-- Left side net -->
  <T.Mesh
    position={[-HALF_W, GOAL_H / 2, gz + netDir * (GOAL_D / 2)]}
    rotation.y={Math.PI / 2}
  >
    <T.PlaneGeometry args={[GOAL_D, GOAL_H, NET_SEGS, NET_SEGS]} />
    <T.MeshStandardMaterial
      color="#ffffff"
      opacity={0.35}
      transparent
      wireframe
      side={2}
    />
  </T.Mesh>

  <!-- Right side net -->
  <T.Mesh
    position={[HALF_W, GOAL_H / 2, gz + netDir * (GOAL_D / 2)]}
    rotation.y={Math.PI / 2}
  >
    <T.PlaneGeometry args={[GOAL_D, GOAL_H, NET_SEGS, NET_SEGS]} />
    <T.MeshStandardMaterial
      color="#ffffff"
      opacity={0.35}
      transparent
      wireframe
      side={2}
    />
  </T.Mesh>

  <!-- Top net -->
  <T.Mesh
    position={[0, GOAL_H, gz + netDir * (GOAL_D / 2)]}
    rotation.x={Math.PI / 2}
  >
    <T.PlaneGeometry args={[GOAL_W, GOAL_D, NET_SEGS, NET_SEGS]} />
    <T.MeshStandardMaterial
      color="#ffffff"
      opacity={0.35}
      transparent
      wireframe
      side={2}
    />
  </T.Mesh>

  <!-- ─── Goal Sensor (only fires when ball is INSIDE net) ─────────── -->
  <!--
    Sensor is a cuboid matching the interior of the net (inset from posts).
    It's positioned behind the goal line so it only triggers after the ball
    crosses the line AND enters the net — not on posts or crossbar.
  -->
  <Collider
    shape="cuboid"
    args={[GOAL_W / 2 - POST_R * 2, GOAL_H / 2 - POST_R, GOAL_D / 2 - POST_R]}
    position={[0, GOAL_H / 2 - POST_R, gz + netDir * (GOAL_D / 2 + POST_R * 2)]}
    sensor
    onsensorenter={handleGoal}
  />
</T.Group>