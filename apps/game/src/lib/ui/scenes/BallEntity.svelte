<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { matchStore } from '$lib/game/match/match-store.svelte';
</script>

<T.Group position={[matchStore.ball.position.x, matchStore.ball.position.y, matchStore.ball.position.z]} rotation={[matchStore.ball.rotation.x, matchStore.ball.rotation.y, matchStore.ball.rotation.z]}>
  <T.Mesh castShadow receiveShadow>
    <T.SphereGeometry args={[0.11, 32, 32]} />
    <!-- PBR standard material for ball -->
    <T.MeshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.1} />
  </T.Mesh>
</T.Group>
