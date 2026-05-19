<script>
  import { T, useTask } from '@threlte/core'
  import { AutoColliders } from '@threlte/rapier'
  import { OrbitControls } from '@threlte/extras'
import { Vector3, MathUtils, Quaternion } from 'three'
import Ground from './Ground.svelte';
import Ball from './Ball.svelte';
import { matchStore }  from '$lib/state/match-store.svelte';
  
  const ACTUAL_PITCH_SIZE = [105, 68]; // [length, width]
  const MULTIPLIER = 1;

  const PITCH_SIZE = ACTUAL_PITCH_SIZE.map(dim => dim * MULTIPLIER);
  
  useTask(delta => {
    const camera = matchStore.camera?.ref.position 
    const ball = matchStore.ball?.ref.translation()
    camera.x = camera.x + (ball.x - camera.x) * 0.05
  })
  
</script>



<T.PerspectiveCamera
  makeDefault
  bind:ref={matchStore.camera.ref}
  position={[0, 22, 52]}
  oncreate={(ref) => {
    ref.lookAt(0, 0, 0)
  }}
/>
<T.AmbientLight intensity={0.15} />
{#each [[-30, 30, -40], [30, 30, -40], [-30, 30, 40], [30, 30, 40]] as pos}
  <T.DirectionalLight position={pos} intensity={0.8} castShadow />
{/each}

<Ground />
<!-- The Ball -->
<Ball position={new Vector3(0, 15,3)} quaternion={new Quaternion().random()}/>