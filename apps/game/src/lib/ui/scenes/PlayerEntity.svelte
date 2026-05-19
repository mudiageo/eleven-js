<script lang="ts">
  import { T } from '@threlte/core';
  import type { Player } from '$lib/game/match/match-store.svelte';

  let { player } = $props<{ player: Player }>();

  // Basic capsule representation for now
</script>

<T.Group position={[player.position.x, player.position.y, player.position.z]} rotation={[0, player.rotation, 0]}>
  <T.Mesh position.y={0.5}>
    <T.CapsuleGeometry args={[0.3, 1, 4, 8]} />
    <T.MeshStandardMaterial color={player.teamId === 0 ? "#1a56db" : "#e02424"} />
  </T.Mesh>

  <!-- Selection indicator -->
  {#if player.isControlled}
    <T.Mesh position.y={0.05} rotation.x={-Math.PI / 2}>
      <T.RingGeometry args={[0.35, 0.45, 16]} />
      <T.MeshBasicMaterial color="#00ff88" transparent opacity={0.6} />
    </T.Mesh>
  {/if}
</T.Group>
