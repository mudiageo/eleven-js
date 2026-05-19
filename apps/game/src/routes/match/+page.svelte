<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas } from '@threlte/core';
  import { World } from '@threlte/rapier';
  import MatchScene from '$lib/ui/scenes/MatchScene.svelte'
  import HUD from '$lib/ui/HUD.svelte'
    import { matchStore }  from '$lib/state/match-store.svelte';
  let paused = $state(false);
 
</script>

<div class="match-container">
  <!-- 3D Canvas -->
  <Canvas>
<World gravity={[0, -9.81, 0]}>
    <MatchScene />
</World>
  </Canvas>
  <!-- Example setup for the match environment -->

<HUD />

</div>

<style>
  .match-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    
  }
</style>