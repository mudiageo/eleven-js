<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { AutoColliders } from '@threlte/rapier'
  import { OrbitControls } from '@threlte/extras'
import { Vector3, MathUtils, Quaternion } from 'three'
import Ground from './Ground.svelte';
import CameraRig from './CameraRig.svelte';
import Ball from '../ball/Ball.svelte';
import Player from '../players/Player.svelte';

//  import Stadium from './Stadium.svelte'
  
  // import PauseMenu from './PauseMenu.svelte'
import { matchStore }  from '$lib/state/match-store.svelte';
  
  const ACTUAL_PITCH_SIZE = [105, 68]; // [length, width]
  const MULTIPLIER = 1;

  const PITCH_SIZE = ACTUAL_PITCH_SIZE.map(dim => dim * MULTIPLIER);
  
  useTask(delta => {
    const camera = matchStore.camera?.ref.position 
    const ball = matchStore.ball?.ref.translation()
    camera.x = camera.x + (ball.x - camera.x) * 0.05
  })
  
  let ballPosition = $derived(matchStore.ball?.rbRef?.translation() || { x: 0, y: 0, z: 0 })
  
  let playerPosition = $derived(matchStore.controlledPlayer?.position);

  // ── Goal flash overlay ────────────────────────────────────────────
  let showGoalFlash = $derived(gameState.goalFlash !== null)

 

  // ── Handle controls events ────────────────────────────────────────
  function onMove(e: CustomEvent<{ x: number; z: number }>) {
    if (gameState.paused) return
    playerState.setMoveInput(e.detail.x, e.detail.z)
  }
  function onShoot() {
    if (gameState.paused) return
    playerState.triggerShoot()
  }
  function onPass() {
    if (gameState.paused) return
    playerState.triggerPass()
  }
  function onTackle() {
    if (gameState.paused) return
    playerState.triggerTackle()
  }
  function onReset() {
    playerState.reset()
    ballComponent?.reset()
    gameState.reset()
  }
  function onResume() {
    gameState.togglePause()
    cameraState.paused = false
  }
  function onPause() {
    gameState.togglePause()
    cameraState.paused = gameState.paused
  }
</script>


<CameraRig {playerPosition} {ballPosition} />
<T.AmbientLight intensity={0.15} />
{#each [[-30, 30, -40], [30, 30, -40], [-30, 30, 40], [30, 30, 40]] as pos}
  <T.DirectionalLight position={pos} intensity={0.8} castShadow />
{/each}
{#each matchStore.players as player, i}
  <Player bind:player={matchStore.players[i]} />
{/each}

<Ground />
<!-- The Ball -->
<Ball ball={matchStore.ball} position={new Vector3(0, 20,3)} quaternion={new Quaternion().random()}/>





<!-- ── Goal flash ────────────────────────────────────────────────────── -->
{#if showGoalFlash}
  <div class="
    fixed inset-0 z-50 flex items-center justify-center
    pointer-events-none
    animate-[goalFlash_0.4s_ease-out]
  ">
    <div class="
      text-white text-7xl font-black tracking-widest
      drop-shadow-[0_0_40px_rgba(255,215,0,0.9)]
      [text-shadow:0_0_60px_gold,0_4px_0_rgba(0,0,0,0.6)]
      uppercase
    ">
      GOAL!
    </div>
  </div>
{/if}


<!-- ── Threlte Canvas ────────────────────────────────────────────────── -->
<div class="fixed inset-0 -z-10">

</div>

<style>
  @keyframes goalFlash {
    0%   { opacity: 0; transform: scale(0.5); }
    40%  { opacity: 1; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1.0); }
  }
</style>