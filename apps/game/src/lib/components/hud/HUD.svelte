<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { useTask } from '@threlte/core'
  import { onMount } from 'svelte'
  import { matchStore }  from '$lib/state/match-store.svelte';
  import { Vector3, MathUtils, Quaternion } from 'three'
  import Controls from './Controls.svelte'
  
</script>


<div class="fixed bottom-0 right-0 z-500">
  <Button class="" onclick={() =>  matchStore.moveBall()}>
  move ball
  </Button>
  <Button class="" onclick={() =>  matchStore.ball.kick((new Vector3(10, 20, 30)), 50)}>
  kick ball
  </Button>
  
</div>
<Controls />

<!-- ── Pause menu (outside canvas, HTML overlay) ────────────────────── -->
<!--{#if gameState.paused}-->
<!--  <PauseMenu onresume={onResume} onreset={onReset} />-->
<!--{/if}-->
