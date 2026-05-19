<script lang="ts">
  import { onMount } from 'svelte';
  import { Canvas } from '@threlte/core';
  import MatchScene from '$lib/ui/scenes/MatchScene.svelte';
  import HUD from '$lib/ui/hud/HUD.svelte';
  import PauseMenu from '$lib/ui/menus/PauseMenu.svelte';
  import { inputManager } from '$lib/engine/input/input-manager.svelte';
  import { Studio } from '@threlte/studio';

  let paused = $state(false);

  onMount(() => {
    inputManager.on('PAUSE', () => {
      paused = !paused;
    });
  });
</script>

<!-- Ensure Studio is rendered outside the canvas but provides tooling -->
<Studio>
  <div class="match-container">
    <Canvas>
      <MatchScene {paused} />
    </Canvas>

    <HUD />

    {#if paused}
      <PauseMenu onResume={() => paused = false} />
    {/if}
  </div>
</Studio>

<style>
  .match-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
  }

</style>
