<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  
  import { matchStore }  from '$lib/state/match-store.svelte';
  import { Button } from '$lib/components/ui/button'
  import Camera from '@lucide/svelte/icons/camera'

   let speedMode: 'walk' | 'run' | 'sprint' = 'run'
  

  let joystickEl: HTMLDivElement = $state()
  let nipple: any


  onMount(async () => {
    // Dynamic import so SSR doesn't break
    const nipplejs = await import('nipplejs')

    nipple = nipplejs.create({
      zone:        joystickEl,
      mode:        'static',
      position:    { left: '50%', top: '50%' },
      color:       'rgba(255,255,255,0.55)',
      size:        116,
      restOpacity: 0.45,
      dynamicPage: true,
    })
    
    nipple.on('move', ({ data }) => {
      if (!data.vector || gameState.paused) return
    
      const angle = data.angle.radian;
      const force = data.force; // Value between 0 and 1
      
      // Map joystick X/Y to Three.js X/Z (Forward/Backward is typically Z)
     const xz = {
        z:  Math.cos(angle) * force * 0.1 ,
        x: Math.sin(angle) * force * 0.1  
      }
      const v = data.vector
      playerState.setMoveInput(v.x, -v.y)

      
      matchStore.input('move', xz)
    })

    nipple.on('end', () => {
      matchStore.input('move', { x: 0, z: 0 })
    })
  })

  onDestroy(() => {
    nipple?.destroy()
  })

  function setSpeed(s: typeof speedMode) {
    speedMode = s
    matchStore.speed = s
  }


</script>
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gameState } from '$lib/stores/game.state.svelte'
  import { playerState } from '$lib/stores/player.state.svelte'
  import { cameraState, CAMERA_MODES } from '$lib/stores/camera.state.svelte'
  import { Button } from '$lib/components/ui/button'
  import { cn } from '$lib/utils'

  // Lucide icons
  import Pause from '@lucide/svelte/icons/pause'
  import Play from '@lucide/svelte/icons/play'
  import Camera from '@lucide/svelte/icons/camera'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Zap from '@lucide/svelte/icons/zap'
  import Footprints from '@lucide/svelte/icons/footprints'
  import Timer from '@lucide/svelte/icons/timer'



  // ── Camera menu ───────────────────────────────────────────────────
  let showCamMenu = $state(false)

  // ── Minimap world→px helper (minimap 110×70px, pitch 68×105m) ────
  function worldToMini(wx: number, wz: number) {
    return { x: ((wx + 34) / 68) * 106, y: ((wz + 52.5) / 105) * 66 }
  }
  let playerDot = $derived(worldToMini(playerState.x, playerState.z))

  // ── Speed config ──────────────────────────────────────────────────
  const SPEEDS = [
    { key: 'walk'   as const, label: 'Walk',   Icon: Footprints },
    { key: 'run'    as const, label: 'Run',    Icon: Timer      },
    { key: 'sprint' as const, label: 'Sprint', Icon: Zap        },
  ]
</script>

<!-- ═══════════════════════════════════════════════════════
     SCOREBOARD — top centre
═══════════════════════════════════════════════════════ -->
<div class="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-stretch select-none pointer-events-none font-['Barlow_Condensed',sans-serif] shadow-2xl">
  <!-- Home -->
  <div class="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117]/90 backdrop-blur border border-white/10 rounded-l-md">
    <div class="w-6 h-6 rounded bg-[#003087] grid place-items-center text-[10px] font-black text-white">H</div>
    <span class="text-white text-sm font-bold tracking-widest">HOME</span>
  </div>
  <!-- Score + time -->
  <div class="flex items-center gap-0">
    <div class="flex items-center px-4 py-1.5 bg-[#f0c400] border-y border-[#d4ac00]">
      <span class="text-[#0d1117] text-2xl font-black tabular-nums leading-none">{gameState.homeGoals}</span>
    </div>
    <div class="flex flex-col items-center justify-center px-2 py-1 bg-[#0d1117]/95 border-y border-white/10 min-w-[56px]">
      <span class="text-white text-xs font-bold tabular-nums tracking-widest leading-none">{gameState.timeDisplay}</span>
      <span class="text-white/40 text-[9px] tracking-widest mt-0.5">1ST</span>
    </div>
    <div class="flex items-center px-4 py-1.5 bg-[#f0c400] border-y border-[#d4ac00]">
      <span class="text-[#0d1117] text-2xl font-black tabular-nums leading-none">{gameState.awayGoals}</span>
    </div>
  </div>
  <!-- Away -->
  <div class="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117]/90 backdrop-blur border border-white/10 rounded-r-md">
    <span class="text-white text-sm font-bold tracking-widest">AWAY</span>
    <div class="w-6 h-6 rounded bg-[#c0392b] grid place-items-center text-[10px] font-black text-white">A</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════
     TOP RIGHT — camera + pause
═══════════════════════════════════════════════════════ -->
<div class="fixed top-3 right-3 z-50 flex items-center gap-2">
  <Button
    variant="ghost" size="icon"
    class="w-9 h-9 rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-white/20"
    onclick={() => { showCamMenu = !showCamMenu }}
  >
    <Camera class="w-4 h-4" />
  </Button>
  <Button
    variant="ghost" size="icon"
    class="w-9 h-9 rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-white/20"
    onclick={() => onpause?.()}
  >
    {#if gameState.paused}
      <Play class="w-4 h-4" />
    {:else}
      <Pause class="w-4 h-4" />
    {/if}
  </Button>
</div>

<!-- Camera mode dropdown -->
{#if showCamMenu}
  <div class="fixed top-14 right-3 z-50 bg-black/85 backdrop-blur-lg border border-white/15 rounded-xl overflow-hidden w-52 shadow-2xl py-1">
    {#each CAMERA_MODES as cam}
      <button
        class={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
          cameraState.mode === cam.value
            ? 'bg-[#f0c400]/15 text-[#f0c400]'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        )}
        onclick={() => { cameraState.switchMode(cam.value); showCamMenu = false }}
      >
    <Camera />
        <span class="text-base w-5 text-center">{cam.icon}</span>
        <span class="font-medium flex-1">{cam.label}</span>
        {#if cameraState.mode === cam.value}
          <ChevronRight class="w-3 h-3 text-[#f0c400]" />
        {/if}
      </Button>
    {/each}
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════
     PLAYER NAME + STAMINA BAR — bottom left above joystick
═══════════════════════════════════════════════════════ -->
<div class="fixed bottom-40 left-3 z-50 pointer-events-none flex flex-col gap-1">
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded-sm bg-[#003087] grid place-items-center">
      <span class="text-[9px] font-black text-white">8</span>
    </div>
    <div class="bg-black/70 backdrop-blur px-2.5 py-0.5 border border-white/10 rounded-sm">
      <span class="text-white text-xs font-semibold tracking-wide">Player One</span>
    </div>
  </div>
  <!-- Stamina bar -->
  <div class="w-32 h-1.5 rounded-full bg-white/15 overflow-hidden ml-7">
    <div
      class={cn(
        'h-full rounded-full transition-all duration-300',
        playerState.stamina > 60 ? 'bg-emerald-400' :
        playerState.stamina > 25 ? 'bg-amber-400' : 'bg-red-500'
      )}
      style="width: {playerState.stamina}%"
    ></div>
  </div>
</div>

<!-- Speed selector — stacked above joystick, to its right -->
<div class="fixed bottom-[148px] left-[148px] z-50 flex flex-col gap-1">
  {#each SPEEDS as { key, label, Icon }}
    <button
      class={cn(
        'flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border transition-all',
        playerState.speedMode === key
          ? 'bg-[#f0c400] border-[#d4ac00] text-[#0d1117]'
          : 'bg-black/55 border-white/20 text-white/55 hover:text-white hover:border-white/40'
      )}
      onclick={() => playerState.setSpeed(key)}
    >
      <Icon class="w-3 h-3" />
      {label}
    </button>
  {/each}
</div>

<!-- ═══════════════════════════════════════════════════════
     JOYSTICK ZONE — bottom left
═══════════════════════════════════════════════════════ -->
<div
  bind:this={joystickEl}
  class="fixed bottom-8 left-8 z-50 w-[124px] h-[124px] rounded-full bg-white/5 border-2 border-white/15 touch-none"
></div>

<!-- ═══════════════════════════════════════════════════════
     MINIMAP — bottom centre
═══════════════════════════════════════════════════════ -->

{#if gameState.miniMap}
<div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[110px] h-[70px] pointer-events-none bg-black/60 backdrop-blur border border-white/15 rounded-sm overflow-hidden">
  <svg class="absolute inset-0 w-full h-full" viewBox="0 0 110 70" preserveAspectRatio="none">
    <rect x="2" y="2" width="106" height="66" fill="rgba(45,90,68,0.6)" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
    <line x1="55" y1="2" x2="55" y2="68" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
    <ellipse cx="55" cy="35" rx="10" ry="8" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.7"/>
    <!-- Penalty areas -->
    <rect x="36" y="2" width="38" height="11" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.6"/>
    <rect x="36" y="57" width="38" height="11" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.6"/>
    <!-- Goals -->
    <rect x="47" y="1" width="16" height="2.5" fill="white" opacity="0.5"/>
    <rect x="47" y="66.5" width="16" height="2.5" fill="white" opacity="0.5"/>
  </svg>
  <!-- Player dot -->
  <div
    class="absolute w-2.5 h-2.5 rounded-full bg-[#f0c400] border border-white shadow-[0_0_4px_rgba(240,196,0,0.9)] -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
    style="left: {playerDot.x}px; top: {playerDot.y}px"
  ></div>
</div>
{/if}
<!-- ═══════════════════════════════════════════════════════
     ACTION BUTTONS — bottom right (eFootball D-cross)
═══════════════════════════════════════════════════════ -->
<div class="fixed bottom-5 right-4 z-50 select-none">
  <!--
    Exact eFootball layout:
           [Shoot]
    [Through]   [Pass]
           [Dash]
  -->
  <div class="relative w-[164px] h-[148px]">

    <!-- SHOOT — top -->
    <button
      class="absolute top-0 left-1/2 -translate-x-1/2 w-[58px] h-[58px] rounded-full bg-black/60 border-2 border-white/25 backdrop-blur flex flex-col items-center justify-center gap-0.5 active:scale-90 active:bg-white/15 transition-transform duration-75"
      onpointerdown={() => onshoot?.()}
    >
      <span class="text-xl leading-none">⚽</span>
      <span class="text-[9px] font-bold tracking-wider text-white/75 uppercase">Shoot</span>
    </button>

    <!-- THROUGH — left -->
    <button
      class="absolute top-1/2 left-0 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-black/60 border-2 border-white/25 backdrop-blur flex flex-col items-center justify-center gap-0.5 active:scale-90 active:bg-white/15 transition-transform duration-75"
      onpointerdown={() => {}}
    >
      <span class="text-base leading-none text-white">↗</span>
      <span class="text-[8px] font-bold text-white/65 uppercase leading-tight">Through</span>
    </button>

    <!-- PASS — right -->
    <button
      class="absolute top-1/2 right-0 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-black/60 border-2 border-white/25 backdrop-blur flex flex-col items-center justify-center gap-0.5 active:scale-90 active:bg-white/15 transition-transform duration-75"
      onpointerdown={() => onpass?.()}
    >
      <span class="text-base leading-none text-white">🎯</span>
      <span class="text-[8px] font-bold text-white/65 uppercase">Pass</span>
    </button>

    <!-- DASH — bottom -->
    <button
      class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[50px] rounded-full bg-black/60 border-2 border-white/25 backdrop-blur flex flex-col items-center justify-center gap-0.5 active:scale-90 active:bg-white/15 transition-transform duration-75"
      onpointerdown={() => ontackle?.()}
    >
      <span class="text-base leading-none text-white">🦵</span>
      <span class="text-[8px] font-bold text-white/65 uppercase">Dash</span>
    </button>

    <!-- Centre connector -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/20 pointer-events-none"></div>
  </div>
</div>



<style>
  /* ── Scoreboard ─────────────────────────────────────────────── */
  .scoreboard {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 8px 24px;
    font-family: 'Oswald', sans-serif;
    color: white;
    z-index: 100;
    pointer-events: none;
  }
  .score {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .team {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    opacity: 0.7;
  }

  /* ── Joystick ───────────────────────────────────────────────── */
  .joystick-zone {
    position: fixed;
    bottom: 32px;
    left: 32px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    border: 2px solid rgba(255,255,255,0.15);
    touch-action: none;
    z-index: 100;
  }

  /* ── Action buttons ─────────────────────────────────────────── */
  .action-buttons {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    z-index: 100;
  }

  .speed-row {
    display: flex;
    gap: 8px;
  }
  .speed-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 2px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.5);
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.15s;
    backdrop-filter: blur(6px);
  }
  .speed-btn.active {
    background: rgba(230, 57, 70, 0.8);
    border-color: #e63946;
    transform: scale(1.1);
  }

  .action-row {
    display: flex;
    gap: 12px;
  }
  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.3);
    cursor: pointer;
    font-family: 'Oswald', sans-serif;
    transition: transform 0.1s, opacity 0.1s;
    backdrop-filter: blur(8px);
  }
  .action-btn:active { transform: scale(0.92); opacity: 0.8; }
  .btn-icon { font-size: 1.4rem; line-height: 1; }
  .btn-label { font-size: 0.55rem; letter-spacing: 0.1em; font-weight: 600; color: white; }

  .shoot  { background: rgba(230, 57, 70, 0.75);  border-color: #e63946; }
  .pass   { background: rgba(29, 53, 87, 0.8);    border-color: #457b9d; }
  .tackle { background: rgba(82, 183, 136, 0.75); border-color: #52b788; }

  .reset-btn {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
    border-radius: 8px;
    padding: 6px 14px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    backdrop-filter: blur(4px);
  }
  .reset-btn:hover { background: rgba(255,255,255,0.15); color: white; }

  /* ── Camera switcher ────────────────────────────────────────── */
  .camera-switcher {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .cam-toggle {
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    border-radius: 10px;
    padding: 8px 14px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.15s;
  }
  .cam-toggle:hover { background: rgba(255,255,255,0.15); }

  .cam-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(0,0,0,0.75);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 8px;
    backdrop-filter: blur(10px);
  }
  .cam-item {
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255,255,255,0.75);
    border-radius: 7px;
    padding: 6px 12px;
    text-align: left;
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .cam-item:hover   { background: rgba(255,255,255,0.1); color: white; }
  .cam-item.active  { background: rgba(230, 57, 70, 0.5); border-color: #e63946; color: white; }
</style>