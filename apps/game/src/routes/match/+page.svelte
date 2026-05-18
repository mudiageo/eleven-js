<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas } from '@threlte/core';
  import { World } from '@threlte/rapier';
  import MatchScene from '$lib/ui/scenes/MatchScene.svelte'
  import { Button } from '$lib/components/ui/button'
    import { matchStore }  from '$lib/state/match-store.svelte';
  let paused = $state(false);
 
</script>
<div class="fixed bottom-0 right-0 z-500">
  <Button class="" onclick={() =>  matchStore.moveBall()}>
  move ball
  </Button>
  
  <div class="flex flex-col gap-8">
  <Button variant="outline" size="icon" class="rounded-full" onclick={() => alert()}>
    run
  </Button>
</div>
</div>

<div class="match-container">
  <!-- 3D Canvas -->
  <Canvas>
<World gravity={[0, -9.81, 0]}>
    <MatchScene />
</World>
  </Canvas>
  <!-- Example setup for the match environment -->



</div>

<style>
  .match-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    
  }
</style>