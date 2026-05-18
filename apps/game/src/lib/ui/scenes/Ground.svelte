<script lang="ts">
  import { T } from '@threlte/core'
  import { AutoColliders } from '@threlte/rapier'
  const ACTUAL_PITCH_SIZE = [105, 68, 1]; // [length, width]
  const MULTIPLIER = 0.5;

const PITCH_SIZE = ACTUAL_PITCH_SIZE.map(dim => dim * MULTIPLIER);

function computeGroundFriction(ball: BallState, pitch: PitchState): number {
  // Friction varies by pitch zone (wet near goals, worn in midfield)
  const wetness = pitch.getWetness(ball.position);
  const wear = pitch.getWear(ball.position);
  
  const baseFriction = 0.85;
  const wetBonus = wetness * 0.08;     // Wet = faster rolling
  const wearPenalty = wear * 0.05;     // Worn = slower
  
  return baseFriction + wetBonus - wearPenalty;
}

</script>
<T.Group position={[0, -0.5, 0]}>
  <AutoColliders shape={'cuboid'}>
<T.Mesh rotation.x={-Math.PI / 2}>
  <T.BoxGeometry args={PITCH_SIZE} />
  <T.MeshBasicMaterial color="green" />
</T.Mesh>  
  
  </AutoColliders>
</T.Group>